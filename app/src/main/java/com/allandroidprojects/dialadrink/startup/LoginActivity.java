package com.allandroidprojects.dialadrink.startup;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.support.annotation.NonNull;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.app.LoaderManager.LoaderCallbacks;

import android.content.CursorLoader;
import android.content.Loader;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;

import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.inputmethod.EditorInfo;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.FacebookSdk;
import com.facebook.GraphRequest;
import com.facebook.GraphResponse;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;
import com.facebook.login.widget.LoginButton;

import org.json.JSONException;
import org.json.JSONObject;

import static android.Manifest.permission.READ_CONTACTS;


public class LoginActivity extends AppCompatActivity {
    public static final String ACTION_LOGOUT = "logout";

    private CallbackManager mCallbackManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FacebookSdk.sdkInitialize(getApplicationContext());
        //AppEventsLogger.activateApp(this);

        setContentView(R.layout.activity_login);

        if (ACTION_LOGOUT.equals(getIntent().getAction())) {
            logout();
        } else {
            AccessToken accessToken = AccessToken.getCurrentAccessToken();
            if (accessToken != null && !accessToken.isExpired()) {
                loginAsFacebookUser(accessToken.getToken(), accessToken.getUserId(), null);
                return;
            }

            if (isLoggedAsGuest()) {
                loginAsGuest();
                return;
            }
        }

        LoginButton facebookLoginButton = (LoginButton) findViewById(R.id.facebook_login_button);
        facebookLoginButton.setReadPermissions("public_profile");

        mCallbackManager = CallbackManager.Factory.create();
        facebookLoginButton.registerCallback(mCallbackManager, new FacebookCallback<LoginResult>() {
            @Override
            public void onSuccess(LoginResult loginResult) {
                continueFacebookLogin(loginResult);
            }

            @Override
            public void onError(FacebookException error) {
                LogManager.getLogger().e(Application.TAG, "Facebook login error", error);
            }

            @Override
            public void onCancel() { }
        });

        Button guestLoginButton = (Button) findViewById(R.id.guest_login_button);
        guestLoginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                loginAsGuest();
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        mCallbackManager.onActivityResult(requestCode, resultCode, data);
    }

    private void continueFacebookLogin(final LoginResult loginResult) {
        GraphRequest request = GraphRequest.newMeRequest(
                loginResult.getAccessToken(), new GraphRequest.GraphJSONObjectCallback() {
                    @Override
                    public void onCompleted(JSONObject object, GraphResponse response) {
                        if (object == null) {
                            LogManager.getLogger().e(Application.TAG, "Cannot get facebook user info after login");
                            return;
                        }

                        try {
                            AccessToken accessToken = loginResult.getAccessToken();
                            String token = accessToken.getToken();
                            String userId = accessToken.getUserId();
                            String name = object.getString("name");
                            loginAsFacebookUser(token, userId, name);
                        } catch (JSONException e) {
                            LogManager.getLogger().e(Application.TAG, "Cannot get facebook user info after login", e);
                            return;
                        }
                    }
                }
        );

        Bundle parameters = new Bundle();
        parameters.putString("fields", "name");
        request.setParameters(parameters);
        request.executeAsync();
    }

    private void loginAsFacebookUser(String token, String userId, String name) {
        Application application = (Application) getApplication();
        application.loginAsFacebookUser(this, token, userId, name);
    }

    private void loginAsGuest() {
        SharedPreferences pref = getPreferences(Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        editor.putBoolean("guest", true);
        editor.commit();
        Application application = (Application) getApplication();
        application.loginAsGuest(this);
    }

    private boolean isLoggedAsGuest() {
        SharedPreferences pref = getPreferences(Context.MODE_PRIVATE);
        return pref.getBoolean("guest", false);
    }

    private void logout() {
        SharedPreferences pref = getPreferences(Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        editor.remove("guest");
        editor.commit();
        LoginManager.getInstance().logOut();
    }
}

