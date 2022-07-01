'use strict'

/* global Android, addInit, addImport, event */
/* eslint no-undef: "error" */

function setStatus (text) {
  const stat = document.getElementById('status')

  if (stat.value !== '') {
    stat.value += '\n'
  }

  stat.value += text
  stat.scrollTop = stat.scrollHeight
}

function capture (msg, source, line, column, err) {
  setStatus('"' + msg + '" in "' +
    source + '" at line ' + line +
    ', character ' + column + '.' + '\n' + err.toString())

  return true
}

window.onerror = capture

/*
 * UI functionality
 */

// eslint-disable-next-line no-unused-vars
function initCustomization () {
  if (Android.havePermission()) {
    const externalHome = Android.copyAssets('gitui')

    setStatus(externalHome)

    setTimeout(function () {
      window.location = externalHome + '/index.html'
    }, 1000)
  } else {
    const message = 'Requires storage access'

    if (Android) {
      Android.showToast(message)
    }

    setStatus(message)
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

  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
function toggleDisplay (eid, displayAs) {
  const el = document.getElementById(eid)

  if (el.style.display === 'none') {
    el.style.display = displayAs

    if (el.tagName === 'INPUT') {
      el.focus()
    }
  } else {
    el.style.display = 'none'
  }
}

// eslint-disable-next-line no-unused-vars
function toggleFooter () {
  const statusBar = document.getElementById('statusBar')

  if (statusBar.style.display === 'none') {
    statusBar.style.display = 'inline-block'
  } else {
    statusBar.style.display = 'none'
  }
}

// eslint-disable-next-line no-unused-vars
function searchRepos (text) {
  const repos = document.getElementsByClassName('repo-card')

  text = text.toLowerCase()

  for (const r of repos) {
    const repoName = r.querySelector('.repo-name').innerText

    if (text !== '' && repoName.indexOf(text) < 0) {
      r.style.display = 'none'
    } else {
      r.style.display = 'block'
    }
  }
}

// eslint-disable-next-line no-unused-vars
function createRepo (way) {
  setStatus('Creating repo via ' + way + '...')
}

// eslint-disable-next-line no-unused-vars
function openRepo (which) {
  setStatus('Opening ' + which)
  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
function pullRepo (which) {
  const behind = event.target.querySelector('.commitsBehind') || event.target.parentElement.querySelector('.commitsBehind')

  behind.innerText = '0'

  setStatus('Pulled ' + which)
  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
function pushRepo (which) {
  const ahead = event.target.querySelector('.commitsAhead') || event.target.parentElement.querySelector('.commitsAhead')

  ahead.innerText = '0'

  setStatus('Pushed ' + which)
  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
function openModal (title) {
  const modal = document.getElementById('modal')

  const modes = [
    'settings',
    'add'
  ]

  for (const m of modes) {
    if (title.toLowerCase().indexOf(m) === -1) {
      document.getElementById(m + 'Modal').style.display = 'none'
    } else {
      document.getElementById(m + 'Modal').style.display = 'block'

      modal['data-mode'] = m
    }
  }

  modal.style.display = 'block'
  document.getElementById('modal_title').innerText = title

  setStatus('Opened modal for ' + title)
}

// eslint-disable-next-line no-unused-vars
function cancelModal () {
  document.getElementById('modal').style.display = 'none'

  setStatus('Cancelled modal')
}

// eslint-disable-next-line no-unused-vars
function okModal () {
  const modal = document.getElementById('modal')

  modal.style.display = 'none'

  if (modal['data-mode'] === 'settings') {
    // saveSettings()
  } else {
    createRepo(modal.querySelector('.add-btn.w3-black').innerText)
  }
}

// eslint-disable-next-line no-unused-vars
function openTab (which, whatClass, btnClass) {
  const controls = {
    clone: ['repoSource', 'repoPath', 'cloneRecursively'],
    init: ['repoPath'],
    import: ['repoPath'],
    app: ['settingsApp'],
    git: ['settingsGit']
  }

  const els = document.getElementsByClassName(whatClass)
  const btns = document.getElementsByClassName(btnClass)

  for (const e of els) {
    e.style.display = 'none'
  }

  for (const b of btns) {
    b.classList.remove('w3-black')
  }

  for (const c of controls[which.toLowerCase()]) {
    document.getElementById(c).style.display = 'inline'
  }

  event.target.classList.add('w3-black')
}

function clickWin (event) {
  if (event.target.className.indexOf('w3-modal') > -1) {
    cancelModal()
  }
}

// eslint-disable-next-line no-unused-vars
function toggleStatus () {
  const sb = document.getElementById('statusBar')
  const ta = document.getElementById('status')
  const xs = document.getElementById('xstatus')

  sb.style.height = (sb.style.height !== '96.18%'
    ? '96.18%'
    : '')

  if (sb.style.height === '') {
    ta.style.height = '8em'
    xs.innerText = 'Expand'
  } else {
    ta.style.height = '98.3%'
    xs.innerText = 'Collapse'
  }

  ta.scrollTop = ta.scrollHeight
}

// eslint-disable-next-line no-unused-vars
function collapseStatus () {
  const xs = document.getElementById('xstatus')

  if (xs.innerText === 'Collapse') {
    toggleStatus()
  }
}

function unloading () {
  window.removeEventListener('error', capture)
  window.removeEventListener('unload', unloading)
  window.removeEventListener('click', clickWin)
  // window.location = 'about:blank'
}

window.addEventListener('unload', unloading)

window.addEventListener('click', clickWin)

/*
 *
 * Native functionality
 *
 */

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
  },

  du: async function du (path) {
    if (Android.havePermission()) {
      const result = await Android.sizeOnDisk(path)
      return result
    }
  }
}

const path = {
  normalize: (p) => Android.normalize(p),
  relativize: (from, to) => Android.relativize(from, to),

  basename: (p) => Android.basename(p),
  dirname: (p) => Android.dirname(p),

  getAbsolutePath: (p) => Android.getAbsolutePath(p),

  join: (...args) => args.slice(1).reduce((a, b) => a + '/' + b, args.slice(0, 1))
}

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

/*
 *
 * Utilities
 *
 */

const util = {
  gitify: function gitify (header, object) {
    // setStatus(`object = ${object}`)

    const string = object.toString()

    return `${header} ${string.length}\0${string}`
  }
}

function hexViewFormat (hex) {
  let bytes = 0
  let output = ''
  let line = ''
  let text = ''
  let ch = 0

  for (let i = 0; i < hex.length; i += 2) {
    line += hex.substring(i, i + 2) + ' '
    ch = parseInt(hex.substring(i, i + 2), 16)

    bytes++

    text += (ch > 30 && ch < 128)
      ? String.fromCharCode(ch)
      : '.'

    if (bytes === 4) {
      line += '| '
    } else if (bytes === 8 || i + 2 > hex.length) {
      output += line + ' || ' + text + '\n'
      bytes = 0
      text = ''
      line = ''
    }
  }

  return output
}

function toHex (o, padTo = 0) {
  let h

  if (typeof o === 'number') {
    h = o.toString(16)
  } else if (typeof o === 'string') {
    h = [...o]
      .map((c) => c.charCodeAt().toString(16))
      .join('')
  } else {
    throw new Error('toHex can only convert from number or string.')
  }

  while (h.length < padTo) {
    h = '0' + h
  }

  return h
}

function hexToString (h) {
  let string = ''

  for (let x = 0; x < h.length; x += 2) {
    string += String.fromCharCode(parseInt(h.substring(x, x + 2), 16))
  }

  return string
}

/*
 *
 * Git functionality
 *
 */

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

    const content = util.gitify(head, object)

    await writeObject(object.oid, content)
  }

  return {
    pathname,
    generateTempName,
    store
  }
}

function blob (d) {
  const data = d
  const type = 'blob'

  function toString () {
    return data
  }

  return {
    type,
    toString,
    oid: ''
  }
}

function entry (n, o, s) {
  const name = n
  const oid = o
  const stats = s

  const EXECUTABLE_MODE = '100755'
  const REGULAR_MODE = '100660' // Normally 100644

  function mode () {
    return (stats.mode & parseInt('1', 2)) !== 0
      ? EXECUTABLE_MODE
      : REGULAR_MODE
  }

  function parentDirs () {
    const dir = this.name.substring(
      0,
      this.name.lastIndexOf('/')
    )

    // setStatus(`name=${this.name} dir=${dir}`)

    return dir
  }

  return {
    name,
    oid,
    stats,
    mode,
    parentDirs
  }
}

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

    root.oid = Android.sha1Hex(util.gitify('tree', root))

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

function authorObject (name, email, time) {
  return `${name} <${email}> ${time}`
}

function commitObject (p, t, a, m) {
  const parent = p
  const tree = t
  const author = a
  const message = m

  const type = 'commit'

  function toString () {
    const lines = [
      `tree ${tree}`,
      `author ${author}`,
      `committer ${author}`,
      '',
      message
    ]

    if (parent !== '') {
      lines.splice(1, 0, parent)
    }

    return lines.join('\n')
  }

  return {
    type,
    toString
  }
}

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

  let entries = {}
  let changed = false

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

      return result + padding
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

  async function add (p, oid, stat) {
    const entry = createEntry(p, oid, stat)

    entries[p] = entry

    changed = true
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

  function readIndexEntries (data, count) {
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

      entries[entry.path] = entry
    }

    return rawEntries
  }

  async function loadIndex () {
    entries = {}
    changed = false

    if (await fs.exists(indexPath) && await Android.beginLoadingIndex(indexPath)) {
      const data = await fs.readFileAsHex(indexPath)
      const entryCount = readIndexHeader(data.slice(0, 24))
      const rawEntries = readIndexEntries(data.slice(24, -40), entryCount)

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

function jit (repoPath) {
  const workspacePath = path.getAbsolutePath(repoPath)
  const gitPath = path.join(workspacePath, '.git')
  const indexPath = path.join(gitPath, 'index')

  const workspaceObj = workspace(workspacePath)
  const databaseObj = database(gitPath)
  const refsObj = refs(gitPath)
  const indexObj = index(indexPath)

  const config = {
    author: {
      name: '',
      email: ''
    }
  }

  async function init () {
    for (const dir of ['objects', 'refs']) {
      await fs.mkdirp(path.join(workspacePath, '.git', dir))
    }

    setStatus(`Initialized empty Jit repository in ${workspacePath}`)
  }

  async function commit (message) {
    if (config.author.name === '' || config.author.email === '') {
      throw new Error('Author name and email must be set before committing.')
    }

    const entries = {}
    const files = await workspaceObj.listFiles()

    // setStatus(`files=${files}`)

    for (let i = 0; i < files.length; i++) {
      if (await Android.isDir(path.join(workspacePath, files[i]))) {
        continue
      }

      const data = await workspaceObj.readFile(path.join(workspacePath, files[i]))

      const blobObj = blob(data)

      blobObj.oid = Android.sha1Hex(util.gitify('blob', blobObj))

      await databaseObj.store('blob', blobObj)

      const blobPath = path.join(repoPath, files[i])

      // setStatus(`blobPath=${blobPath} files[i]=${files[i]}`)

      const stats = await fs.stat(blobPath)

      entries[files[i]] = entry(files[i], blobObj.oid, stats)

      // setStatus(`entries[${i}]=${JSON.stringify(entries[i])}`)
    }

    const root = tree().build(entries)

    const treeOid = await root.traverse(databaseObj, root)

    const parent = await refsObj.readHead()

    const authorObj = authorObject(config.author.name, config.author.email, new Date())
    const commitObj = commitObject(parent, treeOid, authorObj, message)

    commitObj.oid = Android.sha1Hex(util.gitify('commit', commitObj))

    await databaseObj.store('commit', commitObj)

    await refsObj.updateHead(commitObj.oid)

    const isRoot = (parent === '' ? '(root-commit) ' : '')

    setStatus(`[${isRoot}${commitObj.oid}] ${message.split('\n').slice(0, 1)}`)
  }

  async function add (...targets) {
    let files, data, stat, blobObj

    for (const t of targets) {
      // setStatus(`t = ${t}`)

      // t = path.join(workspaceObj.pathname, t)

      // setStatus(`t = ${t}`)

      if (await Android.isDir(t)) {
        files = await workspaceObj.listFiles(t)
      } else {
        files = [t]
      }

      // setStatus(`files = ${files.join(', ')}`)

      for (const f of files) {
        // setStatus(`f = ${f}`)

        const base = path.basename(f)

        let filePath = path.join(t, base)

        if (t === f) {
          filePath = t
        }

        // setStatus(`filePath = ${filePath}`)

        data = await workspaceObj.readFile(filePath)
        stat = await workspaceObj.statFile(filePath)

        blobObj = blob(data)
        blobObj.oid = await Android.sha1Hex(util.gitify('blob', data))

        await databaseObj.store('blob', blobObj)

        await indexObj.add(path.relativize(workspacePath, filePath), blobObj.oid, stat)
      }

      const sortedEntries = Object.keys(indexObj.entries)
        .sort((a, b) => path.basename(a) < path.basename(b))
        .map((e) => indexObj.entries[e].toString())

      // setStatus('indexPath = ' + indexPath + '\nentries = ' + sortedEntries.join(',') + '\nchanged = ' + indexObj.changed)

      const result = await Android.updateIndex(indexPath, sortedEntries.join(','), indexObj.changed)

      // setStatus(`result=${result}`)

      if (result.indexOf('error"') > -1) {
        throw new Error(JSON.parse(result).error)
      } else {
        indexObj.changed = (result === 'true')
      }
    }
  }

  function setAuthor (to) {
    to = to.split(' @ ')
    config.author.name = to[0]
    config.author.email = to[1]
  }

  async function catfile (file) {
    let data = await Android.zlibInflate(await fs.readFile(file))

    const parsed = []

    let type, name, size, hash, content, length

    let nextSpace = data.indexOf(' ')
    let nextNull = data.indexOf('\0')

    let mode = data.slice(0, nextSpace)

    data = data.slice(nextSpace + 1)

    if (mode === 'tree') {
      type = 'tree'

      while (data !== '') {
        /*
         * tree 51\040000 dir\019244fc55d16fc28787265b3600aba08304a2593e
         */

        nextNull = data.indexOf('\0')

        size = data.slice(0, nextNull)

        // data = data.slice(size)
        data = data.slice(nextNull + 1)

        nextSpace = data.indexOf(' ')

        mode = data.slice(0, nextSpace)

        data = data.slice(nextSpace + 1)

        nextNull = data.indexOf('\0')

        name = data.slice(0, nextNull)

        data = data.slice(nextNull + 1)

        length = 40

        hash = data.slice(0, length)

        parsed.push(`${mode} ${name} ${hash}`)

        data = data.slice(length)
      }
    } else if (mode === 'blob') {
      type = 'blob'

      nextNull = data.indexOf('\0')

      size = data.substring(0, nextNull)

      data = data.slice(nextNull + 1)

      length = parseInt(size)

      content = data.slice(0, length)

      parsed.push(`${mode} ${content}`)

      data = data.slice(length)
    } else if (mode === 'commit') {
      type = 'commit'

      nextNull = data.indexOf('\0')

      size = data.slice(0, nextNull)

      length = parseInt(size)

      data = data.slice(nextNull + 1)

      content = data.slice(0, length)

      parsed.push(`${type} ${content}`)

      data = data.slice(length)
    }

    return parsed.join('\n')
  }

  return {
    refs: refsObj,
    index: indexObj,
    config,
    init,
    commit,
    add,
    setAuthor,
    catfile
  }
}

/*
 *
 * Testing
 *
 */

function testFramework () {
  let startTime = 0
  const tests = []
  const _test = async function _test (name, testFunc, flags) {
    let result = false
    let error

    try {
      if (testFunc.constructor.name === 'AsyncFunction') {
        result = (await testFunc())
      } else {
        result = testFunc()
      }
    } catch (e) {
      error = e
      result = flags.fails || false
    }

    tests.push({
      name,
      result,
      error,
      flags
    })
  }

  const test = async function test (name, func) {
    await _test(name, func, { fails: false })
  }

  test.fails = async function fails (name, func) {
    await _test(name, func, { fails: true })
  }

  test.skip = function skip (name, func) {
    tests.push({
      name,
      skip: true
    })
  }

  test.optional = async function optional (name, func) {
    await _test(name, func, { optional: true })
  }

  test.optional.fails = async function optionalFail (name, func) {
    await _test(name, func, { optional: true, fails: true })
  }

  test.fails.optional = test.optional.fails

  test.optional.skip = test.skip
  test.skip.optional = test.skip

  test.fails.skip = test.skip
  test.skip.fails = test.skip

  test.title = async function (text, func) {
    tests.push({
      title: text
    })

    await func()
  }

  test.title.skip = function (text, func) {
    test.title(text, function () {})
  }

  function testReport (t) {
    const check = '+'
    const cross = 'x'
    const dash = '-'

    const result = {
      text: '',
      skipped: 0,
      total: 0,
      passed: 0,
      optional: 0
    }

    if (t.skip) {
      result.text = (dash + ' ' + t.name)

      result.skipped++
    } else if (t.result || (!t.result && t.flags.fails)) {
      result.text = (check + ' ' + t.name)

      result.passed++
      result.total++
    } else {
      result.text = (cross + ' ' + t.name)

      if (t.flags.optional) {
        result.optional++
      } else {
        result.total++
      }
    }

    return result
  }

  function errorReport (t) {
    return `${
      t.error.stack.split('\n')
        .map((s, i) => '  ' + s).join('\n')
    }`
  }

  function reporter () {
    const check = '+'
    const cross = 'x'
    const dash = '-'
    const lines = []

    let skipped = 0
    let total = 0
    let passed = 0
    let optional = 0
    let nextLine = ''
    let result

    for (const t of tests) {
      if (typeof t.title !== 'undefined') {
        lines.push('_'.repeat(t.title.length))
        lines.push(t.title)
        nextLine = '  '
      } else {
        result = testReport(t)

        lines.push(nextLine + result.text)

        skipped += result.skipped
        total += result.total
        passed += result.passed
        optional += result.optional
      }

      if (typeof t.error !== 'undefined') {
        lines.push(nextLine + errorReport(t))
      }
    }

    lines.push('\n-------\n')

    if (optional > 0) {
      lines.push(cross + ' ' + optional + ' optional failure(s)')
    }

    if (skipped > 0) {
      lines.push(dash + ' ' + skipped + ' skipped')
    }

    lines.push(check + ' ' + passed + ' passed')

    const percent = ('' + ((passed / total) * 100)).substring(0, 5)

    lines.push(`\n${percent}% required tests passed (${passed}/${total})`)

    const elapsedMs = Date.now() - startTime
    const elapsedTime = elapsedMs / 1000

    lines.push('\nFinished in ' + elapsedTime + 's (' + elapsedMs + 'ms)')

    return lines.join('\n')
  }

  function startTiming () {
    startTime = Date.now()
  }

  return {
    test,
    reporter,
    startTiming
  }
}

async function runTests () {
  const { test, reporter, startTiming } = testFramework()

  startTiming()

  /*
   * -------- Testing --------
   */

  await test.title('Test framework', function () {
    test('Test returning true passes', function passes () {
      return true
    })

    test.fails('Expected failure from test returning false', function failsFalse () {
      setStatus('Expecting failure 1')

      return false
    })

    test.fails('Expected failure from test throwing error', function failsThrow () {
      setStatus('Expecting failure 2')

      throw new Error('Oops')
    })

    test.optional('Optional tests may fail', function optionalFail () {
      return false
    })

    test.skip('Tests can be skipped', function skipTest () {
      throw new Error('This should never throw.')
    })
  })

  /*
   * UI tests
   */

  test.title('User interface', function () {
    const search = document.getElementById('search')
    const searchInput = document.getElementById('searchInput')

    test('Shows search input', function showSearch () {
      search.click()

      return searchInput.style.display !== 'none'
    })

    test('Hides search input', function () {
      search.click()

      return searchInput.style.display === 'none'
    })

    const add = document.getElementById('add')
    const modal = document.getElementById('modal')
    const addModal = document.getElementById('addModal')
    const addClone = document.getElementById('addClone')
    const repoSource = document.getElementById('repoSource')
    const repoPath = document.getElementById('repoPath')
    const cloneRecursively = document.getElementById('cloneRecursively')
    const xmodal = document.getElementById('xmodal')
    const cancelModal = document.getElementById('cancelModal')
    const okModal = document.getElementById('okModal')

    test('Shows modal from add', function () {
      add.click()

      return (modal.style.display !== 'none' && addModal.style.display !== 'none')
    })

    test('Changes to clone tab', function () {
      addClone.click()

      return (repoSource.style.display !== 'none' && repoPath.style.display !== 'none' && cloneRecursively.style.display !== 'none')
    })

    test('Changes to init tab', function () {
      addInit.click()

      return (repoSource.style.display === 'none' && repoPath.style.display !== 'none' && cloneRecursively.style.display === 'none')
    })

    test('Changes to import tab', function () {
      addImport.click()

      return (repoSource.style.display === 'none' && repoPath.style.display !== 'none' && cloneRecursively.style.display === 'none')
    })

    test('Hides modal after click outside of it', function () {
      modal.click()

      return modal.style.display === 'none'
    })

    test('Hides modal when X is clicked', function () {
      add.click()
      xmodal.click()

      return modal.style.display === 'none'
    })

    test('Hides modal when Cancel is clicked', function () {
      add.click()
      cancelModal.click()

      return modal.style.display === 'none'
    })

    test('Hides modal when Ok is clicked', function () {
      add.click()
      okModal.click()

      return modal.style.display === 'none'
    })
  })

  /*
   * Filesystem tests
   */

  await test.title('Filesystem', async function () {
    await test('Write file', async function () {
      await fs.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

      return true
    })

    await test('Read file', async function () {
      const data = await fs.readFile(Android.homeFolder() + '/.gitui-test-file.txt')

      return data === 'Hello, world!'
    })

    await test('File exists', async function () {
      const result = await fs.exists(Android.homeFolder() + '/.gitui-test-file.txt')

      return result
    })

    await test('Rename', async function () {
      await fs.rename(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test.txt')

      const result = await fs.exists(Android.homeFolder() + '/.gitui-test.txt')

      return result
    })

    await test('Make directory', async function () {
      await fs.mkdir(Android.homeFolder() + '/.gitui-test')

      return (await fs.exists(Android.homeFolder() + '/.gitui-test'))
    })

    await test('Read directory', async function () {
      await fs.writeFile(Android.homeFolder() + '/.gitui-test/.gitui-test1.txt', '')
      await fs.writeFile(Android.homeFolder() + '/.gitui-test/.gitui-test2.txt', '')

      const result = (await fs.readdir(Android.homeFolder() + '/.gitui-test'))

      return result.includes('.gitui-test1.txt', '.gitui-test2.txt')
    })

    await test('Disk usage', async function () {
      const result = await fs.du(Android.homeFolder() + '/.gitui-test')

      if (result.indexOf('error') !== -1) {
        throw new Error(JSON.parse(result).error)
      }

      return (result !== '')
    })

    await test('Can stat', async function () {
      const resultStat = (await fs.stat(Android.homeFolder() + '/.gitui-test'))

      if (resultStat.error) {
        throw new Error(resultStat.error)
      }

      return true
    })

    await test('Remove directory', async function () {
      await fs.rimraf(Android.homeFolder() + '/.gitui-test')

      const result = await fs.exists(Android.homeFolder() + '/.gitui-test')

      return !result
    })

    await test('Delete path', async function () {
      await fs.delete(Android.homeFolder() + '/.gitui-test.txt')

      const result = await fs.exists(Android.homeFolder() + '/.gitui-test.txt')

      return !result
    })
  })

  /*
   *
   * Git/jit
   *
   */

  await test.title('Git/Jit', async function () {
    await test('Workspace.listFiles', async function testWorkspaceListFiles () {
      await fs.mkdir(Android.homeFolder() + '/gitui-test')
      const ws = workspace(Android.homeFolder() + '/gitui-test')

      const files = ['bye.txt', 'hi.txt']

      await fs.writeFile(path.join(ws.pathname, files[0]), 'goodbye workspace')
      await fs.writeFile(path.join(ws.pathname, files[1]), 'hello workspace')

      const list = await ws.listFiles()

      return list.filter((i) => files.indexOf(i) !== -1)
        .length > 0
    })

    await test('Workspace.readFile', async function testWorkspaceListFiles () {
      await fs.mkdir(Android.homeFolder() + '/gitui-test')
      const ws = workspace(Android.homeFolder() + '/gitui-test')
      const data = 'hello, workspace!'
      const filename = 'hello.txt'

      await fs.writeFile(path.join(ws.pathname, filename), data)

      const result = await ws.readFile(path.join(ws.pathname, filename))

      if (result !== data) {
        throw new Error(`workspace.readFile('${filename}') - "${result}" !== "${data}"`)
      }

      return true
    })

    test('Database.generateTempName', function gen () {
      const db = database(path.join(Android.homeFolder(), 'gitui-test'))
      const t = db.generateTempName()

      return /tmp_obj.*/.test(t)
    })

    await test('Database.store', async function dbStore () {
      const gitPath = path.join(Android.homeFolder(), 'gitui-test', '.git')
      const object = blob('hello world')
      const db = database(gitPath)

      object.oid = Android.sha1Hex(util.gitify('blob', object))

      await db.store('blob', object)

      return (await fs.exists(path.join(gitPath, 'objects', object.oid.substring(0, 2), object.oid.substring(2))))
    })

    test('Blob test', function testBlob () {
      const data = 'Blob'
      const blobby = blob(data)

      return (blobby.toString() === data && blobby.type === 'blob')
    })

    test('Entry test', function testEntry () {
      const e = entry('hello', 'world')

      return (e.name === 'hello' && e.oid === 'world')
    })

    test('Tree test', function testTree () {
      const e = entry('hello', toHex('world'), { mode: 33200 })
      const t = tree().build({
        [e.name]: e
      })

      // hello\0776f726c64 as a contiguous string was crashing the script. Lol.
      return (t.toString() === '100660 hello\0' + '776f726c64' && t.type === 'tree')
    })

    test('author returns formatted string', function testAuthor () {
      const now = new Date()
      const auth = authorObject('Tom', 't@b.c', now)

      return auth === `Tom <t@b.c> ${now}`
    })

    await test('zlib deflate, inflate', async function () {
      const data = 'hello world'

      const deflated = await Android.zlibDeflate(data)
      const inflated = await Android.zlibInflate(deflated)

      return data === inflated
    })

    test('jit author', function testSetAuthor () {
      const repoPath = path.join(Android.homeFolder(), 'gitui-test')

      const jitObj = jit(repoPath)

      jitObj.setAuthor('Tom @ l3l_aze')

      return jitObj.config.author.name === 'Tom' &&
        jitObj.config.author.email === 'l3l_aze'
    })

    await test('jit init', async function testInit () {
      const repoPath = path.join(Android.homeFolder(), 'gitui-test')
      await jit(repoPath).init()

      return (await fs.exists(path.join(repoPath, '.git')))
    })

    await test('root-commit', async function testCommit () {
      const repoPath = path.join(Android.homeFolder(), 'gitui-test')

      const jitObj = await jit(repoPath)
      jitObj.setAuthor('Tom @ l3l_aze')
      await jitObj.commit('Testing...')

      return (await fs.exists(path.join(repoPath, '.git', 'HEAD')))
    })

    await test('nested tree commit', async function testNestedTree () {
      await fs.rimraf(path.join(Android.homeFolder(), 'gitui-test'))

      const repoPath = path.join(Android.homeFolder(), 'gitui-test')

      const jitObj = await jit(repoPath)
      jitObj.setAuthor('Tom @ l3l_aze')

      const oldHead = await jitObj.refs.readHead()

      await fs.mkdirp(path.join(repoPath, 'dir1'))
      await fs.writeFile(path.join(repoPath, 'dir1', 'hello.txt'), 'hai!')

      await jitObj.commit('Nested tree')

      const head = await jitObj.refs.readHead()
      const commitFile = path.join(repoPath, '.git', 'objects', head.slice(0, 2), head.slice(2))

      const catCommit = await jitObj.catfile(commitFile)
      const commitTree = catCommit.split('\n')[0]
        .split(' ')[2]

      const treeFile = path.join(repoPath, '.git', 'objects', commitTree.slice(0, 2), commitTree.slice(2))

      const catTree = await jitObj.catfile(treeFile)

      const nestedTreeOid = catTree.split('\n')[0]
        .split(' ')[2]

      const nestedTreeFile = path.join(repoPath, '.git', 'objects', nestedTreeOid.slice(0, 2), nestedTreeOid.slice(2))

      const nestedTree = await jitObj.catfile(nestedTreeFile)

      const blobOid = nestedTree.split('\n')[0]
        .split(' ')[2]

      const blobFile = path.join(repoPath, '.git', 'objects', blobOid.slice(0, 2), blobOid.slice(2))

      const blobData = await jitObj.catfile(blobFile)

      setStatus(`\ncatfile ${commitFile}\n${catCommit}\n\ncatfile ${treeFile}\n${catTree}\n\ncatfile ${nestedTreeFile}\n${nestedTree}\n\ncatfile ${blobFile}\n${blobData}`)

      return (oldHead !== await jitObj.refs.readHead())
    })

    await test('index.add', async function testIndexAdd () {
      await fs.rimraf(path.join(Android.homeFolder(), 'gitui-test'))

      const repoPath = path.join(Android.homeFolder(), 'gitui-test')

      const jitObj = await jit(repoPath)
      jitObj.setAuthor('Tom @ l3l_aze')

      await fs.mkdirp(path.join(repoPath, 'dir1'))

      await fs.writeFile(path.join(repoPath, 'dir1', 'hello.txt'), 'hai!')
      await fs.writeFile(path.join(repoPath, 'hello.txt'), 'hai!')

      await jitObj.add(path.join(repoPath, 'dir1'))
      await jitObj.add(path.join(repoPath, 'hello.txt'))

      await jitObj.index.loadIndex()

      return true
    })

    await fs.rimraf(path.join(Android.homeFolder(), 'gitui-test'))
  })

  return reporter()
}

// eslint-disable-next-line no-unused-vars
async function test () {
  setStatus(window.location)
  setStatus(Android.heapInfo())

  const status = document.getElementById('status')

  if (status.value !== '') {
    status.value = ''
  }

  const report = await runTests()

  setStatus(report)
  setStatus(Android.heapInfo())
  toggleStatus()
}
