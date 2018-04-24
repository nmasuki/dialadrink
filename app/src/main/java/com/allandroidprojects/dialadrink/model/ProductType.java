package com.allandroidprojects.dialadrink.model;

/**
 * Created by nmasuki on 3/24/2018.
 */

public class ProductType extends BaseModel {
    protected String name;
    protected double index;

    public double getIndex() {
        return index;
    }

    public void setIndex(double index) {
        this.index = index;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
