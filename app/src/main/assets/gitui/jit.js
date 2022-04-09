'use strict'

function capture (msg, source, line, column, err) {
  setStatus('"' + msg + '" in "' +
    source + '" at line ' + line +
    ', character ' + column + '.' + '\n' + err.toString())

  return true
}

window.onerror = capture

function setStatus (text) {
  const stat = document.getElementById('status')

  if (stat.value !== '') {
    stat.value += '\n'
  }

  stat.value += text
  stat.scrollTop = stat.scrollHeight
}

const Android = {}

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
        const result = (await Android.readDir(path))

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
  // TODO

  dirName: function (p) {
    return p.substring(0, p.lastIndexOf(/\//))
  },

  absolute: function (p) {
    return p
  },

  join: function (p, d) {
    return p + '/' + d
  }
}

const process = {
  // TODO

  pwd: '.',

  stderr: function (message) {
    setStatus(message)
  },

  stdout: function (message) {
    setStatus(message)
  }
}

async function jit (args) {
  const command = args.shift()

  let argPath, rootPath, gitPath, dbPath,
    workspace, database,
    entries, data, blob, tree, commit,
    name, email, author, message

  switch (command) {
    case 'init':
      argPath = path.dirName(args[0])
      rootPath = path.absolute(argPath)
      gitPath = path.join(rootPath, '.git')

      for (const dir of ['objects', 'refs']) {
        try {
          fs.mkdirp(path.join(gitPath, dir))
        } catch (error) {
          process.stderr(error)
        }
      }

      process.stdout(`Initialized empty Jit repository in ${rootPath}`)
      break

    case 'commit':
      rootPath = process.pwd
      gitPath = path.join(rootPath, '.git')
      dbPath = path.join(gitPath, 'objects')

      workspace = Workspace(rootPath)
      database = Database(dbPath)

      entries = workspace.listFiles()
        .map(dir => {
          data = workspace.read_file(dir)
          blob = Blob(data)
          database.store(blob)

          const entry = Entry(dir, blob.oid)

          return entry
        })

      tree = Tree(entries)
      database.store(tree)

      name = process.ENV.GIT_AUTHOR_NAME
      email = process.ENV.GIT_AUTHOR_EMAIL
      author = Author(name, email, new Date())
      message = args[1]
      commit = Commit(tree.oid, author, message)

      database.store(commit)

      await fs.promises.writeAsync(path.join(gitPath, 'HEAD'), commit.oid)

      process.stdout(`[(root-commit) ${commit.oid}] ${message.split('\n').slice(0, 1)}`)
      break

    default:
      throw new Error(`${command} is not a Jit command`)
  }
}

const Workspace = function Workspace (p) {
  const IGNORE = ['.', '..', '.git']
  const pathname = p

  return {
    listFiles: async function listFiles () {
      const list = (await fs.promises.readdir(pathname))

      return list.filter(entry => IGNORE.indexOf(entry) === -1)
    },
    readFile: async function readFile (p) {
      const data = await fs.promises.readFileAsync(path.join(pathname, p))

      return data
    }
  }
}

const Database = function Database (p) {
  const sha1 = require('./sha1.js')
  const zlib = require('./zlib.js')

  // public

  const pathname = p

  async function store (object) {
    const string = object.toString() // Encoding::ASCII_8BIT

    const content = `${object.type} ${string.length}\0${string}`

    object.oid = sha1.hexdigest(content)

    await writeObject(object.oid, content)
  }

  // private

  async function writeObject (oid, content) {
    const objectPath = path.join(pathname, oid.slice(0, 2), oid.slice(2, -1))
    const dirname = path.dirname(objectPath)
    const tempPath = path.join(dirname, generateTempName())

    try {
      if (!fs.promises.existsSync(dirname)) {
        fs.promises.mkdirp(dirname)
      }

      const compressed = zlib.deflate(content, zlib.FASTEST)

      await fs.promises.writeFileAsync(tempPath, compressed)

      await fs.promises.rename(tempPath, objectPath)
    } catch (err) {
    }

    function generateTempName () {
      // https://stackoverflow.com/a/12502559/7665043
      return Math.random().toString(36).slice(2)
    }
  }
}

const Blob = function Blob (d) {
  // attr_accessor :oid ?

  const data = d
  const type = 'blob'

  return {
    toString: function toString () {
      return data
    }
  }
}

const Entry = function Entry (n, o) {
  // attr_reader :name, :oid ?

  return {
    name: n,
    oid: o
  }
}

const Tree = function Tree (entries) {
  const MODE = '100644'

  // attr_accessor :oid

  const type = 'tree'

  // https://stackoverflow.com/a/33920309/7665043
  function stringToHex (s) {
    return s.split('').map(function(c) {
      return ('0' + c.charCodeAt(0).toString(16))
        .slice(-2)
    }).join('')
  }

  // https://stackoverflow.com/questions/2250752/ruby-array-pack-and-unpack-functionality-in-javascript/2250867#comment4152720_2250867
  function hexToString (h) {
    let i = 0
    let ascii = ''

    while (i < hex.length / 2) {
      ascii += String.fromCharCode(
        parseInt(hex.substr(i * 2, 2),16)
      )

      i++
    }

    return ascii
  }

  function packArray (...contents) {
    return contents[0] + '\0' + string2Hex(contents[1])
  }

  function toString () {
    entries = entries.sort()
      .map(e => packArray([`${MODE} ${e.name}`, e.oid]))

    return entries.join('')
  }
}

const Commit = function Commit (t, a, m) {
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
}

const Author = function Author (n, e, t) {
  const name = n
  const email = e
  const time = t

  return `${name} <${email}> ${time}`
}

jit(process.argv)
