package com.github.l3laze.gitui;
import java.lang.String;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;

import java.nio.file.Files;
import java.nio.file.Paths;

import android.webkit.JavascriptInterface;
import android.content.Context;
import android.widget.Toast;
import android.content.res.AssetManager;
import android.os.Environment;



public class WebAppInterface {
  Context mContext;

  WebAppInterface(Context c) {
    mContext = c;
  }

  @JavascriptInterface
  public int androidVersion () {
    return android.os.Build.VERSION.SDK_INT;
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
  public String readDir (String path) {
    StringBuilder dirList = new StringBuilder();
    File d = new File(path);
    File[] list = d.listFiles();
 
    for (int i = 0; i < list. length; i++) {
       dirList.append("\n" + list[i].getName());
    }
 
    return dirList.toString();
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

  @JavascriptInterface
  public String copyAssets (String path) {
    AssetManager am = mContext.getAssets();
    String[] assets = null;
    String fullPath = "";

    try {
      assets = am.list("");

      if (assets.length == 0) {
        copyFile(path);
      } else {
        fullPath = Environment.getExternalStorageDirectory().getAbsolutePath() + "/gitui/";
        File dir = new File(fullPath);

        if (!dir.exists()) dir.mkdir();

        for (int i = 0; i < assets.length; i++) {
          copyAssets(path + "/" + assets[i]);
        }
      }
    } catch (IOException ioe) {
        System.out.println(ioe.getMessage());
    }

    return fullPath;
  }

  @JavascriptInterface
  public void copyFile (String filename) {
    AssetManager am = mContext.getAssets();

    InputStream in = null;
    OutputStream out = null;
    try {
        in = am.open(filename);
        String newFileName = Environment.getExternalStorageDirectory().getAbsolutePath() + "/gitui/" + filename;
        out = new FileOutputStream(newFileName);

        byte[] buffer = new byte[1024];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        in.close();
        in = null;
        out.flush();
        out.close();
        out = null;
    } catch (Exception e) {
      System.out.println(e.getMessage());
    }
  }
}