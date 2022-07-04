'use strict'

/* global Android, path, gitify */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function tree (e) {
  const entries = {}

  const type = 'tree'

  const DIRECTORY_MODE = 40000

  function build (ents) {
    const entryKeys = Object.keys(ents)
      .sort((a, b) => a.name < b.name)

    // setStatus(`entryKeys=${JSON.stringify(entryKeys)}`)

    const root = tree()
    let parents

    for (e of entryKeys) {
      // setStatus('e = "' + e + '"')

      parents = ents[e].parentDirs()

      // setStatus(`parents=${parents}`)

      root.addEntry(parents, ents[e])
    }

    // setStatus(`root=${JSON.stringify(root)}`)

    return root
  }

  function addEntry (parents, entry) {
    // setStatus(`parents=${parents} entry=${entry.name}`)

    if (parents.length === 0) {
      entries[path.basename(entry.name)] = entry
    } else {
      if (typeof entries[path.basename(parents)] === 'undefined') {
        entries[path.basename(parents)] = tree()

        entry.name = entry.name.substring(
          entry.name.indexOf('/') + 1)

        entries[path.basename(parents)].addEntry(parents.split('/').slice(1).join('/'), entry)
      }
    }
  }

  async function traverse (db, root) {
    // setStatus(`traversing=${JSON.stringify(entries, null, 2)}`)

    for (e of Object.keys(entries)) {
      if (entries[e].type === 'tree') {
        // setStatus(`Found tree ${e}`)

        await entries[e].traverse(db, entries[e])
      } else {
        // setStatus(`Found blob ${e}`)
      }
    }

    root.oid = Android.sha1Hex(gitify('tree', root))

    await db.store('tree', root)

    return root.oid
  }

  function toString () {
    // setStatus(`entries=${JSON.stringify(entries)}`)

    return Object.keys(entries)
      .map((e) => `${entries[e].mode()} ${e}\0${entries[e].oid}`)
      .join('')
  }

  function mode () {
    return DIRECTORY_MODE
  }

  return {
    type,
    oid: '',
    build,
    addEntry,
    traverse,
    toString,
    mode
  }
}
