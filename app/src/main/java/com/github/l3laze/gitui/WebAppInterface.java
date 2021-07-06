package com.github.l3laze.gitui;

import android.os.Build;
import android.webkit.JavascriptInterface;
import android.content.Context;
import android.widget.Toast;

public class WebAppInterface {
    Context mContext;

    WebAppInterface(Context c) {
        mContext = c;
    }

    @JavascriptInterface
    public String getAndroidVersion() {
        return Build.VERSION.RELEASE;
    }

    @JavascriptInterface
    public void showToast(String toast) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
    }

  @JavascriptInterface
  public void copyToClipboard(String text) {
      MainActivity.getInstance().copyTextToClipboard(text);
  }
}
