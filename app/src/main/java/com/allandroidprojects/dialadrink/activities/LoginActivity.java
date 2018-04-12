package com.allandroidprojects.dialadrink.activities;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.UserPrefManager;
import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.FacebookSdk;
import com.facebook.GraphRequest;
import com.facebook.GraphResponse;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;
import com.facebook.login.widget.LoginButton;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Arrays;


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

            if (UserPrefManager.isLoggedAsGuest()) {
                loginAsGuest();
                return;
            }
        }

        LoginButton facebookLoginButton = (LoginButton) findViewById(R.id.facebook_login_button);
        facebookLoginButton.setReadPermissions(Arrays.asList("public_profile", "user_status"));

        mCallbackManager = CallbackManager.Factory.create();
        facebookLoginButton.registerCallback(mCallbackManager, new FacebookCallback<LoginResult>() {
            @Override
            public void onSuccess(LoginResult loginResult) {
                continueFacebookLogin(loginResult);
            }

            @Override
            public void onError(FacebookException error) {
                LogManager.getLogger().d(DialADrink.TAG, "Facebook login error", error);
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
                            LogManager.getLogger().d(DialADrink.TAG, "Cannot get facebook user info after login");
                            return;
                        }

                        try {
                            AccessToken accessToken = loginResult.getAccessToken();
                            String token = accessToken.getToken();
                            String userId = accessToken.getUserId();

                            String name = object.getString("name");
                            loginAsFacebookUser(token, userId, name);
                        } catch (JSONException e) {
                            LogManager.getLogger().d(DialADrink.TAG, "Cannot get facebook user info after login", e);
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
        DialADrink application = (DialADrink) getApplication();
        application.loginAsFacebookUser(this, token, userId, name);
    }

    private void loginAsGuest() {
        UserPrefManager.putBoolean(DialADrink.GUEST_DATABASE, true);
        DialADrink application = (DialADrink) getApplication();
        application.loginAsGuest(this);
    }

    private void logout() {
        UserPrefManager.remove(DialADrink.GUEST_DATABASE);
        LoginManager.getInstance().logOut();
    }
}

