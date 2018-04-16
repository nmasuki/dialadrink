package com.allandroidprojects.dialadrink.activities;

import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.text.Html;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.support.v7.widget.SearchView;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.fragments.ImageListFragment;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.model.SearchItem;
import com.allandroidprojects.dialadrink.utility.ProductUtils;
import com.allandroidprojects.dialadrink.utility.StringUtils;
import com.facebook.drawee.view.SimpleDraweeView;

import java.util.List;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.Stream;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

public class SearchResultActivity extends AppCompatActivity {
    SearchView searchView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_result);
        handleIntent(getIntent());
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        // Inflate menu to add items to action bar if it is present.
        inflater.inflate(R.menu.search_menu, menu);
        MenuItem searchItem = menu.getItem(0);
        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) getSystemService(Context.SEARCH_SERVICE);
        searchView = (SearchView) menu.findItem(R.id.action_search).getActionView();
        searchView.setSearchableInfo(searchManager.getSearchableInfo(getComponentName()));
        searchView.setFocusable(true);
        searchItem.expandActionView();

        if (searchView != null) {
            //searchView.setIconifiedByDefault(false);
            //searchView.setMaxWidth(Integer.MAX_VALUE);
            //searchItem.setQueryHint("Query Hint");
            searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
                @Override
                public boolean onQueryTextSubmit(String query) {
                    searchProducts(query);
                    return false;
                }

                @Override
                public boolean onQueryTextChange(String s) {
                    return false;
                }
            });
        }

        return true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        handleIntent(intent);
    }

    private void searchProducts(final String queryStr){
        if (queryStr.length() > 0) {
            Stream<SearchItem<Product>> stream = Linq.stream(ProductUtils.getProducts())
                    .select(new Selector<Product, SearchItem<Product>>() {
                        @Override
                        public SearchItem<Product> select(Product value) {
                            return StringUtils.getSearchItem(value, queryStr, "name", "category", "categories", "description");
                        }
                    }).where(new Predicate<SearchItem<Product>>() {
                        @Override
                        public boolean apply(SearchItem<Product> value) {
                            return value.getMatchScore() > 0;
                        }
                    });

            final Double avgScore = stream.average(new SelectorDouble<SearchItem<Product>>() {
                @Override
                public Double select(SearchItem<Product> value) {
                    return value.getMatchScore();
                }
            });

            stream = stream.where(new Predicate<SearchItem<Product>>() {
                @Override
                public boolean apply(SearchItem<Product> value) {
                    return value.getMatchScore() >= avgScore;
                }
            });

            List<Product> products = stream
                    .orderByDescending(new Selector<SearchItem<Product>, Double>() {
                        @Override
                        public Double select(SearchItem<Product> value) {
                            return value.getMatchScore();
                        }
                    })
                    .take(10)
                    .select(new Selector<SearchItem<Product>, Product>() {
                        @Override
                        public Product select(SearchItem<Product> value) {
                            return value.getModel();
                        }
                    })
                    .toList();

            RecyclerView.LayoutManager recylerViewLayoutManager = new LinearLayoutManager(SearchResultActivity.this);
            RecyclerView recyclerView = findViewById(R.id.recyclerview);
            recyclerView.setLayoutManager(recylerViewLayoutManager);

            SimpleCartItemRecyclerViewAdapter adapter = (SimpleCartItemRecyclerViewAdapter) recyclerView.getAdapter();
            if (adapter == null)
                recyclerView.setAdapter(new SimpleCartItemRecyclerViewAdapter(this, products, queryStr));
            else {
                adapter.searchStr = queryStr;
                adapter.setProducts(products);
            }

            // Check if no view has focus:
            View view = this.getCurrentFocus();
            if (view != null) {
                InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
            }
        }
    }

    private void handleIntent(Intent intent) {
        if (Intent.ACTION_SEARCH.equals(intent.getAction())) {
            final String queryStr = intent.getStringExtra(SearchManager.QUERY);
            searchProducts(queryStr);
        }
    }

    public class SimpleCartItemRecyclerViewAdapter extends RecyclerView.Adapter {
        private String searchStr = null;
        private List<Product> products;

        public SimpleCartItemRecyclerViewAdapter(Context context, List<Product> products, String searchStr) {
            this.searchStr = searchStr;
            this.products = products;
        }

        public void setProducts(List<Product> products) {
            this.products = products;
            notifyDataSetChanged();
        }

        public class ViewHolder extends RecyclerView.ViewHolder {
            public final View mView;
            public final SimpleDraweeView mImageView;
            public final LinearLayout mLayoutItem;
            public final TextView mPriceTextView, mNameTextView, mCategoryTextView, mDescriptionTextView;

            public ViewHolder(View view) {
                super(view);
                mView = view;
                mImageView = (SimpleDraweeView) view.findViewById(R.id.image_cartlist);
                mLayoutItem = (LinearLayout) view.findViewById(R.id.search_item_layout);
                mNameTextView = (TextView) view.findViewById(R.id.name_textView);
                mCategoryTextView = (TextView) view.findViewById(R.id.category_textView);
                mDescriptionTextView = (TextView) view.findViewById(R.id.description_textView);
                mPriceTextView = (TextView) view.findViewById(R.id.price_textView);
            }
        }

        @Override
        public SearchResultActivity.SimpleCartItemRecyclerViewAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_search_item, parent, false);
            return new SearchResultActivity.SimpleCartItemRecyclerViewAdapter.ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(RecyclerView.ViewHolder vholder, final int position) {
            final SearchResultActivity.SimpleCartItemRecyclerViewAdapter.ViewHolder holder = (SearchResultActivity.SimpleCartItemRecyclerViewAdapter.ViewHolder) vholder;
            final Product item = products.get(position);
            if (item == null)
                return;
            final Uri uri = Uri.parse(item.getImageUrl());

            String description = Html.toHtml(item.getDescription());
            String category = item.getCategory();
            if (item.getSubCategory() != null)
                category += ", " + item.getSubCategory();

            if (searchStr != null) {
                category = category.replace(searchStr, String.format("<mark style='background-color:#FFFF00'>%s</mark>", searchStr));
                description = description.replace(searchStr, String.format("<mark style='background-color:#FFFF00'>%s</mark>", searchStr));
            }

            holder.mImageView.setImageURI(uri);
            holder.mNameTextView.setText(item.getName());
            holder.mCategoryTextView.setText(Html.fromHtml(category));
            holder.mDescriptionTextView.setText(Html.fromHtml(description));
            holder.mPriceTextView.setText(item.getPriceLabel());

            holder.mLayoutItem.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(SearchResultActivity.this, ProductActivity.class);
                    String json = ProductUtils.getJson(products.get(position));
                    intent.putExtra(ImageListFragment.ITEM_JSON_DATA, json);
                    intent.putExtra(ImageListFragment.ITEM_POSITION, position);
                    SearchResultActivity.this.startActivity(intent);
                }
            });
        }

        @Override
        public int getItemCount() {
            return products.size();
        }

        @Override
        public void onViewRecycled(RecyclerView.ViewHolder vholder) {
            super.onViewRecycled(vholder);
            final SearchResultActivity.SimpleCartItemRecyclerViewAdapter.ViewHolder holder =
                    (SearchResultActivity.SimpleCartItemRecyclerViewAdapter.ViewHolder) vholder;

            if (holder.mImageView.getController() != null) {
                holder.mImageView.getController().onDetach();
            }
            if (holder.mImageView.getTopLevelDrawable() != null) {
                holder.mImageView.getTopLevelDrawable().setCallback(null);
            }
        }

    }

}
