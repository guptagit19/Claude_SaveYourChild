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
                // Start overlay service to show lock screen
//                Intent overlayIntent = new Intent(this, OverlayService.class);
//                overlayIntent.putExtra("blockedApp", packageName);
//                startService(overlayIntent);
//
//                // Notify React Native
//                notifyReactNative(packageName);

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
            String ourPackage = getPackageName();
            PackageManager pm = getPackageManager();

            // Get app name from package name
            String appName = getAppNameFromPackage(blockedPackage);

            // Create intent to bring our app to foreground
            Intent launchIntent = pm.getLaunchIntentForPackage(ourPackage);
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                launchIntent.putExtra("BLOCKED_APP_PACKAGE", blockedPackage);
                launchIntent.putExtra("BLOCKED_APP_NAME", appName);
                launchIntent.putExtra("ACTION", "SHOW_LOCK_SCREEN");

                startActivity(launchIntent);

                Log.d(TAG, "✅ Brought React Native app to foreground for: " + appName);

                // ✅ Small delay then notify React Native to navigate
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        notifyReactNative(blockedPackage, appName);
                    }
                }, 500); // 500ms delay to ensure app is in foreground

            } else {
                Log.e(TAG, "❌ Could not get launch intent for our app");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error bringing app to foreground: " + e.getMessage());
            e.printStackTrace();
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
