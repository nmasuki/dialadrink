package com.allandroidprojects.dialadrink.activities;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.PreferenceUtils;
import com.couchbase.lite.Document;
import com.facebook.drawee.view.SimpleDraweeView;

import java.util.List;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;

public class PaymentMethodsActivity extends AppCompatActivity {
    public static final String SELECTED_METHOD_KEY = "preferedPaymentMethod";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payment_method);

        ListView listview = findViewById(R.id.paymentListView);
        List<PaymentMethod> paymetMethods = Linq.stream(DataUtils.getAll("PaymentMethod"))
                .select(new Selector<Document, PaymentMethod>() {
                    @Override
                    public PaymentMethod select(Document value) {
                        return DataUtils.toObj(value, PaymentMethod.class);
                    }
                }).toList();

        if (paymetMethods.size() == 0)
            paymetMethods = PaymentMethod.getFromJsonAsset();

        listview.setAdapter(new PaymentMethodsAdapter(this, Linq.stream(paymetMethods)
                .where(new Predicate<PaymentMethod>() {
            @Override
            public boolean apply(PaymentMethod value) {
                return value.getActive();
            }
        })
                .orderBy(new Selector<PaymentMethod, Integer>() {
                    @Override
                    public Integer select(PaymentMethod value) {
                        return value.getOrderIndex();
                    }
                }).toList()));
    }

    public class PaymentMethodsAdapter extends ArrayAdapter {
        Context context;
        List<PaymentMethod> list;
        LayoutInflater inflater;

        public PaymentMethodsAdapter(Context context, List<PaymentMethod> list) {
            super(context, R.layout.viewitem_paymentmethod, list);
            this.list = list;
            this.context = context;
            inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);

        }

        public View getView(final int position, View convertView, ViewGroup parent) {
            View itemView = inflater.inflate(R.layout.viewitem_paymentmethod, parent, false);

            SimpleDraweeView logoImageView = itemView.findViewById(R.id.logoImageView);
            ImageView selectMarkImageView = itemView.findViewById(R.id.selectMark);
            TextView identifierTextView = itemView.findViewById(R.id.identifierTextView);
            TextView identifier2TextView = itemView.findViewById(R.id.identifier2TextView);
            TextView nameTextView = itemView.findViewById(R.id.nameTextView);
            TextView validThruTextView = itemView.findViewById(R.id.validThruTextView);
            TextView expiryDateTextView = itemView.findViewById(R.id.expiryDateTextView);

            final PaymentMethod item = list.get(position);
            logoImageView.setImageURI(item.getLogoImage());

            if (item.requires("identifier") && !"".equals(item.get("identifier")))
                identifierTextView.setText(item.get("identifier"));
            else
                identifierTextView.setText(item.getName());

            if (item.requires("identifier2"))
                identifier2TextView.setText(item.get("identifier2"));
            else
                identifier2TextView.setText("");

            if (item.requires("fullNames"))
                nameTextView.setText(item.get("fullNames"));
            else
                nameTextView.setText("");

            if (!item.requires("expiryDate")) {
                expiryDateTextView.setVisibility(View.GONE);
                validThruTextView.setVisibility(View.GONE);
            } else {
                String expiryDate = item.get("expiryDate");
                validThruTextView.setVisibility(expiryDate.equals("")? View.GONE: View.VISIBLE);
                expiryDateTextView.setVisibility(View.VISIBLE);
                expiryDateTextView.setText(expiryDate);
            }

            Boolean isPrefered = PreferenceUtils.getString(SELECTED_METHOD_KEY, "")
                    .equals(item.get_id());
            selectMarkImageView.setImageResource(isPrefered ? R.drawable.ic_right : R.drawable.ic_round);

            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    PreferenceUtils.setString(SELECTED_METHOD_KEY, item.get_id());
                    notifyDataSetChanged();

                    if(item.requires("identifier")) {
                        Intent intent = new Intent(PaymentMethodsActivity.this, PaymentDetailsActivity.class);
                        intent.putExtra(SELECTED_METHOD_KEY, item.get_id());
                        startActivity(intent);
                    }else{

                    }
                }
            });

            return itemView;
        }

        public View getDropDownView(int position, View convertView, ViewGroup parent) {
            return getView(position, convertView, parent);
        }
    }
}
