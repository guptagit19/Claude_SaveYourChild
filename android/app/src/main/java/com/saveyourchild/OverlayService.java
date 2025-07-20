// android/app/src/main/java/com/saveyourchild/OverlayService.java
package com.saveyourchild;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.IBinder;
import android.os.Build;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Button;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

public class OverlayService extends Service {
    
    private WindowManager windowManager;
    private View overlayView;
    private static final String TAG = "OverlayService";
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String blockedApp = intent.getStringExtra("blockedApp");
        Log.d(TAG, "Starting overlay for app: " + blockedApp);
        showOverlay(blockedApp);
        return START_NOT_STICKY;
    }
    
    private void showOverlay(String blockedApp) {
        try {
            // Remove existing overlay if any
            //removeOverlay();
            
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            
            LayoutInflater inflater = LayoutInflater.from(this);
            overlayView = inflater.inflate(R.layout.lock_screen_overlay, null);
            
            // Setup the overlay view content
            TextView messageText = overlayView.findViewById(R.id.lockMessage);
            Button closeButton = overlayView.findViewById(R.id.closeButton);
            
            messageText.setText("This app is currently locked.\nFocus on your goals! 🎯");
            
            // ✅ Fixed OnClickListener with proper overlay removal
            closeButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Log.d(TAG, "Close button clicked");
                    
                    // Remove overlay immediately
                    removeOverlay();
                    
                    // Go back to home screen with delay
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            goToHomeScreen();
                        }
                    }, 100);
                }
            });
            
            // ✅ Updated window layout params for better compatibility
            WindowManager.LayoutParams params;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH |
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    PixelFormat.TRANSLUCENT
                );
            } else {
                params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH |
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    PixelFormat.TRANSLUCENT
                );
            }
            
            params.gravity = Gravity.TOP | Gravity.LEFT;
            params.x = 0;
            params.y = 0;
            
            windowManager.addView(overlayView, params);
            Log.d(TAG, "Overlay view added successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Error showing overlay: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // ✅ Improved removeOverlay method
    private void removeOverlay() {
        try {
            if (overlayView != null && windowManager != null) {
                Log.d(TAG, "Removing overlay view");
                windowManager.removeView(overlayView);
                overlayView = null;
                Log.d(TAG, "Overlay view removed successfully");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error removing overlay: " + e.getMessage());
            overlayView = null; // Reset anyway
        }
        
        // Stop the service
        stopSelf();
    }
    
    // ✅ Improved home screen navigation
    private void goToHomeScreen() {
        try {
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(homeIntent);
            Log.d(TAG, "Navigated to home screen");
        } catch (Exception e) {
            Log.e(TAG, "Error navigating to home: " + e.getMessage());
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        removeOverlay();
    }
    
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        removeOverlay();
    }
}
