'use strict'
// 'esversion: 6'

function copyText (text) {
  event.stopPropagation()
  if (typeof Android !== 'undefined') {
    Android.copyToClipboard(text)
  } else {
    navigator.clipboard.writeText(text)
      .then(function () {}, function () {})
  }
}

function setStatus (text) {
  const stat = document.getElementById('status')
  if (stat.value !== '') {
    stat.value += '\n'
  }

  stat.value += text
  stat.scrollTop = stat.scrollHeight;

  if (typeof Android !== 'undefined') {
    Android.showToast(text)
  }
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
  const stat = document.getElementById('status')

  if (stat.style.display === 'none') {
    stat.style.display = 'block'
  } else {
    stat.style.display = 'none'
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

function importRepo () {
  setStatus('Importing repo...')
}

function openRepo (which) {
  setStatus('Opening ' + which)
  event.stopPropagation()
}

function pullRepo (which) {
  const behind = event.target.querySelector('.commitsBehind')
  const ahead = event.target.parentElement.parentElement.querySelector('.commitsAhead')

  behind.innerText = '0'
  ahead.innerText = '0'

  setStatus('Pulled ' + which)
  event.stopPropagation()
}

function pushRepo (which) {
  const ahead = event.target.querySelector('.commitsAhead')
  const behind = event.target.parentElement.parentElement.querySelector('.commitsBehind')

  behind.innerText = '0'
  ahead.innerText = '0'

  setStatus('Pushed ' + which)
  event.stopPropagation()
}

function openModal (title) {
  let modes = [
    'settings',
    'add'
  ]

  for (let m of modes) {
    if (title.toLowerCase().indexOf(m) === -1) {
      document.getElementById(m + 'Modal').style.display = 'none'
    } else {
      document.getElementById(m + 'Modal').style.display = 'block'
    }
  }

  document.getElementById('modal').style.display = 'block'
  document.getElementById('modal_title').innerText = title

  setStatus('Opened modal for ' + title)
}

function cancelModal () {
  document.getElementById('modal').style.display = 'none'

  setStatus('Cancelled modal')
}

function okModal () {
  document.getElementById('modal').style.display = 'none'

  setStatus('Okayed modal')
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

window.onerror = function unhandled (msg, source, line, column, err) {
  setStatus('\"' + msg + '\" in \"' +
    source + '\" at line ' + line +
    ', character ' + column + '.')
  setStatus(err.toString())

  return true
}

function testErr () {
  throw new Error('Oops')
}