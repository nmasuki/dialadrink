package com.allandroidprojects.dialadrink.model;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;

import java.lang.reflect.Field;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

/**
 * Created by nmasuki on 4/18/2018.
 */

public class Order extends BaseModel {
    protected String orderNumber;
    protected Date orderDate;

    protected String clientName;
    protected String clientAddress1;
    protected String clientAddress2;

    protected Boolean paid;
    protected Map<String, Object> metaData;
    protected Double shippingCost = 0.0;
    protected Double itemsCost = 0.0;

    protected PaymentMethod paymentMethod;
    protected List<Cart> orderItems;

    public Order(PaymentMethod paymentMethod, List<Cart> orderItems, Map<String, Object> metaData) {
        super();
        this.orderNumber = getOrderNumber();
        this.orderDate = new Date();

        this.metaData = metaData != null ? metaData : new HashMap<String, Object>();
        this.metaData.put("payment-type", paymentMethod.getName());

        this.paymentMethod = paymentMethod;
        this.orderItems = orderItems;

        this.itemsCost = Linq.stream(orderItems)
                .sum(new SelectorDouble<Cart>() {
                    @Override
                    public Double select(Cart value) {
                        return value.getTotalPrice();
                    }
                });
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public Boolean getPaid() {
        return paid;
    }

    public void setPaid(Boolean paid) {
        this.paid = paid;
    }

    public List<Cart> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<Cart> orderItems) {
        this.orderItems = orderItems;
    }

    public static String getOrderNumber() {
        String numeric = "0123456789";
        String alphabetic = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return String.format("O-%s%s%s",
                getRandomSequence(alphabetic, 1),
                getRandomSequence(numeric, 6),
                getRandomSequence(alphabetic, 1)
        );
    }

    public static String getRandomSequence(String characters, Integer length) {
        String sequence = "";
        for (int i = 0; i < length; i++) {
            int index = ((Number) Math.round(Math.random() * (characters.length() - 1))).intValue();
            sequence += characters.charAt(index);
        }
        return sequence;
    }

    public String getPaymentType() {
        return metaData.containsKey("payment-type") ? (String) metaData.get("payment-type") : "";
    }

    public Double getTotalAmount() {
        return this.getShippingCost() + itemsCost;
    }

    public Double getShippingCost() {
        return shippingCost;
    }

    @Override
    public Object get(String fieldName) {
        if (metaData != null && metaData.containsKey(fieldName))
            return metaData.get(fieldName);
        return super.get(fieldName);
    }

    public void set(String fieldName, Object value) {
        Field field = getField(fieldName);
        if (field != null) {
            try {
                field.set(this, value);
                return;
            } catch (IllegalAccessException e) {
                LogManager.getLogger().e(App.TAG, "Error setting field!", e);
            }
        }

        if (metaData.containsKey(fieldName))
            metaData.remove(fieldName);
        metaData.put(fieldName, value);
    }

    public Map<String, Object> getMetaData() {
        return metaData;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public Order setMetaData(Map<String, Object> metaData) {
        this.metaData = metaData;
        return this;
    }
}
