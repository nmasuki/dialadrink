package com.allandroidprojects.dialadrink;

/**
 * Created by nmasuki on 3/9/2018.
 */

import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Handler;
import android.support.annotation.RequiresApi;
import android.support.v4.content.ContextCompat;
import android.widget.ProgressBar;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.cache.ImagePipelineConfigFactory;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.User;
import com.allandroidprojects.dialadrink.utility.Alerts;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.DbSync;
import com.allandroidprojects.dialadrink.utility.DeviceAccountUtils;
import com.allandroidprojects.dialadrink.utility.PreferenceUtils;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.Document;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;
import com.couchbase.lite.QueryRow;
import com.couchbase.lite.View;
import com.facebook.drawee.backends.pipeline.Fresco;

import java.util.Map;
import java.util.UUID;

import br.com.zbra.androidlinq.Linq;

public class App extends android.app.Application {
    public static final String TAG = "DialADrink";
    public static final String DATE_FORMAT = "yyyy-MM-dd hh:mm:ss a";
    public static final boolean DEBUG = BuildConfig.DEBUG;

    // Guest database:
    public static final String GUEST_DATABASE = "guest";
    private static DbSync syncManager;

    private static Context context;
    private User mCurrentUser;

    @Override
    public void onCreate() {
        super.onCreate();
        App.context = getApplicationContext();
        Fresco.initialize(this, ImagePipelineConfigFactory.getImagePipelineConfig(this));
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable throwable) {
                String msg = throwable.getMessage();
                Throwable t = throwable.getCause();
                while (t != null) {
                    msg += "\r\n-------------------\r\n" + t.getMessage();
                    t = t.getCause();
                }

                Runnable runnable = new Runnable() {
                    @Override
                    public void run(Object[] param) {
                        try {
                            Thread.sleep(4000);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        System.exit(2);
                    }
                };

                Alerts.displayError(getAppContext(), msg);
            }
        });
    }

    public static App getAppContext() {
        return (App) App.context;
    }

    public User getCurrentUser() {
        if (mCurrentUser == null) {
            try {
                QueryRow row = Linq.stream(getUserProfilesView().createQuery().run()).first();
                if (row != null) {
                    Document doc = row.getDocument();
                    mCurrentUser = DataUtils.toObj(doc, User.class);
                }
            } catch (CouchbaseLiteException e) {
                LogManager.getLogger().d(App.TAG, "Error while reading user.", e);
            }
        }
        return mCurrentUser;
    }

    public void setCurrentUser(User user) {
        this.mCurrentUser = user;
    }

    public String getCurrentUserId() {
        User user = getCurrentUser();
        return user != null && user.getUserId() != null ? user.getUserId() : getGuestId();
    }

    public String getGuestId() {
        String guestId = PreferenceUtils.getString(App.GUEST_DATABASE + "_Id", null);

        if (guestId == null) {
            guestId = UUID.randomUUID().toString().replace("-", "") + "@dialadrink.com";
            PreferenceUtils.setString(App.GUEST_DATABASE + "_Id", guestId);
        }

        return guestId;
    }

    /**
     * Database View
     */
    public View getUserProfilesView() {
        View view = App.getSyncManager().getDatabase().getView("User");
        if (view.getMap() == null) {
            Mapper map = new Mapper() {
                @Override
                public void map(Map<String, Object> document, Emitter emitter) {
                    if ("User".equals(document.get("type")))
                        emitter.emit(document.get("name"), null);
                }
            };
            view.setMap(map, "1.0");
        }
        return view;
    }

    /**
     * DB and Sync mechanisms
     *
     * @return
     */
    public static DbSync getSyncManager() {
        if (syncManager == null)
            syncManager = new DbSync();

        return syncManager;
    }

    public static Database getDatabase() {
        return getSyncManager().getDatabase();
    }

    public static void init(final java.lang.Runnable runnable) {
        new AsyncTask<Object, Void, Boolean>() {
            @Override
            protected void onPostExecute(Boolean o) {
                runnable.run();
            }

            @Override
            protected Boolean doInBackground(Object[] objects) {
                Integer retries = 0;
                while (getDatabase() == null) {
                    LogManager.getLogger().w(App.TAG, "Loading db..");
                    try {
                        Thread.currentThread().sleep(1000);
                    } catch (InterruptedException e) {
                        LogManager.getLogger().e(App.TAG, "Interrupted Exception..", e);
                    }

                    if (++retries >= 120) {
                        LogManager.getLogger().e(App.TAG, "Unable to load db in a timely way!");
                        return false;
                    }
                }
                return true;
            }
        }.execute();
    }

    /**
     * Display error message
     */
    public static void showErrorMessage(final String errorMessage, final Throwable throwable) {
        runOnUiThread(new java.lang.Runnable() {
            @Override
            public void run() {
                LogManager.getLogger().d(App.TAG, errorMessage, throwable);
                String msg = String.format("%s: %s", errorMessage, throwable != null ? throwable : "");
                Toast.makeText(App.getAppContext(), msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    public static void showErrorMessage(final String errorMessage) {
        runOnUiThread(new java.lang.Runnable() {
            @Override
            public void run() {
                LogManager.getLogger().d(App.TAG, errorMessage);
                Toast.makeText(App.getAppContext(), errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }

    public static void runOnUiThread(java.lang.Runnable runnable) {
        Handler mainHandler = new Handler(getAppContext().getMainLooper());
        mainHandler.post(runnable);
    }

    public static <T> AsyncTask runOnAsyncThread(final Runnable<T> runnable) {
        return new AsyncTask<T, T, T>() {
            @Override
            protected T doInBackground(T[] objects) {
                runnable.run(objects);
                return null;
            }
        };
    }

    public static AsyncTask runOnAsyncThread(final java.lang.Runnable runnable) {
        return new AsyncTask() {
            @Override
            protected Object doInBackground(Object[] objects) {
                runnable.run();
                return null;
            }
        };
    }

    ProgressDialog progressDialog = null;

    public void showProgressDialog(Activity activity, String message) {
        showProgressDialog(activity, message, false);
    }

    public void showProgressDialog(Activity activity, String message, Boolean noDismiss) {
        if (progressDialog != null && progressDialog.isShowing())
            progressDialog.dismiss();

        progressDialog = new ProgressDialog(activity);
        progressDialog.setMessage(message);

        /*if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            Drawable drawable = new ProgressBar(activity).getIndeterminateDrawable().mutate();
            drawable.setColorFilter(ContextCompat.getColor(this, R.color.gray), PorterDuff.Mode.SRC_IN);
            progressDialog.setIndeterminateDrawable(drawable);
        }*/

        progressDialog.show();
    }

    public void hideProgressDialog() {
        if (progressDialog != null && progressDialog.isShowing())
            progressDialog.dismiss();
    }

    public abstract static class Runnable<T> implements java.lang.Runnable {
        private T toWorkWith = (T) null;

        public Runnable() {
        }

        public Runnable(T param) {
            toWorkWith = param;
        }

        public abstract void run(T... param);

        @Override
        public void run() {
            run(toWorkWith);
        }
    }
}

