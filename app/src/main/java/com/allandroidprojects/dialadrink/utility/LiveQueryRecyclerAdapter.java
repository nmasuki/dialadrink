package com.allandroidprojects.dialadrink.utility;

import android.app.Activity;
import android.content.Context;
import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;

import com.allandroidprojects.dialadrink.fragments.ImageListFragment;
import com.couchbase.lite.Document;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;

/**
 *
 */
public abstract class LiveQueryRecyclerAdapter<T extends RecyclerView.ViewHolder>
        extends RecyclerView.Adapter {
    private LiveQuery query;
    private QueryEnumerator enumerator;
    private Context context;

    public LiveQueryRecyclerAdapter(Context context, LiveQuery query) {
        this.context = context;
        this.query = query;

        query.addChangeListener(new LiveQuery.ChangeListener() {
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
        });

        query.start();
    }

    public Document getItem(int position) {
        return enumerator != null ? enumerator.getRow(position).getDocument() : null;
    }

    @Override
    public int getItemCount() {
        return enumerator != null ? enumerator.getCount() : 0;
    }

    @Override
    public long getItemId(int i) {
        return enumerator.getRow(i).getSequenceNumber();
    }

    public void invalidate() {
        if (query != null)
            query.stop();
    }
}
