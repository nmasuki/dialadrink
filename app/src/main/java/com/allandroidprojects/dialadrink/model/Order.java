package com.allandroidprojects.dialadrink.model;

import java.util.Date;

/**
 * Created by nmasuki on 4/18/2018.
 */

public class Order extends Cart {
    protected Date orderDate;
    protected String orderType;
    protected Boolean paymentDone;

    private Order(Cart cart) {
        super(cart.getProduct(), cart.getSize());
        setType(getClass().getSimpleName());
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public Boolean getPaymentDone() {
        return paymentDone;
    }

    public void setPaymentDone(Boolean paymentDone) {
        this.paymentDone = paymentDone;
    }
}
