package com.allandroidprojects.dialadrink.model;

import android.graphics.Bitmap;

import com.allandroidprojects.dialadrink.utility.ImageUtils;

/**
 * Created by nmasuki on 3/29/2018.
 */

public class User extends BaseModel {
    protected String name;
    protected String userId;
    protected String pictureUrl;
    protected String gender;
    protected String birthday;
    protected String email;
    protected String password;
    protected String accountType;

    public User() {
        super();
    }

    public User(String userId, String name) {
        this();
        setUserId(userId);
        setName(name);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
        set_id("user-" + userId);
    }

    public String getPicture() {
        String avatar = "http://i2.wp.com/pronksiapartments.ee/wp-content/uploads/2015/10/placeholder-face-big.png";
        //"http://www.gravatar.com/avatar/"+ StringUtils.MD5(getEmail())+"?s=40&d=https%3A%2F%2Fcdn-images-1.medium.com%2Fmax%2F1200%2F1*vCm968wcdYjIyg-d40iUOA.png";

        if (pictureUrl != null)
            avatar = pictureUrl;

        return avatar;
    }

    public String getPictureUrl() {
        return pictureUrl;
    }

    public void setPictureUrl(String pictureUrl) {
        this.pictureUrl = pictureUrl;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBirthday() {
        return birthday;
    }

    public void setBirthday(String birthday) {
        this.birthday = birthday;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }
}
