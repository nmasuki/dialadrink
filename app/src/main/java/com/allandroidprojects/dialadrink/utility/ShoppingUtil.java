package com.allandroidprojects.dialadrink.utility;

import android.app.Application;
import android.content.Intent;
import android.support.v4.content.LocalBroadcastManager;

import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.notification.NotificationCountSetClass;

import java.util.ArrayList;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;

/**
 * Created by nmasuki on 3/26/2018.
 */

public class ShoppingUtil {
    static ArrayList<Product> wishlistItems = new ArrayList<>();
    static ArrayList<Product> cartListItems = new ArrayList<>();

    // Methods for Wishlist
    public static void addToWishlist(Product item) {
        wishlistItems.add(0, item);
    }

    public static void removeFromWishlist(final Product item) {
        for (int i = 0; i < wishlistItems.size(); i++) {
            Product p = wishlistItems.get(i);
            if (p.get_id().equals(item.get_id())) {
                wishlistItems.remove(i);
            }
        }
    }

    public static ArrayList<Product> getWishlistItems(){ return wishlistItems; }

    public static boolean isInWishList(final Product item){
        return Linq.stream(wishlistItems).any(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                return value.get_id().equals(item.get_id());
            }
        });
    }

    // Methods for Cart
    public static void addToCart(Product item, Application app) {
        cartListItems.add(item);
        Intent in = new Intent();
        in.putExtra("cartItemCount", getCartListItems().size());
        LocalBroadcastManager.getInstance(app).sendBroadcast(in);
    }

    public static void removeFromCart(final Product item) {
        for (int i = 0; i < cartListItems.size(); i++) {
            Product p = cartListItems.get(i);
            if (p.get_id().equals(item.get_id())) {
                cartListItems.remove(i);
            }
        }
    }

    public static ArrayList<Product> getCartListItems(){ return cartListItems; }

    public static boolean isInCart(final Product item){
        return Linq.stream(cartListItems).any(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                return value.get_id().equals(item.get_id());
            }
        });
    }
}
