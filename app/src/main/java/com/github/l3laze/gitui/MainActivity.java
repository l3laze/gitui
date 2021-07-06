package com.github.l3laze.gitui;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.view.Window;
import android.content.Context;
import android.content.ClipData;
import android.content.ClipboardManager;

import com.github.l3laze.gitui.R;

public class MainActivity extends Activity {
    private static MainActivity instance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_main);

        WebView webView = (WebView) findViewById(R.id.webapp);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        webView.loadUrl("file:///android_asset/index.html");

        instance = this;
    }

    public static MainActivity getInstance() {
        return instance;
    }

    protected void copyTextToClipboard (String text) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("copied text", text);
        clipboard.setPrimaryClip(clip);
    }
}
