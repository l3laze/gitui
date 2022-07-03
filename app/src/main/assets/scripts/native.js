'use strict'

/* global Android, event */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
const fs = {
  exists: async function fileExists (path) {
    if (Android.havePermission()) {
      const result = await Android.fileExists(path)
      return result
    }
  },

  readFile: async function readFile (path) {
    if (Android.havePermission()) {
      const result = await Android.readFile(path)

      if (result.indexOf('"error') !== -1) {
        throw new Error(JSON.parse(result).error)
      }

      return result
    }
  },

  readFileAsHex: async function readFileAsHex (path) {
    if (Android.havePermission()) {
      const result = await Android.readFileAsHex(path)

      if (result.indexOf('"error') !== -1) {
        throw new Error(JSON.parse(result).error)
      }

      return result
    }
  },

  writeFile: async function writeFile (path, data) {
    if (Android.havePermission()) {
      await Android.writeFile(path, data)
    }
  },

  mkdir: async function mkdir (path) {
    if (Android.havePermission()) {
      await Android.makeDirectory(path)
    }
  },

  mkdirp: async function mkdirp (path) {
    if (Android.havePermission()) {
      await Android.makeDirectoryTree(path)
    }
  },

  rename: async function rename (from, to) {
    if (Android.havePermission()) {
      await Android.move(from, to)
    }
  },

  stat: async function stat (path) {
    if (Android.havePermission()) {
      const result = await Android.stat(path)

      if (result.indexOf('"error') !== -1) {
        throw new Error(JSON.parse(result).error)
      }

      return JSON.parse(result)
    }
  },

  readdir: async function readdir (path) {
    if (Android.havePermission()) {
      const result = await Android.readDir(path)

      if (result.indexOf('"error') !== -1) {
        throw new Error(JSON.parse(result).error)
      }

      return result.split(',')
    }
  },

  delete: async function deletePath (path) {
    if (Android.havePermission()) {
      await Android.delete(path)
    }
  },

  rimraf: async function rimraf (path) {
    if (Android.havePermission()) {
      await Android.rimraf(path)
    }
  }
}

// eslint-disable-next-line no-unused-vars
const path = {
  normalize: (p) => Android.normalize(p),
  relativize: (from, to) => Android.relativize(from, to),

  basename: (p) => Android.basename(p),
  dirname: (p) => Android.dirname(p),

  getAbsolutePath: (p) => Android.getAbsolutePath(p),

  join: (...args) => args.slice(1).reduce((a, b) => a + '/' + b, args.slice(0, 1))
}

// eslint-disable-next-line no-unused-vars
const zlib = {
  deflate: async function deflate (input) {
    const result = await Android.zlibDeflate(input)

    if (result.indexOf('"error') !== -1) {
      throw new Error(JSON.parse(result).error)
    }

    return result
  },
  inflate: async function inflate (input) {
    const result = await Android.zlibInflate(input)

    if (result.indexOf('"error') !== -1) {
      throw new Error(JSON.parse(result).error)
    }

    return result
  }
}

// eslint-disable-next-line no-unused-vars
function copyText (text) {
  if (typeof Android !== 'undefined') {
    Android.copyToClipboard(text)

    if (parseInt(Android.androidVersion()) > 27) {
      Android.showToast('Copied to Clip Tray')
    }
  } else {
    navigator.clipboard.writeText(text)
      .then(function () {}, function () {})
  }

  if (typeof event !== 'undefined') {
    event.stopPropagation()
  }
}
