package com.saveyourchild;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.view.Gravity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.util.concurrent.atomic.AtomicBoolean;

public class OverlayAccessService extends Service {
    private static final String TAG = "OverlayAccessService";
    private static final long OVERLAY_TIMEOUT = 30_000; // 30 seconds
    private WebView overlayWebView;
    private WindowManager windowManager;
    private Handler mainHandler;

    private static final AtomicBoolean isOverlayActive = new AtomicBoolean(false);

    // fields for parsed app data
    private String currentAppName;
    private String currentPackageName;
    private String currentAppIcon;
    private JSONObject jsonAppData;

    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "OverlayAccessService created");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (isOverlayActive.get()) {
            Log.d(TAG, "Overlay already active, skipping");
            return START_NOT_STICKY;
        }

        String jsonString = intent.getStringExtra("appData");
        if (jsonString == null) {
            Log.e(TAG, "No appData provided");
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            jsonAppData = new JSONObject(jsonString);
            currentAppName = jsonAppData.optString("appName", "Unknown App");
            currentPackageName = jsonAppData.optString("packageName", "");
            currentAppIcon = jsonAppData.optString("icon", getFallbackIcon(currentPackageName));
        } catch (JSONException e) {
            Log.e(TAG, "Invalid JSON in appData", e);
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.d(TAG, "Preparing overlay for: " + currentAppName);

        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "Overlay permission not granted");
            stopSelf();
            return START_NOT_STICKY;
        }

        mainHandler.post(this::showOverlay);
        isOverlayActive.set(true);
        return START_NOT_STICKY;
    }

    private void showOverlay() {
        removeExistingOverlay();

        overlayWebView = new WebView(this);
        WebSettings settings = overlayWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        overlayWebView.addJavascriptInterface(new AccessScreenInterface(), "AndroidAccess");
        overlayWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectAppData(view);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                Log.e(TAG, "WebView error: " + err.getDescription());
            }
        });

        WindowManager.LayoutParams params = new WindowManager.LayoutParams();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            params.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            params.type = WindowManager.LayoutParams.TYPE_PHONE;
        }
        params.width = WindowManager.LayoutParams.MATCH_PARENT;
        params.height = WindowManager.LayoutParams.MATCH_PARENT;
        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                | WindowManager.LayoutParams.FLAG_FULLSCREEN;
        params.format = PixelFormat.TRANSLUCENT;

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        windowManager.addView(overlayWebView, params);
        overlayWebView.loadUrl("file:///android_asset/accessScreen.html");

        Log.d(TAG, "Overlay displayed for: " + currentAppName);

        // ✅ Add timeout to prevent stuck overlays
        mainHandler.postDelayed(() -> {
            if (isOverlayActive.get()) {
                Log.w(TAG, "⚠️ Overlay timeout for: " + currentAppName);
                // 1) Send user to Home screen (so target app goes to background)
                Intent home = new Intent(Intent.ACTION_MAIN);
                home.addCategory(Intent.CATEGORY_HOME);
                home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(home);
                // 2) Remove the overlay
                hideOverlay();
                // 3) Finally stop the service
                stopSelf();
            }
        }, OVERLAY_TIMEOUT);

    }

    private void injectAppData(WebView view) {
        String rawJson = jsonAppData.toString();
        String b64 = Base64.encodeToString(rawJson.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
        String script = "(function(){" +
                "if(window.initializeWithSingleApp){" +
                "var data=JSON.parse(atob('" + b64 + "'));" +
                "window.initializeWithSingleApp(data);}" +
                "})()";
        view.evaluateJavascript(script, res -> Log.d(TAG, "Data injected"));
    }

    private void removeExistingOverlay() {
        if (overlayWebView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayWebView);
            } catch (IllegalArgumentException ignored) {}
            overlayWebView.destroy();
            overlayWebView = null;
        }
    }

    public void hideOverlay() {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            hideOverlayInternal();
        } else {
            mainHandler.post(this::hideOverlayInternal);
        }
    }

    private void hideOverlayInternal() {
        removeExistingOverlay();
        isOverlayActive.set(false);
        stopSelf();
        Log.d(TAG, "Overlay hidden for: " + currentAppName);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        removeExistingOverlay();
        isOverlayActive.set(false);
        Log.d(TAG, "OverlayAccessService destroyed");
    }

    private String getFallbackIcon(String pkg) {
        switch (pkg.toLowerCase()) {
            case "com.instagram.android": return "📷";
            case "com.facebook.katana": return "📘";
            case "com.twitter.android": return "🐦";
            case "com.zhiliaoapp.musically": return "🎵";
            case "com.google.android.youtube": return "📺";
            case "com.whatsapp": return "💬";
            default: return "📱";
        }
    }

    // JavaScript interface
    private class AccessScreenInterface {
        @JavascriptInterface
        public void onFocusSessionStart(String sessionJson) {
            Log.d(TAG, "Focus session for " + currentAppName + ": " + sessionJson);
            mainHandler.post(() -> {
                try {
                    JSONObject sess = new JSONObject(sessionJson);
                    String pkg = sess.getString("packageName");
                    AppMonitorModule.updateActiveSessionForApp(pkg, sessionJson);
                } catch (JSONException e) {
                    Log.e(TAG, "Bad session JSON", e);
                }
                hideOverlay();
            });
        }

        @JavascriptInterface
        public void onCancel() {
            Log.d(TAG, "Session canceled for: " + currentAppName);
            mainHandler.post(() -> {
                Intent home = new Intent(Intent.ACTION_MAIN);
                home.addCategory(Intent.CATEGORY_HOME);
                home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(home);
                hideOverlay();
            });
        }
    }
}
