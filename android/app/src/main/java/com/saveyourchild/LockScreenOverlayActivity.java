// android/app/src/main/java/com/saveyourchild/LockScreenOverlayActivity.java
package com.saveyourchild;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.graphics.Color;

public class LockScreenOverlayActivity extends Activity {

    private static final String TAG = "LockScreenOverlay";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d(TAG, "🚀 LockScreenOverlayActivity onCreate called!");

        // Get data from intent
        Intent intent = getIntent();
        String appName = intent.getStringExtra("appName");
        String packageName = intent.getStringExtra("packageName");
        int remainingTime = intent.getIntExtra("remainingTime", 30);

        Log.d(TAG, "📦 Received data - App: " + appName + ", Package: " + packageName);

        // ✅ Create simple native UI for testing
        createSimpleUI(appName, packageName, remainingTime);
    }

    private void createSimpleUI(String appName, String packageName, int remainingTime) {
        // Create layout programmatically
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#667eea"));
        layout.setPadding(50, 200, 50, 200);

        // Title
        TextView title = new TextView(this);
        title.setText("🔒 " + appName + " is Locked");
        title.setTextSize(24);
        title.setTextColor(Color.WHITE);
        title.setPadding(0, 0, 0, 50);
        layout.addView(title);

        // Message
        TextView message = new TextView(this);
        message.setText("Focus on your goals LockScreenOverlayActivity ! 🎯\nTime: " + remainingTime + " minutes");
        message.setTextSize(18);
        message.setTextColor(Color.WHITE);
        message.setPadding(0, 0, 0, 50);
        layout.addView(message);

        // Home button
        Button homeButton = new Button(this);
        homeButton.setText("🏠 Go Home");
        homeButton.setTextSize(16);
        homeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d(TAG, "🏠 Home button clicked");
                goHome();
            }
        });
        layout.addView(homeButton);

        // Debug info
        TextView debug = new TextView(this);
        debug.setText("Debug: " + packageName);
        debug.setTextSize(12);
        debug.setTextColor(Color.LTGRAY);
        debug.setPadding(0, 50, 0, 0);
        layout.addView(debug);

        setContentView(layout);

        Log.d(TAG, "✅ Simple UI created successfully");
    }

    private void goHome() {
        try {
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(homeIntent);

            AppMonitorService.resetOverlayFlag();
            finish();

            Log.d(TAG, "✅ Gone to home screen");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error going home: " + e.getMessage());
        }
    }

    @Override
    public void onBackPressed() {
        Log.d(TAG, "⬅️ Back button pressed");
        goHome();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        AppMonitorService.resetOverlayFlag();
        Log.d(TAG, "💀 LockScreenOverlayActivity destroyed");
    }
}
