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
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.adapters.LiveQueryRecyclerAdapter;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.CartItem;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.LoginUtils;
import com.allandroidprojects.dialadrink.utility.ProductUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.couchbase.lite.LiveQuery;
import com.facebook.drawee.view.SimpleDraweeView;

import java.text.DecimalFormat;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.Stream;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

import static com.allandroidprojects.dialadrink.fragments.ImageListFragment.ITEM_POSITION;
import static com.allandroidprojects.dialadrink.fragments.ImageListFragment.ITEM_JSON_DATA;

public class CartListActivity extends AppCompatActivity {
    TextView totalPriceTextView;
    TextView makePaymentTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cart_list);

        //Show cart layout based on items
        setCartLayout();

        LiveQuery query = DataUtils.getView("cartlist_by_user_id", CartItem.Mappers.by_userId)
                .createQuery().toLiveQuery();
        RecyclerView.LayoutManager recylerViewLayoutManager = new LinearLayoutManager(CartListActivity.this);
        RecyclerView recyclerView = (RecyclerView) findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(recylerViewLayoutManager);
        recyclerView.setAdapter(new SimpleCartItemRecyclerViewAdapter(this, query));

        totalPriceTextView = (TextView) findViewById(R.id.priceTextView);
        makePaymentTextView = (TextView) findViewById(R.id.paymentTextView);

        Stream<CartItem> cartItemStream = Linq.stream(ShoppingUtils.getCartListItems());
        final DecimalFormat formatter = new DecimalFormat("#,###,##0.00");
        if (cartItemStream == null || cartItemStream.toList().isEmpty()) {
            totalPriceTextView.setText(formatter.format(0.0));
            setCartLayout(true);
            return;
        }else{
            String currency = cartItemStream.first().getProduct().getCurrency();
            double totalPrice = cartItemStream.sum(new SelectorDouble<CartItem>() {
                @Override
                public Double select(CartItem value) {
                    return value.getTotalPrice();
                }
            });

            totalPriceTextView.setText(currency + " " + formatter.format(totalPrice));
        }

        query.addChangeListener(new LiveQuery.ChangeListener() {
            @Override
            public void changed(LiveQuery.ChangeEvent event) {
                try {
                    final Stream<CartItem> cartItemStream = Linq.stream(ShoppingUtils.getCartListItems());
                    if (cartItemStream == null || cartItemStream.toList().isEmpty()) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                setCartLayout(true);
                                totalPriceTextView.setText(formatter.format(0.0));
                            }
                        });
                    }else{
                        final String currency = cartItemStream.first().getProduct().getCurrency();
                        final double totalPrice = cartItemStream.sum(new SelectorDouble<CartItem>() {
                            @Override
                            public Double select(CartItem value) {
                                return value.getTotalPrice();
                            }
                        });

                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                totalPriceTextView.setText(currency + " " + formatter.format(totalPrice));
                            }
                        });
                    }
                } catch (Exception e) {
                    LogManager.getLogger().d(App.TAG, "Error while updating cart price.", e);
                }

            }
        });

        makePaymentTextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent payIntent = new Intent(CartListActivity.this, EmptyActivity.class);
                if (LoginUtils.isLoggedAsGuest()) {
                    Intent intent = new Intent(CartListActivity.this, LoginActivity.class);
                    intent.putExtra(LoginActivity.NEXT_ACTION_CLASS, payIntent);
                    startActivity(intent);
                } else {
                    startActivity(payIntent);
                }
            }
        });
    }

    public class SimpleCartItemRecyclerViewAdapter
            extends LiveQueryRecyclerAdapter<SimpleCartItemRecyclerViewAdapter.ViewHolder> {

        public SimpleCartItemRecyclerViewAdapter(Context context, LiveQuery query) {
            super(context, query);
        }

        public class ViewHolder extends RecyclerView.ViewHolder {
            public final View mView;
            public final SimpleDraweeView mImageView;
            public final LinearLayout mLayoutItem;
            public final ImageView addImageView, removeImageView;
            public final TextView mPriceTextView, mNameTextView, mDescriptionTextView, mDelivertyMsgTextView, mQtyTextView;

            public ViewHolder(View view) {
                super(view);
                mView = view;
                mImageView = (SimpleDraweeView) view.findViewById(R.id.image_cartlist);
                mLayoutItem = (LinearLayout) view.findViewById(R.id.layout_item_desc);
                addImageView = (ImageView) view.findViewById(R.id.addImageView);
                removeImageView = (ImageView) view.findViewById(R.id.removeImageView);
                mNameTextView = (TextView) view.findViewById(R.id.name_text_cartlist_item);
                mDescriptionTextView = (TextView) view.findViewById(R.id.description_text_cartlist_item);
                mDelivertyMsgTextView = (TextView) view.findViewById(R.id.delivery_msg_text_cartlist_item);
                mQtyTextView = (TextView) view.findViewById(R.id.qty_text_cartlist_item);
                mPriceTextView = (TextView) view.findViewById(R.id.price_text_cartlist_item);
            }
        }

        @Override
        public SimpleCartItemRecyclerViewAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_cartlist_item, parent, false);
            return new SimpleCartItemRecyclerViewAdapter.ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(RecyclerView.ViewHolder vholder, final int position) {
            final SimpleCartItemRecyclerViewAdapter.ViewHolder holder = (SimpleCartItemRecyclerViewAdapter.ViewHolder) vholder;
            final CartItem item = getItem(position, CartItem.class);
            if (item == null)
                return;
            final Uri uri = Uri.parse(item.getProduct().getImageUrl());

            String description = item.getProduct().getCategory();
            if (item.getProduct().getSubCategory() != null)
                description += ", " + item.getProduct().getSubCategory();

            holder.mImageView.setImageURI(uri);
            holder.mNameTextView.setText(item.getProduct().getName());
            holder.mDescriptionTextView.setText(description);
            holder.mDelivertyMsgTextView.setText(item.getProduct().getDescription());
            holder.mQtyTextView.setText(String.valueOf(item.getSize()));
            holder.mPriceTextView.setText(item.getTotalPriceLabel());

            holder.mLayoutItem.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(CartListActivity.this, ProductActivity.class);
                    intent.putExtra(ITEM_JSON_DATA, ProductUtils.getJson(getItem(position, CartItem.class).getProduct()));
                    intent.putExtra(ITEM_POSITION, position);
                    CartListActivity.this.startActivity(intent);
                }
            });

            //Set click action
            holder.removeImageView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    CartItem cartItem = (CartItem) getItem(position, CartItem.class);
                    if (cartItem != null) cartItem.remove();
                    notifyDataSetChanged();
                }
            });

            //Set click action
            holder.addImageView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    CartItem cartItem = (CartItem) getItem(position, CartItem.class);
                    if (cartItem != null) cartItem.add();
                    notifyDataSetChanged();
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

    protected void setCartLayout() {
        setCartLayout(ShoppingUtils.getCartSize() <= 0);
    }

    protected void setCartLayout(Boolean noItems) {
        LinearLayout layoutCartItems = (LinearLayout) findViewById(R.id.layout_items);
        LinearLayout layoutCartPayments = (LinearLayout) findViewById(R.id.paymentLayout);
        LinearLayout layoutCartNoItems = (LinearLayout) findViewById(R.id.emptyCartLayout);

        if (!noItems) {
            layoutCartNoItems.setVisibility(View.GONE);
            layoutCartItems.setVisibility(View.VISIBLE);
            layoutCartPayments.setVisibility(View.VISIBLE);
        } else {
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
