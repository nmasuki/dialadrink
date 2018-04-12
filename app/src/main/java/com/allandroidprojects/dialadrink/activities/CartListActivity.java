package com.allandroidprojects.dialadrink.activities;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.adapters.LiveQueryRecyclerAdapter;
import com.allandroidprojects.dialadrink.model.CartItem;
import com.allandroidprojects.dialadrink.utility.DataUtil;
import com.allandroidprojects.dialadrink.utility.ProductUtil;
import com.allandroidprojects.dialadrink.utility.ShoppingUtil;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.Query;
import com.couchbase.lite.QueryEnumerator;
import com.facebook.drawee.view.SimpleDraweeView;

import static com.allandroidprojects.dialadrink.fragments.ImageListFragment.ITEM_POSITION;
import static com.allandroidprojects.dialadrink.fragments.ImageListFragment.ITEM_JSON_DATA;

public class CartListActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cart_list);

        //Show cart layout based on items
        setCartLayout();

        RecyclerView.LayoutManager recylerViewLayoutManager = new LinearLayoutManager(CartListActivity.this);

        Query query = DataUtil.getView("cartlist_by_user_id", CartItem.Mappers.by_userId)
                .createQuery();

        RecyclerView recyclerView = (RecyclerView)CartListActivity.this.findViewById(R.id.recyclerview);
        recyclerView.setLayoutManager(recylerViewLayoutManager);
        recyclerView.setAdapter(new SimpleCartItemRecyclerViewAdapter(this, query.toLiveQuery()));
    }

    public class SimpleCartItemRecyclerViewAdapter
            extends LiveQueryRecyclerAdapter<SimpleCartItemRecyclerViewAdapter.ViewHolder> {
        private QueryEnumerator enumerator;

        public SimpleCartItemRecyclerViewAdapter(Context context, LiveQuery query) {
            super(context, query);
        }

        public class ViewHolder extends RecyclerView.ViewHolder {
            public final View mView;
            public final SimpleDraweeView mImageView;
            public final LinearLayout mLayoutItem, mLayoutRemove , mLayoutEdit;
            public final TextView mPriceTextView, mNameTextView, mDescriptionTextView, mDelivertyMsgTextView, mQtyTextView;

            public ViewHolder(View view) {
                super(view);
                mView = view;
                mImageView = (SimpleDraweeView) view.findViewById(R.id.image_cartlist);
                mLayoutItem = (LinearLayout) view.findViewById(R.id.layout_item_desc);
                mLayoutRemove = (LinearLayout) view.findViewById(R.id.remove_layout_cartlist_item);
                mLayoutEdit = (LinearLayout) view.findViewById(R.id.edit_layout_cartlist_item);
                mNameTextView = (TextView)view.findViewById(R.id.name_text_cartlist_item);
                mDescriptionTextView = (TextView)view.findViewById(R.id.description_text_cartlist_item);
                mDelivertyMsgTextView = (TextView)view.findViewById(R.id.delivery_msg_text_cartlist_item);
                mQtyTextView = (TextView)view.findViewById(R.id.qty_text_cartlist_item);
                mPriceTextView = (TextView)view.findViewById(R.id.price_text_cartlist_item);
            }
        }

        @Override
        public SimpleCartItemRecyclerViewAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_cartlist_item, parent, false);
            return new SimpleCartItemRecyclerViewAdapter.ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(RecyclerView.ViewHolder vholder,final int position) {
            final SimpleCartItemRecyclerViewAdapter.ViewHolder holder = (SimpleCartItemRecyclerViewAdapter.ViewHolder)vholder;
            final CartItem item = getItem(position, CartItem.class);
            if(item == null)
                return;
            final Uri uri = Uri.parse(item.getProduct().getImageUrl());

            String description = item.getProduct().getCategory();
            if(item.getProduct().getSubCategory() != null)
                description += ", " + item.getProduct().getSubCategory();

            holder.mImageView.setImageURI(uri);
            holder.mNameTextView.setText(item.getProduct().getName());
            holder.mDescriptionTextView.setText(description);
            holder.mDelivertyMsgTextView.setText(item.getProduct().getDescription());
            holder.mQtyTextView.setText("Qty: " + item.getSize());
            holder.mPriceTextView.setText(item.getProduct().getPriceLabel());

            holder.mLayoutItem.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(CartListActivity.this, ProductActivity.class);
                    intent.putExtra(ITEM_JSON_DATA, ProductUtil.getJson(getItem(position, CartItem.class)));
                    intent.putExtra(ITEM_POSITION, position);
                    CartListActivity.this.startActivity(intent);
                }
            });

            //Set click action
            holder.mLayoutRemove.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    ((CartItem)getItem(position, CartItem.class)).remove();
                    notifyDataSetChanged();

                }
            });

            //Set click action
            holder.mLayoutEdit.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                }
            });
        }

        @Override
        public void onViewRecycled(RecyclerView.ViewHolder vholder) {
            super.onViewRecycled(vholder);
            final SimpleCartItemRecyclerViewAdapter.ViewHolder holder = (SimpleCartItemRecyclerViewAdapter.ViewHolder) vholder;

            if (holder.mImageView.getController() != null) {
                holder.mImageView.getController().onDetach();
            }
            if (holder.mImageView.getTopLevelDrawable() != null) {
                holder.mImageView.getTopLevelDrawable().setCallback(null);
//                ((BitmapDrawable) holder.mImageView.getTopLevelDrawable()).getBitmap().recycle();
            }
        }
    }

    protected void setCartLayout(){
        LinearLayout layoutCartItems = (LinearLayout) findViewById(R.id.layout_items);
        LinearLayout layoutCartPayments = (LinearLayout) findViewById(R.id.layout_payment);
        LinearLayout layoutCartNoItems = (LinearLayout) findViewById(R.id.layout_cart_empty);

        if(ShoppingUtil.getCartSize() >0){
            layoutCartNoItems.setVisibility(View.GONE);
            layoutCartItems.setVisibility(View.VISIBLE);
            layoutCartPayments.setVisibility(View.VISIBLE);
        }else {
            layoutCartNoItems.setVisibility(View.VISIBLE);
            layoutCartItems.setVisibility(View.GONE);
            layoutCartPayments.setVisibility(View.GONE);

            Button bStartShopping = (Button) findViewById(R.id.bAddNew);
            bStartShopping.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    finish();
                }
            });
        }
    }
}
