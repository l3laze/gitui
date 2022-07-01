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
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
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

import android.util.Log;

public class WebAppInterface {
  protected Context mContext;
  protected AssetManager assetManager;
  protected boolean storagePermission = false;
  protected Lockfile indexLockfile;
  protected Lockfile headLockfile;
  protected MessageDigest indexDigest;

  protected String TAG = "WebAppInterface";

  WebAppInterface(Context c) {
    setInterface(c.getApplicationContext());
  }

  private void setInterface(Context c) {
    mContext = c;
  }

  public String errorToJson (Exception err) {
    return "{\"error\":\"" + err.toString().replace("\"", "'") + " @ " + stackToString(err.getStackTrace()) + "\"}";
  }

  @JavascriptInterface
  public String heapAvailable () {
    final Runtime runtime = Runtime.getRuntime();
    final long usedMemInMB=(runtime.totalMemory() - runtime.freeMemory()) / 1048576L;
    final long maxHeapSizeInMB=runtime.maxMemory() / 1048576L;
    final long availHeapSizeInMB = maxHeapSizeInMB - usedMemInMB;

    return availHeapSizeInMB + "MB";
  }

  @JavascriptInterface
  public String toJSON(String[] obj) {
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
  public boolean havePermission() {
    return storagePermission;
  }

  @JavascriptInterface
  public int androidVersion() {
    return android.os.Build.VERSION.SDK_INT;
  }

  @JavascriptInterface
  public void showToast(String text) {
    Toast.makeText(mContext, text, Toast.LENGTH_SHORT).show();
  }

  @JavascriptInterface
  public void copyToClipboard(String text) {
    ((MainActivity) mContext).copyTextToClipboard(text);
  }

  @JavascriptInterface
  public String normalize(String path) {
    return Paths.get(path).normalize().toString();
  }

  @JavascriptInterface
  public String relativize(String from, String to) {
    try {
      return Paths.get(from).relativize(Paths.get(to)).toString();
    } catch (Exception err) {
      return errorToJson(err);
    }
  }

  @JavascriptInterface
  public String resolve(String path, String other) {
    return Paths.get(path).resolve(other).toString();
  }

  @JavascriptInterface
  public String getAbsolutePath(String path) {
    return java.nio.file.FileSystems.getDefault().getPath(path).normalize().toAbsolutePath().toString();
  }

  @JavascriptInterface
  public String dirname(String path) {
    return new File(path).getParentFile().getAbsolutePath();
  }

  @JavascriptInterface
  public String basename(String path) {
    return new File(path).getName();
  }

  public String buildStats(StructStat stats) {
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

  public String getExplanation(String errName, String context, String path) {
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
  public String stat(String path) {
    try {
      return buildStats(android.system.Os.stat(path));
    } catch (ErrnoException ee) {
      String name = android.system.OsConstants.errnoName(ee.errno);

      return "{\"error (" + name + ")\": " + getExplanation(name, "stat", path) + " @ " + stackToString(ee.getStackTrace()) + "\"}";
    }
  }

  @JavascriptInterface
  public boolean isFile(String path) {
    return new File(path).isFile();
  }

  @JavascriptInterface
  public boolean isDir(String path) {
    return new File(path).isDirectory();
  }

  @JavascriptInterface
  public boolean fileExists(String path) {
    return new File(path).exists();
  }

  @JavascriptInterface
  public void makeDirectory(String path) {
    new File(path).mkdir();
  }

  @JavascriptInterface
  public void makeDirectoryTree(String path) {
    new File(path).mkdirs();
  }

  @JavascriptInterface
  public void delete(String path) {
    new File(path).delete();
  }

  @JavascriptInterface
  public void rimraf(String path) {
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
  public String readDir(String path) {
    try {
      return String.join(",", new File(path).list());
    } catch (SecurityException err) {
      return errorToJson(err);
    }
  }

  @JavascriptInterface
  public String sizeOnDisk(String path) {
    return new File(path).length() + "";
  }

  @JavascriptInterface
  public void move(String source, String target) {
    new File(source).renameTo(new File(target));
  }

  @JavascriptInterface
  public String writeFile(String path, String data) {
    try {
      Files.write(Paths.get(path), data.getBytes());
    } catch (IOException err) {
      return errorToJson(err);
    }

    return "{}";
  }

  @JavascriptInterface
  public String readFile(String path) {
    String data;

    try {
      data = new String(Files.readAllBytes(Paths.get(path)));
    } catch (IOException err) {
      return errorToJson(err);
    }

    return data;
  }

  @JavascriptInterface
  public String readFileAsHex(String path) {
    String data;

    try {
      data = bytesToHex(Files.readAllBytes(Paths.get(path)));
    } catch (IOException err) {
      return errorToJson(err);
    }

    return data;
  }

  @JavascriptInterface
  public String homeFolder() {
    return Environment.getExternalStorageDirectory().getAbsolutePath();
  }

  @JavascriptInterface
  public String pwd() {
    return System.getProperty("user.dir");
  }

  @JavascriptInterface
  public String copyAssets(String path) {
    File targetFolder;

    try {
      targetFolder = new File(homeFolder());

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
      return errorToJson(err);
    }
  }

  private String copyAssetFileToFolder(String fullAssetPath, File targetBasePath) throws IOException {
    InputStream in = assetManager.open(fullAssetPath);
    File outFile = new File(targetBasePath, fullAssetPath);
    OutputStream out = new FileOutputStream(outFile);

    byte[] buffer = new byte[16 * 1024];
    int read;
    long total = 0;

    while ((read = in.read(buffer)) != -1) {
      out.write(buffer, 0, read);
      total += read;
    }

    out.flush();

    in.close();
    out.close();

    Log.i(TAG, "Closed IO for copyAssetFileToFolder.");

    return "" + total;
  }

  @JavascriptInterface
  public String zlibDeflate(String input) {
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
      return errorToJson(err);
    }
  }

  @JavascriptInterface
  public String zlibInflate(String input) {
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
      return errorToJson(err);
    }
  }

  @JavascriptInterface
  public String bytesToHex(byte[] a) {
    StringBuilder sb = new StringBuilder(a.length * 2);

    for (byte b: a) {
      sb.append(String.format("%02x", b));
    }

    return sb.toString();
  }

  @JavascriptInterface
  public String hexToString(String h) {
    StringBuilder sb = new StringBuilder(h.length() / 2);

    for (int i = 0; i < h.length();  i++) {
      sb.append((char) Integer.parseInt(h, 16));
    }

    return sb.toString();
  }

  @JavascriptInterface
  public String sha1Hex(String data) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-1");

      digest.update(data.getBytes("UTF-16"));
      byte[] digestBytes = digest.digest();

      return bytesToHex(digestBytes);
    } catch (java.io.UnsupportedEncodingException | java.security.NoSuchAlgorithmException err) {
      return errorToJson(err);
    }
  }

