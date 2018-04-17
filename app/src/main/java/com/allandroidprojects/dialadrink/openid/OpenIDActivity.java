package com.allandroidprojects.dialadrink.openid;

import android.annotation.TargetApi;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.couchbase.lite.auth.OIDCLoginContinuation;
import com.couchbase.lite.auth.OpenIDConnectAuthorizer;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Set;

public class OpenIDActivity extends AppCompatActivity {
    public static final String INTENT_LOGIN_URL = "loginUrl";
    public static final String INTENT_REDIRECT_URL = "redirectUrl";
    public static final String INTENT_CONTINUATION_KEY = "continuationKey";

    private static final boolean MAP_LOCALHOST_TO_DB_SERVER_HOST = true;

    private String loginUrl;
    private String redirectUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_openid);

        Intent intent = getIntent();
        loginUrl = intent.getStringExtra(INTENT_LOGIN_URL);
        redirectUrl = intent.getStringExtra(INTENT_REDIRECT_URL);
        String customeUserAgent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";
        //String customeUserAgent = "Mozilla/5.0 Google";

        WebView webView = (WebView) findViewById(R.id.webview);
        webView.getSettings().setUserAgentString(customeUserAgent);
        webView.setWebViewClient(new OpenIdWebViewClient());
        webView.getSettings().setJavaScriptEnabled(true);
        webView.loadUrl(loginUrl);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu_open_id, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_open_id_cancel:
                cancel();
                return true;
        }
        return false;
    }

    private void cancel() {
        Intent intent = getIntent();
        String key = intent.getStringExtra(INTENT_CONTINUATION_KEY);
        OpenIDAuthenticator.deregisterLoginContinuation(key);
        finish();
    }

    private void didFinishAuthentication(String url, String error, String description) {
        Intent intent = getIntent();
        String key = intent.getStringExtra(INTENT_CONTINUATION_KEY);
        if (key != null) {
            OIDCLoginContinuation continuation =
                    OpenIDAuthenticator.getLoginContinuation(key);

            URL authUrl = null;
            if (url != null) {
                try {
                    authUrl = new URL(url);
                    // Workaround for localhost development and test with Android emulators
                    // when the providers such as Google don't allow the callback host to be
                    // a non public domain (e.g. IP addresses):
                    if (authUrl.getHost().equals("localhost") && MAP_LOCALHOST_TO_DB_SERVER_HOST) {
                        String serverHost = App.getSyncManager().getSyncUrl().getHost();
                        authUrl = new URL(authUrl.toExternalForm().replace("localhost", serverHost));
                    }
                } catch (MalformedURLException e) { /* Shouldn't happen */ }
            }

            continuation.callback(authUrl, (error != null ? new Exception(error) : null));
        }
        OpenIDAuthenticator.deregisterLoginContinuation(key);
    }

    private class OpenIdWebViewClient extends WebViewClient {
        @TargetApi(Build.VERSION_CODES.LOLLIPOP)
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (shouldOverrideUrlLoading(request.getUrl()))
                return true;
            else
                return super.shouldOverrideUrlLoading(view, request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String urlStr) {
            Uri url = Uri.parse(urlStr);
            if (shouldOverrideUrlLoading(url))
                return true;
            else
                return super.shouldOverrideUrlLoading(view, urlStr);
        }

        public boolean shouldOverrideUrlLoading(Uri url) {
            String urlStr = url.toString();
            if (urlStr.startsWith(redirectUrl)) {
                String error = null;
                String description = null;
                Set<String> queryNames = url.getQueryParameterNames();
                if (queryNames != null) {
                    for (String name : queryNames) {
                        if (name.equals("error"))
                            error = url.getQueryParameter(name);
                        else if (name.equals("error_description"))
                            description = url.getQueryParameter(name);
                    }
                }
                didFinishAuthentication(urlStr, error, description);
                return true;
            }
            return false;
        }
    }
}
