package com.allandroidprojects.dialadrink.adapters;

import android.app.Activity;
import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;

import com.allandroidprojects.dialadrink.App;
import com.couchbase.lite.Document;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;

public class LiveQueryBaseAdapter extends BaseAdapter {
    protected LiveQuery query;
    protected QueryEnumerator enumerator;
    protected Context context;

    public LiveQueryBaseAdapter(Context context, LiveQuery query) {
        this.context = context;
        this.query = query;

        query.addChangeListener(new LiveQuery.ChangeListener() {
            @Override
            public void changed(final LiveQuery.ChangeEvent event) {
                App.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        enumerator = event.getRows();
                        notifyDataSetChanged();
                    }
                });
            }
        });
        query.start();
    }

    @Override
    public int getCount() {
        return enumerator != null ? enumerator.getCount() : 0;
    }

    @Override
    public Document getItem(int i) {
        return enumerator != null ? enumerator.getRow(i).getDocument() : null;
    }

    @Override
    public long getItemId(int i) {
        return enumerator.getRow(i).getSequenceNumber();
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        return convertView;
    }

    @Override
    public void finalize() {
        if (query != null)
            query.stop();
    }
}
