'use strict'

/* global Android, addInit, addImport, setStatus, fs, path, workspace, database, gitify, blob, entry, toHex, tree, authorObject, jit, testFramework */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function runInit () {
  const { test, reporter } = testFramework()
  const jitObj = jit('.')

  return reporter()
}
