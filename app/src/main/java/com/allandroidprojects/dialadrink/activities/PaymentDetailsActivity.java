package com.allandroidprojects.dialadrink.activities;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.model.Cart;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.facebook.drawee.view.SimpleDraweeView;

import java.text.DateFormatSymbols;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class PaymentDetailsActivity extends AppCompatActivity implements View.OnClickListener {
    protected PaymentMethod paymentMethod;
    SimpleDraweeView logoImageView;
    EditText identifier, identifier2, fullNames;
    Spinner monthSpinner, yearSpinner;
    CheckBox saveCheckbox;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payment_details);

        logoImageView = findViewById(R.id.logoImageView);
        identifier = findViewById(R.id.identifierEditText);
        identifier2 = findViewById(R.id.identifier2EditText);
        fullNames = findViewById(R.id.fullNamesEditText);
        monthSpinner = (Spinner) findViewById(R.id.expiryMonthSpinner);
        yearSpinner = (Spinner) findViewById(R.id.expiryYearSpinner);
        saveCheckbox = findViewById(R.id.saveCheckbox);

        if (getIntent() != null) {
            String methodId = getIntent().getStringExtra(PaymentMethodsActivity.SELECTED_METHOD_KEY);
            paymentMethod = DataUtils.toObj(DataUtils.get(methodId), PaymentMethod.class);
        }

        if (paymentMethod != null) {
            logoImageView.setImageURI(paymentMethod.getLogoImage());
            saveCheckbox.setText("  Save '" + paymentMethod.getName() + "' details.");
            if (paymentMethod.requires("identifier")) {
                identifier.setHint(paymentMethod.getHintText("identifier"));
                identifier.setText(paymentMethod.get("identifier"));
            } else {
                saveOrder();
                return;
            }

            if (!paymentMethod.requires("fullNames"))
                fullNames.setVisibility(View.GONE);
            else {
                fullNames.setHint(paymentMethod.getHintText("fullNames"));
                fullNames.setText(paymentMethod.get("fullNames"));
            }

            if (!paymentMethod.requires("identifier2"))
                identifier2.setVisibility(View.GONE);
            else {
                identifier2.setHint(paymentMethod.getHintText("identifier2"));
                identifier2.setText(paymentMethod.get("identifier2"));
            }

            if (!paymentMethod.requires("expiryDate")) {
                monthSpinner.setVisibility(View.GONE);
                yearSpinner.setVisibility(View.GONE);
            }
        }

        initSpinners();
    }

    private void saveOrder() {
        App.getAppContext().showProgressDialog(PaymentDetailsActivity.this, "Loading..");

        Map<String, Object> map = new HashMap<>();
        map.put("payment-identifier", identifier.getText().toString());
        if (paymentMethod.requires("fullNames"))
            map.put("payment-identifier2", identifier2.getText().toString());
        if (paymentMethod.requires("fullNames"))
            map.put("payment-fullNames", fullNames.getText().toString());
        if (paymentMethod.requires("expiryDate"))
            map.put("payment-expiryDate", String.format("%s/%s",
                    monthSpinner.getSelectedItem(),
                    yearSpinner.getSelectedItem()
            ));

        Order order = ShoppingUtils.getOrder(paymentMethod, map);
        DataUtils.save(order);

        for (Cart cart : ShoppingUtils.getCartListItems()) {
            cart.setDeleted(true);
            DataUtils.saveAsync(cart);
        }

        Intent intent = new Intent(PaymentDetailsActivity.this, OrderDetailsActivity.class);
        intent.putExtra(OrderDetailsActivity.SELECTED_ORDER_KEY, order.get_id());
        intent.putExtra(OrderDetailsActivity.SELECTED_ORDER_KEY + "data", DataUtils.toJson(map));
        startActivity(intent);
        finish();
    }

    private void initSpinners() {
        ArrayList<SpinnerItem> months = new ArrayList<>();
        ArrayList<SpinnerItem> years = new ArrayList<>();

        DateFormatSymbols dateFormat = new DateFormatSymbols();
        for (int i = 0; i < 12; i++)
            months.add(new SpinnerItem(dateFormat.getMonths()[i].substring(0, 3)));

        int year = new Date().getYear() - 100 + 2000;
        for (int i = year; i < year + 10; i++)
            years.add(new SpinnerItem(String.valueOf(i)));

        SpinnerAdapter adapter = new SpinnerAdapter(this, R.layout.spinner, R.id.data, months);
        SpinnerAdapter adapters = new SpinnerAdapter(this, R.layout.spinner, R.id.data, years);

        monthSpinner.setAdapter(adapter);
        yearSpinner.setAdapter(adapters);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.nextButton:

                if (saveCheckbox.isChecked()) {
                    paymentMethod.set("identifier", identifier.getText().toString());
                    paymentMethod.set("identifier2", identifier2.getText().toString());
                    paymentMethod.set("fullNames", fullNames.getText().toString());
                    paymentMethod.set("expiryDate", String.format("%s/%s",
                            monthSpinner.getSelectedItem(),
                            yearSpinner.getSelectedItem().toString()));
                }

                saveOrder();
                break;
            case R.id.backButton:
                finish();
                break;
        }
    }

    public class SpinnerAdapter extends ArrayAdapter<SpinnerItem> {
        int groupId;
        Context context;
        ArrayList<SpinnerItem> list;
        LayoutInflater inflater;

        public SpinnerAdapter(Context context, int groupId, int id, ArrayList<SpinnerItem> list) {
            super(context, id, list);
            this.list = list;
            this.context = context;
            inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            this.groupId = groupId;
        }

        public View getView(final int position, View convertView, ViewGroup parent) {
            View itemView = inflater.inflate(groupId, parent, false);
            TextView textView = (TextView) itemView.findViewById(R.id.data);
            textView.setText(list.get(position).getText());

            return itemView;
        }

        public View getDropDownView(int position, View convertView, ViewGroup parent) {
            return getView(position, convertView, parent);
        }
    }

    public class SpinnerItem {
        String text;
        Integer imageId;

        public SpinnerItem(String text, Integer imageId) {
            this.text = text;
            this.imageId = imageId;
        }

        public SpinnerItem(String text) {
            this.text = text;
        }

        public String getText() {
            return text;
        }

        public Integer getImageId() {
            return imageId;
        }

        @Override
        public String toString() {
            return text;
        }
    }
}
