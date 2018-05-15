package com.allandroidprojects.dialadrink.activities;

import android.annotation.SuppressLint;
import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
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
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.fragments.ImageListFragment;
import com.allandroidprojects.dialadrink.log.LogManager;
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

public class SearchResultActivity extends AppCompatActivity implements SearchView.OnQueryTextListener, View.OnClickListener {
    SearchView searchView;
    MenuItem searchItem;
    EditText searchEditText;

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

        searchItem = menu.getItem(0);
        searchView = (SearchView) menu.findItem(R.id.action_search).getActionView();
        searchView.setOnClickListener(this);
        searchView.setOnQueryTextListener(this);
        searchView.setFocusable(true);

        searchItem.expandActionView();
        searchItem.setOnActionExpandListener(new MenuItem.OnActionExpandListener() {

            @Override
            public boolean onMenuItemActionExpand(MenuItem item) {
                // Do whatever you need
                return true; // KEEP IT TO TRUE OR IT DOESN'T OPEN !!
            }

            @Override
            public boolean onMenuItemActionCollapse(MenuItem item) {
                SearchResultActivity.this.finish();
                return true; // OR FALSE IF YOU DIDN'T WANT IT TO CLOSE!
            }
        });
        searchEditText = (EditText) searchView.findViewById(android.support.v7.appcompat.R.id.search_src_text);

