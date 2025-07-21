// android/app/src/main/java/com/saveyourchild/AppMonitorModule.java
package com.saveyourchild;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ApplicationInfo;
import android.provider.Settings;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.ArrayList;

public class AppMonitorModule extends ReactContextBaseJavaModule {
    
    private ReactApplicationContext reactContext;
    private static final String TAG = "AppMonitorModule";
    private static AppMonitorModule moduleInstance;

    public AppMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        moduleInstance = this; // ✅ Store static reference
    }

    // ✅ Static method to send event from service
    public static void sendEventFromService(String appName, String packageName) {
        try {
            if (moduleInstance != null) {
                WritableMap params = Arguments.createMap();
                params.putString("appName", appName);
                params.putString("packageName", packageName);
                params.putString("action", "NAVIGATE_TO_LOCK_SCREEN");
                params.putString("timestamp", String.valueOf(System.currentTimeMillis()));

                moduleInstance.sendEvent("AppBlocked", params);
                Log.d("AppMonitorModule", "✅ Event sent from service for: " + appName);
            }
        } catch (Exception e) {
            Log.e("AppMonitorModule", "❌ Error sending event from service: " + e.getMessage());
        }
    }
    
    @Override
    public String getName() {
        return "AppMonitorModule";
    }
    
    // ✅ Updated method with icon support
    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            Log.d(TAG, "🔍 Getting installed apps with icons...");
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            WritableArray appList = Arguments.createArray();
            String selfPackage = reactContext.getPackageName();
            int count = 0;
            
            for (ApplicationInfo app : apps) {
                try {
                    // Skip system apps and our own app
                    if ((app.flags & ApplicationInfo.FLAG_SYSTEM) == 0 && 
                        !app.packageName.equals(selfPackage)) {
                        
                        WritableMap appInfo = Arguments.createMap();
                        
                        // Basic app info
                        String appName = pm.getApplicationLabel(app).toString();
                        appInfo.putString("packageName", app.packageName);
                        appInfo.putString("appName", appName);
                        
                        // ✅ Get and convert icon to base64
                        try {
                            Drawable icon = pm.getApplicationIcon(app);
                            String iconBase64 = drawableToBase64(icon);
                            appInfo.putString("icon", iconBase64);
                            Log.d(TAG, "✅ Icon added for: " + appName);
                        } catch (Exception iconError) {
                            Log.e(TAG, "❌ Icon error for " + appName + ": " + iconError.getMessage());
                            appInfo.putString("icon", ""); // Empty if icon fails
                        }
                        
                        appList.pushMap(appInfo);
                        count++;
                        
                        // Limit to 50 apps to avoid performance issues
                        if (count >= 70) break;
                    }
                } catch (Exception appError) {
                    Log.e(TAG, "Error processing app: " + appError.getMessage());
                    continue;
                }
            }
            
            Log.d(TAG, "✅ Successfully loaded " + count + " apps with icons");
            promise.resolve(appList);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting installed apps: " + e.getMessage());
            promise.reject("GET_APPS_ERROR", e.getMessage());
        }
    }
    
    // ✅ Helper method to convert drawable to base64
    private String drawableToBase64(Drawable drawable) {
        try {
            // Set reasonable icon size (48x48 dp)
            int iconSize = 144; // 48dp * 3 for good quality
            
            Bitmap bitmap = Bitmap.createBitmap(iconSize, iconSize, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            
            // Set bounds and draw
            drawable.setBounds(0, 0, iconSize, iconSize);
            drawable.draw(canvas);
            
            // Convert to base64
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 90, byteStream); // 90% quality for smaller size
            byte[] byteArray = byteStream.toByteArray();
            
            // Cleanup
            byteStream.close();
            bitmap.recycle();
            
            return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP);
            
        } catch (Exception e) {
            Log.e(TAG, "Error converting icon to base64: " + e.getMessage());
            return "";
        }
    }
    
    @ReactMethod
    public void startAppMonitoring() {
        try {
            Intent intent = new Intent(reactContext, AppMonitorService.class);
            reactContext.startService(intent);
            Log.d(TAG, "✅ App monitoring service started");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting app monitoring: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void stopAppMonitoring() {
        try {
            Intent intent = new Intent(reactContext, AppMonitorService.class);
            reactContext.stopService(intent);
            Log.d(TAG, "✅ App monitoring service stopped");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping app monitoring: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void checkAccessibilityPermission(Promise promise) {
        try {
            boolean isEnabled = isAccessibilityServiceEnabled();
            Log.d(TAG, "Accessibility permission: " + isEnabled);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility permission: " + e.getMessage());
            promise.resolve(false);
        }
    }
    
    @ReactMethod
    public void openAccessibilitySettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            Log.d(TAG, "✅ Opened accessibility settings");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error opening accessibility settings: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        try {
            boolean canDrawOverlays = Settings.canDrawOverlays(reactContext);
            Log.d(TAG, "Overlay permission: " + canDrawOverlays);
            promise.resolve(canDrawOverlays);
        } catch (Exception e) {
            Log.e(TAG, "Error checking overlay permission: " + e.getMessage());
            promise.resolve(false);
        }
    }
    
    @ReactMethod
    public void openOverlaySettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            Log.d(TAG, "✅ Opened overlay settings");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error opening overlay settings: " + e.getMessage());
        }
    }
    
    private boolean isAccessibilityServiceEnabled() {
        try {
            String serviceName = reactContext.getPackageName() + "/" + AppMonitorService.class.getName();
            String enabledServices = Settings.Secure.getString(
                reactContext.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            
            return enabledServices != null && enabledServices.contains(serviceName);
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility service: " + e.getMessage());
            return false;
        }
    }
    
    // Send events to React Native
    public void sendEvent(String eventName, WritableMap params) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        } catch (Exception e) {
            Log.e(TAG, "Error sending event: " + e.getMessage());
        }
    }

    @ReactMethod
    public void bringAppToForeground(Promise promise) {
        try {
            Context context = reactContext;
            String packageName = context.getPackageName();

            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                context.startActivity(launchIntent);
                Log.d(TAG, "✅ Brought app to foreground");
                promise.resolve(true);
            } else {
                promise.reject("FOREGROUND_ERROR", "Could not bring app to foreground");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error bringing app to foreground: " + e.getMessage());
            promise.reject("FOREGROUND_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void navigateToLockScreen(String appName, String packageName) {
        try {
            Log.d(TAG, "🔒 Navigating to lock screen for: " + appName);

            // Send event to React Native to navigate
            WritableMap params = Arguments.createMap();
            params.putString("appName", appName);
            params.putString("packageName", packageName);
            params.putString("action", "NAVIGATE_TO_LOCK_SCREEN");

            sendEvent("AppBlocked", params);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error navigating to lock screen: " + e.getMessage());
        }
    }

    // android/app/src/main/java/com/saveyourchild/AppMonitorModule.java - Add this method
    @ReactMethod
    public void goToHomeScreen() {
        try {
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            reactContext.startActivity(homeIntent);
            Log.d(TAG, "✅ Navigated to home screen");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error navigating to home: " + e.getMessage());
        }
    }

}
