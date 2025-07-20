// android/app/src/main/java/com/saveyourchild/AppMonitorModule.java
package com.saveyourchild;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ApplicationInfo;
import android.provider.Settings;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.util.List;
import java.util.ArrayList;

public class AppMonitorModule extends ReactContextBaseJavaModule {
    
    private ReactApplicationContext reactContext;
    
    public AppMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }
    
    @Override
    public String getName() {
        return "AppMonitorModule";
    }
    
    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            WritableArray appList = Arguments.createArray();
            
            for (ApplicationInfo app : apps) {
                // Filter out system apps
                if ((app.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                    WritableMap appInfo = Arguments.createMap();
                    appInfo.putString("packageName", app.packageName);
                    appInfo.putString("appName", pm.getApplicationLabel(app).toString());
                    appList.pushMap(appInfo);
                }
            }
            
            promise.resolve(appList);
        } catch (Exception e) {
            promise.reject("GET_APPS_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void startAppMonitoring() {
        Intent intent = new Intent(reactContext, AppMonitorService.class);
        reactContext.startService(intent);
    }
    
    @ReactMethod
    public void stopAppMonitoring() {
        Intent intent = new Intent(reactContext, AppMonitorService.class);
        reactContext.stopService(intent);
    }
    
    @ReactMethod
    public void checkAccessibilityPermission(Promise promise) {
        boolean isEnabled = isAccessibilityServiceEnabled();
        promise.resolve(isEnabled);
    }
    
    @ReactMethod
    public void openAccessibilitySettings() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }
    
    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        boolean canDrawOverlays = Settings.canDrawOverlays(reactContext);
        promise.resolve(canDrawOverlays);
    }
    
    @ReactMethod
    public void openOverlaySettings() {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }
    
    private boolean isAccessibilityServiceEnabled() {
        // Check if accessibility service is enabled
        String serviceName = reactContext.getPackageName() + "/" + AppMonitorService.class.getName();
        String enabledServices = Settings.Secure.getString(
            reactContext.getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        
        return enabledServices != null && enabledServices.contains(serviceName);
    }
    
    // Send events to React Native
    public void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
