An implementation of Jit (from the book *Building Git* by James Coglan) using Android to give a WebView NodeJS-like functionality for filesystem access, path, sha1 hash, and zlib inflate/deflate support. Built using AIDE on Android 10.


The UI was built long before the functionality, and they haven't been attached yet, so the only button that really matters yet is "!" (self-test). The rest of the UI does respond to actions (where applicable), but just doesn't do anything.


Currently, the jit implementation (but not app itself) supports:


* init(<folder>)

* setAuthor(<name@mail>)

* commit(<message>)

* catfile(<path to tree|blob|commit>)
