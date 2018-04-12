package com.allandroidprojects.dialadrink.utility;

import com.allandroidprojects.dialadrink.model.CartItem;
import com.allandroidprojects.dialadrink.model.Product;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;

import java.util.ArrayList;
import java.util.List;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;
import br.com.zbra.androidlinq.delegate.SelectorInteger;

/**
 * Created by nmasuki on 3/26/2018.
 */

public class ShoppingUtils {
    static ArrayList<Product> wishlistItems = new ArrayList<>();
    static QueryEnumerator cartListItems;

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

    public static ArrayList<Product> getWishlistItems() {
        return wishlistItems;
    }

    public static boolean isInWishList(final Product item) {
        return Linq.stream(getWishlistItems()).any(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                return value.get_id().equals(item.get_id());
            }
        });
    }

    // Methods for Cart
    public static void addToCart(Product item) {
        getCartItemByProduct(item).add();
    }

    public static void removeFromCart(final Product item) {
        getCartItemByProduct(item).remove();
    }

    private static CartItem getCartItemByProduct(final Product product) {
        CartItem cartItem = Linq.stream(getCartListItems())
                .firstOrDefault(new Predicate<CartItem>() {
                    @Override
                    public boolean apply(CartItem cart) {
                        return cart.get_id().equals(product.get_id());
                    }
                }, null);

        if (cartItem == null) {
            cartItem = CartItem.fromProduct(product);
            DataUtil.save(cartItem);
        }

        return cartItem;
    }

    static ArrayList<LiveQuery.ChangeListener> changeListeners = new ArrayList<>();
    public static void addChangeListener(LiveQuery.ChangeListener listener){
        changeListeners.add(listener);
    }

    public static void removeChangeListener(LiveQuery.ChangeListener listener){
        changeListeners.remove(listener);
    }

    public static List<CartItem> getCartListItems() {
        if (cartListItems == null) {
            LiveQuery query = DataUtil.getView("cartlist_by_user_id", CartItem.Mappers.by_userId)
                    .createQuery().toLiveQuery();

            query.addChangeListener(new LiveQuery.ChangeListener() {
                @Override
                public void changed(final LiveQuery.ChangeEvent event) {
                    cartListItems = event.getRows();
                    for (LiveQuery.ChangeListener listener: changeListeners)
                        listener.changed(event);
                }
            });

            query.start();
        }

        return cartListItems != null? Linq.stream(cartListItems).select(new Selector<QueryRow, CartItem>() {
            @Override
            public CartItem select(QueryRow value) {
                return DataUtil.toObj(value.getDocument(), CartItem.class);
            }
        }).toList() : new ArrayList<CartItem>();
    }

    public static int getCartSize() {
        return Linq.stream(getCartListItems()).sum(new SelectorInteger<CartItem>() {
            @Override
            public Integer select(CartItem value) {
                return value.getSize();
            }
        });
    }

    public static boolean isInCart(final Product item) {
        CartItem matchItem =  Linq.stream(getCartListItems()).firstOrDefault(new Predicate<CartItem>() {
            @Override
            public boolean apply(CartItem value) {
                return value.getProduct().get_id().equals(item.get_id());
            }
        }, null);
        return matchItem != null;
    }
}
