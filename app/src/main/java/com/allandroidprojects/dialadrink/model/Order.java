package com.allandroidprojects.dialadrink.model;

import com.allandroidprojects.dialadrink.utility.DataUtils;

import java.math.BigDecimal;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.SelectorBigDecimal;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

/**
 * Created by nmasuki on 4/18/2018.
 */

public class Order extends BaseModel {
    protected String orderNumber;
    protected Date orderDate;
    protected String clientName;
    protected String address1;
    protected String address2;
    protected Boolean paid;
    protected List<Cart> cartItems;
    protected Map<String, Object> metaData;
    protected Double shippingCost = 0.0;

    public Order(PaymentMethod paymentMethod, List<Cart> cartItems, Map<String, Object> metaData) {
        super();
        this.orderNumber = getOrderNumber();
        this.cartItems = cartItems;
        this.metaData = metaData;
        String paymentType = Linq.stream(paymentMethod.get_id().split("-")).lastOrDefault(null);
        this.metaData.put("payment-type", paymentType);
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

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getAddress1() {
        return address1;
    }

    public void setAddress1(String address1) {
        this.address1 = address1;
    }

    public String getAddress2() {
        return address2;
    }

    public void setAddress2(String address2) {
        this.address2 = address2;
    }

    public Boolean getPaid() {
        return paid;
    }

    public void setPaid(Boolean paid) {
        this.paid = paid;
    }

    public List<Cart> getCartItems() {
        return cartItems;
    }

    public void setCartItems(List<Cart> cartItems) {
        this.cartItems = cartItems;
    }

    public static String getOrderNumber() {
        String numeric = "0123456789";
        String alphabetic = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return String.format("O-%s%s%s",
                getRandomSequence(alphabetic, 1),
                getRandomSequence(numeric, 4),
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
        return metaData.containsKey("payment-type")? (String)metaData.get("payment-type"): "";
    }

    public Double getTotalAmount() {
        return this.getShippingCost() + Linq.stream(cartItems)
                .sum(new SelectorDouble<Cart>() {
                    @Override
                    public Double select(Cart value) {
                        return value.getTotalPrice();
                    }
                });
    }

    public Double getShippingCost() {
        return shippingCost;
    }

    @Override
    public Object get(String fieldName) {
        if(metaData!=null && metaData.containsKey(fieldName))
            return metaData.get(fieldName);
        return super.get(fieldName);
    }
}
