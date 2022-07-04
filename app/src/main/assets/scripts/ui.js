'use strict'

/* global setStatus, event */
/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
function toggleFooter () {
  const statusBar = document.getElementById('statusBar')

  if (statusBar.style.display === 'none') {
    statusBar.style.display = 'inline-block'
  } else {
    statusBar.style.display = 'none'
  }
}

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
function createRepo (way) {
  setStatus('Creating repo via ' + way + '...')
}

// eslint-disable-next-line no-unused-vars
function openRepo (which) {
  setStatus('Opening ' + which)
  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
function pullRepo (which) {
  const behind = event.target.querySelector('.commitsBehind') || event.target.parentElement.querySelector('.commitsBehind')

  behind.innerText = '0'

  setStatus('Pulled ' + which)
  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
function pushRepo (which) {
  const ahead = event.target.querySelector('.commitsAhead') || event.target.parentElement.querySelector('.commitsAhead')

  ahead.innerText = '0'

  setStatus('Pushed ' + which)
  event.stopPropagation()
}

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
function cancelModal () {
  document.getElementById('modal').style.display = 'none'

  setStatus('Cancelled modal')
}

// eslint-disable-next-line no-unused-vars
function okModal () {
  const modal = document.getElementById('modal')

  modal.style.display = 'none'

  if (modal['data-mode'] === 'settings') {
    // saveSettings()
  } else {
    createRepo(modal.querySelector('.add-btn.w3-black').innerText)
  }
}

// eslint-disable-next-line no-unused-vars
function openTab (which, whatClass, btnClass) {
  const controls = {
    clone: ['repoSourceContainer', 'repoPathContainer', 'cloneRecursivelyContainer'],
    init: ['repoPathContainer'],
    import: ['repoPathContainer'],
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

// eslint-disable-next-line no-unused-vars
function toggleStatus () {
  const sb = document.getElementById('statusBar')
  const ta = document.getElementById('status')
  const xs = document.getElementById('xstatus')

  sb.style.height = (sb.style.height !== '96.18%'
    ? '96.18%'
    : '')

  if (sb.style.height === '') {
    ta.style.height = '8em'
    xs.innerText = 'Expand'
  } else {
    ta.style.height = '98.3%'
    xs.innerText = 'Collapse'
  }

  ta.scrollTop = ta.scrollHeight
}

// eslint-disable-next-line no-unused-vars
function collapseStatus () {
  const xs = document.getElementById('xstatus')

  if (xs.innerText === 'Collapse') {
    toggleStatus()
  }
}
