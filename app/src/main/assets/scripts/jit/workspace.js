'use strict'

/* global Android, fs, path */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function workspace (pathArg) {
  const IGNORE = ['.', '..', '.git']
  const pathname = pathArg
  const base = path.basename(pathname)

  // setStatus(`base=${base}`)

  async function listFiles (p) {
    if (typeof p === 'undefined') {
      p = pathname
    }

    const result = await fs.readdir(p)

    // setStatus(result)

    const listing = result.filter((e) => IGNORE.indexOf(e) === -1)

    let list = []
    let filePath

    for (const f of listing) {
      filePath = path.join(p, f)

      list.push(filePath)

      // setStatus(`filePath=${filePath}`)

      if (await Android.isDir(filePath)) {
        const nested = await listFiles(filePath)

        for (let i = 0; i < nested.length; i++) {
          list.push(nested[i])
        }
      }
    }

    list = list.map((f) => {
      // setStatus(`f=${f}`)

      const baseIndex = f.indexOf(base)

      if (baseIndex > -1) {
        f = f.slice(baseIndex + base.length + 1)
      }

      // setStatus(`f=${f}`)

      return f
    })

    // setStatus(`list=${list}`)

    return list
  }

  return {
    pathname,
    base,
    listFiles,
    readFile: async function readFile (f) {
      return await fs.readFile(f)
    },
    statFile: async function statFile (f) {
      return await fs.stat(f)
    }
  }
}
