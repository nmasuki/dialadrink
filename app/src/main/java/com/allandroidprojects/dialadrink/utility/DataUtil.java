package com.allandroidprojects.dialadrink.utility;

import com.allandroidprojects.dialadrink.startup.DialADrink;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Document;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;
import com.couchbase.lite.Query;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;
import com.couchbase.lite.View;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonElement;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.Stream;

/**
 * Created by nmasuki on 3/26/2018.
 */

public class DataUtil {
    public static View getView(final String name, DialADrink app){
        return getView(name, null, app);
    }

    public static View getView(final String type, Mapper map, DialADrink app) {
        View view = app.getDatabase().getView(StringUtil.toUnderScore(type));
        if (view.getMap() == null) {
            if (map == null)
                map = new Mapper() {
                    @Override
                    public void map(Map<String, Object> document, Emitter emitter) {
                        String _type = (document.containsKey("type") ? document.get("type") : "")
                                .toString().toLowerCase();
                        if (type.toLowerCase().equals(_type)) {
                            List<Object> keys = new ArrayList<Object>();
                            keys.add(document.get("_id"));
                            keys.add(document.get("created_at"));
                            emitter.emit(keys, document);
                        }
                    }
                };
            view.setMap(map, "1.0");
        }
        return view;
    }

    public static Stream<Document> getAll(String type, DialADrink app){
        ArrayList<Document> allItems = new ArrayList<>();
        if (app != null) {
            Query query = getView(type, app).createQuery();
            try {
                QueryEnumerator result = query.run();
                for (Iterator<QueryRow> it = result; it.hasNext(); ) {
                    QueryRow row = it.next();
                   allItems.add(row.getDocument());
                }
            } catch (CouchbaseLiteException e) {
                e.printStackTrace();
            }
        }

        return Linq.stream(allItems);
    }

    public static Document get(String id, DialADrink app){
        if (app != null)
            return app.getDatabase().getDocument(id);

        return null;
    }

    public static <T> Document save(T product, DialADrink app) {
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> properties =
                mapper.convertValue(product, new TypeReference<Map<String, Object>>() {});

        if (!properties.containsKey("type")){
            String type = product.getClass().getSimpleName();
            properties.put("type", type.toLowerCase());
        }

        if (!properties.containsKey("created_at")){
            Date created_at = new Date();
            properties.put("created_at", created_at);
        }

        if (!properties.containsKey("owner")){
            String userId = app.getCurrentUserId();
            if(userId != null)
                properties.put("owner", "p:" + userId);
        }

        try {
            Document document = app.getDatabase().createDocument();
            document.putProperties(properties);
            return document;
        } catch (CouchbaseLiteException e) {
            e.printStackTrace();
            return null;
        }

    }

    public static <T> T toObj(Document document, Class<T> cls){
        return toObj(document.getProperties(), cls);
    }

    public static <T> T toObj(Map<String, Object> map, Class<T> cls){
        Gson gson = new Gson();
        JsonElement jsonElement = gson.toJsonTree(map);
        return gson.fromJson(jsonElement, cls);
    }

}
