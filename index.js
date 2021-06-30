'use strict'
'esversion: 6'

function copyText (text) {
  event.stopPropagation()
  navigator.clipboard.writeText(text)
    .then(function () {}, function () {})
}

function setStatus (text) {
  const stat = document.getElementById('status')
  if (stat.value !== '') {
    stat.value += '\n'
  }

  stat.value += text
  stat.scrollTop = stat.scrollHeight;
}

function openRepo (which) {
  setStatus('Opening ' + which)
  event.stopPropagation()
}

function pullRepo (which) {
  setStatus('Pulling ' + which)
  event.stopPropagation()
}

function pushRepo (which) {
  setStatus('Pushing ' + which)
  event.stopPropagation()
}

function openModal (title) {
  let modes = [
    'Settings',
    'Add'
  ]

  for (let m of modes) {
    if (m !== title) {
      document.getElementById(m.toLowerCase() + 'Modal').style.display = 'none'
    } else {
      document.getElementById(m.toLowerCase() + 'Modal').style.display = 'block'
    }
  }

  document.getElementById('modal').style.display = 'block'
  document.getElementById('modal_title').innerText = title

  setStatus('Opened modal for ' + title)
}

function closeModal () {
  document.getElementById('modal').style.display = 'none'

  setStatus('Closed modal')
}

function openTab (which) {
  setStatus('Opening tab ' + which)
}

function importRepo () {
  setStatus('Importing repo...')
}

window.onclick = function (event) {
  if (event.target.className.indexOf('w3-modal') > -1) {
    closeModal()
  }
}

window.onerror = function (err) {
  setStatus(err)
}