        return true;
    }

    @Override
    public void onClick(View view) {
        LogManager.getLogger().d(App.TAG, "Clicked" + view.getId());
    }

    @Override
    public boolean onQueryTextSubmit(String query) {
        searchProducts(query);
        return false;
    }

    @Override
    public boolean onQueryTextChange(String s) {
        return false;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        handleIntent(intent);
    }

    @SuppressLint("StaticFieldLeak")
    private void searchProducts(final String queryStr) {
        (new AsyncTask<String, Void, Stream<SearchItem<Product>>>() {
            @Override
            protected void onPreExecute() {
                ProgressBar progressBar = findViewById(R.id.progressBar);
                if (progressBar != null)
                    progressBar.setVisibility(View.VISIBLE);

                super.onPreExecute();
            }

            @Override
            protected void onPostExecute(Stream<SearchItem<Product>> searchItems) {
                if (searchItems == null) return;

                LinearLayout noResultsLayout = findViewById(R.id.noResultLayout);
                ProgressBar progressBar = findViewById(R.id.progressBar);
                RecyclerView recyclerView = findViewById(R.id.recyclerView);

                if (progressBar != null)
                    progressBar.setVisibility(View.GONE);

                if (!searchItems.any()) {
                    noResultsLayout.setVisibility(View.VISIBLE);
                    recyclerView.setVisibility(View.GONE);
                } else {
                    noResultsLayout.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.VISIBLE);

                    RecyclerView.LayoutManager recylerViewLayoutManager = new LinearLayoutManager(SearchResultActivity.this);
                    recyclerView.setLayoutManager(recylerViewLayoutManager);

                    SearchRecyclerViewAdapter adapter = (SearchRecyclerViewAdapter) recyclerView.getAdapter();
                    if (adapter == null)
                        recyclerView.setAdapter(new SearchRecyclerViewAdapter(SearchResultActivity.this, searchItems.toList(), queryStr));
                    else {
                        adapter.searchStr = queryStr;
                        adapter.setSearchItems(searchItems.toList());
                    }
                }
                super.onPostExecute(searchItems);
            }

            @Override
            protected Stream<SearchItem<Product>> doInBackground(String... strings) {
                if (queryStr.length() > 0) {
                    final Stream<SearchItem<Product>> stream = Linq.stream(ProductUtils.getProducts())
                            .select(new Selector<Product, SearchItem<Product>>() {
                                @Override
                                public SearchItem<Product> select(Product value) {
                                    return StringUtils.getSearchItem(value, queryStr, "name", "category", "subcategory", "page");
                                }
                            })
                            .where(new Predicate<SearchItem<Product>>() {
                                @Override
                                public boolean apply(SearchItem<Product> value) {
                                    return value.getFuzzyScore() > 0;
                                }
                            });

                    Stream<SearchItem<Product>> matchedStream = stream.where(new Predicate<SearchItem<Product>>() {
                        @Override
                        public boolean apply(SearchItem<Product> value) {
                            return value.isWordMatched();
                        }
                    });

                    if (matchedStream.any()) {
                        return matchedStream.orderBy(new Selector<SearchItem<Product>, Integer>() {
                            @Override
                            public Integer select(SearchItem<Product> value) {
                                return value.getMatchPosition();
                            }
                        });
                    }

                    Stream<SearchItem<Product>> fuzzyMatchedStream = stream.where(new Predicate<SearchItem<Product>>() {
                        @Override
                        public boolean apply(SearchItem<Product> value) {
                            return value.isWordMatched() || value.getPercentileRank(stream) > 70.0;
                        }
                    }).orderByDescending(new Selector<SearchItem<Product>, Double>() {
                        @Override
                        public Double select(SearchItem<Product> value) {
                            return value.getFuzzyScore();
                        }
                    });

                    return matchedStream.any() ? matchedStream : fuzzyMatchedStream;
                }
                return null;
            }
        }).execute(queryStr);

        if (searchEditText != null)
            searchEditText.setText(queryStr);

        // Check if no view has focus:
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private void handleIntent(Intent intent) {
        if (Intent.ACTION_SEARCH.equals(intent.getAction())) {
            final String queryStr = intent.getStringExtra(SearchManager.QUERY);
            searchProducts(queryStr);
        }
    }

    public class SearchRecyclerViewAdapter extends RecyclerView.Adapter {
        private String searchStr = null;
        private List<SearchItem<Product>> searchItems;

        public SearchRecyclerViewAdapter(Context context, List<SearchItem<Product>> searchItems, String searchStr) {
            this.searchStr = searchStr;
            this.searchItems = searchItems;
        }

        public void setSearchItems(List<SearchItem<Product>> searchItems) {
            this.searchItems = searchItems;
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
        public SearchRecyclerViewAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.viewitem_search, parent, false);
            return new SearchRecyclerViewAdapter.ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(RecyclerView.ViewHolder vholder, final int position) {
            final SearchRecyclerViewAdapter.ViewHolder holder = (SearchRecyclerViewAdapter.ViewHolder) vholder;
            SearchItem<Product> item = searchItems.get(position);
            final Product product = searchItems.get(position).getModel();
            if (product == null)
                return;
            final Uri uri = Uri.parse(product.getImageUrl());

            String description = Html.toHtml(product.getDescription());
            String category = product.getCategory();
            String name = product.getName();

            if(category.equals("Others") && product.getSubcategory() != null)
                category = product.getSubcategory();
            else if (product.getSubcategory() != null)
                category += ", " + product.getSubcategory();

            if (searchStr != null) {
                String highLight = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                        ? "<mark style='background-color:#FFFF00'>%s</mark>"
                        : "<font color='#FFFF00'>%s</font>";

                category = category.replace(searchStr, String.format(highLight, searchStr));
                description = description.replace(searchStr, String.format(highLight, searchStr));
            }

            holder.mImageView.setImageURI(uri);
            holder.mNameTextView.setText(name);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                holder.mCategoryTextView.setText(Html.fromHtml(category, Html.FROM_HTML_MODE_LEGACY));
                holder.mDescriptionTextView.setText(Html.fromHtml(description, Html.FROM_HTML_MODE_LEGACY));
            } else {
                holder.mCategoryTextView.setText(Html.fromHtml(category));
                holder.mDescriptionTextView.setText(Html.fromHtml(description));
            }
            holder.mPriceTextView.setText(product.getPriceLabel());

            holder.mLayoutItem.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(SearchResultActivity.this, ProductActivity.class);
                    String json = ProductUtils.getJson(searchItems.get(position).getModel());
                    intent.putExtra(ImageListFragment.ITEM_JSON_DATA, json);
                    intent.putExtra(ImageListFragment.ITEM_POSITION, position);
                    SearchResultActivity.this.startActivity(intent);
                }
            });
        }

        @Override
        public int getItemCount() {
            return searchItems.size();
        }

        @Override
        public void onViewRecycled(RecyclerView.ViewHolder vholder) {
            super.onViewRecycled(vholder);
            final SearchRecyclerViewAdapter.ViewHolder holder =
                    (SearchRecyclerViewAdapter.ViewHolder) vholder;

            if (holder.mImageView.getController() != null) {
                holder.mImageView.getController().onDetach();
            }
            if (holder.mImageView.getTopLevelDrawable() != null) {
                holder.mImageView.getTopLevelDrawable().setCallback(null);
            }
        }

    }

}
