package com.allandroidprojects.dialadrink.activities;

import android.content.Intent;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.fragments.ImageListFragment;
import com.allandroidprojects.dialadrink.fragments.ViewPagerActivity;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.options.CartListActivity;
import com.allandroidprojects.dialadrink.utility.ProductUtil;
import com.allandroidprojects.dialadrink.utility.ShoppingUtil;
import com.facebook.drawee.view.SimpleDraweeView;

public class ProductActivity extends AppCompatActivity {
    Product product;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_item_details);
        SimpleDraweeView mImageView = (SimpleDraweeView)findViewById(R.id.image1);
        TextView textViewAddToCart = (TextView)findViewById(R.id.add_to_card_text_item_details);
        TextView textViewBuyNow = (TextView)findViewById(R.id.buy_now_text_item_details);
        TextView textViewCallUs = (TextView)findViewById(R.id.call_us_text_item_details);

        //Getting image uri from previous screen
        if (getIntent() != null) {
            String json = getIntent().getStringExtra(ImageListFragment.ITEM_JSON_DATA);
            product = ProductUtil.getObject(json, Product.class);
        }

        Uri uri = Uri.parse(product.getImageUrl());
        mImageView.setImageURI(uri);
        mImageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                    Intent intent = new Intent(ProductActivity.this, ViewPagerActivity.class);
                    if(product!=null){
                        int position = getIntent().getIntExtra(ImageListFragment.ITEM_POSITION, 0);
                        intent.putExtra("position", position);
                        intent.putExtra("category", product.getCategory());
                        intent.putExtra("subcategory", product.getSubCategory());
                    }
                    startActivity(intent);
            }
        });

        textViewAddToCart.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ShoppingUtil.addToCart(product);
                Toast.makeText(ProductActivity.this,"Item added to cart.",Toast.LENGTH_SHORT).show();
            }
        });

        textViewBuyNow.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ShoppingUtil.addToCart(product);
                startActivity(new Intent(ProductActivity.this, CartListActivity.class));

            }
        });

    }
}
