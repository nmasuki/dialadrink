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
        SimpleDraweeView mImageView = (SimpleDraweeView) findViewById(R.id.productImageView);
        TextView textViewAddToCart = (TextView) findViewById(R.id.addToCardTextView);
        TextView textViewBuyNow = (TextView) findViewById(R.id.buyNowTextView);
        TextView textViewCallUs = (TextView) findViewById(R.id.callUsTextView);
        TextView textViewDetails = (TextView) findViewById(R.id.detailsTextView);
        TextView textViewName = (TextView) findViewById(R.id.nameTextView);
        TextView textViewPrice = (TextView) findViewById(R.id.priceTextView);
        TextView textViewCategory = (TextView) findViewById(R.id.categoryTextView);
        LinearLayout shareListLayout = findViewById(R.id.shareLayout);
        LinearLayout findSimilarListLayout = findViewById(R.id.similarItemsLayout);
        LinearLayout wishListLayout = findViewById(R.id.wishlistLayout);


        ratings_1 = (ImageView) findViewById(R.id.rating1ImageView);
        ratings_2 = (ImageView) findViewById(R.id.rating2ImageView);
        ratings_3 = (ImageView) findViewById(R.id.rating3ImageView);
        ratings_4 = (ImageView) findViewById(R.id.rating4ImageView);
        ratings_5 = (ImageView) findViewById(R.id.rating5ImageView);

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
        TextView ratingTextView = findViewById(R.id.ratingsTextView);
        TextView ratingsDetails = findViewById(R.id.ratingCountTextView);
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
            case R.id.rating1ImageView:
                product.setRatings(1);
                updateRatingView();
                break;
            case R.id.rating2ImageView:
                product.setRatings(2);
                updateRatingView();
                break;
            case R.id.rating3ImageView:
                product.setRatings(3);
                updateRatingView();
                break;
            case R.id.rating4ImageView:
                product.setRatings(4);
                updateRatingView();
                break;
            case R.id.rating5ImageView:
                product.setRatings(5);
                updateRatingView();
                break;
            case R.id.shareLayout:
                //ShoppingUtils.addToWishlist(product);
                break;
            case R.id.similarItemsLayout:
                //ShoppingUtils.addToWishlist(product);
                break;
            case R.id.wishlistLayout:
                ShoppingUtils.addToWishlist(product);
                break;
            case R.id.addToCardTextView:
                ShoppingUtils.addToCart(product);
                Toast.makeText(ProductActivity.this, "Item added to cart.", Toast.LENGTH_SHORT).show();
                break;
            case R.id.buyNowTextView:
                ShoppingUtils.addToCart(product);
                startActivity(new Intent(ProductActivity.this, CartListActivity.class));
                break;
            case R.id.callUsTextView:
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
            case R.id.productImageView:
                Intent intent = new Intent(ProductActivity.this, ViewPagerActivity.class);
                if (product != null) {
                    String[] images = product.getImages().toArray(new String[product.getImages().size()]);
                    int position = product.getImages().indexOf(product.getImageUrl());
                    intent.putExtra("position", position);
                    intent.putExtra("images", images);
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
