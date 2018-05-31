package com.allandroidprojects.dialadrink.utility;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;

import java.util.HashMap;

public class Alerts {
    public static String INTENT_DISPLAYERROR = "intentDisplayError";

    private static class AlertReceiver extends BroadcastReceiver {
        private static HashMap<Activity, AlertReceiver> registrations;
        private Context activityContext;

        static {
            registrations = new HashMap<Activity, AlertReceiver>();
        }

        private AlertReceiver(Activity activity) {
            activityContext = activity;
        }

        static void register(Activity activity) {
            AlertReceiver receiver = new AlertReceiver(activity);
            activity.registerReceiver(receiver, new IntentFilter(INTENT_DISPLAYERROR));
            registrations.put(activity, receiver);
        }

        static void unregister(Activity activity) {
            AlertReceiver receiver = registrations.get(activity);
            if(receiver != null) {
                activity.unregisterReceiver(receiver);
                registrations.remove(activity);
            }
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            abortBroadcast();
            String msg = intent.getStringExtra(Intent.EXTRA_TEXT);
            displayErrorInternal(activityContext, msg);
        }
    }

    public static void register(Activity activity) {
        AlertReceiver.register(activity);
    }

    public static void unregister(Activity activity) {
        AlertReceiver.unregister(activity);
    }

    public static void displayError(Context context, String msg) {
        Intent intent = new Intent(INTENT_DISPLAYERROR);
        intent.putExtra(Intent.EXTRA_TEXT, msg);
        context.sendOrderedBroadcast(intent, null);
    }

    private static void displayErrorInternal(Context context, String msg) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        builder.setTitle("Error")
                .setMessage(msg)
                .setCancelable(false)
                .setPositiveButton("Ok", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });
        final AlertDialog alert = builder.create();

        alert.show();
    }

}
