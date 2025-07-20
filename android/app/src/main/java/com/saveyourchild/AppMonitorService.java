// android/app/src/main/java/com/saveyourchild/AppMonitorService.java
package com.saveyourchild;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
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
       if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName().toString();
            String className = event.getClassName().toString();

            Log.d(TAG, "App opened: " + packageName);

            if (packageName.equals("com.google.android.launcher")  ||
                    packageName.equals("com.android.launcher3") ||
                    packageName.equals("com.android.systemui") ||
                    packageName.equals("com.google.android.gms") ||
                    packageName.equals("android") ||
                    packageName.equals("com.mi.android.globallauncher") ||
                    packageName.equals("com.android.settings") ||
                    packageName.equals("com.miui.securitycenter")
            ) {
                Log.d(TAG, "Returning back: ");
                return;
            }
            // Check if this app is in locked apps list
            if (isAppLocked(packageName)) {
                Log.d(TAG, "Locked app detected: " + packageName);
                // Start overlay service to show lock screen
                Intent overlayIntent = new Intent(this, OverlayService.class);
                overlayIntent.putExtra("blockedApp", packageName);
                startService(overlayIntent);
                
                // Notify React Native
                notifyReactNative(packageName);
            }
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
    
    private void notifyReactNative(String packageName) {
        // Send event to React Native if app is running
        try {
            WritableMap params = Arguments.createMap();
            params.putString("blockedApp", packageName);
            params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
            
            // This will be received by React Native event listener
            // You'll need to implement the bridge connection
        } catch (Exception e) {
            Log.e(TAG, "Error notifying React Native: " + e.getMessage());
        }
    }
}
