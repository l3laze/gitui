'use strict'

/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function commitObject (p, t, a, m) {
  const parent = p
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

    if (parent !== '') {
      lines.splice(1, 0, parent)
    }

    return lines.join('\n')
  }

  return {
    type,
    toString
  }
}
