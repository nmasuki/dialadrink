package com.allandroidprojects.dialadrink.model;

import android.graphics.Bitmap;

import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.ImageUtils;
import com.allandroidprojects.dialadrink.utility.PreferenceUtils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;

public class PaymentMethod extends BaseModel {
    protected String name;
    protected String logoImage;
    protected String description;
    protected Boolean active = false;
    protected Integer orderIndex;
    protected HashMap<String, String> requiredFields = new HashMap<>();

    public PaymentMethod() {
        super();
        setOwner("none");
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLogoImage() {
        return logoImage;
    }

    public Bitmap getLogoBitmap() {
        String imageUrl = "http://www.pariyarathusilks.com/onlineshop/modules/productpaymentlogos/img/af5f83965bf01fb2ce9484b979b9f458.png";

        if (logoImage != null)
            imageUrl = logoImage;

        return ImageUtils.decodeBitmapFromUrl(imageUrl);
    }

    public void setLogoImage(String logoImage) {
        this.logoImage = logoImage;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean requires(String key) {
        return requiredFields.containsKey(key);
    }

    @Override
    public String get(String key) {
        Object val = super.get(key);
        if (val != null)
            return val.toString();
        return PreferenceUtils.getString(get_id() + key, "");
    }

    public void set(String key, String value){
        PreferenceUtils.setString(get_id() + key, value);
    }

    public String getHintText(String key) {
        return requiredFields.containsKey(key) ? requiredFields.get(key) : "Enter '" + key + "' here..";
    }

    public static List<PaymentMethod> getFromJsonAsset() {
        String json = DataUtils.loadJSONFromAsset("paymentmethods.json");
        Type listType = new TypeToken<List<PaymentMethod>>() {
        }.getType();

        // In this test code i just shove the JSON here as string.
        List<PaymentMethod> list = new Gson().fromJson(json, listType);

        for (PaymentMethod p : list)
            DataUtils.saveAsync(p);

        return list;
    }
}
