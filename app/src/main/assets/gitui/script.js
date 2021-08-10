'use strict'

function capture (msg, source, line, column, err) {
  setStatus('"' + msg + '" in "' +
    source + '" at line ' + line +
    ', character ' + column + '.' + '\n' + err.toString())

  return true
}

window.onerror = capture

pullToRefresh({
  container: document.querySelector('.container'),
  animates: ptrAnimatesMaterial,

  refresh() {
    setTimeout(function () {
      location.search = ''
    }, 750)
  }
})

function setStatus (text) {
  const stat = document.getElementById('status')

  if (stat.value !== '') {
    stat.value += '\n'
  }

  stat.value += text
  stat.scrollTop = stat.scrollHeight;
}

/*
window.ontouchstart = function (event) {
  setStatus('Touching @ ' + event.target.tagName + ' of ' + event.target?.parentElement)
}
*/

window.onload = function startUp () {
  setStatus(window.location)
  setStatus('Storage permission? ' + Android.havePermission())

  if (window.location.search === '?test') selfTest()
}

function initCustomization () {
  if (Android.havePermission()) {
    const externalHome = Android.copyAssets('gitui')
    setStatus(externalHome)
    setTimeout(function () {
      window.location = externalHome + '/index.html'
    }, 1000)
  } else {
    alert('Grant external storage permission(s) to use this feature.')
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

  for (let r of repos) {
    let repoName = r.querySelector('.repo-name').innerText
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
  const behind = event.target.querySelector('.commitsBehind')  || event.target.parentElement.querySelector('.commitsBehind')

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
  let modes = [
    'settings',
    'add'
  ]

  for (let m of modes) {
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
    clone: [ 'repoSource', 'repoPath', 'cloneRecursively'],
    init: [ 'repoPath' ],
    'import': [ 'repoPath' ],
    app: [ 'settingsApp' ],
    git: [ 'settingsGit' ]
  }

  const els = document.getElementsByClassName(whatClass)
  const btns = document.getElementsByClassName(btnClass)

  for (let e of els) {
    e.style.display = 'none'
  }

  for (let b of btns) {
    b.classList.remove('w3-black')
  }

  for (let c of controls[ which.toLowerCase() ]) {
    let elem = document.getElementById(c)
    elem.style.display = 'inline'
  }

  event.target.classList.add('w3-black')
}

window.onclick = function clickWin (event) {
  if (event.target.className.indexOf('w3-modal') > -1) {
    cancelModal()
  }
}

/*
 * Filesystem
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
    mkdir: async function mkdir (path, data) {
      if (Android.havePermission()) {
        await Android.makeDirectory(path)
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

        return JSON.parse(stats)
      }
    },
    lstat: async function lstat (path) {
      if (Android.havePermission()) {
        const stats = (await Android.lstat(path))

        return JSON.parse(stats)
      }
    },
    readdir: async function readdir (path) {
      if (Android.havePermission()) {
        return (await Android.readDir(path))
      }
    },
    'delete': async function deletePath (path) {
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

/*
 * Testing
 */

async function selfTest () {
  let passed = 0
  let total = 0

  const tests = await runTests()

  const message = (function () {
    const check = '\u2714'
    const cross = '\u274C'
    const lines = []

    for (let r of tests) {
      if (r.skip) continue

      if (r.result || r.fails) passed++

      total++

      lines.push((r.result || r.fails
        ? check : cross) + ' ' + r.name +
        (typeof r.error !== 'undefined'
          ? '\n  Thrown - ' + r.error : ''))
    }

    return lines.join('\n')
  }()) +
  '\n\n' +
  ((passed / total * 100) + '').substring(0,5) +
  '% passed (' + passed + '/' + total + ').'

  // document.getElementById('status').value = ''

  setStatus(message)
}

async function runTests () {
  const tests = []
  const _test = async function _test (name, testFunc, fails = false) {
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
      result = fails
    }

    tests.push({
      name,
      result,
      error,
      fails
    })
  }

  const test = async function test (name, func) {
    await _test(name, func, false)
  }

  test.fails = async function fails (name, func) {
    await _test(name,func, true)
  }

  test.skip = function skip (name, func) {
    tests.push({
      name,
      skip: true
    })
  }

  /*
   * Search input tests
   */
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

  /*
   *
   */
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
   * General error handling tests
   */
  test.fails('Expected failure from false', function () {
    setStatus('Expecting failure 1')

    return false
  })

  test.fails('Expected failure from throw', function () {
    setStatus('Expecting failure 2')

    throw new Error('Oops')
  })

  /*
   * File I/O tests
   */
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

  await test('Rename', async function () {
    await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
    await fs.promises.rename(Android.homeFolder() + '/.gitui-test-dir', Android.homeFolder() + '/.gitui-test-folder')
    const result = await fs.promises.exists(Android.homeFolder() + '/.gitui-test-folder')
    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-folder')

    return result
  })

  await test('Read directory', async function () {
    await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file1.txt', '')
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file2.txt', '')
    const result = (await fs.promises.readdir(Android.homeFolder() + '/.gitui-test-dir'))
    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-dir')

    return (JSON.stringify(result.split(',')) === JSON.stringify(['.gitui-test-file1.txt', '.gitui-test-file2.txt']))
  })

  await test('Can stat', async function () {
    await fs.promises.mkdir(Android.homeFolder() + '/.gitui-test-dir')
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-dir/.gitui-test-file1.txt', '')
    const result = (await fs.promises.stat(Android.homeFolder() + '/.gitui-test-dir'))
    const statKeys = ['dev', 'ino', 'mode', 'nlink', 'uid', 'gid', 'rdev', 'size', 'blksize', 'blocks', 'ctimeMs', 'atimeMs', 'mtimeMs', 'birthtime']
    
    await fs.promises.rmdir(Android.homeFolder() + '/.gitui-test-dir')

    for (let k of Object.keys(result)) {
      if (!statKeys.includes(k)) {
        return false
      }
    }

    return true
  })

  await test('Can symlink', async function () {
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

    const result = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test-file-link')

    if (result.errno) {
      setStatus('Error from symlink: ' + result.errnoName + '('+ result.errno + ')')

      throw new Error(result.errnoName + '(' + result.errno + ')')
    }

    await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

    return result
  })

  await test('Can lstat', async function () {
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')

    const resultLink = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', Android.homeFolder() + '/.gitui-test-file-link')

    if (resultLink.errno) {
      setStatus('Error from symlink in lstst: ' + resultLink.errnoName + '('+ resultLink.errno + ')')
    }
    
    const resultFile = await fs.promises.lstat(Android.homeFolder() + '/.gitui-test-file.txt')
    const resultLinkStat = await fs.promises.lstat(Android.homeFolder() + '/.gitui-test-file-link')

    if (resultLinkStat.errno) {
      setStatus('Error from lstat link: ' + resultLinkStat.errnoName + '('+ resultLinkStat.errno + ')')

      throw new Error(resultLinkStat.errnoName + '(' + resultLinkStat.errno + ')')
    } else if(resultFile.errno) {
      setStatus('Error from lstat file: ' + resultFile.errnoName + '('+ resultFile.errno + ')')

      throw new Error(resultFile.errnoName + '(' + resultFile.errno + ')')
    }

    await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

    return true
  })

  await test('Can readlink', async function () {
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')
    const resultLink = await fs.promises.symlink(Android.homeFolder() + '/.gitui-test-file.txt', './.gitui-test-file-link')
    const result = await fs.promises.readlink(Android.homeFolder() + '/.gitui-test-file-link')
    await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

    if (result.errno) {
      setStatus('Error from readlink: ' + result.errnoName + '('+ result.errno + ')')
      throw new Error(result.errnoName + '(' + result.errno + ')')
    }

    return true
  })

  await test('Disk usage', async function () {
    await fs.promises.writeFile(Android.homeFolder() + '/.gitui-test-file.txt', 'Hello, world!')
    const result = await fs.promises.du(Android.homeFolder() + '/.gitui-test-file.txt')
    await fs.promises.delete(Android.homeFolder() + '/.gitui-test-file.txt')

    return (result !== '')
  })
  

  /*
   * Skip test
   */

  test.skip('Skipping test', function () {
    setStatus('This should have been skipped.')
    throw new Error('This should not have been thrown.')
  })
  

  return tests
}