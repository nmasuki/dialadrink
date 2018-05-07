package com.allandroidprojects.dialadrink.utility;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Environment;
import android.os.Handler;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.activities.LoginActivity;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.User;
import com.allandroidprojects.dialadrink.openid.OpenIDAuthenticator;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.DatabaseOptions;
import com.couchbase.lite.Manager;
import com.couchbase.lite.android.AndroidContext;
import com.couchbase.lite.auth.Authenticator;
import com.couchbase.lite.auth.OIDCLoginCallback;
import com.couchbase.lite.auth.OpenIDConnectAuthenticatorFactory;
import com.couchbase.lite.replicator.Replication;
import com.couchbase.lite.util.Log;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Created by nmasuki on 4/8/2018.
 */
public class DbSync implements Replication.ChangeListener {
    public static String IP = "159.65.50.86";//nmasuki.mobileaccord.local
    public static String SYNC_PORT = "4984";
    public static String DB = "dialadrink";

    // Sync end point
    public static final String SYNC_URL_HTTP = "http://" + IP + ":" + SYNC_PORT + "/" + DB;

    // Storage Type: .SQLITE_STORAGE or .FORESTDB_STORAGE
    private static final String STORAGE_TYPE = Manager.SQLITE_STORAGE;

    // Logging:
    private static final boolean LOGGING_ENABLED = App.DEBUG;

    // Encryption:
    private static final boolean ENCRYPTION_ENABLED = false;
    private static final String ENCRYPTION_KEY = App.getAppContext().getString(R.string.encrption_key);

    private Manager manager;
    private Database database;
    private Replication pull;
    private Replication push;
    private Throwable syncError;
    private int pullIdleCount = 0;

    interface ReplicationSetupCallback {
        void setup(Replication repl);
    }

    public DbSync() {
        enableLogging();
    }

    private void enableLogging() {
        if (LOGGING_ENABLED) {
            int logLevel = Log.VERBOSE;
            Manager.enableLogging(App.TAG, logLevel);
            Manager.enableLogging(Log.TAG, logLevel);
            Manager.enableLogging(Log.TAG_SYNC_ASYNC_TASK, logLevel);
            Manager.enableLogging(Log.TAG_SYNC, logLevel);
            Manager.enableLogging(Log.TAG_QUERY, logLevel);
            Manager.enableLogging(Log.TAG_VIEW, logLevel);
            Manager.enableLogging(Log.TAG_DATABASE, logLevel);
        }
    }

    public Manager getManager() {
        if (manager == null) {
            try {
                manager = new Manager(new AndroidContext(App.getAppContext()), Manager.DEFAULT_OPTIONS);
            } catch (Exception e) {
                Log.e(App.TAG, "Cannot create Manager object", e);
            }
        }
        return manager;
    }

    public Database getDatabase() {
        if (database == null)
            setDatabase(getUserDatabase(App.GUEST_DATABASE));

        return database;
    }

