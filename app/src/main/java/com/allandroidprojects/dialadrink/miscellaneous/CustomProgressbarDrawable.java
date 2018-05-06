package com.allandroidprojects.dialadrink.miscellaneous;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.view.View;

import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.photoview.view.PhotoView;
import com.facebook.drawee.drawable.ProgressBarDrawable;

/**
 * Created by 06peng on 15/6/26.
 */
public class CustomProgressbarDrawable extends ProgressBarDrawable {
    float level;

    Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

    int color = R.color.gray;

    final RectF oval = new RectF();

    int radius = 50;

    public CustomProgressbarDrawable(View photoView){
        radius = photoView.getWidth()/2;
        paint.setStrokeWidth(10);
        paint.setStyle(Paint.Style.STROKE);
    }

    @Override
    protected boolean onLevelChange(int level) {
        this.level = level;
        invalidateSelf();
        return true;
    }

    @Override
    public void draw(Canvas canvas) {
        oval.set(canvas.getWidth() / 2 - radius, canvas.getHeight() / 2 - radius,
                canvas.getWidth() / 2 + radius, canvas.getHeight() / 2 + radius);

        drawCircle(canvas, level, color);
    }


    private void drawCircle(Canvas canvas, float level, int color) {
        paint.setColor(color);
        float angle;
        angle = 360 / 1f;
        angle = level * angle;
        canvas.drawArc(oval, 0, Math.round(angle), false, paint);
    }

}
