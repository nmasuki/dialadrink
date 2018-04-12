package com.allandroidprojects.dialadrink.notification;

import android.app.Activity;
import android.content.Context;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.MenuItem;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.DialADrink;

import java.util.HashMap;

/**
 * Created by priyankam on 19-07-2016.
 */
public class NotificationCount extends Activity {
    private static HashMap<String, LayerDrawable>  icons = new HashMap<>();

    public static void setBadgeCount(Context context, LayerDrawable icon, int count) {

        BadgeDrawable badge;

        // Reuse drawable if possible
        Drawable reuse = icon.findDrawableByLayerId(R.id.ic_badge);
        if (reuse != null && reuse instanceof BadgeDrawable) {
            badge = (BadgeDrawable) reuse;
        } else {
            badge = new BadgeDrawable(context);
        }

        badge.setCount(count);
        icon.mutate();
        icon.setDrawableByLayerId(R.id.ic_badge, badge);
    }

    public static void setNotify(MenuItem item, String key)
    {
        setNotify(item, key, 0);
    }

    public static void setNotify(MenuItem item, String key, int numMessages) {
        if (item != null) {
            LayerDrawable icon = (LayerDrawable) item.getIcon();
            icons.put(key, icon);
            setBadgeCount(DialADrink.getAppContext(), icon, numMessages);
        }
    }

    public static int setNotify(String key, int numMessages) {
        LayerDrawable icon = (LayerDrawable) (icons.containsKey(key)? icons.get(key): null);
        if(icon!= null)
        {
            SetNotificationCount.setBadgeCount(DialADrink.getAppContext(), icon, numMessages);
            return numMessages;
        }else{
            LogManager.getLogger().d(DialADrink.TAG, "MenuItem icon not set. Please Call setNotify(MenuItem item, String key) first.");
            return 0;
        }
    }

}
