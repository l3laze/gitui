'use strict'

/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function blob (d) {
  const data = d
  const type = 'blob'

  function toString () {
    return data
  }

  return {
    type,
    toString,
    oid: ''
  }
}
