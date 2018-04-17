package com.allandroidprojects.dialadrink.model;

/**
 * Created by nmasuki on 3/24/2018.
 */

public class ProductType extends BaseModel {
    protected String name;
    protected double id;

    public ProductType(){
        set_id("0");
    }

    public double getId() {
        return id;
    }

    public void setId(double id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