    public void setDatabase(Database database) {
        this.database = database;
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
            if (!App.DEBUG)
                (new AsyncTask<Object, Object, Database>() {

                    @Override
                    protected void onPostExecute(Database o) {
                        super.onPostExecute(o);
                        DbSync.this.database = database[0] = o;
                    }

                    @Override
                    protected Database doInBackground(Object... objects) {
                        final File directory = manager.getContext().getFilesDir();
                        try {
                            // 3
                            FileUtils.unzip(App.getAppContext().getAssets().open("dialadrink.cblite2.zip"), directory);
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
            else {
                try {
                    database[0] = manager.getDatabase(dbName);
                } catch (CouchbaseLiteException e) {
                    LogManager.getLogger().d(App.TAG, e.getMessage());
                }
            }
        }

        return database[0];
    }

    public Database getUserDatabase(String name) {
        String dbName = "db" + StringUtils.MD5(name);
        return touchDatabase(dbName);
    }

    @Override
    public void changed(Replication.ChangeEvent event) {
        Replication repl = event.getSource();
        Log.v(App.TAG, "Replication Change Status: " + repl.getStatus() + " [ " + repl + " ]");
        Throwable error = null;
        if (pull != null) {
            error = pull.getLastError();
            if (LoginUtils.isShouldStartPushAfterPullStart() && isReplicatorStartedOrError(pull)) {
                if (error == null) {
                    User user = new User(pull.getSessionID(), pull.getUsername());
                    DataUtils.migrateGuestToUser(user);

                    startPush(new ReplicationSetupCallback() {
                        @Override
                        public void setup(Replication repl) {
                            OIDCLoginCallback callback =
                                    OpenIDAuthenticator.getOIDCLoginCallback(App.getAppContext());
                            repl.setAuthenticator(
                                    OpenIDConnectAuthenticatorFactory.createOpenIDConnectAuthenticator(
                                            callback,
                                            new AndroidContext(App.getAppContext())
                                    )
                            );
                        }
                    });

                    Intent nextIntent = LoginActivity.getNextIntent();
                    nextIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    App.getAppContext().startActivity(nextIntent);
                } else {
                    LogManager.getLogger().d(App.TAG, "Error while doing Auth Code login", error);
                }
                LoginUtils.setShouldStartPushAfterPullStart(false);
            }
        }

        if (pull != null) {
            if (error == null || error == syncError)
                error = pull.getLastError();
        }


        if (error != null && error != syncError) {
            syncError = error;
            if (syncError != null)
                App.getAppContext().showErrorMessage(syncError.getMessage(), null);
        }
    }

    private boolean isReplicatorStartedOrError(Replication replication) {
        boolean isIdle;
        if (replication == pull) {
            isIdle = replication.getStatus() == Replication.ReplicationStatus.REPLICATION_IDLE;
            isIdle = isIdle && (++pullIdleCount > 1);
        } else {
            isIdle = replication.getStatus() == Replication.ReplicationStatus.REPLICATION_IDLE;
        }
        return isIdle || replication.getChangesCount() > 0 || replication.getLastError() != null;
    }

    /**
     * Replicator
     **/
    public URL getSyncUrl() {
        URL url = null;
        try {
            url = new URL(SYNC_URL_HTTP);
        } catch (MalformedURLException e) {
            Log.e(App.TAG, "Invalid sync url", e);
        }
        return url;
    }

    public void startPull(Authenticator auth) {
        initReplication(auth);
        pull.stop();
        pull.start();
    }

    public void startPush(Authenticator auth) {
        initReplication(auth);
        push.stop();
        push.start();
    }

    public void startPull(ReplicationSetupCallback callback) {
        pullIdleCount = 0;
        pull = database.createPullReplication(getSyncUrl());
        pull.setContinuous(true);
        if (callback != null) callback.setup(pull);
        pull.addChangeListener(this);
        pull.start();
    }

    public void startPush(ReplicationSetupCallback callback) {
        push = database.createPushReplication(getSyncUrl());
        push.setContinuous(true);
        if (callback != null) callback.setup(push);
        push.addChangeListener(this);
        push.start();
    }

    public void startReplication(Authenticator auth) {
        initReplication(auth);
        push.stop();
        pull.stop();
        pull.start();
        push.start();
    }

    public void initReplication(Authenticator auth) {
        if (getDatabase() == null) return;

        if (push == null) {
            push = getDatabase().createPushReplication(getSyncUrl());
            push.setContinuous(true);
            push.setAuthenticator(auth);
            push.addChangeListener(this);
        }

        if (pull == null) {
            pull = getDatabase().createPullReplication(getSyncUrl());
            pull.setContinuous(true);
            pull.setAuthenticator(auth);
            pull.addChangeListener(this);
        }
    }

    public void stopReplication() {
        if (pull != null) {
            pull.removeChangeListener(this);
            pull.stop();
            pull = null;
        }

        if (push != null) {
            push.removeChangeListener(this);
            push.stop();
            push = null;
        }
    }

}

