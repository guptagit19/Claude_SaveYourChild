// android/app/src/main/java/com/saveyourchild/ReactNativeLockOverlay.java - ENHANCED VERSION
package com.saveyourchild;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Button;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;

public class ReactNativeLockOverlay extends Service {

    private static final String TAG = "ReactNativeLockOverlay";
    private ReactRootView mReactRootView;
    private View mNativeOverlay;
    private WindowManager windowManager;
    private WindowManager.LayoutParams params;
    private static ReactNativeLockOverlay instance;
    private boolean isReactNativeOverlay = false;

    // ✅ Add retry mechanism
    private int retryCount = 0;
    private static final int MAX_RETRIES = 3;
    private Handler mainHandler;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        mainHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "🚀 ReactNativeLockOverlay service created");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "📱 ReactNativeLockOverlay service started");

        try {
            // Remove any existing overlay first
            hideOverlay();

            // Extract data from intent
            String appName = intent.getStringExtra("appName");
            String packageName = intent.getStringExtra("packageName");
            int remainingTime = intent.getIntExtra("remainingTime", 30);

            Log.d(TAG, "📦 Overlay data - App: " + appName + ", Package: " + packageName + ", Time: " + remainingTime);

            // Check overlay permission
            if (!Settings.canDrawOverlays(this)) {
                Log.e(TAG, "❌ Overlay permission not granted!");
                stopSelf();
                return START_NOT_STICKY;
            }

            // ✅ Try React Native with retry mechanism
            tryShowReactNativeOverlayWithRetry(appName, packageName, remainingTime);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in onStartCommand: " + e.getMessage());
            e.printStackTrace();
            AppMonitorService.resetOverlayFlag();
        }

        return START_NOT_STICKY;
    }

    // ✅ Retry mechanism for React Native context
    private void tryShowReactNativeOverlayWithRetry(String appName, String packageName, int remainingTime) {
        if (retryCount < MAX_RETRIES) {
            // ✅ Try to initialize React Native first
            if (initializeReactNativeContext()) {
                if (showReactNativeOverlay(appName, packageName, remainingTime)) {
                    Log.d(TAG, "✅ React Native overlay succeeded on attempt " + (retryCount + 1));
                    return;
                }
            }

            retryCount++;
            Log.w(TAG, "⚠️ React Native attempt " + retryCount + " failed, retrying...");

            // Retry after 500ms
            mainHandler.postDelayed(() -> {
                tryShowReactNativeOverlayWithRetry(appName, packageName, remainingTime);
            }, 500);

        } else {
            Log.w(TAG, "⚠️ All React Native attempts failed, using native fallback");
            showNativeOverlay(appName, packageName, remainingTime);
        }
    }

    // ✅ Initialize React Native context
    private boolean initializeReactNativeContext() {
        try {
            Log.d(TAG, "🔄 Initializing React Native context...");

            ReactApplication reactApplication = (ReactApplication) getApplication();
            ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();

            if (reactInstanceManager == null) {
                Log.e(TAG, "❌ ReactInstanceManager is null!");
                return false;
            }

            // ✅ Check if React Native is already initialized
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            if (reactContext != null) {
                Log.d(TAG, "✅ React Native context already available!");
                return true;
            }

            // ✅ If not initialized, try to initialize it
            Log.d(TAG, "🔄 React Native context not available, trying to initialize...");

            // Check if main activity exists and bring it to foreground
            if (!bringMainAppToForeground()) {
                Log.w(TAG, "⚠️ Could not bring main app to foreground");
            }

            // Wait a bit for context to initialize
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // Check again
            reactContext = reactInstanceManager.getCurrentReactContext();
            boolean isReady = reactContext != null;

            Log.d(TAG, "🔍 React Native context after initialization attempt: " + (isReady ? "Available" : "Still null"));
            return isReady;

        } catch (Exception e) {
            Log.e(TAG, "❌ Error initializing React Native context: " + e.getMessage());
            return false;
        }
    }

    // ✅ Bring main app to foreground to initialize RN context
    private boolean bringMainAppToForeground() {
        try {
            String ourPackage = getPackageName();
            Intent launchIntent = getPackageManager().getLaunchIntentForPackage(ourPackage);

            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(launchIntent);

                Log.d(TAG, "✅ Brought main app to foreground for RN initialization");
                return true;
            }

            return false;
        } catch (Exception e) {
            Log.e(TAG, "❌ Error bringing main app to foreground: " + e.getMessage());
            return false;
        }
    }

    // ✅ Enhanced React Native overlay method
    private boolean showReactNativeOverlay(String appName, String packageName, int remainingTime) {
        try {
            Log.d(TAG, "🔐 Attempting React Native overlay (Enhanced)");

            ReactApplication reactApplication = (ReactApplication) getApplication();
            ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();

            if (reactInstanceManager == null) {
                Log.e(TAG, "❌ ReactInstanceManager is null!");
                return false;
            }

            // ✅ Enhanced context check with detailed logging
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            if (reactContext == null) {
                Log.e(TAG, "❌ React Native context is still null after initialization attempts!");
                Log.d(TAG, "🔍 ReactInstanceManager state: " + reactInstanceManager.getLifecycleState());
                return false;
            }

            Log.d(TAG, "✅ React Native context is available!");
            Log.d(TAG, "🔍 Context state: " + reactContext.getLifecycleState());

            // Create React Native root view
            mReactRootView = new ReactRootView(this);

            // Create Bundle for initial props
            Bundle initialProps = new Bundle();
            initialProps.putString("appName", appName != null ? appName : "Unknown App");
            initialProps.putString("packageName", packageName != null ? packageName : "");
            initialProps.putInt("remainingTime", remainingTime);
            initialProps.putString("timestamp", String.valueOf(System.currentTimeMillis()));

            Log.d(TAG, "📋 React Native props: " + initialProps.toString());

            // Start React Application
            mReactRootView.startReactApplication(
                    reactInstanceManager,
                    "LockScreenOverlay",
                    initialProps
            );

            // Setup window parameters
            setupWindowParameters();

            // Add overlay to window manager
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            windowManager.addView(mReactRootView, params);

            isReactNativeOverlay = true;
            Log.d(TAG, "✅ React Native overlay displayed successfully!");
            return true;

        } catch (Exception e) {
            Log.e(TAG, "❌ Error showing React Native overlay: " + e.getMessage());
            e.printStackTrace();

            // Cleanup on error
            if (mReactRootView != null && windowManager != null) {
                try {
                    windowManager.removeView(mReactRootView);
                } catch (Exception cleanupError) {
                    Log.e(TAG, "Error cleaning up failed overlay: " + cleanupError.getMessage());
                }
                mReactRootView = null;
            }

            return false;
        }
    }

    // ✅ Native overlay fallback (existing code)
    private void showNativeOverlay(String appName, String packageName, int remainingTime) {
        try {
            Log.d(TAG, "🔐 Creating native overlay fallback");

            LayoutInflater inflater = LayoutInflater.from(this);
            mNativeOverlay = inflater.inflate(R.layout.simple_lock_overlay, null);

            TextView titleText = mNativeOverlay.findViewById(R.id.titleText);
            TextView messageText = mNativeOverlay.findViewById(R.id.messageText);
            Button homeButton = mNativeOverlay.findViewById(R.id.homeButton);

            titleText.setText(appName + " is Locked");
            messageText.setText("Focus on your goals ReactNativeLockOverlay ! 🎯\nTime remaining: " + remainingTime + " minutes");

            homeButton.setOnClickListener(v -> {
                Log.d(TAG, "🏠 Home button clicked");
                goToHomeScreen();
                hideOverlay();
            });

            setupWindowParameters();

            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            windowManager.addView(mNativeOverlay, params);

            isReactNativeOverlay = false;
            Log.d(TAG, "✅ Native overlay displayed successfully!");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error showing native overlay: " + e.getMessage());
            e.printStackTrace();
            stopSelf();
        }
    }

    // ... rest of the existing methods (setupWindowParameters, goToHomeScreen, hideOverlay, etc.)

    private void setupWindowParameters() {
        params = new WindowManager.LayoutParams();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            params.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            params.type = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params.width = WindowManager.LayoutParams.MATCH_PARENT;
        params.height = WindowManager.LayoutParams.MATCH_PARENT;
        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.x = 0;
        params.y = 0;

        params.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH |
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                WindowManager.LayoutParams.FLAG_FULLSCREEN;

        params.format = PixelFormat.TRANSLUCENT;
    }

    private void goToHomeScreen() {
        try {
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(homeIntent);
            Log.d(TAG, "✅ Navigated to home screen");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error navigating to home: " + e.getMessage());
        }
    }

    public void hideOverlay() {
        try {
            Log.d(TAG, "🫥 Hiding overlay...");

            if (isReactNativeOverlay && mReactRootView != null && windowManager != null) {
                windowManager.removeView(mReactRootView);
                mReactRootView = null;
                Log.d(TAG, "✅ React Native overlay hidden");
            } else if (!isReactNativeOverlay && mNativeOverlay != null && windowManager != null) {
                windowManager.removeView(mNativeOverlay);
                mNativeOverlay = null;
                Log.d(TAG, "✅ Native overlay hidden");
            }

            AppMonitorService.resetOverlayFlag();
            stopSelf();

        } catch (Exception e) {
            Log.e(TAG, "❌ Error hiding overlay: " + e.getMessage());
            mReactRootView = null;
            mNativeOverlay = null;
            AppMonitorService.resetOverlayFlag();
        }
    }

    public static void hideOverlayStatic() {
        if (instance != null) {
            instance.hideOverlay();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "💀 ReactNativeLockOverlay service destroyed");

        try {
            if (mReactRootView != null && windowManager != null) {
                windowManager.removeView(mReactRootView);
            }
            if (mNativeOverlay != null && windowManager != null) {
                windowManager.removeView(mNativeOverlay);
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error in onDestroy: " + e.getMessage());
        }

        mReactRootView = null;
        mNativeOverlay = null;
        instance = null;
        AppMonitorService.resetOverlayFlag();
    }
}
