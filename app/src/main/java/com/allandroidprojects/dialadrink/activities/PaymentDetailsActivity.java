package com.allandroidprojects.dialadrink.activities;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.model.User;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.DeviceAccountUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.facebook.drawee.view.SimpleDraweeView;

import java.text.DateFormatSymbols;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;

import static android.Manifest.permission.READ_CONTACTS;
import static android.Manifest.permission.WRITE_CONTACTS;
import static android.content.pm.PackageManager.PERMISSION_GRANTED;

public class PaymentDetailsActivity extends AppCompatActivity implements View.OnClickListener {
    final String SELECTED_ORDER_KEY = "selectedOrderKey";
    final int REQUEST_READ_CONTACTS_PERMISSION = 1;
    protected PaymentMethod paymentMethod;
    SimpleDraweeView logoImageView;
    EditText identifier, identifier2, fullNames;
    Spinner monthSpinner, yearSpinner;
    CheckBox saveCheckbox;
    Order order = null;

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
            if (methodId != null)
                paymentMethod = DataUtils.get(methodId, PaymentMethod.class);
            else {
                String orderId = getIntent().getStringExtra(SELECTED_ORDER_KEY);
                order = DataUtils.get(orderId, Order.class);
                paymentMethod = order.getPaymentMethod();
            }
        }

        if (paymentMethod != null) {
            int count = 4;
            User user = App.getAppContext().getCurrentUser();
            DeviceAccountUtils.UserProfile userProfile = DeviceAccountUtils.getUserProfile(this);

            logoImageView.setImageURI(paymentMethod.getLogoImage());
            saveCheckbox.setText("  Save '" + paymentMethod.getName() + "' details.");

            if (!paymentMethod.requires("fullNames")) {
                fullNames.setVisibility(View.GONE);
                count--;
            } else {
                fullNames.setHint(paymentMethod.getHintText("fullNames"));
                if (user != null && !"guest".equals(user.getName()))
                    fullNames.setText(user.getName());
                else if (paymentMethod.get("fullNames") != null && paymentMethod.get("fullNames").length() > 0) {
                    fullNames.setText(paymentMethod.get("fullNames"));
                } else if (userProfile != null || userProfile.possibleNames() ==null || userProfile.possibleNames().isEmpty()) {
                    fullNames.setText(Linq.stream(userProfile.possibleNames()).firstOrDefault(null));
                } else {
                    checkReadContactsPermissions();
                }
            }

            if (!paymentMethod.requires("identifier")) {
                identifier.setVisibility(View.GONE);
                count--;
            } else {
                identifier.setHint(paymentMethod.getHintText("identifier"));
                identifier.setText(paymentMethod.get("identifier"));
                Pattern regex = paymentMethod.getValidationRegex("identifier");
                if (paymentMethod.get("identifier") == null || paymentMethod.get("identifier").isEmpty()) {
                    if (regex.matcher("0720805835").find() && !regex.matcher("ANYTHING").find())
                        if (userProfile != null)
                            identifier.setText(userProfile.primaryPhoneNumber());
                }
            }

            if (!paymentMethod.requires("identifier2")) {
                identifier2.setVisibility(View.GONE);
                count--;
            } else {
                identifier2.setHint(paymentMethod.getHintText("identifier2"));
                identifier2.setText(paymentMethod.get("identifier2"));
            }

            if (!paymentMethod.requires("expiryDate")) {
                monthSpinner.setVisibility(View.GONE);
                yearSpinner.setVisibility(View.GONE);
                count--;
            }

            if (count <= 0)
                saveOrder();
        }

        initSpinners();

        this.registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                unregisterReceiver(this);
                finish();
            }
        }, new IntentFilter(ShoppingUtils.ORDER_SUCCESS_INTENT_FILTER));
    }

    private void saveOrder() {
        if (!isValid()) {
            Toast.makeText(this, "Found some invalid input. Please fill in the fields with valid data..", Toast.LENGTH_LONG);
            return;
        }

        final Map<String, Object> map = new HashMap<>();
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

        App.getAppContext().showProgressDialog(PaymentDetailsActivity.this, "Loading..");
        order = order == null ? ShoppingUtils.getOrder(paymentMethod, map) : order.setMetaData(map);
        ShoppingUtils.postOrder(PaymentDetailsActivity.this, order,
                new App.Runnable<Map<String, Object>>() {
                    @Override
                    public void run(Map<String, Object>... param) {
                        Map<String, Object> response = Linq.stream(param).firstOrDefault(new HashMap<String, Object>());
                        Map<String, Object> meta = order.getMetaData();
                        for (Map<String, Object> m : param)
                            for (Map.Entry<String, Object> entry : m.entrySet()) {
                                String key = entry.getKey();
                                Object value = entry.getValue();
                                if (!key.startsWith("payment"))
                                    key = "payment-" + key;
                                meta.put(key, value);
                            }

                        DataUtils.save(order);
                        String status = response.containsKey("status") ? response.get("status").toString() : "failed";

                        if (!status.equals("error") && !status.equals("failed")) {
                            App.getAppContext().hideProgressDialog();
                            Intent intent = new Intent(PaymentDetailsActivity.this, OrderDetailsActivity.class);
                            intent.putExtra(OrderDetailsActivity.SELECTED_ORDER_KEY, order.get_id());
                            startActivity(intent);

                            ShoppingUtils.broadCastOrderSuccess(order);
                        } else {
                            App.getAppContext().hideProgressDialog();
                            String msgKey = Linq.stream(response.keySet()).firstOrDefault(new Predicate<String>() {
                                @Override
                                public boolean apply(String value) {
                                    return value.toLowerCase().contains("message");
                                }
                            }, "errorMessage");
                            String codeKey = Linq.stream(response.keySet()).firstOrDefault(new Predicate<String>() {
                                @Override
                                public boolean apply(String value) {
                                    return value.toLowerCase().contains("code");
                                }
                            }, "errorCode");

                            final String msg = String.format("%s: %s",
                                    response.containsKey(codeKey) ? response.get(codeKey).toString() : "",
                                    response.containsKey(msgKey) ? response.get(msgKey).toString() : "",
                                    getString(R.string.check_internet_try_again)
                            );

                            App.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    Toast.makeText(PaymentDetailsActivity.this, msg, Toast.LENGTH_LONG).show();
                                }
                            });
                        }
                    }
                }, new App.Runnable<String>() {
                    @Override
                    public void run(final String... param) {
                        App.getAppContext().hideProgressDialog();
                        App.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                String msg = Linq.stream(param).firstOrDefault(getString(R.string.payment_error_msg));
                                Toast.makeText(PaymentDetailsActivity.this, msg, Toast.LENGTH_LONG).show();
                            }
                        });
                    }
                });
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

    private boolean checkReadContactsPermissions() {
        if (ActivityCompat.checkSelfPermission(this, READ_CONTACTS) != PERMISSION_GRANTED) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                requestPermissions(
                        new String[]{READ_CONTACTS,WRITE_CONTACTS},
                        REQUEST_READ_CONTACTS_PERMISSION
                );
            }
            return false;
        } else {
            return true;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_READ_CONTACTS_PERMISSION) {
            if (ActivityCompat.checkSelfPermission(this, READ_CONTACTS) != PERMISSION_GRANTED) {
                DeviceAccountUtils.UserProfile userProfile = DeviceAccountUtils.getUserProfile(this);
                if (userProfile != null) {
                    if (identifier.getText().toString() == null || identifier.getText().toString().isEmpty()) {
                        Pattern regex = paymentMethod.getValidationRegex("identifier");
                        if (paymentMethod.get("identifier") == null || paymentMethod.get("identifier").isEmpty()) {
                            if (regex.matcher("0720805835").find() && !regex.matcher("ANYTHING").find())
                                if (userProfile != null)
                                    identifier.setText(userProfile.primaryPhoneNumber());
                        }
                    }

                    if (fullNames.getText().toString() == null || fullNames.getText().toString().isEmpty()) {
                        List<String> names = userProfile.possibleNames();
                        fullNames.setText(Linq.stream(names).firstOrDefault(null));
                    }
                }
            }
        }
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

    public boolean isValid() {
        boolean valid = true;

        if (!paymentMethod.getValidationRegex("identifier").matcher(identifier.getText().toString()).find()) {
            valid = false;
            identifier.setBackgroundColor((int) R.color.grey_light);
        }

        if (!paymentMethod.getValidationRegex("identifier2").matcher(identifier2.getText().toString()).find()) {
            valid = false;
            identifier2.setBackgroundColor((int) R.color.grey_light);
        }

        if (!paymentMethod.getValidationRegex("fullNames").matcher(fullNames.getText().toString()).find()) {
            valid = false;
            fullNames.setBackgroundColor((int) R.color.grey_light);
        }

        return valid;
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
