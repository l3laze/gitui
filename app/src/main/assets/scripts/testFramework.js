'use strict'

/* eslint no-undef: "error" */

// eslint-disable-next-line no-unused-vars
function testFramework () {
  let startTime = Date.now()
  const tests = []
  const _test = async function _test (name, testFunc, flags) {
    let result = false
    let error

    try {
      if (testFunc.constructor.name === 'AsyncFunction') {
        result = (await testFunc())
      } else {
        result = testFunc()
      }
    } catch (e) {
      error = e
      result = flags.fails || false
    }

    tests.push({
      name,
      result,
      error,
      flags
    })
  }

  const test = async function test (name, func) {
    await _test(name, func, { fails: false })
  }

  test.fails = async function fails (name, func) {
    await _test(name, func, { fails: true })
  }

  test.skip = function skip (name, func) {
    tests.push({
      name,
      skip: true
    })
  }

  test.optional = async function optional (name, func) {
    await _test(name, func, { optional: true })
  }

  test.optional.fails = async function optionalFail (name, func) {
    await _test(name, func, { optional: true, fails: true })
  }

  test.fails.optional = test.optional.fails

  test.optional.skip = test.skip
  test.skip.optional = test.skip

  test.fails.skip = test.skip
  test.skip.fails = test.skip

  test.title = async function (text, func) {
    tests.push({
      title: text
    })

    await func()
  }

  test.title.skip = function (text, func) {
    test.title(text, function () {})
  }

  function testReport (t) {
    const check = '+'
    const cross = 'x'
    const dash = '-'

    const result = {
      text: '',
      skipped: 0,
      total: 0,
      passed: 0,
      optional: 0
    }

    if (t.skip) {
      result.text = (dash + ' ' + t.name)

      result.skipped++
    } else if (t.result || (!t.result && t.flags.fails)) {
      result.text = (check + ' ' + t.name)

      result.passed++
      result.total++
    } else {
      result.text = (cross + ' ' + t.name)

      if (t.flags.optional) {
        result.optional++
      } else {
        result.total++
      }
    }

    return result
  }

  function errorReport (t) {
    return `${
      t.error.stack.split('\n')
        .map((s, i) => '  ' + s).join('\n')
    }`
  }

  function reporter () {
    const check = '+'
    const cross = 'x'
    const dash = '-'
    const lines = []

    let skipped = 0
    let total = 0
    let passed = 0
    let optional = 0
    let nextLine = ''
    let result

    for (const t of tests) {
      if (typeof t.title !== 'undefined') {
        lines.push('_'.repeat(t.title.length))
        lines.push(t.title)
        nextLine = '  '
      } else {
        result = testReport(t)

        lines.push(nextLine + result.text)

        skipped += result.skipped
        total += result.total
        passed += result.passed
        optional += result.optional
      }

      if (typeof t.error !== 'undefined') {
        lines.push(nextLine + errorReport(t))
      }
    }

    lines.push('\n-------\n')

    if (optional > 0) {
      lines.push(cross + ' ' + optional + ' optional failure(s)')
    }

    if (skipped > 0) {
      lines.push(dash + ' ' + skipped + ' skipped')
    }

    lines.push(check + ' ' + passed + ' passed')

    const percent = ('' + ((passed / total) * 100)).substring(0, 5)

    lines.push(`\n${percent}% required tests passed (${passed}/${total})`)

    const elapsedMs = Date.now() - startTime
    const elapsedTime = elapsedMs / 1000

    lines.push('\nFinished in ' + elapsedTime + 's (' + elapsedMs + 'ms)')

    return lines.join('\n')
  }

  return {
    test,
    reporter
  }
}
