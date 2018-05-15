package com.allandroidprojects.dialadrink.activities;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.utility.DataUtils;

import java.util.HashMap;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;

public class OrderDetailsActivity extends AppCompatActivity {
    public static String SELECTED_ORDER_KEY = "selectedOrder";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_empty);

        String orderId = getIntent().getStringExtra(SELECTED_ORDER_KEY);
        Order order = DataUtils.get(orderId, Order.class);

        TextView emptyInfoTextView = findViewById(R.id.emptyInfoTextView);
        Map<String, Object> meta = order.getMetaData();

        String msgKey = Linq.stream(meta.keySet()).firstOrDefault(new Predicate<String>() {
            @Override
            public boolean apply(String value) {
                return value.toLowerCase().contains("message");
            }
        }, "payment-CustomerMessage");
        String statusKey = Linq.stream(meta.keySet()).firstOrDefault(new Predicate<String>() {
            @Override
            public boolean apply(String value) {
                return value.toLowerCase().contains("status");
            }
        }, "payment-status");

        String status = meta.containsKey(statusKey)
                ? meta.get(statusKey).toString()
                : "failed";

        String message = meta.containsKey(msgKey)
                ? meta.get(msgKey).toString()
                : (status == "success"? getString(R.string.payment_success_msg): getString(R.string.payment_failure_msg));

        emptyInfoTextView.setText(message);
        //Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        //setSupportActionBar(toolbar);
    }

}
