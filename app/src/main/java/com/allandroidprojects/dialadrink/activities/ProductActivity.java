package com.allandroidprojects.dialadrink.activities;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.fragments.ImageListFragment;
import com.allandroidprojects.dialadrink.fragments.ViewPagerActivity;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.utility.ProductUtils;
import com.allandroidprojects.dialadrink.utility.ShoppingUtils;
import com.facebook.drawee.view.SimpleDraweeView;

public class ProductActivity extends AppCompatActivity implements View.OnClickListener {
    Product product;
    private final int REQUEST_CALL_PHONE_PERMISSION = 1;
    ImageView ratings_1, ratings_2, ratings_3, ratings_4, ratings_5;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_item_details);
        SimpleDraweeView mImageView = (SimpleDraweeView) findViewById(R.id.image1);
        TextView textViewAddToCart = (TextView) findViewById(R.id.add_to_card_text_item_details);
        TextView textViewBuyNow = (TextView) findViewById(R.id.buy_now_text_item_details);
        TextView textViewCallUs = (TextView) findViewById(R.id.call_us_text_item_details);
        TextView textViewDetails = (TextView) findViewById(R.id.details_activity_item_details_textView);
        TextView textViewName = (TextView) findViewById(R.id.name_activity_item_details_textView);
        TextView textViewPrice = (TextView) findViewById(R.id.price_activity_item_details_textView);
        TextView textViewCategory = (TextView) findViewById(R.id.category_activity_item_details_textView);
        LinearLayout shareListLayout = findViewById(R.id.share_layout_cartlist_item);
        LinearLayout findSimilarListLayout = findViewById(R.id.similar_layout_cartlist_item);
        LinearLayout wishListLayout = findViewById(R.id.wishlist_layout_activity_item);


        ratings_1 = (ImageView) findViewById(R.id.product_rating_1);
        ratings_2 = (ImageView) findViewById(R.id.product_rating_2);
        ratings_3 = (ImageView) findViewById(R.id.product_rating_3);
        ratings_4 = (ImageView) findViewById(R.id.product_rating_4);
        ratings_5 = (ImageView) findViewById(R.id.product_rating_5);

        ratings_1.setOnClickListener(this);
        ratings_2.setOnClickListener(this);
        ratings_3.setOnClickListener(this);
        ratings_4.setOnClickListener(this);
        ratings_5.setOnClickListener(this);

        textViewAddToCart.setOnClickListener(this);
        textViewBuyNow.setOnClickListener(this);
        textViewCallUs.setOnClickListener(this);
        mImageView.setOnClickListener(this);

        shareListLayout.setOnClickListener(this);
        findSimilarListLayout.setOnClickListener(this);
        wishListLayout.setOnClickListener(this);

        //Getting image uri from previous screen
        if (getIntent() != null) {
            String json = getIntent().getStringExtra(ImageListFragment.ITEM_JSON_DATA);
            product = ProductUtils.getObject(json, Product.class);

            if(product.getImageUrl()!=null)
                mImageView.setImageURI(Uri.parse(product.getImageUrl()));

            textViewDetails.setText(product.getDescription());
            textViewName.setText(product.getName());
            textViewPrice.setText(product.getPriceLabel());
            textViewCategory.setText(product.getCategory());
            updateRatingView();
        }
    }

    private void updateRatingView() {
        Double ratings = product.getAVGRatings();
        TextView ratingTextView = findViewById(R.id.ratings_activity_item_details_textView);
        TextView ratingsDetails = findViewById(R.id.ratings_count__activity_item_details_textView);
        ImageView wishListIcon = findViewById(R.id.add_to_wishlist_icon);

        ratingTextView.setText(String.format("%.1f *", ratings));
        if(product.getRatings()!=null && product.getRatings().size() > 0)
            ratingsDetails.setText(String.format("%d ratings", product.getRatings().size()));
        else
            ratingsDetails.setText("");

        if(ShoppingUtils.isInWishList(product))
            wishListIcon.setImageDrawable(getResources().getDrawable(R.drawable.ic_favorite_black_18dp));
        else
            wishListIcon.setImageDrawable(getResources().getDrawable(R.drawable.ic_favorite_border_black_18dp));

        Product.Rating myRating = product.getMyRating();
        if(myRating!=null) {
            Drawable star = getResources().getDrawable(R.drawable.rating_star);
            Drawable grayStar = getResources().getDrawable(R.drawable.rating_star_gray);
            ratings_1.setImageDrawable(myRating.getScore() > 0 ? star : grayStar);
            ratings_2.setImageDrawable(myRating.getScore() > 1 ? star : grayStar);
            ratings_3.setImageDrawable(myRating.getScore() > 2 ? star : grayStar);
            ratings_4.setImageDrawable(myRating.getScore() > 3 ? star : grayStar);
            ratings_5.setImageDrawable(myRating.getScore() > 4 ? star : grayStar);
        }

    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.product_rating_1:
                product.setRatings(1);
                updateRatingView();
                break;
            case R.id.product_rating_2:
                product.setRatings(2);
                updateRatingView();
                break;
            case R.id.product_rating_3:
                product.setRatings(3);
                updateRatingView();
                break;
            case R.id.product_rating_4:
                product.setRatings(4);
                updateRatingView();
                break;
            case R.id.product_rating_5:
                product.setRatings(5);
                updateRatingView();
                break;
            case R.id.share_layout_cartlist_item:
                //ShoppingUtils.addToWishlist(product);
                break;
            case R.id.similar_layout_cartlist_item:
                //ShoppingUtils.addToWishlist(product);
                break;
            case R.id.wishlist_layout_activity_item:
                ShoppingUtils.addToWishlist(product);
                break;
            case R.id.add_to_card_text_item_details:
                ShoppingUtils.addToCart(product);
                Toast.makeText(ProductActivity.this, "Item added to cart.", Toast.LENGTH_SHORT).show();
                break;
            case R.id.buy_now_text_item_details:
                ShoppingUtils.addToCart(product);
                startActivity(new Intent(ProductActivity.this, CartListActivity.class));
                break;
            case R.id.call_us_text_item_details:
                ShoppingUtils.addToCart(product);
                if (ActivityCompat.checkSelfPermission(ProductActivity.this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(ProductActivity.this,
                            new String[]{Manifest.permission.CALL_PHONE},
                            REQUEST_CALL_PHONE_PERMISSION);
                } else {
                    Intent intent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + getString(R.string.callus_number)));
                    ProductActivity.this.startActivity(intent);
                }
                break;
            case R.id.image1:
                Intent intent = new Intent(ProductActivity.this, ViewPagerActivity.class);
                if (product != null) {
                    int position = getIntent().getIntExtra(ImageListFragment.ITEM_POSITION, 0);
                    intent.putExtra("position", position);
                    intent.putExtra("category", product.getCategory());
                    intent.putExtra("subcategory", product.getSubCategory());
                    intent.putExtra("subcategory", product.getSubCategory());
                }
                startActivity(intent);
                break;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_CALL_PHONE_PERMISSION) {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) ==
                    PackageManager.PERMISSION_GRANTED) {
                Intent intent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + getString(R.string.callus_number)));
                ProductActivity.this.startActivity(intent);
            }
        }

    }

}
