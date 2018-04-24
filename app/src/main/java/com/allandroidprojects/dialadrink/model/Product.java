package com.allandroidprojects.dialadrink.model;

import android.media.Rating;
import android.text.Html;
import android.text.Spanned;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.DataUtils;
import com.allandroidprojects.dialadrink.utility.StringUtils;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.LiveQuery;
import com.couchbase.lite.Mapper;
import com.couchbase.lite.Query;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;
import com.couchbase.lite.support.Range;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.Selector;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

/**
 * Created by nmasuki on 3/23/2018.
 */

public class Product extends BaseModel {
    protected String imageUrl;
    protected String name;
    protected String description;
    protected double price;
    protected String currency;
    protected String category;
    protected ArrayList<String> categories;
    protected String subCategory;
    protected ArrayList<String> altDescriptions;
    protected ArrayList<String> altImages;
    protected transient ArrayList<Rating> ratings;

    public class Rating extends BaseModel {
        protected int score;
        protected String productId;

        public Rating(String userId, int score) {
            this(userId, Product.this.get_id(), score);
        }

        public Rating(String userId, String productId, int score) {
            setScore(score);
            setOwner(userId);
            setProductId(productId);
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(int score) {
            this.score = score;
        }

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }
    }

    public Product() {
        altDescriptions = new ArrayList<>();
        ratings = new ArrayList<>();

        Query query = DataUtils.getView("ratingsByProduct", new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                if ("Rating".equals(document.get("type"))) {
                    List<Object> keys = new ArrayList<Object>();
                    keys.add(document.get("productId"));
                    emitter.emit(keys, document);
                }
            }
        }).createQuery();

        query.setDescending(true);
        query.setStartKey(new Object[]{get_id(), new HashMap<String, Object>()});
        query.setEndKey(new Object[]{get_id()});

        try {
            QueryEnumerator enumerator = query.run();
            if (enumerator != null && enumerator.hasNext()) {
                List<Rating> _ratingsList = Linq.stream(enumerator).select(new Selector<QueryRow, Rating>() {
                    @Override
                    public Rating select(QueryRow value) {
                        return DataUtils.toObj(value.getDocument(), Rating.class);
                    }
                }).toList();
                ratings = new ArrayList<Rating>(_ratingsList);
            }
        } catch (Exception e) {
            LogManager.getLogger().d(App.TAG, "Error running query..", e);
        }

        LiveQuery liveQuery = query.toLiveQuery();
        liveQuery.addChangeListener(new LiveQuery.ChangeListener() {
            @Override
            public void changed(LiveQuery.ChangeEvent event) {
                if (event.getRows() != null)
                    ratings = new ArrayList<Rating>(Linq.stream(event.getRows())
                            .select(new Selector<QueryRow, Rating>() {
                                @Override
                                public Rating select(QueryRow value) {
                                    return DataUtils.toObj(value.getDocument(), Rating.class);
                                }
                            })
                            .toList());
            }
        });

        liveQuery.start();
    }

    public ArrayList<String> getImages() {
        ArrayList<String> allImages = new ArrayList<>();
        allImages.add(getImageUrl());
        if (altImages != null && !altImages.isEmpty())
            allImages.addAll(altImages);
        return allImages;
    }

    public double getAVGRatings() {
        if (ratings.size() == 0 && getCategories() != null) {
            if (getCategories().contains("offer"))
                return 4.5;
            else if (getCategories().contains("whisky"))
                return 4.6;
            else if (getCategories().contains("wine"))
                return 4.3;
            else if (getCategories().contains("vodka"))
                return 4.4;
        } else if (!ratings.isEmpty())
            return Linq.stream(ratings).average(new SelectorDouble<Rating>() {
                @Override
                public Double select(Rating value) {
                    return value.getScore().doubleValue();
                }
            });

        return 4.0;
    }

    public ArrayList<Rating> getRatings() {
        return ratings;
    }

    public Rating getMyRating() {
        return Linq.stream(ratings).firstOrDefault(new Predicate<Rating>() {
            @Override
            public boolean apply(Rating value) {
                return App.getAppContext().getCurrentUserId().equals(value.getOwner());
            }
        }, null);
    }

    public void setRatings(int rating) {
        Rating myRating = getMyRating();
        if (myRating == null)
        {
            myRating = new Rating(App.getAppContext().getCurrentUserId(), rating);
            ratings.add(myRating);
        }

        myRating.setScore(rating);
        DataUtils.saveAsync(myRating);
    }

    public String getSubCategory() {
        return subCategory;
    }

    public void setSubCategory(String subCategory) {
        this.subCategory = subCategory;
    }

    public String getCategory() {
        return StringUtils.toTitleCase(category);
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public ArrayList<String> getCategories() {
        return categories;
    }

    public void setCategories(ArrayList<String> categories) {
        this.categories = categories;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Spanned getDescription() {
        return Html.fromHtml(description != null ? description : "");
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ArrayList<String> getAltDescriptions() {
        return altDescriptions;
    }

    public void setAltDescriptions(ArrayList<String> altDescriptions) {
        this.altDescriptions = altDescriptions;
    }

    public double getPrice() {
        return price;
    }

    public String getPriceLabel() {
        DecimalFormat formatter = new DecimalFormat("#,###,###");
        return getCurrency() + " " + formatter.format(getPrice());
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isValid() {
        return getImageUrl() != null;
    }

    public static class Mappers {
        public static Mapper by_category = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                String type = document.containsKey("type") && document.get("type") != null
                        ? document.get("type").toString().toLowerCase()
                        : null;

                if (type != null && "product".equals(type)) {
                    if (document.containsKey("categories") && document.get("categories") != null) {
                        ArrayList<String> categories = (ArrayList<String>) document.get("categories");
                        for (String cat : categories) {
                            List<Object> keys = new ArrayList<Object>();
                            keys.add(cat);
                            keys.add(document.get("modifiedAt"));
                            emitter.emit(keys, document);
                        }
                    } else {
                        List<Object> keys = new ArrayList<Object>();
                        keys.add(document.get("category"));
                        keys.add(document.get("modifiedAt"));
                        emitter.emit(keys, document);
                    }
                }
            }
        };
        public static Mapper by_price = new Mapper() {
            @Override
            public void map(Map<String, Object> document, Emitter emitter) {
                String type = document.containsKey("type")
                        ? document.get("type").toString().toLowerCase()
                        : "";

                if ("product".equals(type)) {
                    List<Object> keys = new ArrayList<Object>();
                    keys.add(document.get("price"));
                    keys.add(document.get("modifiedAt"));
                    emitter.emit(keys, document);
                }
            }
        };
    }
}
