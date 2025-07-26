// android/app/src/main/java/com/saveyourchild/OverlayAccessService.java
package com.saveyourchild;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.util.Base64;
import java.io.ByteArrayOutputStream;

import org.json.JSONException;
import org.json.JSONObject;

public class OverlayAccessService extends Service {

    private static final String TAG = "OverlayAccessService";
    private WebView overlayWebView;
    private WindowManager windowManager;
    private static boolean isOverlayActive = false;
    private Handler mainHandler;

    // ✅ Single app data
    private String currentAppName;
    private String currentPackageName;
    private String currentAppIcon;
    JSONObject JsonAppData;

    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "🚀 OverlayAccessService created");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (isOverlayActive) {
            Log.d(TAG, "⏭️ Access overlay already active, ignoring...");
            return START_NOT_STICKY;
        }

        String jsonStringAppData = intent.getStringExtra("appData");

        if (jsonStringAppData == null) {
            Log.e(TAG, "No appData passed!");
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.d(TAG, "📱 Starting access screen overlay for: " + currentAppName);

        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "❌ Overlay permission not granted!");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Run on main thread
        mainHandler.post(() -> {
            if (jsonStringAppData != null) {
                try {
                    JsonAppData = new JSONObject(jsonStringAppData);
                    showAccessScreenOverlay(JsonAppData);
                } catch (JSONException e) {
                    Log.e(TAG, "Invalid JSON in appData", e);
                }
            }

        });

        isOverlayActive = true;
        return START_NOT_STICKY;
    }

    private void showAccessScreenOverlay(JSONObject jsonAppData) {
        try {
            Log.d(TAG, "🎯 Creating Access Screen WebView overlay for: " + currentAppName);

            // Ensure we're on main thread
            if (Looper.myLooper() != Looper.getMainLooper()) {
                Log.e(TAG, "❌ Not on main thread!");
                return;
            }

            // Remove existing overlay first
            if (overlayWebView != null) {
                hideOverlayInternal();
            }

            // Create WebView on main thread
            overlayWebView = new WebView(this);

            // Enhanced WebView settings
            WebSettings webSettings = overlayWebView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowContentAccess(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);

            // Add JavaScript interface
            overlayWebView.addJavascriptInterface(new AccessScreenWebInterface(), "AndroidAccess");

            // WebViewClient for handling page events
            overlayWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);

                    Log.d(TAG, "📄 Access screen page finished loading: " + url);

                    // Initialize with single app data
                    mainHandler.postDelayed(() -> initializeAccessScreen(view, 1), 300);
                    mainHandler.postDelayed(() -> initializeAccessScreen(view, 2), 800);
                    mainHandler.postDelayed(() -> initializeAccessScreen(view, 3), 1500);
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    super.onReceivedError(view, request, error);
                    Log.e(TAG, "❌ WebView error: " + error.getDescription());
                }
            });

            // Setup window parameters
            WindowManager.LayoutParams params = new WindowManager.LayoutParams();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                params.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                params.type = WindowManager.LayoutParams.TYPE_PHONE;
            }

            params.width = WindowManager.LayoutParams.MATCH_PARENT;
            params.height = WindowManager.LayoutParams.MATCH_PARENT;
            params.gravity = Gravity.TOP | Gravity.LEFT;

            params.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                    WindowManager.LayoutParams.FLAG_FULLSCREEN;

            params.format = PixelFormat.TRANSLUCENT;

            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            windowManager.addView(overlayWebView, params);

            // ✅ Load the access screen HTML file
            overlayWebView.loadUrl("file:///android_asset/accessScreen.html");

            Log.d(TAG, "✅ Access screen overlay displayed successfully for: " + currentAppName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error showing access screen overlay: " + e.getMessage());
            e.printStackTrace();
            hideOverlay();
        }
    }

    // ✅ Initialize access screen with single app data
    private void initializeAccessScreen(WebView view, int attempt) {
        try {

            String appDataJson = JsonAppData.toString().replace("\"", "\\\"");

            String initScript = String.format(
                    "console.log('🔄 Access screen initialization attempt %d for app: %s'); " +
                            "if (typeof window.initializeWithSingleApp === 'function') { " +
                            "  console.log('✅ initializeWithSingleApp found, calling...'); " +
                            "  window.initializeWithSingleApp(\"%s\"); " +
                            "  console.log('✅ Access screen initialized with single app'); " +
                            "} else { " +
                            "  console.log('❌ initializeWithSingleApp not found on attempt %d'); " +
                            "}",
                    attempt, currentAppName, appDataJson, attempt
            );

            view.evaluateJavascript(initScript, result -> {
                Log.d(TAG, "📱 Access screen init result for attempt " + attempt + ": " + result);
            });

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in access screen initialization attempt " + attempt + ": " + e.getMessage());
        }
    }

    // ✅ Fallback emoji icons
    private String getFallbackIcon(String packageName) {
        if (packageName == null) return "📱";

        switch (packageName.toLowerCase()) {
            case "com.instagram.android": return "📷";
            case "com.facebook.katana": return "📘";
            case "com.twitter.android": return "🐦";
            case "com.zhiliaoapp.musically": return "🎵";
            case "com.google.android.youtube": return "📺";
            case "com.whatsapp": return "💬";
            case "com.android.chrome": return "🌐";
            default: return "📱";
        }
    }

    // JavaScript interface class for access screen
    public class AccessScreenWebInterface {

        @JavascriptInterface
        public void onFocusSessionStart(String sessionDataJson) {
            Log.d(TAG, "🎯 Focus session started for " + currentAppName + " with data: " + sessionDataJson);

            mainHandler.post(() -> {
                try {
                    // ✅ Parse session data and update active session
                    JSONObject sessionData = new JSONObject(sessionDataJson);

                    String packageName = sessionData.getString("packageName");
                    int accessTime = sessionData.getInt("accessTime");
                    int lockTime = sessionData.getInt("lockTime");
                    String accessStartTime = sessionData.getString("accessStartTime");
                    String accessEndTime = sessionData.getString("accessEndTime");
                    String lockUpToTime = sessionData.getString("lockUpToTime");

                    Log.d(TAG, "📊 Session Config for " + currentAppName + " - Access: " + accessTime + " min, Lock: " + lockTime + " min");

                    // ✅ Update active session in MMKV via AppMonitorModule
                    updateActiveSession(packageName, sessionData);

                    // Navigate back to main app
                    Intent mainAppIntent = new Intent(OverlayAccessService.this, MainActivity.class);
                    mainAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    mainAppIntent.putExtra("sessionStarted", true);
                    mainAppIntent.putExtra("targetApp", currentAppName);
                    mainAppIntent.putExtra("targetPackage", currentPackageName);
                    mainAppIntent.putExtra("accessTime", accessTime);
                    mainAppIntent.putExtra("lockTime", lockTime);
                    startActivity(mainAppIntent);

                    // Hide overlay after delay
                    mainHandler.postDelayed(() -> {
                        hideOverlay();
                    }, 500);

                } catch (Exception e) {
                    Log.e(TAG, "❌ Error processing session start: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void onCancel() {
            Log.d(TAG, "❌ Access screen cancelled for: " + currentAppName);

            mainHandler.post(() -> {
                // Go to home screen
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(homeIntent);

                // Hide overlay after delay
                mainHandler.postDelayed(() -> {
                    hideOverlay();
                }, 300);
            });
        }

        @JavascriptInterface
        public void logMessage(String message) {
            Log.d(TAG, "📱 WebView Log: " + message);
        }

        @JavascriptInterface
        public String getCurrentApp() {
            // ✅ Return single app data as JSON string
            try {
                JSONObject appObj = new JSONObject();
                appObj.put("appName", currentAppName != null ? currentAppName : "Unknown App");
                appObj.put("packageName", currentPackageName != null ? currentPackageName : "");
                appObj.put("icon", currentAppIcon != null ? currentAppIcon : "📱");

                return appObj.toString();
            } catch (Exception e) {
                Log.e(TAG, "❌ Error getting current app: " + e.getMessage());
                return "{}";
            }
        }

        @JavascriptInterface
        public String getAppName() {
            return currentAppName != null ? currentAppName : "Unknown App";
        }

        @JavascriptInterface
        public String getPackageName() {
            return currentPackageName != null ? currentPackageName : "";
        }
    }

    // ✅ Update active session in MMKV via AppMonitorModule
    private void updateActiveSession(String packageName, JSONObject sessionData) {
        try {
            // Call AppMonitorModule to update active session
            AppMonitorModule.updateActiveSessionForApp(packageName, sessionData.toString());
            Log.d(TAG, "✅ Active session updated for: " + packageName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating active session: " + e.getMessage());
        }
    }

    // Thread-safe hide overlay method
    public void hideOverlay() {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            hideOverlayInternal();
        } else {
            mainHandler.post(this::hideOverlayInternal);
        }
    }

    // Internal hide method (must be called on main thread)
    private void hideOverlayInternal() {
        try {
            Log.d(TAG, "🫥 Hiding access screen overlay for: " + currentAppName);

            if (overlayWebView != null) {
                overlayWebView.stopLoading();

                if (overlayWebView.getParent() != null && windowManager != null) {
                    try {
                        windowManager.removeView(overlayWebView);
                        Log.d(TAG, "✅ Access screen WebView removed from window");
                    } catch (IllegalArgumentException e) {
                        Log.w(TAG, "⚠️ WebView was already removed: " + e.getMessage());
                    }
                }

                overlayWebView.clearHistory();
                overlayWebView.clearCache(true);
                overlayWebView.loadUrl("about:blank");

                mainHandler.postDelayed(() -> {
                    if (overlayWebView != null) {
                        try {
                            overlayWebView.destroy();
                            overlayWebView = null;
                            Log.d(TAG, "✅ Access screen WebView destroyed");
                        } catch (Exception e) {
                            Log.e(TAG, "❌ Error destroying WebView: " + e.getMessage());
                            overlayWebView = null;
                        }
                    }
                }, 100);
            }

            isOverlayActive = false;
            stopSelf();

        } catch (Exception e) {
            Log.e(TAG, "❌ Error hiding access screen overlay: " + e.getMessage());
            isOverlayActive = false;
            overlayWebView = null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        if (mainHandler != null) {
            mainHandler.post(() -> {
                hideOverlayInternal();
            });
        }

        Log.d(TAG, "💀 OverlayAccessService destroyed");
    }

}
