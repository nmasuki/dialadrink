package com.allandroidprojects.dialadrink.startup;

/**
 * Created by nmasuki on 3/9/2018.
 */

import android.app.Activity;
import android.app.ListActivity;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.cache.ImagePipelineConfigFactory;
import com.allandroidprojects.dialadrink.startup.LoginActivity;
import com.allandroidprojects.dialadrink.utility.StringUtil;
import com.allandroidprojects.dialadrink.utility.UserProfile;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.DatabaseOptions;
import com.couchbase.lite.Document;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Manager;
import com.couchbase.lite.Mapper;
import com.couchbase.lite.View;
import com.couchbase.lite.android.AndroidContext;
import com.couchbase.lite.auth.Authenticator;
import com.couchbase.lite.auth.AuthenticatorFactory;
import com.couchbase.lite.replicator.Replication;
import com.couchbase.lite.util.Log;
import com.couchbase.lite.util.ZipUtils;
import com.facebook.drawee.backends.pipeline.Fresco;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DialADrink extends android.app.Application implements Replication.ChangeListener {
    public static final String TAG = "DialADrink";

    private static final String SYNC_URL_HTTP = "http://ec2-18-217-219-161.us-east-2.compute.amazonaws.com:4984/dialadrink";

    // Storage Type: .SQLITE_STORAGE or .FORESTDB_STORAGE
    private static final String STORAGE_TYPE = Manager.SQLITE_STORAGE;

    // Encryption (Don't store encryption key in the source code. We are doing it here just as an example):
    private static final boolean ENCRYPTION_ENABLED = false;
    private static final String ENCRYPTION_KEY = "seekrit";

    // Logging:
    private static final boolean LOGGING_ENABLED = true;

    // Guest database:
    private static final String GUEST_DATABASE_NAME = "guest";

    private Manager mManager;
    private Database mDatabase;
    private Replication mPull;
    private Replication mPush;
    private Throwable mReplError;
    private String mCurrentUserId;

    @Override
    public void onCreate() {
        super.onCreate();
        Fresco.initialize(this, ImagePipelineConfigFactory.getImagePipelineConfig(this));
        enableLogging();
    }

    private void enableLogging() {
        if (LOGGING_ENABLED) {
            Manager.enableLogging(TAG, Log.VERBOSE);
            Manager.enableLogging(Log.TAG, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_SYNC_ASYNC_TASK, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_SYNC, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_QUERY, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_VIEW, Log.VERBOSE);
            Manager.enableLogging(Log.TAG_DATABASE, Log.VERBOSE);
        }
    }

    private Manager getManager() {
        if (mManager == null) {
            try {
                AndroidContext context = new AndroidContext(getApplicationContext());
                mManager = new Manager(context, Manager.DEFAULT_OPTIONS);
            } catch (Exception e) {
                Log.e(TAG, "Cannot create Manager object", e);
            }
        }
        return mManager;
    }

    public Database getDatabase() {
        if(mDatabase == null)
            setDatabase(getUserDatabase(GUEST_DATABASE_NAME));

        return mDatabase;
    }

    private void setDatabase(Database database) {
        this.mDatabase = database;
    }

    private Database touchDatabase(String dbName){
        // 1
        Manager manager = getManager();
        Database database = null;
        try {
            // 2
            database = manager.getExistingDatabase(dbName);
        } catch (CouchbaseLiteException e) {
            e.printStackTrace();
        }

        // 3
        if (database == null) {
            File directory = manager.getContext().getFilesDir();
            try {
                ZipUtils.unzip(this.getAssets().open("dialadrink.cblite2.zip"), directory);
            } catch (IOException e) {
                Log.e(TAG, "Cannot extract db from 'assets/dialadrink.cblite2.zip': ");
            }

            try{
                // 4
                File from = new File(directory, "dialadrink.cblite2");
                if(from.exists()) {
                    File to = new File(directory, dbName + ".cblite2");
                    from.renameTo(to);
                }

                // 5
                DatabaseOptions options = new DatabaseOptions();
                options.setCreate(true);
                options.setStorageType(STORAGE_TYPE);
                options.setEncryptionKey(ENCRYPTION_ENABLED ? ENCRYPTION_KEY : null);
                return manager.openDatabase(dbName, options);
            }
            catch (CouchbaseLiteException e) {
                Log.e(TAG, "Cannot create database for name: " + dbName, e);
            }
        }

        return database;
    }

    private Database getUserDatabase(String name) {
        String dbName = "db" + StringUtil.MD5(name);
        return touchDatabase(dbName);
    }

    public void loginAsFacebookUser(Activity activity, String token, String userId, String name, Class<?> cls) {
        setCurrentUserId(userId);
        setDatabase(getUserDatabase(userId));

        String profileDocID = "p:" + userId;
        Document profile = mDatabase.getExistingDocument(profileDocID);
        if (profile == null) {
            try {
                Map<String, Object> properties = new HashMap<String, Object>();
                properties.put("type", "profile");
                properties.put("user_id", userId);
                properties.put("name", name);

                profile = mDatabase.getDocument(profileDocID);
                profile.putProperties(properties);

                // Migrate guest data to user:
                UserProfile.migrateGuestData(getUserDatabase(GUEST_DATABASE_NAME), profile);
            } catch (CouchbaseLiteException e) {
                Log.e(TAG, "Cannot create a new user profile", e);
            }
        }

        startReplication(AuthenticatorFactory.createFacebookAuthenticator(token));
        login(activity, cls);
    }

    public void loginAsGuest(Activity activity, Class<?> cls) {
        setDatabase(getUserDatabase(GUEST_DATABASE_NAME));
        setCurrentUserId(null);
        login(activity, cls);
    }

    private void login(Activity activity, Class<?> cls) {
        Intent intent = new Intent(activity, cls);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity.startActivity(intent);
        activity.finish();
    }

    public void loginAsFacebookUser(Activity activity, String token, String userId, String name){
        loginAsFacebookUser(activity, token, userId, name, WelcomeActivity.class);
    }

    public void loginAsGuest(Activity activity) {
        loginAsGuest(activity, WelcomeActivity.class);
    }

    private void login(Activity activity) {
        login(activity, WelcomeActivity.class);
    }

    public void logout() {
        setCurrentUserId(null);
        stopReplication();
        setDatabase(null);

        Intent intent = new Intent(getApplicationContext(), LoginActivity.class);
        intent.setAction(LoginActivity.ACTION_LOGOUT);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }

    private void setCurrentUserId(String userId) {
        this.mCurrentUserId = userId;
    }

    public String getCurrentUserId() {
        return this.mCurrentUserId;
    }

    /**
     * Replicator
     */
    private URL getSyncUrl() {
        URL url = null;
        try {
            url = new URL(SYNC_URL_HTTP);
        } catch (MalformedURLException e) {
            Log.e(TAG, "Invalid sync url", e);
        }
        return url;
    }

    private void startReplication(Authenticator auth) {
        if (mPull == null) {
            mPull = mDatabase.createPullReplication(getSyncUrl());
            mPull.setContinuous(true);
            mPull.setAuthenticator(auth);
            mPull.addChangeListener(this);
        }

        if (mPush == null) {
            mPush = mDatabase.createPushReplication(getSyncUrl());
            mPush.setContinuous(true);
            mPush.setAuthenticator(auth);
            mPush.addChangeListener(this);
        }

        mPull.stop();
        mPull.start();

        mPush.stop();
        mPush.start();
    }

    private void stopReplication() {
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
     * Database View
     */
    public View getListsView() {
        View view = mDatabase.getView("lists");
        if (view.getMap() == null) {
            Mapper mapper = new Mapper() {
                public void map(Map<String, Object> document, Emitter emitter) {
                    String type = (String) document.get("type");
                    if ("list".equals(type))
                        emitter.emit(document.get("title"), null);
                }
            };
            view.setMap(mapper, "1.0");
        }
        return view;
    }

    public View getTasksView() {
        View view = mDatabase.getView("tasks");
        if (view.getMap() == null) {
            Mapper map = new Mapper() {
                @Override
                public void map(Map<String, Object> document, Emitter emitter) {
                    if ("task".equals(document.get("type"))) {
                        List<Object> keys = new ArrayList<Object>();
                        keys.add(document.get("list_id"));
                        keys.add(document.get("created_at"));
                        emitter.emit(keys, document);
                    }
                }
            };
            view.setMap(map, "1.0");
        }
        return view;
    }

    public View getUserProfilesView() {
        View view = mDatabase.getView("profiles");
        if (view.getMap() == null) {
            Mapper map = new Mapper() {
                @Override
                public void map(Map<String, Object> document, Emitter emitter) {
                    if ("profile".equals(document.get("type")))
                        emitter.emit(document.get("name"), null);
                }
            };
            view.setMap(map, "1.0");
        }
        return view;
    }

    /**
     * Display error message
     */

    public void showErrorMessage(final String errorMessage, final Throwable throwable) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                android.util.Log.e(TAG, errorMessage, throwable);
                String msg = String.format("%s: %s",
                        errorMessage, throwable != null ? throwable : "");
                Toast.makeText(getApplicationContext(), msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void runOnUiThread(Runnable runnable) {
        Handler mainHandler = new Handler(getApplicationContext().getMainLooper());
        mainHandler.post(runnable);
    }
}

