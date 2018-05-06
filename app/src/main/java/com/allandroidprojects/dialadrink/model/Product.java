package com.allandroidprojects.dialadrink.model;

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

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    protected String page;
    protected String description;
    protected double price;
    protected String currency;
    protected String category;
    protected String subcategory;
    protected ArrayList<String> categories;
    protected ArrayList<String> altImages;
    protected transient ArrayList<String> altDescriptions;
    protected transient ArrayList<Rating> ratings;

    public class Rating extends BaseModel {
        protected int score;
        protected String ratedBy;
        protected String productId;

        public Rating(int score){
            this(App.getAppContext().getCurrentUserId(), score);
        }
        public Rating(String ratedBy, int score) {
            this(ratedBy, Product.this.get_id(), score);
        }

        public Rating(String ratedBy, String productId, int score) {
            setOwner("none");
            setRatedBy(ratedBy);
            setProductId(productId);
            setScore(score);
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

        public String getRatedBy() {
            return ratedBy;
        }

        public void setRatedBy(String ratedBy) {
            this.ratedBy = ratedBy;
        }
    }

    public Product() {
        altDescriptions = new ArrayList<>();
        ratings = null;
    }

    private Query getRatingsQuery() {
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

        return query;
    }

    public ArrayList<String> getImages() {
        ArrayList<String> allImages = new ArrayList<>();
        allImages.add(getImageUrl());
        if (altImages != null && !altImages.isEmpty())
            allImages.addAll(altImages);
        return allImages;
    }

    public double getAVGRatings() {
        if (getRatings().size() == 0 && getCategories() != null) {
            if (getCategories().contains("offer"))
                return 4.5;
            else if (getCategories().contains("whisky"))
                return 4.6;
            else if (getCategories().contains("wine"))
                return 4.3;
            else if (getCategories().contains("vodka"))
                return 4.4;
        } else if (!getRatings().isEmpty())
            return Linq.stream(getRatings()).average(new SelectorDouble<Rating>() {
                @Override
                public Double select(Rating value) {
                    return value.getScore().doubleValue();
                }
            });

        return 4.0;
    }

    public ArrayList<Rating> getRatings() {
        if (ratings != null) return ratings;

        try {
            Query query = getRatingsQuery();
            QueryEnumerator enumerator = query.run();
            if (enumerator != null && enumerator.hasNext()) {
                ratings = new ArrayList<Rating>(Linq.stream(enumerator).select(new Selector<QueryRow, Rating>() {
                    @Override
                    public Rating select(QueryRow value) {
                        return DataUtils.toObj(value.getDocument(), Rating.class);
                    }
                }).toList());
            } else {
                ratings = new ArrayList<>();
            }

            LiveQuery liveQuery = query.toLiveQuery();
            liveQuery.addChangeListener(new LiveQuery.ChangeListener() {
                @Override
                public void changed(LiveQuery.ChangeEvent event) {
                    ratings = new ArrayList<Rating>(Linq.stream(event.getRows())
                            .select(new Selector<QueryRow, Rating>() {
                                @Override
                                public Rating select(QueryRow value) {
                                    return DataUtils.toObj(value.getDocument(), Rating.class);
                                }
                            }).toList());
                }
            });
            liveQuery.start();

        } catch (CouchbaseLiteException e) {
            LogManager.getLogger().d(App.TAG, "Error running query..", e);
        }
        return ratings;
    }

    public Rating getMyRating() {
        final String userId = App.getAppContext().getCurrentUserId();
        return Linq.stream(getRatings()).firstOrDefault(new Predicate<Rating>() {
            @Override
            public boolean apply(Rating value) {
                return userId.equals(value.getRatedBy());
            }
        }, null);
    }

    public void setRatings(int rating) {
        Rating myRating = getMyRating();
        if (myRating == null) {
            myRating = new Rating(rating);
            getRatings().add(myRating);
        }

        myRating.setScore(rating);
        DataUtils.saveAsync(myRating);
    }

    public String getSubcategory() {
        if(subcategory == null) return null;
        return StringUtils.toTitleCase(subcategory.replaceAll("[\\W]+", " "));
    }

    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
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
