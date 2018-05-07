package com.allandroidprojects.dialadrink.utility;

import android.app.Activity;
import android.content.Intent;
import android.util.Base64;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.activities.LoginActivity;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.User;
import com.couchbase.lite.auth.Authenticator;
import com.couchbase.lite.auth.AuthenticatorFactory;
import com.couchbase.lite.replicator.Replication;
import com.facebook.AccessToken;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Cookie;
import okhttp3.FormBody;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by nmasuki on 4/4/2018.
 */
public class LoginUtils {
    public static final boolean AUTO_GUEST_LOGIN = true;
    public static final String GUEST_LOGGED_IN_FLAG = "guestLoggedIn";
    public static final String AUTHCODE_LOGGED_IN_FLAG = "authCodeLoggedIn";

    private static final App app = App.getAppContext();
    private static final DbSync dbMgr = App.getSyncManager();

    private static final OkHttpClient httpClient = new OkHttpClient();
    private static final Gson gson = new Gson();

    private static boolean shouldStartPushAfterPullStart = false;

    public static boolean isShouldStartPushAfterPullStart() {
        return shouldStartPushAfterPullStart;
    }

    public static void setShouldStartPushAfterPullStart(boolean shouldStartPushAfterPullStart) {
        LoginUtils.shouldStartPushAfterPullStart = shouldStartPushAfterPullStart;
    }

    public static User getUserFromGoogleAccount(GoogleSignInAccount account) {
        User user = new User();
        user.setUserId(account.getId());
        user.setName(account.getDisplayName());
        user.setPictureUrl(account.getPhotoUrl().toString());
        user.setEmail(account.getEmail());
        user.setPassword(StringUtils.MD5(account.getId()));
        user.setAccountType("Google");
        return user;
    }

    public static User getUserFromFacebookAccount(String userId, JSONObject object) {
        String pictureUrl = null;
        try {
            pictureUrl = object.getJSONObject("picture").getJSONObject("data").getString("url");
        } catch (JSONException e) {
            LogManager.getLogger().d(App.TAG, "Cannot get facebook picture URL", e);
        }

        Map<String, Object> map = new HashMap<String, Object>();
        Iterator<String> it = object.keys();
        while (it.hasNext()) {
            String key = it.next();
            try {
                map.put(key, object.get(key));
            } catch (JSONException e) {
                LogManager.getLogger().d(App.TAG, "Cannot get facebook user info after startActivity", e);
            }
        }

        User user = DataUtils.toObj(map, User.class);
        user.setPictureUrl(pictureUrl);
        user.setUserId(userId);
        user.setAccountType("Facebook");

        return user;
    }

    public static void createUser(Activity activity, User user, final App.Runnable<Map<String, Object>> success, final App.Runnable<String> failure) {
        String basicAuth = Base64.encodeToString(String.format("%s:%s", user.getUserId(), user.getPassword()).getBytes(), Base64.NO_WRAP);

        RequestBody formBody = new FormBody.Builder()
                .add("name", user.getUserId())
                .add("password", user.getPassword())
                .build();

        Request request = new Request.Builder()
                .url(getServerDbSignupUrl())
                .header("Authorization", "Basic " + basicAuth)
                .post(formBody)
                .build();

        App.getAppContext().showProgressDialog(activity, "Loading..");
        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                LogManager.getLogger().d(App.TAG, "Error while making http call.", e);
                App.getAppContext().hideProgressDialog();
                failure.run("Error while making http call.");
            }

