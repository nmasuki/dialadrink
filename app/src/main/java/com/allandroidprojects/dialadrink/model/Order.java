package com.allandroidprojects.dialadrink.model;

import java.util.Date;
import java.util.List;

/**
 * Created by nmasuki on 4/18/2018.
 */

public class Order extends BaseModel {
    protected String orderNumber;
    protected Date orderDate;
    protected String clientName;
    protected String address1;
    protected String address2;
    protected PaymentMethod paymentMethod;
    protected Boolean paid;
    protected List<Cart> cartItems;

    public Order(){
        
    }
}
