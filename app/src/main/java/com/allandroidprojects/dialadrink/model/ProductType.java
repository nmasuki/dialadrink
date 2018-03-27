package com.allandroidprojects.dialadrink.model;

/**
 * Created by nmasuki on 3/24/2018.
 */

public class ProductType {
    int id;
    String name;
    String type = "ProductType";

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