  @JavascriptInterface
  public String updateHead (String headPath, String oid) {
    try {
      headLockfile = new Lockfile(headPath);

      if (headLockfile.holdForUpdate()) {
        headLockfile.write(oid.getBytes());
        headLockfile.commit();
        return "{}";
      }
    } catch (IOException | SecurityException | FileAlreadyExistsException | FileNotFoundException | StaleLockException err) {
      headLockfile = null;

      return errorToJson(err);
    }

    return "{\"error\":\"Could not get lock on file " + headPath + ".\"}";
  }

  protected void beginWritingIndex () throws java.security.NoSuchAlgorithmException, IOException, StaleLockException {
    indexDigest = MessageDigest.getInstance("SHA-1");
  }

  protected void writeToIndex (byte[] data) throws IOException, StaleLockException {
    indexLockfile.write(data);
    indexDigest.update(data);
  }

  protected void finishWritingIndex () throws IOException, StaleLockException {
    indexLockfile.write(bytesToHex(indexDigest.digest()).getBytes());
    indexLockfile.commit();
  }

  @JavascriptInterface
  public String updateIndex (String indexPath, String entriesString, String hasChanged) {
    String[] entries = entriesString.split(",");
    boolean changed = hasChanged.equals("true");

    Log.i(TAG, entriesString);

    try {
      if (changed &&
        fileExists(resolve(indexPath, ".lock"))) {
        indexLockfile.rollback();
      }

      indexLockfile = new Lockfile(indexPath);

      if (indexLockfile.holdForUpdate()) {
        beginWritingIndex();

        int indexVersion = Integer.parseUnsignedInt("" + 2);
        int numEntries = Integer.parseUnsignedInt("" + entries.length);

        ByteBuffer header = ByteBuffer.allocate(12);

        header.put("DIRC".getBytes());
        header.putInt(indexVersion);
        header.putInt(numEntries);
        
        writeToIndex(header.array());

        ByteBuffer bb;
        int statField;
        int pathEnd;
        int flags;
        String path;
        String padding;

        for (int i = 0; i < entries.length; i++) {
          for (int x = 0; x < 10; x++) {
            bb = ByteBuffer.allocate(4);

            String sf = entries[i].substring(x * 8, x * 8 + 8);

            Log.i(TAG, sf);

            statField = Integer.parseUnsignedInt(sf, 16);

            Log.i(TAG, "" + statField);

            bb.putInt(statField);

            writeToIndex(bb.array());
          }

          writeToIndex(entries[i].substring(80, 120).getBytes());

          flags = Integer.parseUnsignedInt(entries[i].substring(120, 124), 16);

          bb = ByteBuffer.allocate(2);
          bb.putShort((short) flags);

          writeToIndex(bb.array());

          pathEnd = entries[i].indexOf((char) 0, 124); 
          path = entries[i].substring(124, pathEnd);

          writeToIndex(path.getBytes());

          padding = entries[i].substring(pathEnd + 1);

          writeToIndex(padding.getBytes());
        }

        finishWritingIndex();

        changed = false;
      } else {
        return "{\"error\":\"Could not get lock on file " + indexPath + ".\"}";
      }
    } catch (IOException | SecurityException | FileAlreadyExistsException | FileNotFoundException | StaleLockException | java.security.NoSuchAlgorithmException | Exception err) {
      indexLockfile = null;

      return errorToJson(err);
    }

    return "{\"changed\":\"" + changed + "\"}";
  }

