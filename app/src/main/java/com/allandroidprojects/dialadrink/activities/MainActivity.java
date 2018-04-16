package com.allandroidprojects.dialadrink.activities;

import android.app.SearchManager;
import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.TabLayout;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.Menu;
import android.view.MenuItem;
import android.view.SearchEvent;
import android.widget.ImageView;
import android.support.v7.widget.SearchView;
import android.widget.TextView;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.fragments.ImageListFragment;
import com.allandroidprojects.dialadrink.model.ProductType;
import com.allandroidprojects.dialadrink.model.User;
import com.allandroidprojects.dialadrink.notification.NotificationCount;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.ProductUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.couchbase.lite.Document;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class MainActivity extends AppCompatActivity
        implements NavigationView.OnNavigationItemSelectedListener {

    static ViewPager viewPager;
    static TabLayout tabLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle =
                new ActionBarDrawerToggle(this, drawer, toolbar,
                    R.string.navigation_drawer_open, R.string.navigation_drawer_close);

        drawer.setDrawerListener(toggle);
        toggle.syncState();

        NavigationView navigationView = (NavigationView) findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);

        final TextView usernameTextView = (TextView)navigationView.getHeaderView(0).findViewById(R.id.user_profile_username_textview);
        final ImageView usernameImageView = (ImageView)navigationView.getHeaderView(0).findViewById(R.id.user_profile_username_imageview);

        viewPager = (ViewPager) findViewById(R.id.viewpager);
        tabLayout = (TabLayout) findViewById(R.id.tabs);

        if (viewPager != null) {
            setupViewPager(viewPager);
            tabLayout.setupWithViewPager(viewPager);
        }

        /*FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
            }
        });*/

        ShoppingUtils.addShoppingCartChangeListener(new LiveQuery.ChangeListener() {
            @Override
            public void changed(final LiveQuery.ChangeEvent event) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        NotificationCount.setBadgeCount("cart", event.getRows().getCount());
                    }
                });
            }
        });

        LiveQuery profileQuery = App.getAppContext().getUserProfilesView()
                .createQuery().toLiveQuery();

        profileQuery.addChangeListener(new LiveQuery.ChangeListener() {
            @Override
            public void changed(LiveQuery.ChangeEvent event) {
                QueryEnumerator it = event.getRows();
                if(it!=null && it.hasNext())
                {
                    Document doc = it.next().getDocument();
                    User user = DataUtils.toObj(doc, User.class);

                    usernameTextView.setText(user.getName());
                    usernameImageView.setImageBitmap(user.getPicture());
                }
            }
        });

        profileQuery.start();
    }

    @Override
    protected void onResume() {
        super.onResume();
        invalidateOptionsMenu();
    }

    @Override
    public void onBackPressed() {
        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        if (drawer.isDrawerOpen(GravityCompat.START)) {
            drawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);

        // Get the notifications MenuItem and its LayerDrawable (layer-list)
        final MenuItem cartMenu = menu.findItem(R.id.action_cart);
        final MenuItem searchMenu = menu.findItem(R.id.action_search);
        if (cartMenu != null)
            NotificationCount.setBadgeCount(cartMenu,"cart", ShoppingUtils.getCartSize());

        if (searchMenu != null) {
            SearchView searchView = (SearchView) searchMenu.getActionView();
            if (searchView != null) {
                //searchView.setIconifiedByDefault(false);
                //searchView.setMaxWidth(Integer.MAX_VALUE);
                //searchItem.setQueryHint("Query Hint");
                searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
                    @Override
                    public boolean onQueryTextSubmit(String query) {
                        Intent intent = new Intent(MainActivity.this, SearchResultActivity.class);
                        intent.setAction(Intent.ACTION_SEARCH);
                        intent.putExtra(SearchManager.QUERY, query);

                        startActivity(intent);
                        return true;
                    }

                    @Override
                    public boolean onQueryTextChange(String s) {
                        return false;
                    }
                });
            }
        }
        return true;
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        // force the ActionBar to relayout its MenuItems.
        // onCreateOptionsMenu(Menu) will be called again.
        //invalidateOptionsMenu();
        return super.onPrepareOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_search) {
            //startActivity(new Intent(MainActivity.this, SearchResultActivity.class));
            //return true;
        } else
        if (id == R.id.action_cart) {
            startActivity(new Intent(MainActivity.this, CartListActivity.class));
            return true;
        } else {
            startActivity(new Intent(MainActivity.this, EmptyActivity.class));
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public boolean onSearchRequested(SearchEvent searchEvent) {
        return super.onSearchRequested(searchEvent);
    }

    private void setupViewPager(ViewPager viewPager) {
        Adapter adapter = new Adapter(getSupportFragmentManager());
        ImageListFragment fragment = new ImageListFragment();
        ArrayList<ProductType> productTypes = ProductUtils.getProductTypes();

        Collections.sort(productTypes, new Comparator<ProductType>() {
            @Override
            public int compare(ProductType a, ProductType b) {
                if(a.getName().startsWith("offer"))
                    return -1;
                else  if(b.getName().startsWith("offer"))
                    return 1;
                else if(a.getName().startsWith("other"))
                    return 1;
                else  if(b.getName().startsWith("other"))
                    return -1;
                else
                    return a.getName().compareTo(b.getName());
            }
        });

        for (ProductType c: productTypes){
            if(c==null)continue;
            fragment = new ImageListFragment();
            Bundle bundle  = new Bundle();
            bundle.putString("category", c.getName());
            fragment.setArguments(bundle);
            adapter.addFragment(fragment, c.getName());
        }

        viewPager.setAdapter(adapter);
    }

    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();

        if (id == R.id.menu_item_offers) {
            viewPager.setCurrentItem(0);
        } else if (id == R.id.menu_item_others) {
            int lastIndex = viewPager.getAdapter().getCount() - 1;
            viewPager.setCurrentItem(lastIndex);
//        } else if (id == R.id.nav_item3) {
//            viewPager.setCurrentItem(2);
//        } else if (id == R.id.nav_item4) {
//            viewPager.setCurrentItem(3);
//        } else if (id == R.id.nav_item5) {
//            viewPager.setCurrentItem(4);
//        } else if (id == R.id.nav_item6) {
//            viewPager.setCurrentItem(5);
        } else if (id == R.id.my_wishlist) {
            startActivity(new Intent(MainActivity.this, WishlistActivity.class));
        } else if (id == R.id.my_cart) {
            startActivity(new Intent(MainActivity.this, CartListActivity.class));
        } else {
            startActivity(new Intent(MainActivity.this, EmptyActivity.class));
        }

        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
        return true;
    }

    static class Adapter extends FragmentPagerAdapter {
        private final List<Fragment> mFragments = new ArrayList<>();
        private final List<String> mFragmentTitles = new ArrayList<>();

        public Adapter(FragmentManager fm) {
            super(fm);
        }

        public void addFragment(Fragment fragment, String title) {
            mFragments.add(fragment);
            mFragmentTitles.add(title);
        }

        @Override
        public Fragment getItem(int position) {
            return mFragments.get(position);
        }

        @Override
        public int getCount() {
            return mFragments.size();
        }

        @Override
        public CharSequence getPageTitle(int position) {
            return mFragmentTitles.get(position);
        }
    }
}
