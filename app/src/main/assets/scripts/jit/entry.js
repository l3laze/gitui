'use strict'

/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
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
