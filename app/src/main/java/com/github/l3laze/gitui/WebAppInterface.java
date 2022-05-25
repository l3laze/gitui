package com.github.l3laze.gitui;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.io.FileNotFoundException;

import java.util.zip.Deflater;
import java.util.zip.Inflater;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.nio.channels.FileLock;
import java.nio.file.FileAlreadyExistsException;

import java.security.MessageDigest;

import android.webkit.JavascriptInterface;
import android.content.Context;
import android.widget.Toast;
import android.content.res.AssetManager;
import android.os.Environment;
import android.system.*;
import android.util.Base64;

public class WebAppInterface {
  protected static Context mContext;
  protected static AssetManager assetManager;
  protected static boolean storagePermission = false;

  WebAppInterface(Context c) {
    setInterface(c.getApplicationContext());
  }

  private void setInterface(Context c) {
    mContext = c;
  }

  @JavascriptInterface
  public static String toJSON(String[] obj) {
    StringBuilder sb = new StringBuilder();

    sb.append("{");

    for (int o = 0; o < obj.length; o++) {
      sb.append("\"" + obj[o] + "\":\"" + obj[++o] + "\"");

      if (o + 1 < obj.length) {
        sb.append(",");
      }
    }

    sb.append("}");

    return sb.toString();
  }

  @JavascriptInterface
  public static boolean havePermission() {
    return storagePermission;
  }

  @JavascriptInterface
  public static int androidVersion() {
    return android.os.Build.VERSION.SDK_INT;
  }

  @JavascriptInterface
  public static void showToast(String text) {
    Toast.makeText(mContext, text, Toast.LENGTH_SHORT).show();
  }

  @JavascriptInterface
  public static void copyToClipboard(String text) {
    MainActivity.getInstance().copyTextToClipboard(text);
  }

  @JavascriptInterface
  public static String normalize(String path) {
    return Paths.get(path).normalize().toString();
  }

  @JavascriptInterface
  public static String relativize(String from, String to) {
    return Paths.get(from).relativize(Paths.get(to)).toString();
  }

  @JavascriptInterface
  public static String resolve(String path, String other) {
    return Paths.get(path).resolve(other).toString();
  }

  @JavascriptInterface
  public static String getAbsolutePath(String path) {
    return new File(path).getAbsolutePath();
  }

  @JavascriptInterface
  public static String dirname(String path) {
    return new File(path).getParentFile().getAbsolutePath();
  }

  @JavascriptInterface
  public static String basename(String path) {
    return new File(path).getName();
  }

  public static String buildStats(StructStat stats) {
    StringBuilder sb = new StringBuilder();
    sb.append("{");
    sb.append("\"dev\":" + stats.st_dev);
    sb.append(",\"ino\":" + stats.st_ino);
    sb.append(",\"mode\":" + stats.st_mode);
    sb.append(",\"nlink\":" + stats.st_nlink);
    sb.append(",\"uid\":" + stats.st_uid);
    sb.append(",\"gid\":" + stats.st_gid);
    sb.append(",\"rdev\":" + stats.st_rdev);
    sb.append(",\"size\":" + stats.st_size);
    sb.append(",\"blksize\":" + stats.st_blksize);
    sb.append(",\"blocks\":" + stats.st_blocks);
    sb.append(",\"atimeMs\":" + stats.st_atime);
    sb.append(",\"mtimeMs\":" + stats.st_mtime);
    sb.append(",\"ctimeMs\":" + stats.st_ctime);
    sb.append(",\"birthtime\":" + stats.st_mtime);
    sb.append("}");

    return sb.toString();
  }

  public static String getExplanation(String errName, String context, String path) {
    StringBuilder sb = new StringBuilder();

    if (errName.equals("ENOENT")) {
      sb.append("Part of " + path + " does not exist or is a dangling symbolic link.");
    } else if (errName.equals("EACCES")) {
      sb.append("Access to " + path + " (or one of the directories) was denied.");
    } else if (errName.equals("EROFS")) {
      sb.append("The path " + path + " is on a read-only filesystem.");
    } else if (errName.equals("EPERM")) {
      sb.append("Not permitted to perform " + context + ". Likely SELinux related.");
    } else {
      sb.append("No explanation available for " + errName + ".");
    }

    return sb.toString();
  }

