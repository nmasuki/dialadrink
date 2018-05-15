package com.allandroidprojects.dialadrink.model;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.utility.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.Stream;
import br.com.zbra.androidlinq.delegate.Predicate;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

/**
 * Created by nmasuki on 4/13/2018.
 */


public class SearchItem<T extends BaseModel> {
    private T model;
    private String searchTerm;
    private String[] searchFields;
    private Double fuzzyScore = null;
    private Double similarityScore = null;
    private Boolean wordMatched = null;

    public SearchItem(T model, String searchTerm, String... searchFields) {
        this.model = model;
        this.searchTerm = searchTerm;
        this.searchFields = searchFields;
    }

    public T getModel() {
        return model;
    }

    public String getSearchTerm() {
        return searchTerm;
    }

    public String[] getSearchFields() {
        return searchFields;
    }

    public Boolean isWordMatched() {
        Pattern regex = Pattern.compile(String.format(".*(%s).*", searchTerm.toLowerCase()), Pattern.CASE_INSENSITIVE);
        if (wordMatched == null) {
            wordMatched = false;
            for (int i = 0; i < searchFields.length; i++) {
                Object value = model.get(searchFields[i]);
                if (value == null) continue;
                if (value instanceof String) {
                    String sValue = (String) value;
                    if (regex.matcher(sValue).matches()) {
                        wordMatched = true;
                        break;
                    }
                } else if (value instanceof List) {
                    List list = (List) value;
                    for (Object word : list) {
                        if (word instanceof String)
                            if (regex.matcher((String)word).matches()) {
                                wordMatched = true;
                                break;
                            }
                    }
                }
            }
        }

        return wordMatched;
    }

    public Integer getMatchPosition(){
        Pattern regex = Pattern.compile(String.format(".*(%s).*", searchTerm.toLowerCase()), Pattern.CASE_INSENSITIVE);

        for (int i = 0; i < searchFields.length; i++) {
            Object value = model.get(searchFields[i]);
            if (value == null) continue;
            if (value instanceof String) {
                String sValue = (String) value;
                Matcher matcher = regex.matcher(sValue);
                if (matcher.matches())
                    return matcher.start();
            } else if (value instanceof List) {
                List list = (List) value;
                for (Object word : list) {
                    if (word instanceof String){
                        Matcher matcher = regex.matcher((String)word);
                        if (matcher.matches())
                            return matcher.start();
                    }
                }
            }
        }

        return Integer.MAX_VALUE;
    }

    public Double getFuzzyScore() {
        if (fuzzyScore == null) {
            fuzzyScore = calculateFuzzyScore(model, searchTerm, searchFields);
            /*if (App.DEBUG) {
                if (fuzzyScore > 0)
                    LogManager.getLogger().d(App.TAG, "Fuzzy score " + getModel().get("name") + "/" + searchTerm + "=" + fuzzyScore);
            }*/
        }
        return fuzzyScore;
    }

    public Double getSimilarityScore() {
        if (similarityScore == null) {
            similarityScore = calculateSimilarityScore(model, searchTerm, searchFields);
            /*if (App.DEBUG) {
                if (similarityScore > 0)
                    LogManager.getLogger().d(App.TAG, "Similarity score " + getModel().get("name") + "/" + searchTerm + "=" + similarityScore);
            }*/
        }
        return similarityScore;
    }

    public Double getPercentileRank(Stream<SearchItem<T>> stream){
        Double denominator = stream.count() - 1.0;
        return 100.0 * stream.where(new Predicate<SearchItem<T>>() {
            @Override
            public boolean apply(SearchItem<T> value) {
                return getFuzzyScore()> value.getFuzzyScore();
            }
        }).count() / denominator;
    }

    private Double calculateFuzzyScore(T model, String searchTerm, String... searchFields) {
        List<Double> scores = new ArrayList<>();
        int wc = searchTerm.split(" ").length;
        Pattern splitter = Pattern.compile(String.format("(\\w+\\s*){%d}", wc > 0 ? wc : 1));
        for (int i = 0; i < searchFields.length; i++) {
            String field = searchFields[i];
            Double sWeight = 1.0 / (i + 1);
            Object value = model.get(field);
            if (value == null) continue;
            if (value instanceof String) {
                String sValue = (String) value;
                if (false && sValue.contains(" ")) {
                    String[] words = sValue.split(" ");//splitter.split(sValue);
                    Double weight = sWeight * (1.0 / words.length);
                    for (String word : words)
                        if (word.length() >= searchTerm.length())
                            scores.add(weight * StringUtils.fuzzyScore(word, searchTerm));
                } else {
                    scores.add(sWeight * StringUtils.fuzzyScore(sValue, searchTerm).doubleValue());
                }
            } else if (value instanceof List) {
                List list = (List) value;
                Double weight = sWeight * (1.0 / list.size());
                for (Object word : list) {
                    if (word instanceof String)
                        scores.add(weight * StringUtils.fuzzyScore((String) word, searchTerm));
                }
            }
        }

        Double score = Linq.stream(scores)
                .where(new Predicate<Double>() {
                    @Override
                    public boolean apply(Double value) {
                        return value > 0;
                    }
                })
                .average(new SelectorDouble<Double>() {
                    @Override
                    public Double select(Double value) {
                        return value.doubleValue();
                    }
                });
        return score;
    }

    private Double calculateSimilarityScore(T model, String searchTerm, String... searchFields) {
        List<Double> scores = new ArrayList<>();
        for (int i = 0; i < searchFields.length; i++) {
            String field = searchFields[i];
            Double sWeight = 1.0 / (i + 1);
            Object value = model.get(field);
            if (value == null) continue;
            if (value instanceof String) {
                String sValue = (String) value;
                if (sValue.contains(" ")) {
                    String[] words = sValue.split(" ");
                    Double weight = sWeight * (1.0 / words.length);
                    for (String word : words)
                        if (word.length() >= searchTerm.length())
                            scores.add(weight * StringUtils.levenshteinSimilarityScore(word, searchTerm));
                } else {
                    scores.add(StringUtils.levenshteinSimilarityScore(sValue, searchTerm).doubleValue());
                }
            } else if (value instanceof List) {
                List list = (List) value;
                Double weight = sWeight * (1.0 / list.size());
                for (Object word : list) {
                    if (word instanceof String)
                        scores.add(weight * StringUtils.levenshteinSimilarityScore((String) word, searchTerm));
                }
            }
        }

        Double score = Linq.stream(scores)
                .where(new Predicate<Double>() {
                    @Override
                    public boolean apply(Double value) {
                        return value > 0;
                    }
                })
                .average(new SelectorDouble<Double>() {
                    @Override
                    public Double select(Double value) {
                        return value.doubleValue();
                    }
                });
        return score;
    }
}
