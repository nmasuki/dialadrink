package com.allandroidprojects.dialadrink.utility;

import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.model.ProductType;
import com.allandroidprojects.dialadrink.DialADrink;
import com.couchbase.lite.Document;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import br.com.zbra.androidlinq.Grouping;
import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;

public class ProductUtils {

    public static ArrayList<Product> getProducts() {
        ArrayList<Product> allItems = new ArrayList<>(DataUtil.<Product>getAll("Product")
                .select(new Selector<Document, Product>() {
            @Override
            public Product select(Document value) {
                return DataUtil.toObj(value, Product.class);
            }
        }).toList());

        if (allItems.size() == 0)
            allItems = new ArrayList<>(getProductsFromJsonAsset());

        return allItems;
    }

    public static ArrayList<Product> getProductsByCategory(final int categoryId){
        List<Product> allItems = getProducts();

        return new ArrayList<Product> (Linq.stream(allItems).where(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                ProductType type = getProductType(value);
                return (type!=null && type.getId() == categoryId);
            }
        }).toList());
    }

    public static ArrayList<ProductType> getProductTypes() {
        ArrayList<ProductType> allItems =
                new ArrayList<ProductType>(DataUtil.getAll("ProductType")
                        .select(new Selector<Document, ProductType>() {
                            @Override
                            public ProductType select(Document value) {
                                return DataUtil.toObj(value, ProductType.class);
                            }
                        }).toList());

        if (allItems.size() == 0)
            allItems = getProductTypesFromProducts(getProducts());

        return new ArrayList<ProductType>(Linq.stream(allItems)
                .groupBy(new Selector<ProductType, Object>() {
                    @Override
                    public Object select(ProductType value) {
                        return value.getName();
                    }
                }).select(new Selector<Grouping<Object, ProductType>, ProductType>() {
                    @Override
                    public ProductType select(Grouping<Object, ProductType> value) {
                        return value.getElements().firstOrDefault(null);
                    }
                }).toList());
    }

    private static ProductType getProductType(Product p){
        for (ProductType t : getProductTypes()) {
            if(t.getName().equals(p.getCategory()))
                return t;
        }
        return null;
    }

    private static List<Product> getProductsFromJsonAsset(){
        String json = loadJSONFromAsset("dialadrinkproducts.json");
        Type listType = new TypeToken<List<Product>>(){}.getType();

        // In this test code i just shove the JSON here as string.
        List<Product> list = new Gson().fromJson(json, listType);

        for (Product p :list)
        {
            p.set_id(md5(p.getImageUrl()));
            DataUtil.save(p);
        }

        return Linq.stream(list).where(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                return value.isValid();
            }
        }).toList();
    }

    private static ArrayList<ProductType> getProductTypesFromProducts(List<Product>products){
        Set<String> categories = new HashSet<>();
        ArrayList<ProductType> productTypes = new ArrayList<>();

        for (Product p : products)
            if(p.getCategory()!=null)
                categories.add(p.getCategory().toLowerCase());

        final int[] i = {0};
        for (final String c: categories) {
            ProductType type = new ProductType();
            type.setId(i[0]++);
            type.setName(c);

            productTypes.add(type);
        }

        for (ProductType p :productTypes)
            DataUtil.save(p);

        return productTypes;
    }

    /*
    Convert Object to json string
     */
    public static String getJson(Object obj){
        Gson gson = new Gson();
        String j = gson.toJson(obj);
        return j;
    }

    /**
     * Convert json string to POJO
     * @param json
     * @param <T>
     * @return
     */
    public static <T> T getObject(String json, Class<T> cls){
        try {
            Gson gson = new Gson();
            T myClass = gson.fromJson(json, cls);
            return (T)myClass;
        } catch (Exception e) {
            LogManager.getLogger().d(DialADrink.TAG, "Error while parsing json string.", e);
            return null;
        }
    }

    private static String loadJSONFromAsset(String fileName) {
        String json = null;
        try {
            InputStream is = DialADrink.getAppContext().getAssets().open(fileName);
            int size = is.available();
            byte[] buffer = new byte[size];
            is.read(buffer);
            is.close();
            json = new String(buffer, "UTF-8");
        } catch (IOException ex) {
            ex.printStackTrace();
            return null;
        }
        return json;
    }

    public static final String md5(final String s) {
        final String MD5 = "MD5";
        try {
            // Create MD5 Hash
            MessageDigest digest = java.security.MessageDigest
                    .getInstance(MD5);
            digest.update(s.getBytes());
            byte messageDigest[] = digest.digest();

            // Create Hex String
            StringBuilder hexString = new StringBuilder();
            for (byte aMessageDigest : messageDigest) {
                String h = Integer.toHexString(0xFF & aMessageDigest);
                while (h.length() < 2)
                    h = "0" + h;
                hexString.append(h);
            }
            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            LogManager.getLogger().d(DialADrink.TAG, e.getMessage());
        }
        return "";
    }
}
