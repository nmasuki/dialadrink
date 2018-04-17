package com.allandroidprojects.dialadrink.model;

import android.text.format.DateFormat;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.couchbase.lite.Document;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;

import java.lang.reflect.Field;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;

/**
 * Created by nmasuki on 3/28/2018.
 */

public abstract class BaseModel implements Document.ChangeListener {
    private transient Document doc = null;

    private String _id;
    private String _rev;
    private Boolean _deleted;
    private String type;
    private String owner;
    private String createdAt;

    public BaseModel(Document doc) {
        this();
        setFieldsFromDocument(doc);
    }

    public BaseModel() {
        setType(this.getClass().getSimpleName());
        setCreatedAt(new Date());
        setOwner(App.getAppContext().getCurrentUserId());
    }

    @Override
    public void changed(Document.ChangeEvent event) {
        setFieldsFromDocument(this.doc);
    }

    public String get_id() {
        if (_id == null)
            _id = UUID.randomUUID().toString();

        return _id;
    }

    public void set_id(String _id) {
        this._id = _id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOwner() {
        String userId = App.getAppContext().getCurrentUserId();
        if (userId != null) {
            if (owner == null || owner == App.getAppContext().getGuestId())
                owner = userId;
        }
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public Date getCreatedAt() {
        try {
            return new SimpleDateFormat().parse(createdAt);
        } catch (ParseException e) {
            e.printStackTrace();
            return new Date();
        }
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = DateFormat.format(App.DATE_FORMAT, createdAt).toString();
    }

    public Document getDocument() {
        if (doc == null) {
            doc = App.getDatabase().getExistingDocument(get_id());
        }
        return doc;
    }

    public BaseModel setFieldsFromDocument(Document doc) {
        if (doc == null) {
            LogManager.getLogger().d(App.TAG, "Can't set doc. Null value given.");
            return this;
        }

        //Set the document
        if (!doc.equals(this.doc)) {
            if (this.doc != null)
                this.doc.removeChangeListener(this);

            this.doc = doc;
            this.doc.addChangeListener(this);
        }

        //Update fields
        Map<String, Object> properties = this.doc.getProperties();
        if (properties == null)
            return this;

        List<Field> fields = getAllFields(this.getClass());
        for (final String key : properties.keySet()) {
            if (key.equals("doc") || key.equals("_id")) continue;
            try {
                Field field = Linq.stream(fields).firstOrDefault(new Predicate<Field>() {
                    @Override
                    public boolean apply(Field value) {
                        return value.getName().equals(key);
                    }
                }, null);

                if (field == null)
                    continue;

                Object pvalue = properties.get(key);
                if (pvalue instanceof Map)
                    pvalue = DataUtils.toObj((Map) pvalue, field.getType());

                if(pvalue instanceof TreeMap)
                    pvalue = DataUtils.toObj((TreeMap) pvalue, field.getType());

                if (field.getType().isAssignableFrom(int.class))
                    pvalue = ((Number) pvalue).intValue();

                field.set(this, pvalue);

            } catch (IllegalAccessException e) {
                LogManager.getLogger().d(App.TAG, e.getMessage());
            } catch (Exception e) {
                LogManager.getLogger().d(App.TAG, e.getMessage());
            }
        }
        return this;
    }

    public Boolean getDeleted() {
        return _deleted;
    }

    public void setDeleted(Boolean _deleted) {
        this._deleted = _deleted;
    }

    public Object get(String fieldName){
        try {
            Field field = getField(fieldName, this.getClass());
            return field.get(this);
        } catch (IllegalAccessException e) {
            LogManager.getLogger().d(App.TAG, "Error while getting value for '"+fieldName+"'!", e);
            return null;
        }
    }

    protected static Field getField(final String name, Class<?> type) {
        return Linq.stream(getAllFields(type)).firstOrDefault(new Predicate<Field>() {
            @Override
            public boolean apply(Field value) {
                return value.getName().equals(name);
            }
        }, null);
    }

    protected static List<Field> getAllFields(Class<?> type) {
        return getAllFields(new LinkedList<Field>(), type);
    }

    private static List<Field> getAllFields(List<Field> fields, Class<?> type) {
        fields.addAll(Arrays.asList(type.getDeclaredFields()));

        if (type.getSuperclass() != null) {
            getAllFields(fields, type.getSuperclass());
        }

        return fields;
    }

    public static class Mappers {
        public static Mapper by_type = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                if (document.get("type") != null) {
                    List<Object> keys = new ArrayList<Object>();
                    keys.add(document.get("type"));
                    keys.add(document.get("createdAt"));
                    emitter.emit(keys, document);
                }
            }
        };
    }
}
