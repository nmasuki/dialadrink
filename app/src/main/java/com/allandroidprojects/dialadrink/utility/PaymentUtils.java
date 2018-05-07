package com.allandroidprojects.dialadrink.utility;

import com.allandroidprojects.dialadrink.model.PaymentMethod;

public class PaymentUtils {
    public void makePayment(PaymentMethod method, Double amount, String description, Runnable runnable) {
        switch (method.get_id()) {
            case "paymentmethod-Mpesa":
                PaymentMpesaUtils.getInstance().c2B(
                        method.get("identifier"),
                        amount
                );
                break;
            default:
        }
    }
}
