package com.allandroidprojects.dialadrink.utility;

import android.text.format.DateFormat;

import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.BaseModel;
import com.allandroidprojects.dialadrink.DialADrink;
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

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.Stream;
import br.com.zbra.androidlinq.delegate.Selector;

/**
 * Created by nmasuki on 3/26/2018.
 */

public class DataUtils {
    public static View getView(final String name){
        return getView(name, null);
    }

    public static View getView(final String type, Mapper map) {
        View view = DialADrink.getAppContext().getDatabase().getView(StringUtils.toUnderScore(type));
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

    public static Stream<Document> getAll(String type){
        ArrayList<Document> allItems = new ArrayList<>();
        Query query = getView(type).createQuery();

        try {
            List<Document> result = Linq.stream(query.run()).select(new Selector<QueryRow, Document>() {
                @Override
                public Document select(QueryRow value) {
                    return value.getDocument();
                }
            }).toList();

            allItems.addAll(result);
        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(DialADrink.TAG, e.getMessage());
        }

        return Linq.stream(allItems);
    }

    public static Document get(String id){
        if (DialADrink.getAppContext() != null)
            return DialADrink.getAppContext().getDatabase().getExistingDocument(id);

        return null;
    }

    public static <T extends BaseModel> Document save(T model) {
        Gson gson = new Gson();
        Map<String, Object> properties = gson.fromJson(gson.toJson(model), HashMap.class);

        if(properties==null)
        {
            LogManager.getLogger().d(DialADrink.TAG, "Object was serialized to a null String.");
            return null;
        }

        if(properties.containsKey("doc"))
            properties.remove("doc");

        if (!properties.containsKey("type") || properties.get("type") == null){
            String type = model.getClass().getSimpleName();
            properties.put("type", type.toLowerCase());
        }

        if (!properties.containsKey("createdAt"))
            properties.put("createdAt", DateFormat.format(DialADrink.DATE_FORMAT, new Date()));

        if (!properties.containsKey("owner") || properties.get("owner") == null){
            String userId = DialADrink.getAppContext().getCurrentUserId();
            if(userId != null)
                properties.put("owner", userId);
        }

        try {
            Document document = model.getDocument();
            if(document == null)
                document = DialADrink.getAppContext().getDatabase().createDocument();

            document.putProperties(properties);
            model.setFields(document);

            return document;
        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(DialADrink.TAG, "Error while saving to CouchbaseLite.", e);
            return null;
        }

    }

    public static <T> T toObj(Document document, Class<T> cls){
        T model = toObj(document.getProperties(), cls);
        if(model instanceof BaseModel)
            ((BaseModel)model).setFields(document);

        return model;
    }

    public static <T> T toObj(Map<String, Object> map, Class<T> cls){
        Gson gson = new Gson();
        String jsonElement = gson.toJson(map);
        return gson.fromJson(jsonElement, cls);
    }

    public static boolean migrateGuestData(final Database guestDb, final Document profile) {
        boolean success = true;
        final Database userDB = profile.getDatabase();
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

                            if(properties.containsKey("userId"))
                                properties.remove("userId");
                            properties.put("userId", DialADrink.getAppContext().getCurrentUserId());

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
                        LogManager.getLogger().d(DialADrink.TAG, "Error when migrating guest data to user", e);
                        return false;
                    }
                    return true;
                }
            });
        }
        return success;
    }

}
