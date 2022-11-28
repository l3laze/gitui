'use strict'

/* global Android, setStatus, fs, toHex, hexToString, hexViewFormat */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function index (p) {
  /* eslint camelcase: ["error", {allow: [".time_nsec"]}] */
  const indexPath = p
  const entryFields = {
    ctime: 'ctimeMs',
    ctime_nsec: '',
    mtime: 'mtimeMs',
    mtime_nsec: '',
    dev: 'dev',
    ino: 'ino',
    mode: 'mode',
    uid: 'uid',
    gid: 'gid',
    size: 'size',
    oid: '',
    flags: '',
    path: ''
  }

  const entries = {}
  const changed = false

  const ENTRY_BLOCK = 8

  function createEntry (targetPath, oid, stat) {
    const REG_MODE = parseInt('0100660', 8)
    const EXE_MODE = parseInt('0100755', 8)
    const MAX_PATH_SIZE = 0xfff

    const mode = stat.executable ? EXE_MODE : REG_MODE
    const flags = ((2 << 8) >>> 0) | Math.min(targetPath.length, MAX_PATH_SIZE)

    // setStatus(['createEntry', targetPath, oid, JSON.stringify(stat)].join(', '))

    const obj = {}

    for (const e of Object.keys(entryFields)) {
      if (e === 'mode') {
        obj.mode = mode
      } else if (e === 'oid') {
        obj.oid = oid
      } else if (e === 'flags') {
        obj.flags = flags
      } else if (e === 'path') {
        obj.path = targetPath
      } else if (e === 'ctime_nsec' || e === 'mtime_nsec') {
        obj[e] = 0
      } else {
        obj[e] = stat[entryFields[e]]
      }
    }

    function toString () {
      let result = ''
      let single

      for (const e of Object.keys(entryFields).slice(0, 10)) {
        single = toHex(parseInt(obj[e]) >>> 0, 8)

        result += single

        // setStatus([e, single, parseInt(obj[e]) >>> 0].join(','))
      }

      result += obj.oid

      // setStatus(['oid', '=', obj.oid].join(' '))

      const fl = toHex(parseInt(obj.flags), 4)

      // setStatus(['flags', fl, obj.flags].join(','))

      result += fl

      result += obj.path

      // setStatus('path = ' + obj.path)

      let padding = '\0'

      do {
        padding += '\0'
      } while ((padding.length + result.length) % ENTRY_BLOCK !== 0)

      // setStatus('toString.padding = ' + padding.length)

      // setStatus('toString.length = ' + (result.length + padding.length))

      return result + padding.substring(1)
    }

    return {
      stat: {
        ctime: obj.ctime,
        ctime_nsec: 0,
        mtime: obj.mtime,
        mtime_nsec: 0,
        dev: obj.dev,
        ino: obj.ino,
        mode: obj.mode,
        uid: obj.uid,
        gid: obj.gid,
        size: obj.size
      },
      oid: obj.oid,
      flags: obj.flags,
      path: obj.path,
      toString
    }
  }

  function removeConflicts (that, p) {
    // setStatus('Removing conflicts: ' + p + ' and [' + keys.join(', ') + ']')

    const ps = p.split('/')

    if (ps.length === 1) return

    const parent = ps.slice(0, -1).join('/')

    if (typeof that.entries[parent] !== 'undefined') {
      delete that.entries[parent]
      that.changed = true

      // setStatus('Removed from index: ' + parent + '. Remaining: [' + Object.keys(that.entries).join(', ') + ']')
    }
  }

  async function add (that, p, oid, stat) {
    removeConflicts(that, p)

    const entry = createEntry(p, oid, stat)

    that.entries[p] = entry

    that.changed = true

    // setStatus('Added to index: ' + p + '. entries: ' + Object.keys(that.entries))
  }

  function readIndexHeader (data) {
    const SIGNATURE = 'DIRC'
    const VERSION = 2

    const sig = hexToString(data.substring(0, 8))

    const ver = parseInt(data.substring(8, 16))
    const count = parseInt(data.substring(16, 24))

    // setStatus([sig, ver, count].join(', '))

    if (sig !== SIGNATURE) {
      throw new Error(`Index signature mismatch. Expected ${SIGNATURE}, found ${sig}.`)
    } else if (ver !== VERSION) {
      throw new Error(`Index version mismatch. Expected ${VERSION}, found ${ver}.`)
    }

    return count
  }

  function readIndexEntries (that, data, count) {
    const rawEntries = []

    let entry
    let u32
    let offset = 0
    let entryLength

    setStatus('---- Parsing Index ----')

    setStatus(hexViewFormat(data))

    for (let i = 0; i < count; i++) {
      entry = {
        stat: {}
      }

      entryLength = 0

      // setStatus(data.substring(offset))

      for (const x of Object.keys(entryFields).slice(0, 10)) {
        u32 = parseInt(data.substring(offset, offset + 8), 16) >>> 0

        entry.stat[x] = u32
        offset += 8
        entryLength += 4

        // setStatus([x, '=', u32].join(' '))
      }

      entry.oid = hexToString(data.substring(offset, offset + 80))
      offset += 80
      entryLength += 20

      entry.flags = parseInt(data.substring(offset, offset + 4), 16) >>> 0
      offset += 4
      entryLength += 2

      let nextHex = data.substring(offset, offset + 2)
      offset += 2
      entryLength++

      entry.path = ''

      while (nextHex !== '00') {
        // setStatus(['next', nextHex, 'offset', offset].join(', '))

        entry.path += hexToString(nextHex)

        nextHex = data.substring(offset, offset + 2)

        offset += 2
        entryLength++
      }

      offset += 4
      entryLength++

      let parsedPadding = 0

      do {
        offset += 2
        entryLength++

        // eslint-disable-next-line no-unused-vars
        parsedPadding++
      } while (entryLength % 8 !== 0)

      // setStatus('parsedPadding = ' + parsedPadding)
      // setStatus('entryLength = ' + entryLength)

      setStatus(JSON.stringify(entry))

      entry = createEntry(entry.path, entry.oid, entry.stat)

      const raw = entry.toString()

      rawEntries.push(raw)

      that.entries[entry.path] = entry
    }

    return rawEntries
  }

  async function loadIndex (that) {
    that.entries = {}
    that.changed = false

    if (await fs.exists(that.pathTo) && await Android.beginLoadingIndex(that.pathTo)) {
      const data = await fs.readFileAsHex(that.pathTo)
      const entryCount = readIndexHeader(data.slice(0, 24))
      const rawEntries = readIndexEntries(that, data.slice(24, -40), entryCount)

      const result = await Android.verifyChecksum(rawEntries, data.slice(-40))

      if (result.indexOf('error"') > -1) {
        throw new Error(JSON.parse(result).error)
      }
    }
  }

  return {
    pathTo: indexPath,
    entries,
    changed,
    createEntry,
    add,
    loadIndex
  }
}
