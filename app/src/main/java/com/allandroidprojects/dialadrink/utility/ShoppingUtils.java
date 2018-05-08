package com.allandroidprojects.dialadrink.utility;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.model.Cart;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.model.User;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;
import br.com.zbra.androidlinq.delegate.SelectorInteger;

/**
 * Created by nmasuki on 3/26/2018.
 */

public class ShoppingUtils {
    static ArrayList<Product> wishlistItems = new ArrayList<>();
    static ArrayList<Cart> cartListItems;
    static ArrayList<LiveQuery.ChangeListener> changeListeners = new ArrayList<>();

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

    private static Cart getCartItemByProduct(final Product product) {
        Cart cartItem = Linq.stream(getCartListItems())
                .firstOrDefault(new Predicate<Cart>() {
                    @Override
                    public boolean apply(Cart cart) {
                        return cart.getProduct() != null && cart.getProduct().get_id().equals(product.get_id());
                    }
                }, null);

        if (cartItem == null) {
            cartItem = Cart.fromProduct(product);
            cartListItems.add(cartItem);
            DataUtils.save(cartItem);
        }

        return cartItem;
    }

    public static void addShoppingCartChangeListener(LiveQuery.ChangeListener listener) {
        changeListeners.add(listener);
    }

    public static void removeChangeListener(LiveQuery.ChangeListener listener) {
        changeListeners.remove(listener);
    }

    public static List<Cart> getCartListItems() {
        if (cartListItems == null) {
            LiveQuery liveQuery = DataUtils.getView("cartlist_by_user_id", Cart.Mappers.by_userId)
                    .createQuery().toLiveQuery();

            try {
                QueryEnumerator it = liveQuery.run();
                if (it != null && it.hasNext())
                    cartListItems = new ArrayList<Cart>(Linq.stream(it).select(new Selector<QueryRow, Cart>() {
                        @Override
                        public Cart select(QueryRow value) {
                            return DataUtils.toObj(value.getDocument(), Cart.class);
                        }
                    }).toList());
                else
                    cartListItems = new ArrayList<>();
            } catch (CouchbaseLiteException e) {
                e.printStackTrace();
            }

            liveQuery.addChangeListener(new LiveQuery.ChangeListener() {
                @Override
                public void changed(final LiveQuery.ChangeEvent event) {
                    cartListItems = new ArrayList<Cart>(Linq.stream(event.getRows())
                            .select(new Selector<QueryRow, Cart>() {
                                @Override
                                public Cart select(QueryRow value) {
                                    return DataUtils.toObj(value.getDocument(), Cart.class);
                                }
                            }).toList());

                    for (LiveQuery.ChangeListener listener : changeListeners)
                        listener.changed(event);
                }
            });

            liveQuery.start();
        }

        return cartListItems;
    }

    public static int getCartSize() {
        return Linq.stream(getCartListItems()).sum(new SelectorInteger<Cart>() {
            @Override
            public Integer select(Cart value) {
                return value.getSize();
            }
        });
    }

    public static boolean isInCart(final Product item) {
        Cart matchItem = Linq.stream(getCartListItems()).firstOrDefault(new Predicate<Cart>() {
            @Override
            public boolean apply(Cart value) {
                return value.getProduct().get_id().equals(item.get_id());
            }
        }, null);
        return matchItem != null;
    }

    // Methods for Order
    public static Order getOrder(PaymentMethod method, Map<String, Object> metaData) {
        List<Cart> cartList = getCartListItems();
        Order order = new Order(method, cartList , metaData);
        User user = App.getAppContext().getCurrentUser();
        if(user != null)
            order.setClientName(user.getName());
        return order;
    }

}
