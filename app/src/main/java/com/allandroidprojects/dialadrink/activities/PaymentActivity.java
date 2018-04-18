package com.allandroidprojects.dialadrink.activities;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;

import com.allandroidprojects.dialadrink.R;
import com.facebook.FacebookSdk;


public class PaymentActivity extends AppCompatActivity implements
        View.OnClickListener {
    public static final String BUNDLE_ORDER = "BundleOrder";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FacebookSdk.sdkInitialize(getApplicationContext());
        //AppEventsLogger.activateApp(this);
        setContentView(R.layout.activity_payment);

        Bundle bundle = getIntent().getExtras();
        Object serializable = (Object) bundle.get(BUNDLE_ORDER);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.payWithMPESAButton:
                break;
            case R.id.payOnDeliveryButton:
                break;
        }
    }
}

