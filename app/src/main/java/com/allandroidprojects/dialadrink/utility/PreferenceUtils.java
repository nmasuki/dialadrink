package com.allandroidprojects.dialadrink.utility;

import android.content.SharedPreferences;

import com.allandroidprojects.dialadrink.App;

/**
 * Created by Lincoln on 05/05/16.
 */
public class PreferenceUtils {
    private static SharedPreferences pref;
    private static SharedPreferences.Editor editor;

    // shared pref mode
    private static final int PRIVATE_MODE = 0;

    // Shared preferences constants
    private static final String PREF_NAME = "MyPreference";
    private static final String IS_FIRST_TIME_LAUNCH = "IsFirstTimeLaunch";

    public static SharedPreferences getPref() {
        if (pref == null)
            pref = App.getAppContext().getSharedPreferences(PREF_NAME, PRIVATE_MODE);
        return pref;
    }

    public static SharedPreferences.Editor getEditor() {
        if (editor == null)
            editor = getPref().edit();
        return editor;
    }

    public static void setFirstTimeLaunch(boolean isFirstTime) {
        getEditor().putBoolean(IS_FIRST_TIME_LAUNCH, isFirstTime);
        getEditor().commit();
    }

    public static boolean isFirstTimeLaunch() {
        return getPref().getBoolean(IS_FIRST_TIME_LAUNCH, true);
    }

    public static boolean getBoolean(String s, Boolean defaultValue) {
        return getPref().getBoolean(s, defaultValue);
    }

    public static String getString(String s, String defaultValue) {
        return getPref().getString(s, defaultValue);
    }

    public static float getFloat(String s, Float defaultValue) {
        return getPref().getFloat(s, defaultValue);
    }

    public static int getInt(String s, Integer defaultValue) {
        return getPref().getInt(s, defaultValue);
    }

    public static long getLong(String s, long defaultValue) {
        return getPref().getLong(s, defaultValue);
    }

    public static void putBoolean(String s, Boolean value) {
        getEditor().putBoolean(s, value);
        getEditor().commit();
    }

    public static void setString(String s, String value) {
        getEditor().putString(s, value);
        getEditor().commit();
    }

    public static void setFloat(String s, Float value) {
        getEditor().putFloat(s, value);
        getEditor().commit();
    }

    public static void setInt(String s, Integer value) {
        getEditor().putInt(s, value);
        getEditor().commit();
    }

    public static void setLong(String s, long value) {
        getEditor().putLong(s, value);
        getEditor().commit();
    }

    public static void remove(String s) {
        getEditor().remove(s);
        getEditor().commit();
    }


}
