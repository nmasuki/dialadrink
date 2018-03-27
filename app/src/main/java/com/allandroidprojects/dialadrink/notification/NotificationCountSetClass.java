package com.allandroidprojects.dialadrink.notification;

import android.app.Activity;
import android.content.Context;
import android.graphics.drawable.LayerDrawable;
import android.view.MenuItem;

/**
 * Created by priyankam on 19-07-2016.
 */
public class NotificationCountSetClass extends Activity {
    private static LayerDrawable icon;
    private static Context _context;
    public NotificationCountSetClass() {
        //constructor
    }

    public static void setAddToCart(Context context, MenuItem item, int numMessages) {
        if (item != null) {
            icon = (LayerDrawable) item.getIcon();
            SetNotificationCount.setBadgeCount(context, icon, numMessages);
        }
    }

    public static int setNotifyCount(int numMessages) {
        if(_context!=null && icon!= null)
            SetNotificationCount.setBadgeCount(_context, icon, numMessages);
        return numMessages;

    }


}
