'use strict'

/* global Android, addInit, addImport, setStatus, fs, path, workspace, database, gitify, blob, entry, toHex, tree, authorObject, jit, testFramework */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
async function runTests () {
  const { test, reporter } = testFramework()

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

  await test.title('Filesystem', async function filesystemTest () {
    const testDir = path.join(Android.homeFolder(), 'gitui-test')
    const file1 = path.join(testDir, 'file1.txt')
    const testFile1 = path.join(testDir, 'testFile1.txt')
    const testFile2 = path.join(testDir, 'testFile2.txt')

    await test('Make directory paths (mkdirp)', async function mkdirpTest () {
      await fs.mkdirp(testDir)

      return true
    })

    await test('Path exists', async function existsTest () {
      const result = await fs.exists(testDir)

      return result
    })

    await test('Write file', async function writeFileTest () {
      await fs.writeFile(file1, 'Hello, world!')
      await fs.writeFile(testFile2, 'Goodbye, world!')

      return true
    })

    await test('Rename', async function renameTest () {
      await fs.rename(file1, testFile1)

      return true
    })

    await test('Read file', async function readFileTest () {
      const data = await fs.readFile(testFile1)

      return data === 'Hello, world!'
    })

    await test('Read directory', async function readdirTest () {
      const result = await fs.readdir(testDir)

      return result.includes('testFile1.txt', 'testFile2.txt')
    })

    await test('Can stat', async function statTest () {
      const result = await fs.stat(testDir)

      if (result.error) {
        throw new Error(result.error)
      }

      return true
    })

    await test('Delete path', async function deleteTest () {
      await fs.delete(testFile2)

      const result = await fs.exists(testFile2)

      return !result
    })

    await test('Rimraf (rm -rf)', async function rimrafTest () {
      await fs.rimraf(testDir)

      const result = await fs.exists(testDir)

      return !result
    })
  })

  /*
   *
   * Git/jit
   *
   */

  await test.title('Git/Jit', async function () {
    const repoPath = path.join(Android.homeFolder(), 'gitui-test')
    const gitPath = path.join(repoPath, '.git')
    const file1 = path.join(repoPath, 'file1.txt')
    const file2 = path.join(repoPath, 'file2.txt')

    await fs.mkdirp(repoPath)
    await fs.writeFile(file1, 'hello')
    await fs.writeFile(file2, 'goodbye')

    const jitObj = await jit(repoPath)

    const ws = workspace(repoPath)
    const db = database(gitPath)

    await test('Workspace.listFiles', async function workspaceListFiles () {
      const list = await ws.listFiles()

      return list.includes(path.basename(file1), path.basename(file2))
    })

    await test('Workspace.readFile', async function workspaceReadFile () {
      const result = await ws.readFile(file1)

      return result === 'hello'
    })

    test('Blob test', function blobTest () {
      const data = 'Blob'
      const blobby = blob(data)

      return (blobby.toString() === data &&
        blobby.type === 'blob')
    })

    test('Database.generateTempName', function genTempName () {
      const t = db.generateTempName()

      return /tmp_obj.*/.test(t)
    })

    await test('Database.store', async function dbStore () {
      const object = blob('hello world')

      object.oid = Android.sha1Hex(gitify('blob', object))

      await db.store('blob', object)

      const result = await fs.exists(path.join(gitPath, 'objects',
        object.oid.substring(0, 2),
        object.oid.substring(2)))

      await fs.rimraf(gitPath)

      return result
    })

    test('Entry test', function entryTest () {
      const e = entry('hello', 'world')

      return (e.name === 'hello' && e.oid === 'world')
    })

    test('Tree test', function treeTest () {
      const e = entry('hello', toHex('world'), { mode: 33200 })
      const t = tree().build({
        [e.name]: e
      })

      // hello\0776f726c64 as a contiguous string was crashing the script. Lol.
      return (t.type === 'tree' &&
        t.toString() === '100660 hello\0' + '776f726c64')
    })

    test('author function returns formatted string', function authorTest () {
      const now = new Date()
      const auth = authorObject('Tom', 't@b.c', now)

      return auth === `Tom <t@b.c> ${now}`
    })

    await test('zlib deflate, inflate', async function zlibTest () {
      const data = 'hello world'

      const deflated = await Android.zlibDeflate(data)
      const inflated = await Android.zlibInflate(deflated)

      return data === inflated
    })

    test('jit setAuthor', function jitSetAuthor () {
      jitObj.setAuthor('Tom @ l3l_aze')

      return (jitObj.config.author.name === 'Tom' &&
        jitObj.config.author.email === 'l3l_aze')
    })

    await test('jit init', async function jitInit () {
      await jitObj.init()

      return (await fs.exists(gitPath))
    })

    await test('root-commit', async function rootCommit () {
      await jitObj.init()
      await jitObj.commit('Testing...')

      return (await fs.exists(path.join(gitPath, 'HEAD')))
    })

    await test('nested tree commit', async function nestedTreeCommit () {
      await fs.rimraf(gitPath)
      await fs.delete(file1)
      await fs.delete(file2)

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

      return (oldHead !== head)
    })

    await test('index.add', async function indexAdd () {
      await jitObj.add(path.join(repoPath, 'dir1'))
      await jitObj.add(path.join(repoPath, 'dir1', 'hello.txt'))

      await jitObj.index.loadIndex()

      return true
    })

    await fs.rimraf(repoPath)
  })

  return reporter()
}
