// android/app/src/main/java/com/saveyourchild/AppMonitorService.java
package com.saveyourchild;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.view.accessibility.AccessibilityEvent;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class AppMonitorService extends AccessibilityService {
    
    private static final String TAG = "AppMonitorService";
    private static AppMonitorService instance;
    private static boolean isOverlayActive = false; // ✅ Add this flag
    private static long lastBlockTime = 0;
    private static String lastBlockedPackage = "";
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // only care about new windows...
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)
            return;

        String packageName = event.getPackageName().toString();
        Log.d(TAG, "App opened: " + packageName);

        // Skip system apps
        if (packageName.equals("com.google.android.launcher") ||
                packageName.equals("com.android.launcher3") ||
                packageName.equals("com.android.systemui") ||
                packageName.equals("com.google.android.gms") ||
                packageName.equals("android") ||
                packageName.equals("com.mi.android.globallauncher") ||
                packageName.equals("com.android.settings") ||
                packageName.equals("com.miui.securitycenter") ||
                packageName.equals(getPackageName())) { // Skip our own app
            return;
        }
            // Check if this app is in locked apps list
            if (isAppLocked(packageName)) {
                Log.d(TAG, "Locked app detected: " + packageName);

                // ✅ Instead of overlay, bring React Native app to foreground
                bringReactNativeAppToForeground(packageName);
            }
    }
    
    @Override
    public void onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted");
    }
    
    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        Log.d(TAG, "Accessibility service connected");
    }
    
    public static AppMonitorService getInstance() {
        return instance;
    }
    
    private boolean isAppLocked(String packageName) {
        Log.d(TAG, "Checking if app is locked: " + packageName);
        
        // Temporary hardcoded apps for testing, check from MMKV Storage
        boolean isLocked = packageName.equals("com.instagram.android") ||
            packageName.equals("com.whatsapp") ||
            packageName.equals("com.facebook.katana") ||
            packageName.equals("com.zhiliaoapp.musically") ||
            packageName.equals("com.google.android.youtube") ||
                packageName.equals("com.android.chrome");
        
        Log.d(TAG, "App " + packageName + " is locked: " + isLocked);
        return isLocked;
    }


    // ✅ Bring React Native app to foreground and navigate to LockScreen

    private void bringReactNativeAppToForeground(String blockedPackage) {
        try {
            long currentTime = System.currentTimeMillis();

            // ✅ Prevent rapid duplicate calls (within 2 seconds)
            // if (isOverlayActive ||
            //         (blockedPackage.equals(lastBlockedPackage) &&
            //                 currentTime - lastBlockTime < 2000)) {
            //     Log.d(TAG, "⏭️ Ignoring duplicate block request");
            //     return;
            // }

            lastBlockTime = currentTime;
            lastBlockedPackage = blockedPackage;

            String appName = getAppNameFromPackage(blockedPackage);
            Log.d(TAG, "🔐 Showing React Native lock screen overlay for: " + appName);

            isOverlayActive = true;

            Intent overlayIntent = new Intent(this, ReactNativeOverlayService.class);
            overlayIntent.putExtra("appName", appName);
            overlayIntent.putExtra("packageName", blockedPackage);
            overlayIntent.putExtra("remainingTime", 30);

            startService(overlayIntent);

            Log.d(TAG, "✅ React Native overlay service started for: " + appName);

        } catch (Exception e) {
            isOverlayActive = false;
            Log.e(TAG, "❌ Error showing overlay: " + e.getMessage());
        }
    }

    // android/app/src/main/java/com/saveyourchild/AppMonitorService.java - UPDATE
    private void showReactNativeLockScreenOverlay(String appName, String packageName) {
        try {
            Log.d(TAG, "🚀 Starting React Native overlay service");

            Intent overlayIntent = new Intent(this, ReactNativeOverlayService.class);
            overlayIntent.putExtra("appName", appName);
            overlayIntent.putExtra("packageName", packageName);
            overlayIntent.putExtra("remainingTime", 30);

            startService(overlayIntent); // ✅ Service instead of Activity

            Log.d(TAG, "✅ React Native overlay service started for: " + appName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting overlay service: " + e.getMessage());
            isOverlayActive = false;
        }
    }

    // ✅ Reset flag when overlay is hidden
    public static void resetOverlayFlag() {
        isOverlayActive = false;
        Log.d(TAG, "🔄 Overlay flag reset");
    }

    // ✅ New method to show overlay
    private void showLockScreenOverlay(String appName, String packageName) {
        try {
            Log.d(TAG, "✅ Lock screen overlay started for: " + appName + " packageName: "+packageName);
            Intent overlayIntent = new Intent(this, ReactNativeLockOverlay.class);
            overlayIntent.putExtra("appName", appName);
            overlayIntent.putExtra("packageName", packageName);
            overlayIntent.putExtra("remainingTime", 30);

            startService(overlayIntent);

            Log.d(TAG, "✅ Lock screen overlay started for: " + appName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting overlay service: " + e.getMessage());
        }
    }


    // ✅ Get app name from package name
    private String getAppNameFromPackage(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            android.content.pm.ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
            return pm.getApplicationLabel(appInfo).toString();
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting app name for: " + packageName);
            return packageName; // Return package name as fallback
        }
    }

    // Update the notifyReactNative method in AppMonitorService.java
    private void notifyReactNative(String packageName, String appName) {
        try {
            Log.d(TAG, "📤 Notifying React Native to navigate to lock screen for: " + appName);

            // ✅ Use static method to send event
            AppMonitorModule.sendEventFromService(appName, packageName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error notifying React Native: " + e.getMessage());
        }
    }

}
