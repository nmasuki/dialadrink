package com.allandroidprojects.dialadrink.activities;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.utility.DataUtils;

import java.util.HashMap;
import java.util.Map;

public class OrderDetailsActivity extends AppCompatActivity {
    public static String SELECTED_ORDER_KEY = "selectedOrder";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_empty);

        String orderId = getIntent().getStringExtra(SELECTED_ORDER_KEY);
        String json = getIntent().getStringExtra(SELECTED_ORDER_KEY + "data");
        Map<String, String> meta = DataUtils.toObj(json, HashMap.class);
        Order order = DataUtils.toObj(DataUtils.get(orderId), Order.class);

        //Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        //setSupportActionBar(toolbar);
    }

}
