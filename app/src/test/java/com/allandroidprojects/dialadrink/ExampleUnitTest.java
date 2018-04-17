package com.allandroidprojects.dialadrink;

import com.allandroidprojects.dialadrink.utility.StringUtils;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {
    @Test
    public void levishtineSimilarityTest() throws Exception {
        Double similary = StringUtils.levenshteinSimilarityScore("Wine", "wine");
        assertTrue(similary >= 3.0/4.0);
    }
}