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
  stat.scrollTop = stat.scrollHeight;
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

        if (stats.indexOf('\"error') === 0) {
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

  exit: function (code) {
    process.stderr(`Process exited with code ${code}`)
  },

  stderr: function (message) {
    setStatus(messages)
  },

  stdout: function (message) {
    setStatus(messages)
  }
}

;
async function jit () {
  command = args.shift()

  switch (command) {
    case 'init':
      arg_path = path.dirName(args[0])
      root_path = path.absolute(arg_path)
      git_path = path.join(root_path, '.git')

      for (dir of ['objects', 'refs']) {
        try {
          fs.mkdirp(path.join(git_path, dir))
        } catch (error) {
          process.stderr(error)
          process.exit(1)
        }
      }

      process.stdout(`Initialized empty Jit repository in ${root_path}`)
      break

    case 'commit':
      root_path = process.pwd
      git_path = path.join(root_path, '.git')
      db_path = path.join(git_path, 'objects')

      workspace = new Workspace(root_path)
      database = new Database(db_path)

      entries = workspace.listFiles()
          .map(dir => {
        data = workspace.read_file(dir)
        blob = new Blob(data)
        database.store(blob)

        const entry = new Entry(dir, blob.oid)

        return entry
      })

      tree = new Tree(entries)
      database.store(tree)

      name = process.ENV.GIT_AUTHOR_NAME
      email = process.ENV.GIT_AUTHOR_EMAIL
      author = new Author(name, email, new Date ())
      message = args[1]
      commit = new Commit(tree.oid, author, message)

      database.store(commit)

      await fs.promises.writeAsync(path.join(git_path, 'HEAD'), commit.oid)

      process.stdout('[(root-commit) ${commit.oid}] ${message.split('\n').slice(0,1)}'
      process.exit(0)
      break

    default:
      throw new Error(`${command} is not a Jit command`)
  }
}
