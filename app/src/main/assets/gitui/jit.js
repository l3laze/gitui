'use strict'

/*global Android, pullToRefresh, ptrAnimatesMaterial, addInit, addImport  */
/*eslint no-undef: "error"*/

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

window.onload = function startUp () {
  setStatus(window.location)
  // setStatus('Storage permission? ' + Android.havePermission())

  if (window.location.search === '?test') {
    setStatus('Running tests...')

    selfTest()
  }
}

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

function toggleFooter () {
  const statusArea = document.getElementById('status')

  if (statusArea.style.display === 'none') {
    statusArea.style.display = 'inline-block'
    statusArea.scrollTop = statusArea.scrollHeight
  } else {
    statusArea.style.display = 'none'
  }
}

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

function createRepo (way) {
  setStatus('Creating repo via ' + way + '...')
}

function openRepo (which) {
  setStatus('Opening ' + which)
  event.stopPropagation()
}

function pullRepo (which) {
  const behind = event.target.querySelector('.commitsBehind') || event.target.parentElement.querySelector('.commitsBehind')

  behind.innerText = '0'

  setStatus('Pulled ' + which)
  event.stopPropagation()
}

function pushRepo (which) {
  const ahead = event.target.querySelector('.commitsAhead') || event.target.parentElement.querySelector('.commitsAhead')

  ahead.innerText = '0'

  setStatus('Pushed ' + which)
  event.stopPropagation()
}

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

function cancelModal () {
  document.getElementById('modal').style.display = 'none'

  setStatus('Cancelled modal')
}

function okModal () {
  const modal = document.getElementById('modal')
  modal.style.display = 'none'

  if (modal['data-mode'] === 'settings') {
    // saveSettings()
  } else {
    createRepo(modal.querySelector('.add-btn.w3-black').innerText)
  }
}

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

function toggleStatus () {
  const sb = document.getElementById('statusBar')
  const ta = document.getElementById('status')
  const xs = document.getElementById('xstatus')

  sb.style.height = (sb.style.height !== '94%'
    ? '94%'
    : '')

  if (sb.style.height === '') {
    ta.style.height = '6.1em'
    xs.innerText = 'Expand'
  } else {
    ta.style.height = '96%'
    xs.innerText = 'Collapse'
  }
}

/*
 * Native functionality
 */

