package com.allandroidprojects.dialadrink.utility;

import android.os.Handler;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.model.PaymentMethod;

import java.util.HashMap;
import java.util.Map;

public class PaymentUtils {
    public static void makePayment(Order order, Double amount, String description, final App.Runnable<Map<String, Object>> runnable) {
        switch (order.getPaymentType().toUpperCase()) {
            case "MPESA":
                PaymentMpesaUtils.getInstance().c2B(
                    (String)order.get("payment-identifier"),
                    amount, runnable
                );
                break;
            default:
                new Handler().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        runnable.run(new HashMap<String, Object>());
                    }
                }, 1000);
        }
    }
}
