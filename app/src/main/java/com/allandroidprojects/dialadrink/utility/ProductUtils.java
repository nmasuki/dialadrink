package com.allandroidprojects.dialadrink.utility;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.Product;
import com.allandroidprojects.dialadrink.model.ProductType;
import com.couchbase.lite.Document;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
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
        ArrayList<Product> allItems = new ArrayList<>(DataUtils.<Product>getAll("Product")
                .select(new Selector<Document, Product>() {
                    @Override
                    public Product select(Document value) {
                        return DataUtils.toObj(value, Product.class);
                    }
                }).toList());

        if (allItems.size() == 0)
            allItems = new ArrayList<>(getProductsFromJsonAsset());

        return allItems;
    }

    public static ArrayList<Product> getProductsByCategory(final int categoryId) {
        List<Product> allItems = getProducts();

        return new ArrayList<Product>(Linq.stream(allItems).where(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                ProductType type = getProductType(value);
                return (type != null && type.getIndex() == categoryId);
            }
        }).toList());
    }

    public static ArrayList<ProductType> getProductTypes() {
        ArrayList<ProductType> allItems =
                new ArrayList<ProductType>(DataUtils.getAll("ProductType")
                        .select(new Selector<Document, ProductType>() {
                            @Override
                            public ProductType select(Document value) {
                                return DataUtils.toObj(value, ProductType.class);
                            }
                        }).toList());

        if (allItems.size() == 0)
            allItems = new ArrayList<>(getProductTypesFromJsonAsset());

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

    private static ProductType getProductType(Product p) {
        for (ProductType t : getProductTypes()) {
            if (t.getName().equals(p.getCategory()))
                return t;
        }
        return null;
    }

    private static List<ProductType> getProductTypesFromJsonAsset() {
        String json = DataUtils.loadJSONFromAsset("dialadrinkproductstypes.json");
        Type listType = new TypeToken<List<ProductType>>() {
        }.getType();

        // In this test code i just shove the JSON here as string.
        List<ProductType> list = new Gson().fromJson(json, listType);

        for (ProductType p : list) {
            String id = p.getName().toLowerCase()
                    .replaceAll("/[\\W]+/g", "-")
                    .replaceAll("[-]+$", "")
                    .replaceAll("^[-]+", "");

            p.set_id(id);
            //DataUtils.save(p);
        }

        return Linq.stream(list)
                .groupBy(new Selector<ProductType, String>() {
                    @Override
                    public String select(ProductType value) {
                        return value.getName();
                    }
                })
                .select(new Selector<Grouping<String, ProductType>, ProductType>() {
                    @Override
                    public ProductType select(Grouping<String, ProductType> value) {
                        return value.getElements().first();
                    }
                })
                .toList();
    }

    private static List<Product> getProductsFromJsonAsset() {
        String json = DataUtils.loadJSONFromAsset("dialadrinkproducts.json");
        Type listType = new TypeToken<List<Product>>() {
        }.getType();

        // In this test code i just shove the JSON here as string.
        List<Product> list = new Gson().fromJson(json, listType);

        for (Product p : list) {
            String id = p.getName().toLowerCase()
                    .replaceAll("/[\\W]+/g", "-")
                    .replaceAll("[-]+$", "")
                    .replaceAll("^[-]+", "");

            p.set_id(id);
            //DataUtils.save(p);
        }

        return Linq.stream(list).where(new Predicate<Product>() {
            @Override
            public boolean apply(Product value) {
                return value.isValid();
            }
        }).toList();
    }

    private static ArrayList<ProductType> getProductTypesFromProducts(List<Product> products) {
        Set<String> categories = new HashSet<>();
        ArrayList<ProductType> productTypes = new ArrayList<>();

        for (Product p : products)
            if (p.getCategories() != null)
                for (String cat : p.getCategories())
                    categories.add(cat.toLowerCase());
            else if (p.getCategory() != null)
                categories.add(p.getCategory().toLowerCase());

        final int[] i = {0};
        for (final String c : categories) {
            ProductType type = new ProductType();
            String id = c.toLowerCase()
                    .replaceAll("/[\\W]+/g", "-")
                    .replaceAll("[-]+$", "")
                    .replaceAll("^[-]+", "");

            type.set_id(id);

            type.setIndex(i[0]++);
            type.setName(c);

            productTypes.add(type);
        }

        for (ProductType p : productTypes)
            DataUtils.save(p);

        return productTypes;
    }

    /*
    Convert Object to json string
     */
    public static String getJson(Object obj) {
        Gson gson = new Gson();
        String j = gson.toJson(obj);
        return j;
    }

    /**
     * Convert json string to POJO
     *
     * @param json
     * @param <T>
     * @return
     */
    public static <T> T getObject(String json, Class<T> cls) {
        try {
            Gson gson = new Gson();
            T myClass = gson.fromJson(json, cls);
            return (T) myClass;
        } catch (Exception e) {
            LogManager.getLogger().d(App.TAG, "Error while parsing json string.", e);
            return null;
        }
    }


}
