package com.allandroidprojects.dialadrink.notification;

import android.app.Activity;
import android.content.Context;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.MenuItem;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;

import java.util.HashMap;

/**
 * Created by priyankam on 19-07-2016.
 */
public class NotificationCount extends Activity {
    private static HashMap<String, LayerDrawable>  icons = new HashMap<>();

    public static void setBadgeCount(Context context, final LayerDrawable icon, final int count) {

        final BadgeDrawable badge;

        // Reuse drawable if possible
        Drawable reuse = icon.findDrawableByLayerId(R.id.ic_badge);
        if (reuse != null && reuse instanceof BadgeDrawable) {
            badge = (BadgeDrawable) reuse;
        } else {
            badge = new BadgeDrawable(context);
        }

        App.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                badge.setCount(count);
                icon.mutate();
                icon.setDrawableByLayerId(R.id.ic_badge, badge);
            }
        });
    }

    public static void setBadgeCount(MenuItem item, String key, int numMessages) {
        if (item != null) {
            LayerDrawable icon = (LayerDrawable) item.getIcon();
            icons.put(key, icon);
            setBadgeCount(App.getAppContext(), icon, numMessages);
        }
    }

    public static int setBadgeCount(String key, int numMessages) {
        LayerDrawable icon = (LayerDrawable) (icons.containsKey(key)? icons.get(key): null);

        if(icon!= null)
        {
            setBadgeCount(App.getAppContext(), icon, numMessages);
            return numMessages;
        }else{
            LogManager.getLogger().d(App.TAG, "MenuItem icon not set. Please Call setBadgeCount(MenuItem item, String key) first.");
            return 0;
        }
    }
}
