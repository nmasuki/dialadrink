package com.allandroidprojects.dialadrink.adapters;

import android.app.Activity;
import android.content.Context;
import android.support.v7.widget.RecyclerView;
import android.view.ViewGroup;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Document;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;

/**
 *
 */
public abstract class LiveQueryRecyclerAdapter<T extends RecyclerView.ViewHolder>
        extends RecyclerView.Adapter implements LiveQuery.ChangeListener{
    private LiveQuery query;
    protected QueryEnumerator enumerator;
    private Context context;

    public LiveQueryRecyclerAdapter(Context context, LiveQuery query) {
        this.context = context;
        setLiveQuery(query);
    }

    public void setLiveQuery(LiveQuery liveQuery){
        if(query != null){
            query.stop();
            query.removeChangeListener(this);
        }

        try {
            this.enumerator = liveQuery.run();
        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(App.TAG, "Error", e);
        }

        query = liveQuery;
        query.addChangeListener(this);
        query.start();

    };

    @Override
    public void changed(final LiveQuery.ChangeEvent event) {
        ((Activity) LiveQueryRecyclerAdapter.this.context).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                enumerator = event.getRows();
                notifyDataSetChanged();
            }
        });
    }

    private Document getItem(int position) {
        return enumerator != null ? enumerator.getRow(position).getDocument() : null;
    }

    public <T> T getItem(int position, Class<T> cls){
        return (T) DataUtils.toObj(getItem(position), cls);
    }

    @Override
    public int getItemCount() {
        return enumerator != null ? enumerator.getCount() : 0;
    }

    @Override
    public abstract T onCreateViewHolder(ViewGroup parent, int viewType);

    @Override
    public long getItemId(int i) {
        return enumerator.getRow(i).getSequenceNumber();
    }

    @Override
    public void finalize() {
        if (query != null)
            query.stop();
    }
}
