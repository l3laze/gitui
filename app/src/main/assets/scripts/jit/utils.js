'use strict'

/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function gitify (header, object) {
  // setStatus(`object = ${object}`)

  const string = object.toString()

  return `${header} ${string.length}\0${string}`
}

// eslint-disable-next-line no-unused-vars
function hexViewFormat (hex) {
  let bytes = 0
  let output = ''
  let line = ''
  let text = ''
  let ch = 0

  for (let i = 0; i < hex.length; i += 2) {
    line += hex.substring(i, i + 2) + ' '
    ch = parseInt(hex.substring(i, i + 2), 16)

    bytes++

    text += (ch > 30 && ch < 128)
      ? String.fromCharCode(ch)
      : '.'

    if (bytes === 4) {
      line += '| '
    } else if (bytes === 8 || i + 2 > hex.length) {
      output += line + ' || ' + text + '\n'
      bytes = 0
      text = ''
      line = ''
    }
  }

  return output
}

// eslint-disable-next-line no-unused-vars
function toHex (o, padTo = 0) {
  let h

  if (typeof o === 'number') {
    h = o.toString(16)
  } else if (typeof o === 'string') {
    h = [...o]
      .map((c) => c.charCodeAt().toString(16))
      .join('')
  } else {
    throw new Error('toHex can only convert from number or string.')
  }

  while (h.length < padTo) {
    h = '0' + h
  }

  return h
}

// eslint-disable-next-line no-unused-vars
function hexToString (h) {
  let string = ''

  for (let x = 0; x < h.length; x += 2) {
    string += String.fromCharCode(parseInt(h.substring(x, x + 2), 16))
  }

  return string
}
