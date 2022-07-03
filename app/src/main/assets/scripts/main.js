'use strict'

/* global Android, runTests, toggleStatus, cancelModal */
/* eslint no-undef: "error" */

function setStatus (text) {
  const stat = document.getElementById('status')

  if (stat.value !== '') {
    stat.value += '\n'
  }

  stat.value += text
  stat.scrollTop = stat.scrollHeight
}

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
async function test () {
  setStatus(window.location)
  setStatus(Android.memInfo())

  const status = document.getElementById('status')

  if (status.value !== '') {
    status.value = ''
  }

  const report = await runTests()

  setStatus(report)
  setStatus(Android.memInfo())
  toggleStatus()
}

function capture (msg, source, line, column, err) {
  setStatus('"' + msg + '" in "' +
    source + '" at line ' + line +
    ', character ' + column + '.' + '\n' + err.toString())

  return true
}

function clickWin (event) {
  if (event.target.className.indexOf('w3-modal') > -1) {
    cancelModal()
  }
}

function unloading () {
  window.removeEventListener('error', capture)
  window.removeEventListener('unload', unloading)
  window.removeEventListener('click', clickWin)
  // window.location = 'about:blank'
}

window.addEventListener('error', capture)

window.addEventListener('click', clickWin)

window.addEventListener('unload', unloading)