  @JavascriptInterface
  public String beginLoadingIndex (String indexPath) {
    try {
      indexLockfile.raiseOnStaleLock();

      indexLockfile = new Lockfile(indexPath);

      if (indexLockfile.holdForUpdate()) {
        return "true";
      }

      return "{\"error\":\"Could not get lock on file " + indexPath + ".\"}";
    } catch (StaleLockException | IOException err) {
      indexLockfile = null;

      return errorToJson(err);
    }
  }

  @JavascriptInterface
  public String verifyChecksum (String[] rawEnts, String digest) {
    try {
      MessageDigest cksum = MessageDigest.getInstance("SHA-1");

      for (int i = 0; i < rawEnts.length; i++) {
        cksum.update(rawEnts[i].getBytes());
      }

      if (bytesToHex(cksum.digest()).equals(digest)) {
        return "true";
      }
    } catch (java.security.NoSuchAlgorithmException err) {
      return errorToJson(err);
    }

    return "false";
  }

  public String stackToString (StackTraceElement[] st) {
    StringBuffer sb = new StringBuffer();

    for(int i = 0; i < st.length; i++) {
      sb.append(st[i].toString() + "\\n");
    }

    return sb.toString();
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
      RandomAccessFile raf = null;

      try {
        if (lock == null) {
          Path path = Files.createFile(Paths.get(lockPath));

          raf = new RandomAccessFile(path.toString(), "rw");

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

    public void write (byte[] b) throws IOException, StaleLockException {
      raiseOnStaleLock();
      fos.write(b);
    }

    public void commit () throws IOException, StaleLockException {
      raiseOnStaleLock();
      fos.close();
      lock.close();

      new File(lockPath).renameTo(new File(filePath));

      lock = null;

      Log.i(TAG, "Closed IO for Lockfile.commit.");
    }

    public void raiseOnStaleLock () throws StaleLockException {
      if (lock == null) {
        throw new StaleLockException("Not holding file lock: " + filePath);
      }
    }

    public void rollback () throws StaleLockException, IOException {
      raiseOnStaleLock();

      lock.close();

      new File(lockPath).delete();

      lock = null;

      Log.i(TAG, "Closed IO for Lockfile.rollbqck.");
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
