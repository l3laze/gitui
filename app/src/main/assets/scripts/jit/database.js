'use strict'

/* global fs, path, util, zlib */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function database (p) {
  const pathname = path.join(p, 'objects')

  function generateTempName () {
    // https://stackoverflow.com/a/12502559/7665043
    return 'tmp_obj' + Math.random().toString(36).slice(2)
  }

  async function writeObject (oid, content) {
    const dir = path.join(pathname, oid.substring(0, 2))
    const objectPath = path.join(dir, oid.substring(2))
    const tempPath = path.join(dir, generateTempName())

    if (!await fs.exists(objectPath)) {
      if (!await fs.exists(dir)) {
        await fs.mkdirp(dir)
      }

      const compressed = await zlib.deflate(content)

      await fs.writeFile(tempPath, compressed)
      await fs.rename(tempPath, objectPath)
      await fs.delete(tempPath)
    }
  }

  async function store (head, object) {
    // setStatus(`store oid=${object.oid}`)

    const content = gitify(head, object)

    await writeObject(object.oid, content)
  }

  return {
    pathname,
    generateTempName,
    store
  }
}
