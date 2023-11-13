import { Undo } from '../src'

const undo = new Undo()

// undo.update('one', 'one')
// undo.update('one', 'ones')

setTimeout(() => {
  console.log('EXEC')
  undo.update('one', 'one')
  undo.update('one', 'ones')
  undo.update('one', 'onesx')
  undo.update('one', 'more')

  undo.update('two', 'two')
  // undo.update('two', 'twos')
  // undo.update('two', 'twosx')
}, 1000)

// @ts-ignore
globalThis.$undo = undo
