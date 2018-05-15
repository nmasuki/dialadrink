package com.allandroidprojects.dialadrink.utility;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.content.Intent;
import android.content.IntentFilter;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.Cart;
import com.allandroidprojects.dialadrink.model.Order;
import com.allandroidprojects.dialadrink.model.PaymentMethod;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.model.User;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;
import br.com.zbra.androidlinq.delegate.SelectorInteger;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

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
        Order order = new Order(method, cartList, metaData);
        User user = App.getAppContext().getCurrentUser();
        String regId = PreferenceUtils.getString("regId", null);

        order.set("clientName", getClientName());
        if (regId != null)
            order.set("regId", regId);

        DataUtils.save(order);
        return order;
    }

    private static String getClientName() {
        User user = App.getAppContext().getCurrentUser();
        if (user != null)
            return user.getName();

        AccountManager manager = AccountManager.get(App.getAppContext());
        Account[] accounts = manager.getAccountsByType("com.google");
        List<String> possibleEmails = new LinkedList<String>();

        for (Account account : accounts) {
            // TODO: Check possibleEmail against an email regex or treat
            // account.name as an email address only for certain account.type values.
            possibleEmails.add(account.name);
        }

        if (!possibleEmails.isEmpty() && possibleEmails.get(0) != null) {
            String email = possibleEmails.get(0);
            String[] parts = email.split("@");

            if (parts.length > 1)
                return parts[0];
        }
        return null;
    }

    public static void postOrder(
            Activity activity, Order order,
            final App.Runnable<Map<String, Object>> success,
            final App.Runnable<String> failure) {
        OkHttpClient httpClient = new OkHttpClient();
        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(JSON, DataUtils.toJson(order));
        Request request = new Request.Builder()
                .header("Authorization", "Basic " + LoginUtils.getBasicAuth())
                .url(getServerOrderUrl())
                .post(body)
                .build();

        App.getAppContext().showProgressDialog(activity, "Processing Order '" + order.getOrderNumber() + "'..", true);
        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                LogManager.getLogger().d(App.TAG, "Error while making http call.", e);
                App.getAppContext().hideProgressDialog();
                failure.run("Error while making http call.", e.getMessage());
            }

            @Override
            public void onResponse(Call call, final Response response) throws IOException {
                App.getAppContext().hideProgressDialog();
                if (response.isSuccessful()) {
                    Type type = (new TypeToken<Map<String, Object>>() {
                    }).getType();

                    Map<String, Object> map = new Gson().fromJson(response.body().charStream(), type);
                    success.run(map);
                } else {
                    failure.run(response.body().string());
                }
            }
        });
    }

    private static URL getServerOrderUrl() {
        try {
            return new URL("http://" + DbSync.IP + ":3000/order");
            //return new URL("http://192.168.0.27:3000/order");
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    public static String ORDER_SUCCESS_INTENT_FILTER = App.getAppContext().getPackageName() + "ORDER_SUCCESS_INTENT_FILTER";

    public static void broadCastOrderSuccess(Order order) {
        Intent intent = new Intent(ORDER_SUCCESS_INTENT_FILTER);
        intent.putExtra("orderId", order.get_id());
        App.getAppContext().sendBroadcast(intent);
    }
}
