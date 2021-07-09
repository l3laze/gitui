package com.github.l3laze.gitui;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class FilesystemInterface {
  private static FilesystemInterface instance;

  protected final String HOME = System.getProperty("user.home");

  public FilesystemInterface () {
    instance = this;
  }

  public static FilesystemInterface getInstance () {
    return instance;
  }

  public Boolean fileExists (String path) {
    return Files.exists(Paths.get(path));
  }

  public void makeDir (String path) {
    try {
      Files.createDirectories(Paths.get(path));
    } catch (IOException ioe) {
      ioe.printStackTrace();
    }
  }

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

  public boolean isFile (String path) {
    return new File(path).isFile();
  }

  public boolean isDir (String path) {
    return new File(path).isFile();
  }

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

  public void writeFile (String path, String data) {
    try {
      Files.write(Paths.get(path), data.getBytes());
    } catch (IOException ioe) {
      ioe.printStackTrace();
    }
  }

  public String readFile (String path) {
    String data;

    try {
      data = new String (Files.readAllBytes(Paths.get(path)));
    } catch (IOException ioe) {
      ioe.printStackTrace();
    } finally {
      data = "";
    }

    return data;
  }

  public Boolean fileExits (String path) {
    return Files.exists(Paths.get(path));
  }
}