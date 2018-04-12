package com.allandroidprojects.dialadrink.model;

import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by nmasuki on 3/23/2018.
 */

public class Product {
    private String _id;
    private String imageUrl;
    private String name;
    private String description;
    private double price;
    private String currency;
    private String category;
    private String subCategory;
    private String type = "Product";

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubCategory() {
        return subCategory;
    }

    public void setSubCategory(String subCategory) {
        this.subCategory = subCategory;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String get_id() {
        return _id;
    }

    public void set_id(String _id) {
        this._id = _id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrice() {
        return price;
    }

    public String getPriceLabel(){
        DecimalFormat formatter = new DecimalFormat("#,###,###");
        return getCurrency() + " " + formatter.format(getPrice());
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isValid() {
        return getImageUrl()!=null;
    }

    public static class Mappers {
        public static Mapper by_category = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                String type = document.containsKey("type")
                        ? document.get("type").toString().toLowerCase()
                        : "";

                if ("product".equals(type)) {
                    List<Object> keys = new ArrayList<Object>();
                    keys.add(document.get("category"));
                    emitter.emit(keys, document);
                }
            }
        };
        public static Mapper by_price = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                String type = document.containsKey("type")
                        ? document.get("type").toString().toLowerCase()
                        : "";

                if ("product".equals(type)) {
                    List<Object> keys = new ArrayList<Object>();
                    keys.add(document.get("price"));
                    emitter.emit(keys, document);
                }
            }
        };

    }
}
