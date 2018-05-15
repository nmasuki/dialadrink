package com.allandroidprojects.dialadrink.model;

import android.graphics.Bitmap;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.ImageUtils;
import com.allandroidprojects.dialadrink.utility.PreferenceUtils;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import br.com.zbra.androidlinq.Stream;

public class PaymentMethod extends BaseModel {
    protected String name;
    protected String logoImage;
    protected String description;
    protected Boolean active = false;
    protected Integer orderIndex;
    protected HashMap<String, String> requiredFields = new HashMap<>();
    protected HashMap<String, Object> metaData = new HashMap<>();

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

    public void set(String key, String value) {
        PreferenceUtils.setString(get_id() + key, value);
    }

    public String getHintText(String key) {
        return requiredFields.containsKey(key) ? requiredFields.get(key).split(":")[0] : "Enter '" + key + "' here..";
    }

    public Pattern getValidationRegex(String key) {
        if (requiredFields.containsKey(key)) {
            String value = requiredFields.get(key);
            if (value.contains(":")) {
                String regex = requiredFields.get(key).split(":")[1];
                if (regex != null && regex.length() > 0) {
                    try {
                        return Pattern.compile(regex);
                    } catch (Exception e) {
                        LogManager.getLogger().e(App.TAG, "Error parsing regex '" + regex + "'", e);
                    }
                }
            }
        }
        return Pattern.compile("[\\w]*");
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

    public static class Mappers {
        public static Mapper by_active = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                String type = document.containsKey("type") && document.get("type") != null
                        ? document.get("type").toString().toLowerCase()
                        : null;

                if (type != null && "paymentmethod".equals(type)) {
                    List<Object> keys = new ArrayList<>();
                    keys.add(document.get("active"));
                    keys.add(document.get("orderIndex"));
                    emitter.emit(keys, document);
                }
            }
        };
    }

}