  @JavascriptInterface
  public static String stat(String path) {
    try {
      return buildStats(android.system.Os.stat(path));
    } catch (ErrnoException ee) {
      String name = android.system.OsConstants.errnoName(ee.errno);

      return "{\"error (" + name + ")\": " + getExplanation(name, "stat", path) + "\"}";
    }
  }

  @JavascriptInterface
  public static boolean isFile(String path) {
    return new File(path).isFile();
  }

  @JavascriptInterface
  public static boolean isDir(String path) {
    return new File(path).isDirectory();
  }

  @JavascriptInterface
  public static boolean fileExists(String path) {
    return new File(path).exists();
  }

  @JavascriptInterface
  public static void makeDirectory(String path) {
    new File(path).mkdir();
  }

  @JavascriptInterface
  public static void makeDirectoryTree(String path) {
    new File(path).mkdirs();
  }

  @JavascriptInterface
  public static void delete(String path) {
    new File(path).delete();
  }

  @JavascriptInterface
  public static void rimraf(String path) {
    File dir = new File(path);

    if (dir.isDirectory()) {
      String[] children = dir.list();

      for (int i = 0; i < children.length; i++) {
        File f = new File(dir, children[i]);

        if (f.isDirectory()) {
          rimraf(f.toString());
        } else {
          f.delete();
        }
      }

      dir.delete();
    }
  }

  @JavascriptInterface
  public static String readDir(String path) {
    try {
      return String.join(",", new File(path).list());
    } catch (SecurityException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }
  }

  @JavascriptInterface
  public static String sizeOnDisk(String path) {
    return new File(path).length() + "";
  }

  @JavascriptInterface
  public static void move(String source, String target) {
    new File(source).renameTo(new File(target));
  }

  @JavascriptInterface
  public static String writeFile(String path, String data) {
    try {
      Files.write(Paths.get(path), data.getBytes());
    } catch (IOException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }

    return "{}";
  }

  @JavascriptInterface
  public static String readFile(String path) {
    String data;

    try {
      data = new String(Files.readAllBytes(Paths.get(path)));
    } catch (IOException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }

    return data;
  }

  @JavascriptInterface
  public static String homeFolder() {
    return Environment.getExternalStorageDirectory().getAbsolutePath();
  }

  @JavascriptInterface
  public static String pwd() {
    return System.getProperty("user.dir");
  }

  @JavascriptInterface
  public static String copyAssets(String path) {
    File targetFolder;

    try {
      targetFolder = new File(MainActivity.getInstance().webAppInterface.homeFolder());

      assetManager = mContext.getAssets();
      String sources[] = assetManager.list(path);

      if (sources.length == 0) {
        copyAssetFileToFolder(path, targetFolder);
      } else if (!path.startsWith("images") && !path.startsWith("sounds") && !path.startsWith("webkit")) {
        File targetDir = new File(targetFolder, path);
        targetDir.mkdirs();

        for (String source: sources) {
          String fullSourcePath = path.equals("")
            ? source
            : (path + File.separator + source);
          copyAssets(fullSourcePath);
        }
      }

      return targetFolder.toString() + "/gitui";
    } catch (IOException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }
  }

  private static String copyAssetFileToFolder(String fullAssetPath, File targetBasePath) throws IOException {
    InputStream in = assetManager.open(fullAssetPath);
    File outFile = new File(targetBasePath, fullAssetPath);
    OutputStream out = new FileOutputStream(outFile);

    byte[] buffer = new byte[16 * 1024];
    int read;
    long total = 0;

    while ((read = in .read(buffer)) != -1) {
      out.write(buffer, 0, read);
      total += read;
    }

    in.close();
    out.flush();
    out.close();

    return "" + total;
  }

