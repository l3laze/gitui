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


public class WebAppInterface {
	static Context mContext;
	static AssetManager assetManager;
  static boolean storagePermission = false;

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
	public static boolean isFile (String path) {
		return new File(path).isFile();
	}

	@JavascriptInterface
	public static boolean isDir (String path) {
		return new File(path).isFile();
	}

	@JavascriptInterface
	public static Boolean fileExists (String path) {
		return Files.exists(Paths.get(path)) && Files.isReadable(Paths.get(path));
	}

	@JavascriptInterface
	public static void makeDir (String path) {
		try {
			Files.createDirectories(Paths.get(path));
		}
    catch (IOException ioe) {
		}
	}

	@JavascriptInterface
	public static boolean removePath (String path) {
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
	public static String readDir (String path) {
		StringBuilder dirList = new StringBuilder();
		File d = new File(path);
		File[] list = d.listFiles();

		for (int i = 0; i < list. length; i++) {
			dirList.append("\n" + list[ i ].getName());
		}

		return dirList.toString();
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
	public static String copyAssets (String path) {
		File targetFolder;

		try {
			// Log.i(LOG_TAG, "Copying " + path);
			// StringBuilder contents = new StringBuilder();
			targetFolder = new File(Environment.getExternalStorageDirectory().getAbsolutePath());
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
