package com.github.l3laze.gitui;
import java.lang.String;

import java.io.File;
import java.io.IOException;

import java.nio.file.Files;
import java.nio.file.Paths;

import android.webkit.JavascriptInterface;
import android.content.Context;
import android.widget.Toast;




public class WebAppInterface {
    Context mContext;

    WebAppInterface(Context c) {
      mContext = c;
    }

    @JavascriptInterface
    public void showToast(String text) {
      Toast.makeText(mContext, text, Toast.LENGTH_SHORT).show();
    }

  @JavascriptInterface
  public void copyToClipboard(String text) {
    MainActivity.getInstance().copyTextToClipboard(text);
  }

  @JavascriptInterface
  public String normalize (String path) {
    return Paths.get(path).normalize().toString();
  }

  @JavascriptInterface
  public String relativize (String from, String to) {
    return Paths.get(from).relativize(Paths.get(to)).toString();
  }

  @JavascriptInterface
  public String resolve (String path, String other) {
    return Paths.get(path).resolve(other).toString();
  }

  @JavascriptInterface
  public boolean isFile (String path) {
    return new File(path).isFile();
  }
 
  @JavascriptInterface
  public boolean isDir (String path) {
    return new File(path).isFile();
  }

  @JavascriptInterface
  public Boolean fileExists (String path) {
    return Files.exists(Paths.get(path));
  }
 
  @JavascriptInterface
  public void makeDir (String path) {
    try {
      Files.createDirectories(Paths.get(path));
    } catch (IOException ioe) {
      ioe.printStackTrace();
    }
  }
 
  @JavascriptInterface
  public boolean removePath (String path) {
    File p = new File(path);
    File[] contents = p.listFiles();
 
    if (contents != null) {
      for (File f : contents) {
        removePath(f.toString());
      }
    }
 
    return p.delete();
  }

  @JavascriptInterface
  public String[] readDir (String path) {
    String[] dirList;
    File d = new File(path);
    File[] list = d.listFiles();
    dirList = new String[list.length];
 
    for (int i = 0; i < list. length; i++) {
       dirList[ i ] = list[i].getName();
    }
 
    return dirList;
  }

  @JavascriptInterface
  public void writeFile (String path, String data) {
    try {
      Files.write(Paths.get(path), data.getBytes());
    } catch (IOException ioe) {
      ioe.printStackTrace();
    }
  }

  @JavascriptInterface
  public String readFile (String path) {
    String data;
 
    try {
      data = new String (Files.readAllBytes(Paths.get(path)));
    } catch (IOException ioe) {
      ioe.printStackTrace();
      data = "";
    }
 
    return data;
  }
}