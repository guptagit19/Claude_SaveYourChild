// android/app/src/main/java/com/saveyourchild/AppMonitorService.java
package com.saveyourchild;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.view.accessibility.AccessibilityEvent;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import org.json.JSONObject;
import org.json.JSONException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

public class AppMonitorService extends AccessibilityService {

    private static final String TAG = "AppMonitorService";
    private static AppMonitorService instance;
    private static boolean isOverlayActive = false;
    private static long lastBlockTime = 0;
    private static String lastBlockedPackage = "";
    JSONObject appData;
    private String appName;

    // App states for decision making
    private enum AppState {
        NOT_IN_SESSION,     // App not in active session
        NEEDS_ACCESS_SETUP, // accessStartTime is null/empty - show Access Screen
        WITHIN_ACCESS_TIME, // Currently within allowed access time - allow access
        IN_LOCK_PERIOD,     // Access time ended, in lock period - show Lock Screen
        LOCK_EXPIRED        // Lock period ended - allow access
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)
            return;

        String packageName = event.getPackageName().toString();
        Log.d(TAG, "App opened: " + packageName);

        // Skip system apps
        if (isSystemApp(packageName)) {
            return;
        }

        // Check app state based on active session rules
        AppState appState = checkAppState(packageName);

        if (appState != AppState.NOT_IN_SESSION && appState != AppState.WITHIN_ACCESS_TIME && appState != AppState.LOCK_EXPIRED) {
            Log.d(TAG, "App needs intervention: " + packageName + " - State: " + appState);
            handleAppIntervention(packageName, appState);
        }
    }

    private boolean isSystemApp(String packageName) {
        return packageName.equals("com.google.android.launcher") ||
                packageName.equals("com.android.launcher3") ||
                packageName.equals("com.android.systemui") ||
                packageName.equals("com.google.android.gms") ||
                packageName.equals("android") ||
                packageName.equals("com.mi.android.globallauncher") ||
                packageName.equals("com.android.settings") ||
                packageName.equals("com.miui.securitycenter") ||
                packageName.equals(getPackageName());
    }

    // ✅ Smart rules-based app state checking
    private AppState checkAppState(String packageName) {
        try {
            String rulesJson = AppMonitorModule.getActiveSession();
            Log.d(TAG, "📋 Checking rules for " + packageName + ": " + rulesJson);

            if (rulesJson == null || rulesJson.isEmpty() || rulesJson.equals("{}")) {
                Log.d(TAG, "📋 No active session rules found");
                return AppState.NOT_IN_SESSION;
            }

            JSONObject activeSession = new JSONObject(rulesJson);

            if (!activeSession.has(packageName)) {
                Log.d(TAG, "📋 App not in active session: " + packageName);
                return AppState.NOT_IN_SESSION;
            }

            appData = activeSession.getJSONObject(packageName);
            appName = appData.optString("appName", "");
            // Check if app is active
            if (!appData.optBoolean("isActive", false)) {
                Log.d(TAG, "📋 App is not active in session: " + packageName);
                return AppState.NOT_IN_SESSION;
            }

            // Check if access time has been set
            String accessStartTime = appData.optString("accessStartTime", "");

            if (accessStartTime.isEmpty() || accessStartTime.equals("null")) {
                Log.d(TAG, "🎯 App needs access setup: " + packageName);
                return AppState.NEEDS_ACCESS_SETUP;
            }

            // Parse timing data
            String accessEndTime = appData.optString("accessEndTime", "");
            String lockUpToTime = appData.optString("lockUpToTime", "");

            long currentTime = System.currentTimeMillis();

            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
                sdf.setTimeZone(TimeZone.getTimeZone("UTC"));

                long accessStartMillis = sdf.parse(accessStartTime).getTime();
                long accessEndMillis = !accessEndTime.isEmpty() ? sdf.parse(accessEndTime).getTime() : 0;
                long lockUpToMillis = !lockUpToTime.isEmpty() ? sdf.parse(lockUpToTime).getTime() : 0;

                Log.d(TAG, "⏰ Time check for " + packageName + ":");
                Log.d(TAG, "   Current: " + new Date(currentTime));
                Log.d(TAG, "   Access Start: " + new Date(accessStartMillis));
                Log.d(TAG, "   Access End: " + new Date(accessEndMillis));
                Log.d(TAG, "   Lock Until: " + new Date(lockUpToMillis));

                if (currentTime >= accessStartMillis && currentTime <= accessEndMillis) {
                    Log.d(TAG, "✅ Within access time: " + packageName);
                    return AppState.WITHIN_ACCESS_TIME;
                } else if (currentTime > accessEndMillis && currentTime <= lockUpToMillis) {
                    Log.d(TAG, "🔒 In lock period: " + packageName);
                    return AppState.IN_LOCK_PERIOD;
                } else if (currentTime > lockUpToMillis) {
                    Log.d(TAG, "🔓 Lock expired: " + packageName);
                    // 1) Reset the timing fields on the JSON
                    try {
                        // clear the old times
                        appData.put("accessTime", 0);
                        appData.put("lockTime", 0);
                        appData.put("accessStartTime", "");
                        appData.put("accessEndTime", "");
                        appData.put("lockUpToTime",  "");
                    } catch (JSONException je) {
                        Log.e(TAG, "❌ Error clearing appData times", je);
                    }
                    // 2) Write that back into your session store
                    //    Make sure to convert to String—your bridge method takes a String
                    AppMonitorModule.updateActiveSessionForApp(
                            packageName,
                            appData.toString()
                    );
                    return AppState.LOCK_EXPIRED;
                } else {
                    Log.d(TAG, "⏰ Before access time: " + packageName);
                    return AppState.NEEDS_ACCESS_SETUP;
                }

            } catch (Exception e) {
                Log.e(TAG, "❌ Error parsing time for " + packageName + ": " + e.getMessage());
                return AppState.NEEDS_ACCESS_SETUP;
            }

        } catch (JSONException e) {
            Log.e(TAG, "❌ Error parsing active session JSON: " + e.getMessage());
            return AppState.NOT_IN_SESSION;
        }
    }

    // ✅ Handle app intervention based on state
    private void handleAppIntervention(String packageName, AppState appState) {
        try {
            long currentTime = System.currentTimeMillis();

            // Prevent rapid duplicate calls
//            if (isOverlayActive ||
//                    (packageName.equals(lastBlockedPackage) && currentTime - lastBlockTime < 2000)) {
//                Log.d(TAG, "⏭️ Ignoring duplicate intervention request");
//                return;
//            }

            Log.d(TAG, "🎯 isOverlayActive: " + isOverlayActive +" lastBlockedPackage: "+lastBlockedPackage+" currentTime: "+currentTime+" lastBlockTime: "+lastBlockTime);
            lastBlockTime = currentTime;
            lastBlockedPackage = packageName;

            isOverlayActive = true;

            switch (appState) {
                case NEEDS_ACCESS_SETUP:
                 Log.d(TAG, "🎯 Showing Access Screen for: " + appName);
                Intent accessIntent = new Intent(this, OverlayAccessService.class);
                accessIntent.putExtra("appData", appData.toString());
                accessIntent.putExtra("appState", "showAccessScreen");
                startService(accessIntent);
                break;

                case IN_LOCK_PERIOD:
                    Log.d(TAG, "🔒 Showing Lock Screen for: " + appName);

                    Intent lockIntent = new Intent(this, OverlayAccessService.class);
                    lockIntent.putExtra("appData", appData.toString());
                    lockIntent.putExtra("appState", "showLockScreen");
                    startService(lockIntent);
                    break;

                default:
                    Log.w(TAG, "⚠️ Unexpected app state: " + appState);
                    isOverlayActive = false;
                    break;
            }

            Log.d(TAG, "✅ Intervention handled for: " + appName + " - State: " + appState);

        } catch (Exception e) {
            isOverlayActive = false;
            Log.e(TAG, "❌ Error handling app intervention: " + e.getMessage());
        }
    }

    // Legacy method - now used for fallback only
    private boolean isAppLocked(String packageName) {
        AppState state = checkAppState(packageName);
        return state == AppState.NEEDS_ACCESS_SETUP || state == AppState.IN_LOCK_PERIOD;
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

    public static void resetOverlayFlag() {
        isOverlayActive = false;
        Log.d(TAG, "🔄 Overlay flag reset");
    }

    private void notifyReactNative(String packageName, String appName) {
        try {
            Log.d(TAG, "📤 Notifying React Native to navigate to lock screen for: " + appName);
            AppMonitorModule.sendEventFromService(appName, packageName);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error notifying React Native: " + e.getMessage());
        }
    }
}
