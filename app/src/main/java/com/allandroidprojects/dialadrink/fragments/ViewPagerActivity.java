/**
 * ****************************************************************************
 * Copyright 2011, 2012 Chris Banes.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * *****************************************************************************
 */
package com.allandroidprojects.dialadrink.fragments;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.model.ProductType;
import com.allandroidprojects.dialadrink.photoview.view.PhotoView;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.ProductUtils;
import com.couchbase.lite.Query;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;

/**
 * Lock/Unlock button is added to the ActionBar.
 * Use it to temporarily disable ViewPager navigation in order to correctly interact with ImageView by gestures.
 * Lock/Unlock state of ViewPager is saved and restored on configuration changes.
 *
 * Julia Zudikova
 */

public class ViewPagerActivity extends Activity {

    private static final String ISLOCKED_ARG = "isLocked";
    private ViewPager mViewPager;
    private int position;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_view_pager);
        mViewPager = (HackyViewPager) findViewById(R.id.view_pager);
        setContentView(mViewPager);

        if (getIntent() != null) {
            List<String> images = Arrays.asList(getIntent().getStringArrayExtra("images"));
            position = getIntent().getIntExtra("position", 0);
            mViewPager.setAdapter(new SamplePagerAdapter(this, images));
            mViewPager.setCurrentItem(position);
        }

        if (savedInstanceState != null) {
            boolean isLocked = savedInstanceState.getBoolean(ISLOCKED_ARG, false);
            ((HackyViewPager) mViewPager).setLocked(isLocked);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) return;
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
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

    private Query getQuery(final int categoryId){
        ProductType productCategory = Linq.stream(ProductUtils.getProductTypes())
                .where(new Predicate<ProductType>() {
                    @Override
                    public boolean apply(ProductType value) {
                        return value.getIndex() == categoryId;
                    }
                }).firstOrDefault(new ProductType() {{
                    setIndex(0);
                    setName("offer");
                }});
        return getQuery(productCategory.getName());
    }

    class SamplePagerAdapter  extends PagerAdapter {
        List<String> images;
        public SamplePagerAdapter(Context context, List<String> images) {
            this.images = new ArrayList<String>(images);
        }

        @Override
        public int getCount() {
            return images.size();
        }

        @Override
        public View instantiateItem(ViewGroup container, int position) {
            PhotoView photoView = new PhotoView(container.getContext());
            photoView.setImageUri(images.get(position));

            // Now just add PhotoView to ViewPager and return it
            container.addView(photoView, LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);

            return photoView;
        }

        @Override
        public void destroyItem(ViewGroup container, int position, Object object) {
            container.removeView((View) object);
        }

        @Override
        public boolean isViewFromObject(View view, Object object) {
            return view == object;
        }

    }

    private boolean isViewPagerActive() {
        return (mViewPager != null && mViewPager instanceof HackyViewPager);
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        if (isViewPagerActive()) {
            outState.putBoolean(ISLOCKED_ARG, ((HackyViewPager) mViewPager).isLocked());
        }
        super.onSaveInstanceState(outState);
    }

}
