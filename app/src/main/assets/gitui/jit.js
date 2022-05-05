'use strict'

/* global Android, pullToRefresh, ptrAnimatesMaterial, addInit, addImport, event */
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
 * UI event handlers
 */

pullToRefresh({
  container: document.querySelector('.container'),
  animates: ptrAnimatesMaterial,

  refresh () {
    setTimeout(function () {
      window.location.search = ''
    }, 750)
  }
})

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

window.onclick = function clickWin (event) {
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

/*
 * Native functionality
 */

const fs = {
  promises: {
    exists: async function fileExists (path) {
      if (Android.havePermission()) {
        const result = await Android.fileExists(path)
        return result
      }
    },

    readFile: async function readFile (path) {
      if (Android.havePermission()) {
        const result = await Android.readFile(path)
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

        return result
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

    /*
      readlink: async function readlink (path) {
        if (Android.havePermission()) {
          const result = (await Android.readlink(path))

          if (result.indexOf('"error') === 0) {
            throw new Error(JSON.parse(result))
          }

          return JSON.parse(result)
        }
      },

      lstat: async function lstat (path) {
        if (Android.havePermission()) {
          const stats = (await Android.lstat(path))

          if (stats.indexOf('"error') === 0) {
            throw new Error(JSON.parse(stats).error)
          }

          return JSON.parse(stats)
        }
      },

      symlink: async function symlink (from, to) {
        if (Android.havePermission()) {
          const result = (await Android.createSymlink(from, to))

          return JSON.parse(result)
        }
      }
    */
  }
}

const path = {
  normalize: (p) => Android.normalize(p),

  relativize: (p) => Android.relativize(p),

  dirname: (p) => Android.dirname(p),

  absolute: (p) => Android.getAbsolutePath(p),

  join: (...args) => args.reduce((a, b) => a + '/' + b, '')
}

const process = {
  pwd: () => Android.cwd(),

  stderr: (message) => {
    setStatus(message)
  },

  stdout: (message) => {
    setStatus(message)
  },
  ENV: {
    GIT_author_NAME: '',
    GIT_author_EMAIL: ''
  }
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
 * Git functionality
 */

function workspace (p) {
  const IGNORE = ['.', '..', '.git']
  const pathname = p

  async function listFiles () {
    const list = await fs.promises.readdir(pathname)

    return list.split(',').filter((e) => IGNORE.indexOf(e) === -1)
  }

  return {
    pathname,
    listFiles,
    readFile: fs.promises.readFile
  }
}

function database (p) {
  // const sha1 = require('./sha1.js')
  // const zlib = require('./zlib.js')

  const pathname = path.join(p, '.git', 'objects')

  function generateTempName () {
    // https://stackoverflow.com/a/12502559/7665043
    return 'tmp_obj' + Math.random().toString(36).slice(2)
  }

  async function writeObject (oid, content) {
    const dir = path.join(pathname, oid.substring(0, 2))
    const objectPath = path.join(dir, oid.substring(2))
    const tempPath = path.join(dir, generateTempName())
    const exists = await fs.promises.exists(dir)

    if (!exists) {
      await fs.promises.mkdirp(dir)
    }

    const compressed = await zlib.deflate(content)

    await fs.promises.writeFile(tempPath, compressed)
    await fs.promises.rename(tempPath, objectPath)
    await fs.promises.delete(tempPath)
  }

  async function store (object) {
    const string = object.toString()
    const content = `${object.type} ${string.length}\0${string}`
    const oid = Android.sha1Hex(content)

    await writeObject(oid, content)

    return oid
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
    toString
  }
}

function entry (name, oid) {
  return {
    name,
    oid
  }
}

function tree (e) {
  const entries = e
  const MODE = '100644'

  const type = 'tree'

  // https://stackoverflow.com/a/33920309/7665043
  function stringToHex (s) {
    const arr = [...s]

    return arr.map(function (c) {
      return ('0' + c.charCodeAt(0).toString(16))
        .slice(-2)
    }).join('')
  }

  // https://stackoverflow.com/questions/2250752/ruby-array-pack-and-unpack-functionality-in-javascript/2250867#comment4152720_2250867
  // eslint-disable-next-line no-unused-vars
  function hexToString (h) {
    let i = 0
    let ascii = ''

    while (i < h.length / 2) {
      ascii += String.fromCharCode(
        parseInt(h.substr(i * 2, 2), 16)
      )

      i++
    }

    return ascii
  }

  function toString () {
    return entries.sort()
      .map((e) => `${MODE} ${e.name}\0${stringToHex(e.oid)}`)
      .join('')
  }

  return {
    type,
    toString
  }
}

function authorObject (name, email, time) {
  return `${name} <${email}> ${time}`
}

function commitObject (t, a, m) {
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

    return lines.join('\n')
  }

  return {
    type,
    toString
  }
}

function jit (repoPath) {
  const workspacePath = path.absolute(repoPath)

  const config = {
    author: {
      name: '',
      email: ''
    }
  }

  async function init () {
    for (const dir of ['objects', 'refs']) {
      await fs.promises.mkdirp(path.join(workspacePath, '.git', dir))
    }

    process.stdout(`Initialized empty Jit repository in ${workspacePath}`)
  }

  async function commit (message) {
    if (config.author.name === '' || config.author.email === '') {
      throw new Error('Author name and email must be set before committing.')
    }

    const gitPath = path.join(workspacePath, '.git')
    const dbPath = path.join(gitPath, 'objects')

    const workspaceObj = workspace(workspacePath)
    const databaseObj = database(dbPath)

    const entries = await workspaceObj.listFiles()

    for (let i = 0; i < entries.length; i++) {
      const data = await workspaceObj.readFile(entries[i])
      const blobObj = blob(data)
      blobObj.oid = await databaseObj.store(blobObj)

      entries[i] = entry(entries[i], blobObj.oid)
    }

    const treeObj = tree(entries)
    treeObj.oid = await databaseObj.store(treeObj)

    const authorObj = authorObject(config.author.name, config.author.email, new Date())
    const commitObj = commitObject(treeObj.oid, authorObj, message)

    const commitOid = await databaseObj.store(commitObj)

    await fs.promises.writeFile(path.join(gitPath, 'HEAD'), commitOid)

    process.stdout(`[(root-commit) ${commitOid}] ${message.split('\n').slice(0, 1)}`)
  }

  function setAuthor (to) {
    to = to.split(' @ ')
    config.author.name = to[0]
    config.author.email = to[1]
  }

  return {
    config,
    setAuthor,
    init,
    commit
  }
}

/*
 *
 *
 * Testing
 *
 *
 */

async function runTests () {
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
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

      return true
    })

    await test('Read file', async function () {
      const data = await fs.promises.readFile(Android.homeFolder() + '/.gitui-test-file.txt')

      return data === 'Hello, world!'
    })

    await test('File exists', async function () {
      const result = await fs.promises.exists(Android.homeFolder() + '/.gitui-test-file.txt')
      await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

      return result
    })

    await test('Rename', async function () {
      await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
      await fs.promises.rename(Android.homeFolder() + '/.gitui-test-dir', Android.homeFolder() + '/.gitui-test-folder')
      const result = await fs.promises.exists(Android.homeFolder() + '/.gitui-test-folder')
      await fs.promises.rimraf(Android.homeFolder() + '/.gitui-test-folder')

      return result
    })

    await test('Make directory', async function () {
      await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')

      return true
    })

    await test('Delete path', async function () {
      await fs.promises.delete(Android.homeFolder() + '/.gitui-test-dir')

      return true
    })

    await test('Remove directory', async function () {
      await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file.txt', 'Hello, world!')
      const result = await fs.promises.exists(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file.txt')
      await fs.promises.rimraf(Android.homeFolder() + '/.gitui-test-dir')

      return result
    })

    await test('Read directory', async function () {
      await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file1.txt', '')
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file2.txt', '')
      const result = (await fs.promises.readdir(Android.homeFolder() + '/.gitui-test-dir'))
      await fs.promises.rimraf(Android.homeFolder() + '/.gitui-test-dir')

      if (result.error) {
        throw new Error(result.error)
      }

      const split = result.split(',')

      return (split.includes('.gitui-test-file1.txt') && split.includes('.gitui-test-file2.txt'))
    })

    await test('Disk usage', async function () {
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')
      const result = await fs.promises.du(Android.homeFolder() + '/.gitui-test-file.txt')
      await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

      return (result !== '')
    })

    await test('Can stat', async function () {
      await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file1.txt', '')
      const resultStat = (await fs.promises.stat(Android.homeFolder() + '/.gitui-test-dir'))

      await fs.promises.rimraf(Android.homeFolder() + '/.gitui-test-dir')

      if (resultStat.error) {
        throw new Error(resultStat.error)
      }

      return true
    })

    await test.optional.skip('Can symlink', async function () {
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

      const result = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test-file-link')
      await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    })

    await test.optional.skip('Can lstat', async function () {
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

      const resultLink = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test-file-link')
      if (resultLink.error) {
        throw new Error(resultLink.error)
      }

      const resultFile = await fs.promises.lstat(Android.homeFolder() + '/.gitui-test-file.txt')
      if (resultFile.error) {
        throw new Error(resultFile.error)
      }

      const resultLinkStat = await fs.promises.lstat(Android.homeFolder() + '/.gitui-test-file-link')
      if (resultLinkStat.error) {
        throw new Error(resultLinkStat.error)
      }

      await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

      return true
    })

    await test.optional.skip('Can readlink', async function () {
      await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')
      const resultLink = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test-file-link')
      if (resultLink.error) {
        throw new Error(resultLink.error)
      }

      const result = await fs.promises.readlink(Android.homeFolder() + '/.gitui-test-file-link')
      if (result.error) {
        throw new Error(result.error)
      }

      await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

      return true
    })

    await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')
  })

  /*
   *
   *
   * Git/jit
   *
   *
   */

  await test.title('Git/Jit', async function () {
    await test('Workspace.listFiles', async function testWorkspaceListFiles () {
      await fs.promises.mkdir(Android.homeFolder() + '/gitui-test')
      const ws = workspace(Android.homeFolder() + '/gitui-test')

      const files = ['bye.txt', 'hi.txt']

      await fs.promises.writeFile(path.join(ws.pathname, files[0]), 'goodbye workspace')
      await fs.promises.writeFile(path.join(ws.pathname, files[1]), 'hello workspace')

      const list = await ws.listFiles()

      return list.filter((i) => files.indexOf(i) !== -1)
        .length > 0
    })

    await test('Workspace.readFile', async function testWorkspaceListFiles () {
      await fs.promises.mkdir(Android.homeFolder() + '/gitui-test')
      const ws = workspace(Android.homeFolder() + '/gitui-test')
      const data = 'hello, workspace!'
      const filename = 'hello.txt'

      await fs.promises.writeFile(path.join(ws.pathname, filename), data)

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
      const dbPath = path.join(Android.homeFolder(), 'gitui-test')
      const object = blob('hello world')
      const db = database(dbPath)

      const oid = (await db.store(object))

      object.oid = oid

      return (await fs.promises.exists(path.join(dbPath, '.git', 'objects', oid.substring(0, 2), oid.substring(2))))
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
      const e = entry('hello', 'world')
      const t = tree([e])

      // hello\0776f726c64 as a contiguous string was crashing the script. Lol.
      return (t.toString() === '100644 hello\0' + '776f726c64' && t.type === 'tree')
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

      return (await fs.promises.exists(path.join(repoPath, '.git')))
    })

    await test('jit commit', async function testCommit () {
      const repoPath = path.join(Android.homeFolder(), 'gitui-test')

      const jitObj = await jit(repoPath)
      jitObj.setAuthor('Tom @ l3l_aze')
      await jitObj.commit('Testing...')

      return (await fs.promises.exists(path.join(repoPath, '.git', 'HEAD')))
    })

    await fs.promises.rimraf(path.join(Android.homeFolder(), 'gitui-test'))
  })

  return tests
}

