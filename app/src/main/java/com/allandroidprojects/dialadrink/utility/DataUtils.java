package com.allandroidprojects.dialadrink.utility;

import android.os.AsyncTask;
import android.text.format.DateFormat;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.BaseModel;
import com.allandroidprojects.dialadrink.model.User;
import com.couchbase.lite.Attachment;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.Document;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Mapper;
import com.couchbase.lite.Query;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;
import com.couchbase.lite.TransactionalTask;
import com.couchbase.lite.UnsavedRevision;
import com.couchbase.lite.View;
import com.google.gson.Gson;
import com.google.gson.internal.ObjectConstructor;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.Stream;
import br.com.zbra.androidlinq.delegate.Selector;

/**
 * Created by nmasuki on 3/26/2018.
 */

public class DataUtils {
    static Gson gson = new Gson();

    public static View getView(final String name) {
        return getView(name, null);
    }

    public static View getView(final String type, Mapper map) {
        View view = App.getDatabase().getView(StringUtils.toUnderScore(type));
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
                            keys.add(document.get("createdAt"));
                            emitter.emit(keys, document);
                        }
                    }
                };
            view.setMap(map, "1.0");
        }
        return view;
    }

    public static Stream<Document> getAll(String type) {
        ArrayList<Document> allItems = new ArrayList<>();
        Query query = getView("by_type", BaseModel.Mappers.by_type).createQuery();

        query.setDescending(true);
        if (type != null) {
            List<Object> startKeys = new ArrayList<Object>();
            startKeys.add(type); // [type, {}]
            startKeys.add(new HashMap<String, Object>());

            List<Object> endKeys = new ArrayList<Object>();
            endKeys.add(type);

            query.setStartKey(startKeys); //[type, null]
            query.setEndKey(endKeys);
        }

        Date start = new Date();
        try {
            QueryEnumerator enumerator = query.run();
            if (enumerator != null && enumerator.hasNext()) {
                List<Document> result = Linq.stream(query.run()).select(new Selector<QueryRow, Document>() {
                    @Override
                    public Document select(QueryRow value) {
                        return value.getDocument();
                    }
                }).toList();

                allItems.addAll(result);
            }
        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(App.TAG, e.getMessage());
        }

        if (App.DEBUG) {
            long time = new Date().getTime() - start.getTime();
            LogManager.getLogger().d(App.TAG, "Query getAll '" + type + "' in " + time + "ms");
        }

        return Linq.stream(allItems);
    }

    public static Document get(String id) {
        if (App.getAppContext() != null)
            return App.getDatabase().getExistingDocument(id);

        return null;
    }

    public static <T extends BaseModel> AsyncTask saveAsync(final T model) {

        AsyncTask task = new AsyncTask<Object, Object, Object>() {
            @Override
            protected Document doInBackground(Object... args) {
                return save(model);
            }
        };

        task.execute();

        return task;
    }

    public static <T extends BaseModel> Document save(final T model) {
        Gson gson = new Gson();
        final Map<String, Object> properties = gson.fromJson(gson.toJson(model), HashMap.class);

        if (properties == null) {
            LogManager.getLogger().d(App.TAG, "Object was serialized to a null String.");
            return null;
        }

        if (properties.containsKey("doc"))
            properties.remove("doc");

        if (!properties.containsKey("_id"))
            properties.put("_id", model.get_id());

        if (!properties.containsKey("type") || properties.get("type") == null) {
            String type = model.getClass().getSimpleName();
            properties.put("type", type);
        }

        if (properties.get("owner") == null || App.getAppContext().getGuestId().equals(properties.get("owner"))) {
            String userId = App.getAppContext().getCurrentUserId();
            if (userId != null)
                properties.put("owner", userId);
        }

        if (!properties.containsKey("createdAt"))
            properties.put("createdAt", DateFormat.format(App.DATE_FORMAT, new Date()));
        else {
            if(properties.containsKey("modifiedBy"))
                properties.remove("modifiedBy");
            if(properties.containsKey("modifiedAt"))
                properties.remove("modifiedAt");
            properties.put("modifiedBy", App.getAppContext().getCurrentUserId());
            properties.put("modifiedAt", DateFormat.format(App.DATE_FORMAT, new Date()));
        }

        try {
            Document document = model.getDocument();
            if (document == null)
                document = App.getSyncManager().getDatabase().getDocument(model.get_id());

            document.putProperties(properties);
            model.setFieldsFromDocument(document);
            return document;
        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(App.TAG, "Error while saving to CouchbaseLite.", e);
            return null;
        }
    }

    public static <T> T toObj(Document document, Class<T> cls) {
        T model = toObj(document.getProperties(), cls);
        if (model instanceof BaseModel)
            ((BaseModel) model).setFieldsFromDocument(document);

        return model;
    }

    public static <T> T toObj(String json, Class<T> cls) {
        try {
            return gson.fromJson(json, cls);
        } catch (Exception e) {
            LogManager.getLogger().d(App.TAG, "Error while ", e);
            return null;
        }
    }

    public static <T> T toObj(Map<String, Object> map, Class<T> cls) {
        String jsonElement = DataUtils.toJson(map);
        return toObj(jsonElement, cls);
    }

    public static <T> T toObj(Object obj, Class<T> cls){
        String jsonElement = DataUtils.toJson(obj);
        return toObj(jsonElement, cls);
    }

    public static String toJson(Object obj){
        return gson.toJson(obj);
    }

    public static void migrateGuestToUser(User user) {
        if (user != null && App.getAppContext().getGuestId().equals(App.getAppContext().getCurrentUserId())) {
            App.getAppContext().setCurrentUser(user);
            App.getSyncManager().setDatabase(App.getSyncManager().getUserDatabase(user.getUserId()));

            //Wait till db initialization is complete
            while (App.getSyncManager().getDatabase() == null) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }

            DataUtils.save(user);
            // Migrate guest data to user:
            migrateGuestData(App.getSyncManager().getUserDatabase(App.GUEST_DATABASE), user);
        }
    }

    private static boolean migrateGuestData(final Database guestDb, final User user) {
        boolean success = true;
        final Database userDB = user.getDocument().getDatabase();
        if (guestDb.getLastSequenceNumber() > 0 && userDB.getLastSequenceNumber() == 0) {
            success = userDB.runInTransaction(new TransactionalTask() {
                @Override
                public boolean run() {
                    try {
                        QueryEnumerator rows = guestDb.createAllDocumentsQuery().run();
                        for (QueryRow row : rows) {
                            Document doc = row.getDocument();
                            Document newDoc = userDB.getDocument(doc.getId());

                            Map<String, Object> properties = doc.getUserProperties();

                            if (properties.containsKey("owner")){
                                if(App.getAppContext().getGuestId().equals(properties.get("owner"))){
                                    properties.remove("owner");
                                    properties.put("owner", user.getUserId());
                                }
                            }

                            newDoc.putProperties(properties);

                            List<Attachment> attachments = doc.getCurrentRevision().getAttachments();
                            if (attachments.size() > 0) {
                                UnsavedRevision rev = newDoc.getCurrentRevision().createRevision();
                                for (Attachment attachment : attachments) {
                                    rev.setAttachment(
                                            attachment.getName(),
                                            attachment.getContentType(),
                                            attachment.getContent());
                                }
                                rev.save();
                            }
                        }
                        // Delete guest database:
                        guestDb.delete();
                    } catch (CouchbaseLiteException e) {
                        LogManager.getLogger().d(App.TAG, "Error when migrating guest data to user", e);
                        return false;
                    }
                    return true;
                }
            });
        }
        return success;
    }

    public static String loadJSONFromAsset(String fileName) {
        String json = null;
        try {
            InputStream is = App.getAppContext().getAssets().open(fileName);
            int size = is.available();
            byte[] buffer = new byte[size];
            is.read(buffer);
            is.close();
            json = new String(buffer, "UTF-8");
        } catch (IOException ex) {
            ex.printStackTrace();
            return "[]";
        }
        return json;
    }

}
