package com.allandroidprojects.dialadrink.activities;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.adapters.LiveQueryBaseAdapter;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.PreferenceUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.Query;
import com.facebook.drawee.view.SimpleDraweeView;

import java.util.HashMap;

public class PaymentMethodsActivity extends AppCompatActivity {
    public static final String SELECTED_METHOD_KEY = "preferedPaymentMethod";
    ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payment_method);
        ListView listview = findViewById(R.id.paymentListView);
        progressBar = findViewById(R.id.progressBar);

        Query query = DataUtils.getView("by_active_paymentmethods", PaymentMethod.Mappers.by_active)
                .createQuery();

        Object[] startKey = {true, null};
        Object[] endKey = {true, new HashMap<String, Object>()};

        query.setStartKey(startKey);
        query.setEndKey(endKey);

        listview.setAdapter(new PaymentMethodsAdapter(this, query.toLiveQuery()));

        this.registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                unregisterReceiver(this);
                finish();
            }
        }, new IntentFilter(ShoppingUtils.ORDER_SUCCESS_INTENT_FILTER));
    }

    public class PaymentMethodsAdapter extends LiveQueryBaseAdapter {
        Context context;
        LiveQuery liveQuery;
        LayoutInflater inflater;

        public PaymentMethodsAdapter(Context context, LiveQuery liveQuery) {
            super(context, liveQuery);
            this.liveQuery = liveQuery;
            this.context = context;
            this.inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        }

        public View getView(final int position, View convertView, ViewGroup parent) {
            View itemView = inflater.inflate(R.layout.viewitem_paymentmethod, parent, false);

            if (progressBar != null && progressBar.getVisibility() == View.VISIBLE)
                progressBar.setVisibility(View.GONE);

            SimpleDraweeView logoImageView = itemView.findViewById(R.id.logoImageView);
            ImageView selectMarkImageView = itemView.findViewById(R.id.selectMark);
            TextView identifierTextView = itemView.findViewById(R.id.identifierTextView);
            TextView identifier2TextView = itemView.findViewById(R.id.identifier2TextView);
            TextView nameTextView = itemView.findViewById(R.id.nameTextView);
            TextView validThruTextView = itemView.findViewById(R.id.validThruTextView);
            TextView expiryDateTextView = itemView.findViewById(R.id.expiryDateTextView);

            final PaymentMethod paymentMethod = DataUtils.toObj(super.getItem(position), PaymentMethod.class);
            logoImageView.setImageURI(paymentMethod.getLogoImage());

            if (paymentMethod.requires("identifier") && !"".equals(paymentMethod.get("identifier")))
                identifierTextView.setText(paymentMethod.get("identifier"));
            else
                identifierTextView.setText(paymentMethod.getName());

            if (paymentMethod.requires("identifier2"))
                identifier2TextView.setText(paymentMethod.get("identifier2"));
            else
                identifier2TextView.setText(paymentMethod.get("description"));

            if (paymentMethod.requires("fullNames"))
                nameTextView.setText(paymentMethod.get("fullNames"));
            else
                nameTextView.setText("");

            if (!paymentMethod.requires("expiryDate")) {
                expiryDateTextView.setVisibility(View.GONE);
                validThruTextView.setVisibility(View.GONE);
            } else {
                String expiryDate = paymentMethod.get("expiryDate");
                validThruTextView.setVisibility(expiryDate.equals("") ? View.GONE : View.VISIBLE);
                expiryDateTextView.setVisibility(View.VISIBLE);
                expiryDateTextView.setText(expiryDate);
            }

            Boolean isPrefered = PreferenceUtils.getString(SELECTED_METHOD_KEY, "").equals(paymentMethod.get_id());
            selectMarkImageView.setImageResource(isPrefered ? R.drawable.ic_right : R.drawable.ic_round);

            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    PreferenceUtils.setString(SELECTED_METHOD_KEY, paymentMethod.get_id());
                    notifyDataSetChanged();

                    Intent intent = new Intent(PaymentMethodsActivity.this, PaymentDetailsActivity.class);
                    intent.putExtra(SELECTED_METHOD_KEY, paymentMethod.get_id());
                    startActivity(intent);
                }
            });

            return itemView;
        }

        public View getDropDownView(int position, View convertView, ViewGroup parent) {
            return getView(position, convertView, parent);
        }
    }
}