const fs = {
  promises: {
    exists: async function fileExists (path) {
      if (Android.havePermission()) {
        return (await Android.fileExists(path))
      }

      return false
    },

    readFile: async function readFile (path) {
      if (Android.havePermission()) {
        return (await Android.readFile(path))
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
        await Android.makeDirectorytree(path)
      }
    },

    rename: async function rename (from, to) {
      if (Android.havePermission()) {
        await Android.move(from, to)
      }
    },

    stat: async function stat (path) {
      if (Android.havePermission()) {
        const stats = (await Android.stat(path))

        if (stats.indexOf('"error') === 0) {
          throw new Error(JSON.parse(stats).error)
        }

        return JSON.parse(stats)
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

    readdir: async function readdir (path) {
      if (Android.havePermission()) {
        const result = await Android.readDir(path)

        if (result.indexOf('"error') === 0) {
          throw new Error(JSON.parse(result))
        }

        return result
      }
    },

    delete: async function deletePath (path) {
      if (Android.havePermission()) {
        await Android.delete(path)
      }
    },

    rmdir: async function rmdir (path) {
      if (Android.havePermission()) {
        await Android.rmdir(path)
      }
    },

    readlink: async function readlink (path) {
      if (Android.havePermission()) {
        const result = (await Android.readlink(path))

        if (result.indexOf('"error') === 0) {
          throw new Error(JSON.parse(result))
        }

        return JSON.parse(result)
      }
    },

    du: async function du (path) {
      if (Android.havePermission()) {
        return (await Android.sizeOnDisk(path))
      }
    },

    symlink: async function symlink (from, to) {
      if (Android.havePermission()) {
        const result = (await Android.createSymlink(from, to))

        return JSON.parse(result)
      }
    }
  }
}

const path = {
  normalize: (p) => {
    return Android.normalize(p)
  },

  relativize: (p) => {
    return Android.relativize(p)
  },

  dirname: (p) => {
    return Android.dirname(p)
  },

  getAbsolutePath: (p) => {
    return Android.getAbsolutePath(p)
  },

  join: (a, b) => {
    // return Android.resolve(a, b)
    return a + '/' + b
  }
}

const process = {
  pwd: () => Android.cwd(),

  stderr: (message) => {
    setStatus(message)
  },

  stdout: (message) => {
    setStatus(message)
  }
}

/*
 * Git functionality
 */

function workspace (p) {
  const IGNORE = ['.', '..', '.git']
  const pathname = p

  return {
    pathname,
    listFiles: async function listFiles () {
      const list = await fs.promises.readdir(pathname)

      return list.split(',').filter((e) => IGNORE.indexOf(e) === -1)
    },
    readFile: async function readFile (p) {
      const data = await fs.promises.readFileAsync(path.join(pathname, p))

      return data
    }
  }
}

const database = function database (p) {
  const sha1 = require('./sha1.js')
  const zlib = require('./zlib.js')

    // private

  function generateTempName () {
    // https://stackoverflow.com/a/12502559/7665043
    return Math.random().toString(36).slice(2)
  }

  async function writeObject (oid, content) {
    const objectPath = path.join(pathname, oid.slice(0, 2), oid.slice(2, -1))
    const dirname = path.dirname(objectPath)
    const tempPath = path.join(dirname, generateTempName())

    if (!fs.promises.existsSync(dirname)) {
      await fs.promises.mkdirp(dirname)
    }

    const compressed = zlib.deflate(content, zlib.FASTEST)

    await fs.promises.writeFileAsync(tempPath, compressed)

    await fs.promises.rename(tempPath, objectPath)
  }

  // public

  const pathname = p

  async function store (object) {
    const string = object.toString()

    const content = `${object.type} ${string.length}\0${string}`

    object.oid = sha1.hexdigest(content)

    await writeObject(object.oid, content)
  }


  return {
    pathname,
    store
  }
}

const blob = function blob (d) {
  // attr_accessor :oid ?

  const data = d
  const type = 'blob'

  return {
    type,
    toString: function toString () {
      return data
    }
  }
}

const entry = function entry (n, o) {
  // attr_reader :name, :oid ?

  return {
    name: n,
    oid: o
  }
}

const tree = function tree (entries) {
  const MODE = '100644'

  // attr_accessor :oid

  const type = 'tree'

  // https://stackoverflow.com/a/33920309/7665043
  function stringToHex (s) {
    return s.split('').map(function (c) {
      return ('0' + c.charCodeAt(0).toString(16))
        .slice(-2)
    }).join('')
  }

  // https://stackoverflow.com/questions/2250752/ruby-array-pack-and-unpack-functionality-in-javascript/2250867#comment4152720_2250867
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

  function packArray (...contents) {
    return contents[0] + '\0' + stringToHex(contents[1])
  }

  function toString () {
    entries = entries.sort()
      .map((e) => packArray([`${MODE} ${e.name}`, e.oid]))

    return entries.join('')
  }

  return {
    type,
    packArray,
    toString
  }
}

function author (n, e, t) {
  const name = n
  const email = e
  const time = t

  return `${name} <${email}> ${time}`
}

const commit = function commit (t, a, m) {
  // attr_accessor :oid

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

async function jit (args) {
  const command = args.shift()

  let argPath, rootPath, gitPath, dbPath,
    workspaceObj, databaseObj,
    entries, data, blobObj, treeObj, commitObj,
    name, email, authorObj, message, dir

  switch (command) {
    case 'init':
      try {
        argPath = path.dirname(args[0] || process.pwd())
        rootPath = path.absolute(argPath)
        gitPath = path.join(rootPath, '.git')

        for (const dir of ['objects', 'refs']) {
          try {
            await fs.promises.mkdirp(path.join(gitPath, dir))
          } catch (error) {
            process.stderr(error)
          }
        }

        process.stdout(`Initialized empty Jit repository in ${rootPath}`)
      } catch (err) {
        setStatus(err)
      }

      break

    case 'commit':
      try {
        rootPath = process.pwd()
        gitPath = path.join(rootPath, '.git')
        dbPath = path.join(gitPath, 'objects')

        workspaceObj = workspace(rootPath)
        databaseObj = database(dbPath)

        entries = await workspaceObj.listFiles()

        for (let i = 0; i < entries.length; i++) {
          dir = entries[i]
          data = await workspaceObj.read_file(dir)
          blobObj = blob(data)
          await databaseObj.store(blobObj)

          entries[i] = entry(dir, blobObj.oid)
        }

        treeObj = tree(entries)
        await databaseObj.store(treeObj)

        name = process.ENV.GIT_author_NAME
        email = process.ENV.GIT_author_EMAIL
        authorObj = author(name, email, new Date())
        message = args[1]
        commitObj = commit(treeObj.oid, authorObj, message)

        await databaseObj.store(commitObj)

        await fs.promises.writeAsync(path.join(gitPath, 'HEAD'), commitObj.oid)

        process.stdout(`[(root-commit) ${commitObj.oid}] ${message.split('\n').slice(0, 1)}`)
      } catch (err) {
        setStatus(err)
      }

      break

    default:
      throw new Error(`${command} is not a Jit command`)
  }
}

/*
 * Testing
 */

async function selfTest () {
  let passed = 0
  let optional = 0
  let skipped = 0
  let total = 0

  const tests = await runTests()

  const message = (function () {
    const check = '\u2714'
    const cross = '\u274C'
    const lines = []
    let nested = false
    let titled = false

    for (const t of tests) {
      if (typeof t.title !== 'undefined') {
        lines.push((titled
          ? '\n'
          : '') + t.title)
        nested = true
        titled = true
        continue
      }

      if (t.skip) {
        skipped++
        total++
        continue
      }

      if (t.result || t.flags.fails) passed++

      if (t.result === false && t.flags.optional) optional++

      total++

      lines.push((nested
        ? '    '
        : '') +
          (t.result || (t.flags.fails || t.result === true)
            ? check
            : cross) + ' ' + t.name +
            (typeof t.error !== 'undefined'
              ? '\n  Thrown - ' + t.error
              : ''))
    }

    return lines.join('\n')
  }()) +
  '\n\n' +
  (optional > 0
    ? optional + ' optional tests failed.\n'
    : '') +
    (skipped > 0
      ? skipped + ' tests skipped.\n'
      : '') +
  ((passed / ((total - optional) - skipped) * 100) + '').substring(0, 5) +
  '% passed (' + passed + '/' + total + ').'

  document.getElementById('status').value = ''

  setStatus(message)
}

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

  test.title = function (text) {
    tests.push({
      title: text
    })
  }

  /*
   *
   * -------- Tests --------
   *
   *
   */

  test.title('Error handling')

  test.fails('Expected failure from test returning false', function failsFalse () {
    setStatus('Expecting failure 1')

    return false
  })

  test.fails('Expected failure from test throwing error', function failsThrow () {
    setStatus('Expecting failure 2')

    throw new Error('Oops')
  })

  /*
   * UI functionality
   */

  test.title('User interface')

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

  /*
   * FS functionality
   */

  test.title('Filesystem')

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
    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-folder')

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
    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-dir')

    return result
  })

  await test('Read directory', async function () {
    await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file1.txt', '')
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file2.txt', '')
    const result = (await fs.promises.readdir(Android.homeFolder() + '/.gitui-test-dir'))
    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-dir')

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

    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-dir')

    if (resultStat.error) {
      throw new Error(resultStat.error)
    }

    return true
  })

  await test.optional('Can symlink', async function () {
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

    const result = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test-file-link')
    await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

    if (result.error) {
      throw new Error(result.error)
    }

    return result
  })

  await test.optional('Can lstat', async function () {
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

  await test.optional('Can readlink', async function () {
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

  /*
   * Git/jit functionality
   */

  test.title('Git (jit)')

  await test('Workspace.listFiles', async function workspaceListFiles () {
    await fs.promises.mkdir(Android.homeFolder() + '/gitui-test')
    const ws = workspace(Android.homeFolder() + '/gitui-test')

    const files = ['bye.txt', 'hi.txt']

    await fs.promises.writeFile(path.join(ws.pathname, files[0]), 'goodbye workspace')
    await fs.promises.writeFile(path.join(ws.pathname, files[1]), 'hello workspace')

    const list = await ws.listFiles()

    await fs.promises.rmdir(Android.homeFolder() + '/gitui-test')

    return list.filter((i) => files.indexOf(i) !== -1)
      .length > 0
  })

  test('author returns formatted string', function authorFunc () {
    const now = new Date()
    const auth = author('Tom', 't@b.c', now)

    return auth === `Tom <t@b.c> ${now}`
  })

  return tests
}
