package com.github.l3laze.gitui;

import android.app.Activity;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.content.Context;
import android.content.ClipData;
import android.content.ClipboardManager;

import com.github.l3laze.gitui.R;

public class MainActivity extends Activity {
    private static MainActivity instance;
    private static WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_main);

        webView = (WebView) findViewById(R.id.webapp);
        webView.setWebViewClient(new WebViewClient());
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");

        instance = this;

        loadWebapp();
    }

    public static MainActivity getInstance() {
      return instance;
    }

    public static void loadWebapp () {
      String externalBase = Environment.getExternalStorageDirectory().getAbsolutePath() + "/gitui";
      java.io.File external = new java.io.File(externalBase + "/index.html");
      String internal = "file:///android_asset/gitui/index.html";
      String url;

      if (external.exists()) url = external.toString();
      else url = internal;

      webView.loadUrl(url);
    }

    protected void copyTextToClipboard (String text) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("copied text", text);
        clipboard.setPrimaryClip(clip);
    }
}