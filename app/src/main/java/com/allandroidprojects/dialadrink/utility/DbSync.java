package com.allandroidprojects.dialadrink.utility;

import android.os.AsyncTask;
import android.os.Handler;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.StringUtils;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.DatabaseOptions;
import com.couchbase.lite.Manager;
import com.couchbase.lite.android.AndroidContext;
import com.couchbase.lite.auth.Authenticator;
import com.couchbase.lite.replicator.Replication;
import com.couchbase.lite.util.Log;
import com.couchbase.lite.util.ZipUtils;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Created by nmasuki on 4/8/2018.
 */
public class DbSync implements Replication.ChangeListener {
    public static String IP = "159.65.50.86";

    // Sync end point
    private static final String SYNC_URL_HTTP = "http://" + IP + ":4984/dialadrink";//"http://nmasuki.mobileaccord.local:4984/dialadrink";//

    // Storage Type: .SQLITE_STORAGE or .FORESTDB_STORAGE
    private static final String STORAGE_TYPE = Manager.SQLITE_STORAGE;

    // Logging:
    private static final boolean LOGGING_ENABLED = true;

    // Encryption:
    private static final boolean ENCRYPTION_ENABLED = false;
    private static String ENCRYPTION_KEY = "seeker1";

    private Manager mManager;
    private Database mDatabase;
    private Replication mPull;
    private Replication mPush;
    private Throwable mReplError;

    public DbSync() {
        ENCRYPTION_KEY = App.getAppContext().getString(R.string.encrption_key);
        enableLogging();
    }

    private void enableLogging() {
        if (LOGGING_ENABLED) {
            Manager.enableLogging(App.TAG, Log.VERBOSE);
            Manager.enableLogging(Log.TAG, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_SYNC_ASYNC_TASK, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_SYNC, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_QUERY, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_VIEW, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_DATABASE, Log.VERBOSE);
        }
    }

    public Manager getManager() {
        if (mManager == null) {
            try {
                AndroidContext context = new AndroidContext(App.getAppContext());
                mManager = new Manager(context, Manager.DEFAULT_OPTIONS);
            } catch (Exception e) {
                Log.e(App.TAG, "Cannot create Manager object", e);
            }
        }
        return mManager;
    }

    public Database getDatabase() {
        if (mDatabase == null)
            setDatabase(getUserDatabase(App.GUEST_DATABASE));

        return mDatabase;
    }

    public void setDatabase(Database database) {
        this.mDatabase = database;
    }

    private Database touchDatabase(final String dbName) {
        // 1
        final Manager manager = getManager();
        final Database[] database = {null};
        try {
            // 2
            database[0] = manager.getExistingDatabase(dbName);
        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(App.TAG, e.getMessage());
        }

        if (database[0] == null) {
            (new AsyncTask<Object, Object, Database>() {

                @Override
                protected void onPostExecute(Database o) {
                    super.onPostExecute(o);
                    mDatabase = database[0] = o;
                }

                @Override
                protected Database doInBackground(Object... objects) {
                    final File directory = manager.getContext().getFilesDir();
                    try {
                        // 3
                        ZipUtils.unzip(App.getAppContext().getAssets().open("dialadrink.cblite2.zip"), directory);
                    } catch (IOException e) {
                        Log.e(App.TAG, "Cannot extract db from 'assets/dialadrink.cblite2.zip': ");
                    }
                    // 4
                    File from = new File(directory, "dialadrink.cblite2");
                    if (from.exists()) {
                        File to = new File(directory, dbName + ".cblite2");
                        from.renameTo(to);
                    }

                    // 5
                    DatabaseOptions options = new DatabaseOptions();
                    options.setCreate(true);
                    options.setStorageType(STORAGE_TYPE);
                    options.setEncryptionKey(ENCRYPTION_ENABLED ? ENCRYPTION_KEY : null);
                    try {
                        return manager.openDatabase(dbName, options);
                    } catch (CouchbaseLiteException e) {
                        Log.e(App.TAG, "Cannot create database for name: " + dbName, e);
                    }
                    return null;
                }
            }).execute();
        }

        return database[0];
    }

    public Database getUserDatabase(String name) {
        String dbName = "db" + StringUtils.MD5(name);
        return touchDatabase(dbName);
    }

    @Override
    public void changed(Replication.ChangeEvent event) {
        Throwable error = null;
        if (mPull != null) {
            if (error == null)
                error = mPull.getLastError();
        }

        if (error == null || error == mReplError)
            error = mPush.getLastError();

        if (error != mReplError) {
            mReplError = error;
            if (mReplError != null)
                showErrorMessage(mReplError.getMessage(), null);
        }
    }

    /**
     * Replicator
     */
    private URL getSyncUrl() {
        URL url = null;
        try {
            url = new URL(SYNC_URL_HTTP);
        } catch (MalformedURLException e) {
            Log.e(App.TAG, "Invalid sync url", e);
        }
        return url;
    }

    public void startPullReplication(Authenticator auth) {
        initReplication(auth);
        mPull.stop();
        mPull.start();
    }

    public void startPushReplication(Authenticator auth) {
        initReplication(auth);
        mPush.stop();
        mPush.start();
    }

    public void startReplication(Authenticator auth) {
        startPullReplication(auth);
        startPushReplication(auth);
    }

    public void initReplication(Authenticator auth) {
        if (mPush == null) {
            mPush = getDatabase().createPushReplication(getSyncUrl());
            mPush.setContinuous(true);
            mPush.setAuthenticator(auth);
            mPush.addChangeListener(this);
        }

        if (mPull == null) {
            mPull = getDatabase().createPullReplication(getSyncUrl());
            mPull.setContinuous(true);
            mPull.setAuthenticator(auth);
            mPull.addChangeListener(this);
        }
    }

    public void stopReplication() {
        if (mPull != null) {
            mPull.removeChangeListener(this);
            mPull.stop();
            mPull = null;
        }

        if (mPush != null) {
            mPush.removeChangeListener(this);
            mPush.stop();
            mPush = null;
        }
    }

    /**
     * Display error message
     */
    public void showErrorMessage(final String errorMessage, final Throwable throwable) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                LogManager.getLogger().d(App.TAG, errorMessage, throwable);
                String msg = String.format("%s: %s", errorMessage, throwable != null ? throwable : "");
                Toast.makeText(App.getAppContext(), msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void runOnUiThread(Runnable runnable) {
        Handler mainHandler = new Handler(App.getAppContext().getMainLooper());
        mainHandler.post(runnable);
    }
}

