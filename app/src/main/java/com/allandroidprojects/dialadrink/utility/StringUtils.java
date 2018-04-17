package com.allandroidprojects.dialadrink.utility;

import android.os.AsyncTask;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.allandroidprojects.dialadrink.model.BaseModel;
import com.allandroidprojects.dialadrink.model.SearchItem;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import br.com.zbra.androidlinq.Linq;
import br.com.zbra.androidlinq.delegate.Selector;
import br.com.zbra.androidlinq.delegate.SelectorDouble;

public class StringUtils {
    public static String MD5(String string) {
        if (string == null)
            return null;

        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] inputBytes = string.getBytes();
            byte[] hashBytes = digest.digest(inputBytes);
            return byteArrayToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
        }

        return null;
    }

    public static String md5(final String s) {
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
            LogManager.getLogger().d(App.TAG, e.getMessage());
        }
        return "";
    }

    private static String byteArrayToHex(byte[] a) {
        StringBuilder sb = new StringBuilder(a.length * 2);
        for (byte b : a)
            sb.append(String.format("%02x", b & 0xff));
        return sb.toString();
    }

    public static String toUnderScore(String camelCase) {
        String regex = "([a-z])([A-Z]+)";
        String replacement = "$1_$2";
        return camelCase.replaceAll(regex, replacement).toLowerCase();
    }

    public static String toTitleCase(String input) {
        if(input == null) return null;

        StringBuilder titleCase = new StringBuilder();
        boolean nextTitleCase = true;

        for (char c : input.toCharArray()) {
            if (Character.isSpaceChar(c)) {
                nextTitleCase = true;
            } else if (nextTitleCase) {
                c = Character.toTitleCase(c);
                nextTitleCase = false;
            }

            titleCase.append(c);
        }

        return titleCase.toString();
    }

    public static int levenshteinDistance(CharSequence lhs, CharSequence rhs) {
        Date start = new Date();
        int len0 = lhs.length() + 1;
        int len1 = rhs.length() + 1;

        // the array of distances
        int[] cost = new int[len0];
        int[] newcost = new int[len0];

        // initial cost of skipping prefix in String s0
        for (int i = 0; i < len0; i++) cost[i] = i;

        // dynamically computing the array of distances

        // transformation cost for each letter in s1
        for (int j = 1; j < len1; j++) {
            // initial cost of skipping prefix in String s1
            newcost[0] = j;

            // transformation cost for each letter in s0
            for (int i = 1; i < len0; i++) {
                // matching current letters in both strings
                int match = (lhs.charAt(i - 1) == rhs.charAt(j - 1)) ? 0 : 1;

                // computing cost for each transformation
                int cost_replace = cost[i - 1] + match;
                int cost_insert = cost[i] + 1;
                int cost_delete = newcost[i - 1] + 1;

                // keep minimum cost
                newcost[i] = Math.min(Math.min(cost_insert, cost_delete), cost_replace);
            }

            // swap cost/newcost arrays
            int[] swap = cost;
            cost = newcost;
            newcost = swap;
        }
        /*
        if(App.DEBUG){
            long time = new Date().getTime() - start.getTime();
            LogManager.getLogger().d(App.TAG, "LevenshteinDistance took " + time + "ms");
        }*/
        // the distance is the cost for transforming all letters in both strings
        return cost[len0 - 1];
    }

    public static Double levenshteinSimilarityScore(String word, String query) {
        Integer ld = StringUtils.levenshteinDistance(word, query);
        return ld.doubleValue() / Math.min(word.length(), query.length());
    }

    /**
     * <p>
     * Find the Fuzzy Score which indicates the similarity score between two
     * Strings.
     * </p>
     * <p>
     * <pre>
     * score.fuzzyScore(null, null, null)                                    = IllegalArgumentException
     * score.fuzzyScore("", "", Locale.ENGLISH)                              = 0
     * score.fuzzyScore("Workshop", "b", Locale.ENGLISH)                     = 0
     * score.fuzzyScore("Room", "o", Locale.ENGLISH)                         = 1
     * score.fuzzyScore("Workshop", "w", Locale.ENGLISH)                     = 1
     * score.fuzzyScore("Workshop", "ws", Locale.ENGLISH)                    = 2
     * score.fuzzyScore("Workshop", "wo", Locale.ENGLISH)                    = 4
     * score.fuzzyScore("Apache Software Foundation", "asf", Locale.ENGLISH) = 3
     * </pre>
     *
     * @param term  a full term that should be matched against, must not be null
     * @param query the query that will be matched against a term, must not be
     *              null
     * @return result score
     * @throws IllegalArgumentException if either String input {@code null} or
     *                                  Locale input {@code null}
     */
    public static Integer fuzzyScore(final CharSequence term, final CharSequence query) {
        Date start = new Date();
        if (term == null || query == null) {
            throw new IllegalArgumentException("Strings must not be null");
        }

        // fuzzy logic is case insensitive. We normalize the Strings to lower
        // case right from the start. Turning characters to lower case
        // via Character.toLowerCase(char) is unfortunately insufficient
        // as it does not accept a locale.
        final String termLowerCase = term.toString().toLowerCase(getLocale());
        final String queryLowerCase = query.toString().toLowerCase(getLocale());

        // the resulting score
        int score = 0;

        // the position in the term which will be scanned next for potential
        // query character matches
        int termIndex = 0;

        // index of the previously matched character in the term
        int previousMatchingCharacterIndex = Integer.MIN_VALUE;

        for (int queryIndex = 0; queryIndex < queryLowerCase.length(); queryIndex++) {
            final char queryChar = queryLowerCase.charAt(queryIndex);

            boolean termCharacterMatchFound = false;
            for (; termIndex < termLowerCase.length()
                    && !termCharacterMatchFound; termIndex++) {
                final char termChar = termLowerCase.charAt(termIndex);

                if (queryChar == termChar) {
                    // simple character matches result in one point
                    score++;

                    // subsequent character matches further improve
                    // the score.
                    if (previousMatchingCharacterIndex + 1 == termIndex) {
                        score += 2;
                    }

                    previousMatchingCharacterIndex = termIndex;

                    // we can leave the nested loop. Every character in the
                    // query can match at most one character in the term.
                    termCharacterMatchFound = true;
                }
            }
        }
        /*
        if(App.DEBUG){
            long time = new Date().getTime() - start.getTime();
            LogManager.getLogger().d(App.TAG, "FuzzyScore took " + time + "ms");
        }*/
        return score;
    }

    private static Locale getLocale() {
        return App.getAppContext().getResources().getConfiguration().locale;
    }

    public static <T extends BaseModel> SearchItem getSearchItem(T model, String searchTerm, String... searchFields) {
        final SearchItem searchItem = new SearchItem(model, searchTerm, searchFields);

        /*
        (new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... voids) {
                searchItem.getFuzzyScore();
                return null;
            }
        }).execute();
        */
        return searchItem;
    }

}
