import { Undo } from '../src'

const undo = new Undo()

setTimeout(() => {
  undo.update('one', 'one')
  // undo.update('one', 'ones')
}, 1000)
// undo.update('one', 'ones')

// setTimeout(() => {
//   console.log('EXEC')
//   undo.update('one', 'one')
//   // undo.update('one', 'ones')
//   // undo.update('one', 'onesx')
//   // undo.update('one', 'more')

//   // undo.update('two', 'two')
//   // undo.update('two', 'twos')
//   // undo.update('two', 'twosx')

//   // undo.update('three', 'three')
//   // undo.update('three', 'threes')
//   // undo.update('three', 'threesx')

//   // undo.update('four', 'four')
//   // undo.update('four', 'fours')
//   // undo.update('four', 'foursx')
// }, 1000)

// @ts-ignore
globalThis.$undo = undo
