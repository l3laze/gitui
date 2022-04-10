package com.github.l3laze.gitui;

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
import android.system.*;


public class WebAppInterface {
	protected static Context mContext;
	protected static AssetManager assetManager;
  protected static boolean storagePermission = false;
  protected static boolean symlinkPermission = false;

	WebAppInterface (Context c) {
		mContext = c;
	}

  @JavascriptInterface
  public static boolean havePermission () {
    return storagePermission;
	}

	@JavascriptInterface
	public static int androidVersion () {
		return android.os.Build.VERSION.SDK_INT;
	}

	@JavascriptInterface
	public static void showToast (String text) {
		Toast.makeText(mContext, text, Toast.LENGTH_SHORT).show();
	}

	@JavascriptInterface
	public static void copyToClipboard (String text) {
		MainActivity.getInstance().copyTextToClipboard(text);
	}

	@JavascriptInterface
	public static String normalize (String path) {
		return Paths.get(path).normalize().toString();
	}

	@JavascriptInterface
	public static  String relativize (String from, String to) {
		return Paths.get(from).relativize(Paths.get(to)).toString();
	}

	@JavascriptInterface
	public static String resolve (String path, String other) {
		return Paths.get(path).resolve(other).toString();
	}

	@JavascriptInterface
	public static String getAbsolutePath (String path) {
		return new File(path).getAbsolutePath();
	}

	@JavascriptInterface
	public static String dirname (String path) {
		return new File(path).getAbsolutePath().getParent();
	}

  public static String getExplanation (String errnoName, String context) {
    switch (errnoName) {
      case "ENOENT":
        return "A component of pathname does not exist or is a dangling symbolic link.";
      case "EACCES":
        return "Write access to the directory containing linkpath is denied, or one of the directories in the path prefix of linkpath did not allow search permission.";
      default:
        return "No explanation available.";
    }
  }

  public static String buildStats (StructStat stats) {
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

  @JavascriptInterface
  public static String lstat(String path) {
    try {
      return buildStats(android.system.Os.lstat(path));
    } catch (ErrnoException ee) {
      String name = android.system.OsConstants.errnoName(ee.errno);
      return "{\"error\":\"" + name + " (" + ee.errno + "): " + getExplanation(name, "lstat") + "\"}";
    }
  }

  @JavascriptInterface
  public static String stat(String path) {
    try {
      return buildStats(android.system.Os.stat(path));
    } catch (ErrnoException ee) {
      String name = android.system.OsConstants.errnoName(ee.errno);
      return "{\"error\":\"" + name + " (" + ee.errno + "): " + getExplanation(name, "stat") + "\"}";
    }
  }

	@JavascriptInterface
	public static boolean isFile (String path) {
		return new File(path).isFile();
	}

	@JavascriptInterface
	public static boolean isDir (String path) {
		return new File(path).isFile();
	}

  @JavascriptInterface
  public static boolean isSymlink (String path) {
    return Files.isSymbolicLink(Paths.get(path));
	}

	@JavascriptInterface
	public static Boolean fileExists (String path) {
		return new File(path).exists();
	}

	@JavascriptInterface
	public static void makeDirectory (String path) {
		new File(path).mkdir();
	}

    @JavascriptInterface
	public static void makeDirectoryTree (String path) {
	    new File(path).mkdirs();
	}

    @JavascriptInterface
    public static void delete (String path) {
      try {
        Files.delete(Paths.get(path));
      } catch (IOException ioe) {
      }
    }

	@JavascriptInterface
	public static void rmdir (String path) {
      File dir = new File(path);

      if (dir.isDirectory()) {
        String[] children = dir.list();

        for (int i = 0; i < children.length; i++) {
          new File(dir, children[i]).delete();
        }
        
        dir.delete();
      }
	}

	@JavascriptInterface
	public static String readDir (String path) {
      try {
          return String.join(",", new File(path).list());
      } catch (SecurityException se) {
        return "{\"error\":" + se.getMessage() + "\"}";
      }
	}

    @JavascriptInterface
    public static String readlink (String path) {
      try {
        android.system.Os.readlink(path);
      } catch (ErrnoException ee) {
        String name = android.system.OsConstants.errnoName(ee.errno);
        return "{\"error\":\"" + name + " (" + ee.errno + "): " + getExplanation(name, "readlink") + "\"}";
      }

      return "true";
	}

    @JavascriptInterface
    public static String sizeOnDisk (String path) {
      try {
        return new String("" + Files.size(Paths.get(path)));
      } catch (IOException ioe) {
        return "{\"error\":" + ioe.getMessage() + "\"}";
      }
	}

  @JavascriptInterface
  public static String createSymlink (String source, String target) {
    try {
      android.system.Os.symlink(source, target);
    } catch (ErrnoException ee) {
      return "{\"error\":\"" + android.system.OsConstants.errnoName(ee.errno)
        + " (" + ee.errno + "): Write access to the directory containing linkpath is "
        + "denied, or one of the directories in the path prefix of "
        + "linkpath did not allow search permission.\"}";
    }
    
    return "true";
	}

  @JavascriptInterface
  public static void move (String source, String target) {
    try {
      Files.move(Paths.get(source), Paths.get(target));
    } catch (IOException ioe) {
    }
  }

	@JavascriptInterface
	public static void writeFile (String path, String data) {
		try {
			Files.write(Paths.get(path), data.getBytes());
		}
    catch (IOException ioe) {
		}
	}

	@JavascriptInterface
	public static String readFile (String path) {
		String data;

		try {
			data = new String(Files.readAllBytes(Paths.get(path)));
		}
    catch (Exception e) {
			data = "";
		}

		return data;
	}

  @JavascriptInterface
  public static String homeFolder () {
    return Environment.getExternalStorageDirectory().getAbsolutePath();
	}

	@JavascriptInterface
	public static String copyAssets (String path) {
		File targetFolder;

		try {
			// Log.i(LOG_TAG, "Copying " + path);
			// StringBuilder contents = new StringBuilder();
			targetFolder = new File(MainActivity.getInstance().webAppInterface.homeFolder());
			assetManager = mContext.getAssets();
			String sources[] = assetManager.list(path);

			if (sources.length == 0) {
				// contents.append("Copying " + path + " @ ");
				// contents.append(copyAssetFileToFolder(path, targetFolder) + " bytes");
				copyAssetFileToFolder(path, targetFolder);
			} else {
				if (path.startsWith("images") || path.startsWith("sounds") || path.startsWith("webkit")) {
					// Log.i(LOG_TAG, "  > Skipping " + path);
				}

				File targetDir = new File(targetFolder, path);
				targetDir.mkdirs();

				for (String source : sources) {
					String fullSourcePath = path.equals("") ? source : (path + File.separator + source);
					// contents.append(copyAssets(fullSourcePath) + "\n");
					copyAssets(fullSourcePath);
				}
			}

			// return contents.toString().replace("\n\n", "\n");
			return targetFolder.toString() + "/gitui";
		}
    catch (Exception e) {
			// return "error: " + e.toString();
			return "";
		}
	}

	private static String copyAssetFileToFolder (String fullAssetPath, File targetBasePath) throws Exception {
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

		in.close();
		out.flush();
		out.close();

		return "" + total;
	}
}