  @JavascriptInterface
  public static String zlibDeflate(String input) {
    try {
      byte[] in = input.getBytes("UTF-8");
      byte result[] = new byte[in.length * 4];
      Deflater d = new Deflater(Deflater.BEST_SPEED);

      d.setInput(in);
      d.finish();
      int resultLength = d.deflate(result);
      d.end();

      String b64 = Base64.encodeToString(result, 0, resultLength, Base64.NO_WRAP);

      return b64;
    } catch (IOException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }
  }

  @JavascriptInterface
  public static String zlibInflate(String input) {
    try {
      byte[] in = Base64.decode(input, Base64.NO_WRAP);
      byte result[] = new byte[in.length * 4];
      Inflater i = new Inflater();

      i.setInput(in, 0, in.length);
      int resultLength = i.inflate(result);
      i.end();

      String out = new String(result, 0, resultLength, "UTF-8");

      // String b64 = Base64.encodeToString(out.getBytes("UTF-8"), 0, out.length(), Base64.NO_WRAP);

      return out;
    } catch (IOException | java.util.zip.DataFormatException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }
  }

  public static String bytesToHex(byte[] a) {
    StringBuilder sb = new StringBuilder(a.length * 2);

    for (byte b: a) {
      sb.append(String.format("%02x", b));
    }

    return sb.toString();
  }

  @JavascriptInterface
  public static String sha1Hex(String data) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-1");

      digest.update(data.getBytes("UTF-16"));
      byte[] digestBytes = digest.digest();

      return bytesToHex(digestBytes);
    } catch (java.io.UnsupportedEncodingException | java.security.NoSuchAlgorithmException err) {
      return "{\"error\":\"" + err.toString() + "\"}";
    }
  }

  @JavascriptInterface
  public String updateHead (String headPath, String oid) {
    try {
      Lockfile lockfile = new Lockfile(headPath);

      if (lockfile.holdForUpdate()) {
        lockfile.write(oid);
        lockfile.commit();
        return "{}";
      }

      return "{\"error\":\"Could not get lock on file " + headPath + ".\"}";
    } catch (IOException | SecurityException | FileAlreadyExistsException | FileNotFoundException | StaleLockException err) {
      return "{\"error\":\"" + err.getMessage() + "\"}";
    }
  }

  protected class Lockfile {
    private String filePath;
    private String lockPath;
    private FileLock lock;
    private FileOutputStream fos;

    public Lockfile (String file) {
      filePath = file;
      lockPath = file + ".lock";
    }

    public boolean holdForUpdate () throws IOException {
      try {
        if (lock == null) {
          Path path = Files.createFile(Paths.get(lockPath));

          RandomAccessFile raf = new RandomAccessFile(path.toString(), "rw");

          lock = raf.getChannel().lock();
          fos = new FileOutputStream(raf.getFD());
        }

        return true;
      } catch (SecurityException err) {
        throw new SecurityException("Could not access: " + filePath);
      } catch (FileNotFoundException err) {
        throw new FileNotFoundException("Error opening file: " + filePath);
      } catch (FileAlreadyExistsException err) {
        return false;
      } catch (IOException err) {
        throw new IOException("Missing parent directory: " + filePath);
      }
    }

    public void write (String string) throws IOException, StaleLockException {
      raiseOnStaleLock();
      fos.write(string.getBytes());
    }

    public void commit () throws IOException, StaleLockException {
      raiseOnStaleLock();
      fos.close();
      lock.close();
      // lock.release();

      new File(lockPath).renameTo(new File(filePath));

      lock = null;
    }

    public void raiseOnStaleLock () throws StaleLockException {
      if (lock == null) {
        throw new StaleLockException("Not holding file lock: " + filePath);
      }
    }
  }

  protected class StaleLockException extends Exception {
    public StaleLockException () {

    }

    public StaleLockException (String message) {
        super (message);
    }

    public StaleLockException (Throwable cause) {
        super (cause);
    }

    public StaleLockException (String message, Throwable cause) {
        super (message, cause);
    }
  }
}
