package com.github.l3laze.gitui;

import android.Manifest;
import android.app.Activity;
import android.view.Window;
import android.widget.Toast;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.content.Context;
import android.content.ClipData;
import android.content.ClipboardManager;

import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.github.l3laze.gitui.R;

public class MainActivity extends Activity {
  private static MainActivity instance;
  private static WebView webView;
  protected WebAppInterface webAppInterface;
  protected final int STORAGE_PERM_CODE = 1;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    requestWindowFeature(Window.FEATURE_NO_TITLE);
    setContentView(R.layout.activity_main);

    webView = (WebView) findViewById(R.id.webapp);
    webView.setWebViewClient(new WebViewClient());
    webView.setWebChromeClient(new WebChromeClient());
    webView.getSettings().setJavaScriptEnabled(true);
    webView.getSettings().setDomStorageEnabled(true);

    webAppInterface = new WebAppInterface(this);
    webView.addJavascriptInterface(webAppInterface, "Android");

    instance = this;

    loadWebapp();
  }

  public void havePermission(int reqCode) {

    if (reqCode == STORAGE_PERM_CODE) {
      checkPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE, STORAGE_PERM_CODE);
    }
  }

  public static MainActivity getInstance() {
    return instance;
  }

  public void checkPermission(String permission, int reqCode) {
    if (ContextCompat.checkSelfPermission(MainActivity.this, permission) == PackageManager.PERMISSION_DENIED) {
      // Requesting the permission 
      ActivityCompat.requestPermissions(MainActivity.this, new String[] {
        permission
      }, reqCode);
    } else {
      savePermission(reqCode, true);
    }
  }

  public void savePermission(int reqCode, boolean isAllowed) {
    if (reqCode == STORAGE_PERM_CODE) {
      MainActivity.getInstance().webAppInterface.storagePermission = isAllowed;
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);

    if (requestCode == STORAGE_PERM_CODE) {
      if (grantResults.length > 0 &&
        grantResults[0] == PackageManager.PERMISSION_GRANTED) {
        Toast.makeText(MainActivity.this, "Storage Permission Granted", Toast.LENGTH_SHORT).show();
        savePermission(STORAGE_PERM_CODE, true);
      } else {
        Toast.makeText(MainActivity.this, "Storage Permission Denied", Toast.LENGTH_SHORT).show();
        savePermission(STORAGE_PERM_CODE, false);
      }
    }
  }

  public void loadWebapp() {
    String externalBase = Environment.getExternalStorageDirectory().getAbsolutePath() + "/gitui";
    java.io.File external = new java.io.File(externalBase + "/index.html");
    String internal = "file:///android_asset/gitui/index.html";
    String url;

    if (external.exists() && external.canRead()) url = external.toString();
    else url = internal;

    webView.loadUrl(url);

    MainActivity.getInstance().havePermission(STORAGE_PERM_CODE);
  }

  protected void copyTextToClipboard(String text) {
    ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
    ClipData clip = ClipData.newPlainText("copied text", text);
    clipboard.setPrimaryClip(clip);
  }
}