function testReport (tests) {
  const check = '+'
  const cross = 'x'
  const dash = '-'

  const lines = []

  let skipped = 0
  let total = 0
  let passed = 0
  let optional = 0
  let nested = false
  let nextLine = ''

  for (const t of tests) {
    if (typeof t.title !== 'undefined') {
      nested = true

      lines.push('_'.repeat(t.title.length))
      lines.push(t.title)
    } else {
      if (nested) {
        nextLine = '  '
      }

      if (t.skip) {
        lines.push(nextLine + dash + ' ' + t.name)

        skipped++
      } else if (t.result || (!t.result && t.flags.fails)) {
        lines.push(nextLine + check + ' ' + t.name)

        passed++
        total++
      } else {
        lines.push(nextLine + cross + ' ' + t.name)

        if (t.flags.optional) {
          optional++
        } else {
          total++
        }
      }
    }

    if (typeof t.error !== 'undefined') {
      lines.push(`    Thrown -${
        t.error.stack.split('\n')
          .map((s, i) => (i > 0 &&
            s.indexOf('(') > -1
            ? '  ' + s.substring(0, s.indexOf(' (') + 1) +
              'in ...' +
              s.substring(s.lastIndexOf('/'),
                s.lastIndexOf(')'))
            : '  ' + s)
          ).join ('\n')
      }`)
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

  return lines.join('\n')
}

async function selfTest () {
  const tests = await runTests()
  const message = testReport(tests)

  // document.getElementById('status').value = ''
  setStatus(message)
}

window.onload = function startUp () {
  setStatus(window.location)
  // setStatus('Storage permission? ' + Android.havePermission())

  if (window.location.search === '?test') {
    selfTest()
  }
}
