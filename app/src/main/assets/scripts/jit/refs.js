'use strict'

/* global Android, fs, path */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function refs (pathname) {
  const headPath = path.join(pathname, 'HEAD')

  async function updateHead (oid) {
    const result = JSON.parse(await Android.updateHead(headPath, oid))

    if (typeof result.error !== 'undefined') {
      throw new Error(result.error)
    }
  }

  async function readHead () {
    if (await fs.exists(headPath)) {
      return await fs.readFile(headPath)
    } else {
      return ''
    }
  }

  return {
    headPath,
    updateHead,
    readHead
  }
}