            @Override
            public void onResponse(Call call, final Response response) throws IOException {
                App.getAppContext().hideProgressDialog();
                if (response.isSuccessful()) {
                    Type type = new TypeToken<Map<String, Object>>() {
                    }.getType();
                    Map<String, Object> map = gson.fromJson(response.body().charStream(), type);
                    success.run(map);
                } else {
                    failure.run(response.body().string());
                }
            }
        });
    }

    public static void loginAsFacebookUser(Activity activity, String token, User user, Intent nextIntent) {
        DataUtils.migrateGuestToUser(user);
        Authenticator auth = AuthenticatorFactory.createFacebookAuthenticator(token);
        dbMgr.startReplication(auth);
        startActivity(activity, nextIntent);
    }

    public static void loginAsGoogleUser(final Activity activity, GoogleSignInAccount account, final Intent nextIntent) {
        final User user = getUserFromGoogleAccount(account);

        DataUtils.migrateGuestToUser(user);
        Authenticator auth = AuthenticatorFactory.createBasicAuthenticator(user.getUserId(), user.getPassword());
        dbMgr.startReplication(auth);

        startActivity(activity, nextIntent);
    }

    public static void loginAsGuest(Activity activity, Intent nextIntent) {
        dbMgr.setDatabase(dbMgr.getUserDatabase(App.GUEST_DATABASE));
        String guestId = App.getAppContext().getGuestId();

        app.setCurrentUser(new User(guestId, App.GUEST_DATABASE));
        dbMgr.startReplication(null);

        LoginUtils.setLoggedInAsGuest(true);
        startActivity(activity, nextIntent);
    }

    public static void loginUser(final LoginActivity activity, String username, String password, final Intent nextIntent) {
        String basicAuth = Base64.encodeToString(String.format("%s:%s", username, password).getBytes(), Base64.NO_WRAP);

        Request request = new Request.Builder()
                .url(getServerDbSessionUrl())
                .header("Authorization", "Basic " + basicAuth)
                .post(new FormBody.Builder().build())
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                LogManager.getLogger().d(App.TAG, "Error while making http call.", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    Type type = new TypeToken<Map<String, Object>>() {
                    }.getType();
                    Map<String, Object> session = gson.fromJson(response.body().charStream(), type);
                    Map<String, Object> userInfo = (Map<String, Object>) session.get("userCtx");

                    final List<Cookie> cookies = Cookie.parseAll(
                            HttpUrl.get(App.getSyncManager().getSyncUrl()),
                            response.headers()
                    );

                    loginUser(activity, cookies, nextIntent);
                }
            }
        });
    }

    private static void loginUser(Activity activity, final List<Cookie> sessionCookies, final Intent nextIntent) {
        App.getSyncManager().startPull(new DbSync.ReplicationSetupCallback() {
            @Override
            public void setup(Replication repl) {
                for (Cookie cookie : sessionCookies) {
                    repl.setCookie(
                            cookie.name(), cookie.value(), cookie.path(),
                            new Date(cookie.expiresAt()), cookie.secure(),
                            cookie.httpOnly()
                    );
                    App.getSyncManager().startPull(repl.getAuthenticator());
                }
            }
        });

        App.getSyncManager().startPush(new DbSync.ReplicationSetupCallback() {
            @Override
            public void setup(Replication repl) {
                for (Cookie cookie : sessionCookies) {
                    repl.setCookie(
                            cookie.name(), cookie.value(), cookie.path(),
                            new Date(cookie.expiresAt()), cookie.secure(),
                            cookie.httpOnly()
                    );
                    App.getSyncManager().startPush(repl.getAuthenticator());
                }
            }
        });

        startActivity(activity, nextIntent);
    }

    private static URL getServerDbSessionUrl() {
        String serverUrl = App.getSyncManager().getSyncUrl().toString();
        if (!serverUrl.endsWith("/"))
            serverUrl = serverUrl + "/";
        try {
            return new URL(serverUrl + "_session");
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    private static URL getServerDbSignupUrl() {
        try {
            return new URL("http://" + DbSync.IP + ":3000/signup");
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    public static boolean isLoggedAsGuest() {
        return PreferenceUtils.getBoolean(GUEST_LOGGED_IN_FLAG, AUTO_GUEST_LOGIN);
    }

    public static void setLoggedInAsGuest(boolean loggedInAsGuest) {
        PreferenceUtils.putBoolean(GUEST_LOGGED_IN_FLAG, loggedInAsGuest);
    }

    public static void setLoggedWithAuthCode(boolean value) {
        PreferenceUtils.putBoolean(AUTHCODE_LOGGED_IN_FLAG, value);
    }

    public static void startActivity(Activity activity, Intent nextIntent) {
        startActivity(activity, nextIntent, false);
    }

    public static void startActivity(Activity activity, Intent nextIntent, Boolean requireLoggedIn) {
        if (requireLoggedIn) {
            // Check for existing Facebook Sign In account
            AccessToken accessToken = AccessToken.getCurrentAccessToken();
            if (accessToken != null && !accessToken.isExpired()) {
                LoginUtils.loginAsFacebookUser(activity, accessToken.getToken(), null, nextIntent);
                return;
            }

            // Check for existing Google Sign In account
            GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
            if (account != null) {
                LoginUtils.loginAsGoogleUser(activity, account, nextIntent);
                return;
            }


            Intent intent = new Intent(activity, LoginActivity.class);
            intent.putExtra(LoginActivity.NEXT_ACTION_CLASS, nextIntent);
            activity.startActivity(intent);
        }else{
            nextIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
            activity.startActivity(nextIntent);
            activity.finish();
        }
    }

    public static void logout() {
        app.setCurrentUser(null);
        dbMgr.stopReplication();
        dbMgr.setDatabase(null);

        Intent intent = new Intent(app, LoginActivity.class);
        intent.setAction(LoginActivity.ACTION_LOGOUT);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        app.startActivity(intent);
    }
}
