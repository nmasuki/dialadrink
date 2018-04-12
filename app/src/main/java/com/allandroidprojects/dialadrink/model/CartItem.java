package com.allandroidprojects.dialadrink.model;

import com.allandroidprojects.dialadrink.notification.NotificationCountSetClass;

import java.text.DecimalFormat;

/**
 * Created by nmasuki on 3/27/2018.
 */

public class CartItem {
    private Product product = new Product();
    private int size = 0;

    public static CartItem fromProduct(Product product){
        return fromProduct(product, 0);
    }

    public static CartItem fromProduct(Product product, int size){
        return new CartItem(product, size);
    }

    private CartItem(Product product, int size){
        this.product = product;
        this.size = size;
    }

    public CartItem add(){
        size++;
        NotificationCountSetClass.setNotify("cart", size);
        return this;
    }

    public CartItem remove(){
        size--;
        NotificationCountSetClass.setNotify("cart", size);
        return this;
    }

    public Product getProduct() {
        return product;
    }

    public int getSize(){
        return size;
    }

    public double getTotalPrice(){
        if(product!=null)
            return product.getPrice() * size;
        return 0.0;
    }

    public String getTotalPriceLabel(){
        DecimalFormat formatter = new DecimalFormat("#,###,###");
        return getProduct().getCurrency() + " " + formatter.format(getTotalPrice());
    }
}
