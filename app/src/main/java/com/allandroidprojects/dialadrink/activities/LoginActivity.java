package com.allandroidprojects.dialadrink.activities;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.support.v7.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.User;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.LoginUtils;
import com.allandroidprojects.dialadrink.utility.PreferenceUtils;
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
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

import org.json.JSONObject;

import java.util.Arrays;


public class LoginActivity extends AppCompatActivity implements
        //GoogleApiClient.OnConnectionFailedListener,
        FacebookCallback<LoginResult>,
        View.OnClickListener {
    public static final String NEXT_ACTION_CLASS = "NextIntent";
    public static final String ACTION_LOGOUT = "logout";
    public static final int GOOGLE_SIGN_IN_REQUEST = 1;

    private CallbackManager mFacebookCallbackManager;
    private GoogleSignInClient mGoogleSignInClient;
    private static Intent nextIntent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FacebookSdk.sdkInitialize(getApplicationContext());
        //AppEventsLogger.activateApp(this);
        setContentView(R.layout.activity_login);

        Bundle bundle = getIntent().getExtras();
        Object serializable = (Object) bundle.get(NEXT_ACTION_CLASS);
        if (serializable != null)
            nextIntent = (Intent) serializable;
        else
            nextIntent = new Intent(this, WelcomeActivity.class);


        LoginButton facebookLoginButton = (LoginButton) findViewById(R.id.facebookSignInButton);
        facebookLoginButton.setReadPermissions(Arrays.asList("email", "public_profile"));

        // Set the dimensions of the sign-in button.
        SignInButton googleLoginInButton = findViewById(R.id.googleSignInButton);
        googleLoginInButton.setSize(SignInButton.SIZE_STANDARD);
        setGooglePlusButtonText(googleLoginInButton, getResources().getString(R.string.google_signin_button));
        Button guestLoginButton = (Button) findViewById(R.id.guestSignInButton);

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                //.requestIdToken(getString(R.string.server_client_id))
                .requestId()
                .requestEmail()
                .requestProfile()
                .build();

        mFacebookCallbackManager = CallbackManager.Factory.create();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        facebookLoginButton.registerCallback(mFacebookCallbackManager, this);
        googleLoginInButton.setOnClickListener(this);
        guestLoginButton.setOnClickListener(this);

        if (ACTION_LOGOUT.equals(getIntent().getAction())) {
            logout();
        } else {
            // Check for existing Facebook Sign In account
            AccessToken accessToken = AccessToken.getCurrentAccessToken();
            if (accessToken != null && !accessToken.isExpired()) {
                LoginUtils.loginAsFacebookUser(LoginActivity.this, accessToken.getToken(), null, nextIntent);
                return;
            }

            // Check for existing Google Sign In account
            GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
            if (account != null) {
                LoginUtils.loginAsGoogleUser(this, account, nextIntent);
                return;
            }

            if (LoginUtils.isLoggedAsGuest() && serializable == null) {
                PreferenceUtils.putBoolean(App.GUEST_DATABASE, true);
                LoginUtils.loginAsGuest(this, nextIntent);
                return;
            }
        }
    }

    protected void setGooglePlusButtonText(SignInButton signInButton, String buttonText) {
        // Find the TextView that is inside of the SignInButton and set its text
        for (int i = 0; i < signInButton.getChildCount(); i++) {
            View v = signInButton.getChildAt(i);

            if (v instanceof TextView) {
                TextView tv = (TextView) v;
                tv.setText(buttonText);
                return;
            }
        }
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.googleSignInButton:
                Intent signInIntent = mGoogleSignInClient.getSignInIntent();
                startActivityForResult(signInIntent, GOOGLE_SIGN_IN_REQUEST);
                break;
            case R.id.facebookSignInButton:
                //
                break;
            case R.id.guestSignInButton:
                LoginUtils.loginAsGuest(this, nextIntent);
                break;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        mFacebookCallbackManager.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInClient.getSignInIntent(...);
        if (requestCode == GOOGLE_SIGN_IN_REQUEST) {
            // The Task returned from this call is always completed, no need to attach a listener.
            Task<GoogleSignInAccount> completedTask = GoogleSignIn.getSignedInAccountFromIntent(data);
            continueGoogleLogin(completedTask);
        }
    }

    @Override
    public void onSuccess(LoginResult loginResult) {
        continueFacebookLogin(loginResult);
    }

    @Override
    public void onError(FacebookException error) {
        LogManager.getLogger().d(App.TAG, "Facebook login error", error);
    }

    @Override
    public void onCancel() {
        LogManager.getLogger().d(App.TAG, "Facebook login canceled!!");
    }

    public static Intent getNextIntent() {
        return nextIntent;
    }

    public static void showLogin(Context context, Intent nextIntent) {
        Intent intent = new Intent(context, LoginActivity.class);
        intent.putExtra(NEXT_ACTION_CLASS, nextIntent);
        context.startActivity(intent);
        if (context instanceof Activity)
            ((Activity) context).finish();
    }

    private void continueFacebookLogin(final LoginResult loginResult) {
        GraphRequest request = GraphRequest.newMeRequest(
                loginResult.getAccessToken(), new GraphRequest.GraphJSONObjectCallback() {
                    @Override
                    public void onCompleted(JSONObject object, GraphResponse response) {
                        if (object == null) {
                            LogManager.getLogger().d(App.TAG, "Cannot get facebook user info after login");
                            return;
                        }

                        AccessToken accessToken = loginResult.getAccessToken();
                        User user = LoginUtils.getUserFromFacebookAccount(accessToken.getUserId(), object);
                        LoginUtils.loginAsFacebookUser(LoginActivity.this, accessToken.getToken(), user, nextIntent);
                    }
                }
        );

        Bundle parameters = new Bundle();
        parameters.putString("fields", "id,name,link,gender,email,picture.width(100).height(100)");
        request.setParameters(parameters);
        request.executeAsync();
    }

    private void continueGoogleLogin(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            LoginUtils.loginAsGoogleUser(this, account, nextIntent);
        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            String error = GoogleSignInStatusCodes.getStatusCodeString(e.getStatusCode());
            LogManager.getLogger().w(App.TAG, error+ ": Google signInResult:failed code=" + e.getStatusCode(), e);
            App.showErrorMessage(error, e);
        }
    }

    private void logout() {
        PreferenceUtils.remove(App.GUEST_DATABASE);
        LoginManager.getInstance().logOut();
    }

}

