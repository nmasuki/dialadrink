/*
 * Copyright (C) 2015 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.allandroidprojects.dialadrink.fragments;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.StaggeredGridLayoutManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.activities.ProductActivity;
import com.allandroidprojects.dialadrink.activities.MainActivity;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.adapters.LiveQueryRecyclerAdapter;
import com.allandroidprojects.dialadrink.utility.ProductUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.Query;
import com.facebook.drawee.view.SimpleDraweeView;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;


public class ImageListFragment extends Fragment {

    public static final String ITEM_JSON_DATA = "ItemJsonData";
    public static final String ITEM_POSITION = "ItemPosition";
    private static MainActivity mActivity;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mActivity = (MainActivity) getActivity();
    }

    private Query getQuery(final String category){
        Query query = DataUtils.getView("product_by_category", Product.Mappers.by_category).createQuery();

        query.setDescending(true);
        List<Object> startKeys = new ArrayList<Object>();
        startKeys.add(category); // [category, {}]
        startKeys.add(new HashMap<String, Object>());

        List<Object> endKeys = new ArrayList<Object>();
        endKeys.add(category);

        query.setStartKey(startKeys); //[category, null]
        query.setEndKey(endKeys);

        return query;
    }
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        RecyclerView recyclerView = (RecyclerView) inflater.inflate(R.layout.layout_recylerview_list, container, false);
        setupRecyclerView(recyclerView);

        return recyclerView;
    }

    private void setupRecyclerView(RecyclerView recyclerView) {
        try {
            String category = "offer";
            if(!recyclerView.isInEditMode())
                category  = ImageListFragment.this.getArguments().getString("category");

            StaggeredGridLayoutManager layoutManager = new StaggeredGridLayoutManager(2, StaggeredGridLayoutManager.VERTICAL);
            recyclerView.setLayoutManager(layoutManager);

            recyclerView.setAdapter(new SimpleProductRecyclerViewAdapter(getContext(), getQuery(category).toLiveQuery()));
        }catch (Exception e){
            LogManager.getLogger().d(App.TAG, "Error while setting up RecyclerView.", e);
        }
    }

    public class SimpleProductRecyclerViewAdapter
            extends LiveQueryRecyclerAdapter<SimpleProductRecyclerViewAdapter.ViewHolder> {
        public SimpleProductRecyclerViewAdapter(Context context, LiveQuery query) {
            super(context, query);
        }

        @Override
        public SimpleProductRecyclerViewAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.viewitem_main, parent, false);
            return new SimpleProductRecyclerViewAdapter.ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(final ViewHolder holder, int position) {
            final Product item = getItem(position, Product.class);
            final Uri uri = Uri.parse(item.getImageUrl());

            holder.mImageView.setImageURI(uri);
            holder.mNameTextView.setText(item.getName());
            holder.mDescriptionTextView.setText(item.getCategory());
            holder.mPriceTextView.setText(item.getPriceLabel());

            if(ShoppingUtils.isInWishList(item))
                holder.mImageViewWishlist.setImageResource(R.drawable.ic_favorite_black_18dp);
            else
                holder.mImageViewWishlist.setImageResource(R.drawable.ic_favorite_border_black_18dp);

            if(ShoppingUtils.isInCart(item))
                holder.mImageViewCartlist.setImageResource(R.drawable.ic_shopping_cart_full);
            else
                holder.mImageViewCartlist.setImageResource(R.drawable.ic_shopping_cart_empty);
        }

        public class ViewHolder extends RecyclerView.ViewHolder {
            public final View mView;
            public final SimpleDraweeView mImageView;
            public final LinearLayout mLayoutItem;
            public final ImageView mImageViewCartlist;
            public final ImageView mImageViewWishlist;
            public final TextView mNameTextView;
            public final TextView mDescriptionTextView;
            public final TextView mPriceTextView;

            public ViewHolder(View view) {
                super(view);
                mView = view;

                mImageView = (SimpleDraweeView) view.findViewById(R.id.image_list_item);
                mNameTextView = (TextView)view.findViewById(R.id.name_list_item);
                mDescriptionTextView = (TextView)view.findViewById(R.id.description_list_item);
                mPriceTextView = (TextView)view.findViewById(R.id.price_list_item);

                mLayoutItem = (LinearLayout) view.findViewById(R.id.layout_item);
                mImageViewWishlist = (ImageView) view.findViewById(R.id.ic_wishlist);
                mImageViewCartlist = (ImageView) view.findViewById(R.id.ic_cartlist);

                mLayoutItem.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        Intent intent = new Intent(mActivity, ProductActivity.class);
                        intent.putExtra(ITEM_JSON_DATA, ProductUtils.getJson(getItem()));
                        intent.putExtra(ITEM_POSITION, getPosition());
                        mActivity.startActivity(intent);

                    }
                });

                //Set click action for wishlist
                mImageViewWishlist.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        if(ShoppingUtils.isInWishList(getItem()))
                            ShoppingUtils.removeFromCart(getItem());
                        else
                            ShoppingUtils.addToWishlist(getItem());

                        notifyDataSetChanged();
                        Toast.makeText(mActivity, "Item added to wishlist.", Toast.LENGTH_SHORT).show();
                    }
                });

                //Set click action for cart
                mImageViewCartlist.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        ShoppingUtils.addToCart(getItem());

                        notifyDataSetChanged();
                        Toast.makeText(mActivity, "Item added to cart!", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            public Product getItem(){
                return SimpleProductRecyclerViewAdapter.this.getItem(this.getPosition(), Product.class);
            }
        }
    }
}
