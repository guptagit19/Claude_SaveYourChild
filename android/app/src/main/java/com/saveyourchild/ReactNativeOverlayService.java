// android/app/src/main/java/com/saveyourchild/ReactNativeOverlayService.java - COMPLETE FIXED VERSION
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

public class ReactNativeOverlayService extends Service {

    private static final String TAG = "RNOverlayService";
    private WebView overlayWebView;
    private WindowManager windowManager;
    private static boolean isOverlayActive = false;
    private Handler mainHandler;

    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "🚀 ReactNativeOverlayService created");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (isOverlayActive) {
            Log.d(TAG, "⏭️ Overlay already active, ignoring...");
            return START_NOT_STICKY;
        }

        String appName = intent.getStringExtra("appName");
        String packageName = intent.getStringExtra("packageName");
        int remainingTime = intent.getIntExtra("remainingTime", 30);

        Log.d(TAG, "📱 Starting overlay for: " + appName);

        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "❌ Overlay permission not granted!");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Run on main thread
        mainHandler.post(() -> {
            showWebViewOverlay(appName, packageName, remainingTime);
        });

        isOverlayActive = true;
        return START_NOT_STICKY;
    }

    private void showWebViewOverlay(String appName, String packageName, int remainingTime) {
        try {
            Log.d(TAG, "🔐 Creating WebView overlay on main thread");

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
            overlayWebView.addJavascriptInterface(new WebAppInterface(appName, packageName), "Android");

            // ✅ FIXED: WebViewClient without inner method
            overlayWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);

                    Log.d(TAG, "📄 Page finished loading: " + url);

                    // ✅ Multiple initialization attempts with delays - calling class method
                    mainHandler.postDelayed(() -> attemptInitialization(view, appName, packageName, remainingTime, 1), 300);
                    mainHandler.postDelayed(() -> attemptInitialization(view, appName, packageName, remainingTime, 2), 800);
                    mainHandler.postDelayed(() -> attemptInitialization(view, appName, packageName, remainingTime, 3), 1500);
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

            // Load HTML file
            overlayWebView.loadUrl("file:///android_asset/lockscreen.html");

            Log.d(TAG, "✅ React Native overlay displayed successfully!");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error showing overlay: " + e.getMessage());
            e.printStackTrace();
            hideOverlay();
        }
    }

    // ✅ MOVED: Helper method for initialization (now a class method)
    private void attemptInitialization(WebView view, String appName, String packageName, int remainingTime, int attempt) {
        try {
            String checkAndInitScript = String.format(
                    "console.log('🔄 Initialization attempt %d'); " +
                            "if (typeof window.initLockScreen === 'function') { " +
                            "  console.log('✅ initLockScreen found, calling...'); " +
                            "  window.initLockScreen('%s', '%s', %d); " +
                            "  console.log('✅ initLockScreen called successfully'); " +
                            "} else { " +
                            "  console.log('❌ initLockScreen not found on attempt %d'); " +
                            "}",
                    attempt, appName.replace("'", "\\'"), packageName, remainingTime, attempt
            );

            view.evaluateJavascript(checkAndInitScript, result -> {
                Log.d(TAG, "📱 JavaScript result for attempt " + attempt + ": " + result);
            });

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in initialization attempt " + attempt + ": " + e.getMessage());
        }
    }

    // JavaScript interface class with thread-safe methods
    public class WebAppInterface {
        private String appName;
        private String packageName;

        WebAppInterface(String appName, String packageName) {
            this.appName = appName;
            this.packageName = packageName;
        }

        @JavascriptInterface
        public void goHome() {
            Log.d(TAG, "🏠 Home button clicked from WebView");

            // Post to main thread to avoid thread violation
            mainHandler.post(() -> {
                try {
                    // Go to home screen
                    Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                    homeIntent.addCategory(Intent.CATEGORY_HOME);
                    homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(homeIntent);

                    Log.d(TAG, "✅ Home intent started");

                    // Delay hiding overlay to prevent drawing conflicts
                    mainHandler.postDelayed(() -> {
                        hideOverlay();
                    }, 300);

                } catch (Exception e) {
                    Log.e(TAG, "❌ Error in goHome: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void onTimeUp() {
            Log.d(TAG, "⏰ Time completed");

            // Post to main thread
            mainHandler.post(() -> {
                mainHandler.postDelayed(() -> {
                    hideOverlay();
                }, 300);
            });
        }

        @JavascriptInterface
        public String getAppName() {
            return appName;
        }

        @JavascriptInterface
        public String getPackageName() {
            return packageName;
        }
    }

    // Thread-safe hide overlay method
    public void hideOverlay() {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            // Already on main thread
            hideOverlayInternal();
        } else {
            // Post to main thread
            mainHandler.post(this::hideOverlayInternal);
        }
    }

    // Internal hide method (must be called on main thread)
    private void hideOverlayInternal() {
        try {
            Log.d(TAG, "🫥 Hiding overlay on main thread");

            if (overlayWebView != null) {
                // Stop loading first
                overlayWebView.stopLoading();

                // Check if view is still attached before removing
                if (overlayWebView.getParent() != null && windowManager != null) {
                    try {
                        windowManager.removeView(overlayWebView);
                        Log.d(TAG, "✅ WebView removed from window");
                    } catch (IllegalArgumentException e) {
                        Log.w(TAG, "⚠️ WebView was already removed: " + e.getMessage());
                    }
                }

                // Cleanup WebView
                overlayWebView.clearHistory();
                overlayWebView.clearCache(true);
                overlayWebView.loadUrl("about:blank");

                // Destroy after delay
                mainHandler.postDelayed(() -> {
                    if (overlayWebView != null) {
                        try {
                            overlayWebView.destroy();
                            overlayWebView = null;
                            Log.d(TAG, "✅ WebView destroyed");
                        } catch (Exception e) {
                            Log.e(TAG, "❌ Error destroying WebView: " + e.getMessage());
                            overlayWebView = null;
                        }
                    }
                }, 100);
            }

            isOverlayActive = false;
            AppMonitorService.resetOverlayFlag();
            stopSelf();

        } catch (Exception e) {
            Log.e(TAG, "❌ Error hiding overlay: " + e.getMessage());
            isOverlayActive = false;
            overlayWebView = null;
        }
    }

    public static void hideOverlayStatic() {
        // Implementation for static access if needed
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        // Ensure cleanup on main thread
        if (mainHandler != null) {
            mainHandler.post(() -> {
                hideOverlayInternal();
            });
        }

        Log.d(TAG, "💀 ReactNativeOverlayService destroyed");
    }
}
