'use strict'

/* global Android, setStatus, fs, path, workspace, database, blob, util, entry, tree, authorObject, refs, index, commitObject */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
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

      blobObj.oid = Android.sha1Hex(gitify('blob', blobObj))

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

    commitObj.oid = Android.sha1Hex(gitify('commit', commitObj))

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
        blobObj.oid = await Android.sha1Hex(gitify('blob', data))

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
