package com.allandroidprojects.dialadrink.utility;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.activities.LoginActivity;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.User;
import com.allandroidprojects.dialadrink.openid.OpenIDAuthenticator;
import com.couchbase.lite.android.AndroidContext;
import com.couchbase.lite.auth.Authenticator;
import com.couchbase.lite.auth.AuthenticatorFactory;
import com.couchbase.lite.auth.OIDCLoginCallback;
import com.couchbase.lite.auth.OpenIDConnectAuthenticatorFactory;
import com.couchbase.lite.replicator.Replication;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Date;
import java.util.List;
import java.util.Map;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Cookie;
import okhttp3.FormBody;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
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

    public static boolean isShouldStartPushAfterPullStart() {
        return shouldStartPushAfterPullStart;
    }

    public static void setShouldStartPushAfterPullStart(boolean shouldStartPushAfterPullStart) {
        LoginUtils.shouldStartPushAfterPullStart = shouldStartPushAfterPullStart;
    }

    private static boolean shouldStartPushAfterPullStart = false;

    public static void showLogin(Context context, Intent nextIntent) {
        LoginActivity.showLogin(context, nextIntent);
    }

    public static void loginAsGoogleUser(final LoginActivity loginActivity, final String token, final User finalUser, final Intent nextIntent) {
        Request request = new Request.Builder()
                .url(getServerDbSessionUrl())
                .header("Authorization", "Bearer " + token)
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

                    String userId = (userInfo != null ? (String) userInfo.get("userId") : null);
                    String username = (userInfo != null ? (String) userInfo.get("name") : null);
                    String email = (userInfo != null ? (String) userInfo.get("email") : null);
                    String gender = (userInfo != null ? (String) userInfo.get("gender") : null);
                    String picture = (userInfo != null ? (String) userInfo.get("picture") : null);

                    User user = finalUser != null ? finalUser : new User();
                    user.setUserId(userId);
                    user.setName(username);
                    user.setPictureUrl(picture);
                    user.setEmail(email);
                    user.setGender(gender);

                    final List<Cookie> cookies =
                            Cookie.parseAll(
                                    HttpUrl.get(App.getSyncManager().getSyncUrl()),
                                    response.headers()
                            );

                    loginAsGoogleUser(loginActivity, nextIntent, cookies, user);
                }
            }
        });
    }

    private static void loginAsGoogleUser(Activity activity, final Intent nextIntent, final List<Cookie> sessionCookies, final User user) {
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

        login(activity, nextIntent);
    }

    public static void loginWithAuthCode(final Activity activity) {
        dbMgr.stopReplication();
        dbMgr.startPull(new DbSync.ReplicationSetupCallback() {
            @Override
            public void setup(Replication repl) {
                shouldStartPushAfterPullStart = true;
                OIDCLoginCallback callback = OpenIDAuthenticator.getOIDCLoginCallback(App.getAppContext());
                repl.setAuthenticator(
                        OpenIDConnectAuthenticatorFactory.createOpenIDConnectAuthenticator(
                                callback,
                                new AndroidContext(App.getAppContext())
                        )
                );
                activity.finish();
            }
        });
    }

    public static void loginAsFacebookUser(Activity activity, String token, User user, Intent nextIntent) {
        DataUtils.migrateGuestToUser(user);
        Authenticator auth = AuthenticatorFactory.createFacebookAuthenticator(token);
        dbMgr.startReplication(auth);
        login(activity, nextIntent);
    }

    public static void loginAsGuest(Activity activity, Intent nextIntent) {
        dbMgr.setDatabase(dbMgr.getUserDatabase(App.GUEST_DATABASE));
        String guestId = App.getAppContext().getGuestId();

        app.setCurrentUser(new User(guestId, App.GUEST_DATABASE));
        dbMgr.startReplication(null);

        LoginUtils.setLoggedInAsGuest(true);
        login(activity, nextIntent);
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

    private static void login(Activity activity, Intent nextIntent) {
        nextIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity.startActivity(nextIntent);
        activity.finish();
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

    public static boolean isLoggedAsGuest() {
        return PreferenceUtils.getBoolean(GUEST_LOGGED_IN_FLAG, AUTO_GUEST_LOGIN);
    }

    public static void setLoggedInAsGuest(boolean loggedInAsGuest) {
        PreferenceUtils.putBoolean(GUEST_LOGGED_IN_FLAG, loggedInAsGuest);
    }

    public static boolean isLoggedWithAuthCode() {
        return PreferenceUtils.getBoolean(AUTHCODE_LOGGED_IN_FLAG, false);
    }

    public static void setLoggedWithAuthCode(boolean value) {
        PreferenceUtils.putBoolean(AUTHCODE_LOGGED_IN_FLAG, value);
    }
}
