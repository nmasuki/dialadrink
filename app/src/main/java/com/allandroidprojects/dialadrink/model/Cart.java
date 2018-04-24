package com.allandroidprojects.dialadrink.model;

import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.notification.NotificationCount;
import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by nmasuki on 3/27/2018.
 */

public class Cart extends BaseModel {
    protected int size = 0;
    protected Product product = new Product();

    public static Cart fromProduct(Product product) {
        return fromProduct(product, 0);
    }

    public static Cart fromProduct(Product product, int size) {
        return new Cart(product, size);
    }

    protected Cart(Product product, int size) {
        this.product = product;
        this.size = size;
    }

    public Cart add() {
        NotificationCount.setBadgeCount("cart", ++size);
        try {
            DataUtils.save(this);
        } catch (Exception e) {
            LogManager.getLogger().d(App.TAG, e.getMessage());
        }
        return this;
    }

    public Cart remove() {
        NotificationCount.setBadgeCount("cart", --size);

        if (size <= 0)
            this.setDeleted(true);

        DataUtils.save(this);
        return this;
    }

    public int getSize() {
        return size;
    }

    public Product getProduct() {
        return product;
    }

    public double getTotalPrice() {
        if (getProduct() != null)
            return getProduct().getPrice() * size;
        return 0.0;
    }

    public String getTotalPriceLabel() {
        DecimalFormat formatter = new DecimalFormat("#,###,##0.00");
        return getProduct().getCurrency() + " " + formatter.format(getTotalPrice());
    }

    public static class Mappers {
        public static Mapper by_userId = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                String type = document.containsKey("type")
                        ? document.get("type").toString().toLowerCase()
                        : "";

                if ("cart".equals(type)) {
                    double size = 0;
                    if (document.get("size") != null)
                        size = (double) document.get("size");

                    if(size > 0) {
                        Cart item = DataUtils.toObj(document, Cart.class);
                        List<Object> keys = new ArrayList<Object>();
                        keys.add(document.get("userId"));
                        keys.add(document.get("modifiedAt"));
                        keys.add(item.getTotalPrice());
                        emitter.emit(keys, document);
                    }
                }
            }
        };

    }
}
