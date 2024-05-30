import { Undo } from '../src'

const undo = new Undo('Mono')
// undo.update('one', ['one'])
// undo.update('one', ['two', 'one'])
// undo.update('one', ['one', 'two', 'three'])
// undo.update('two', 'ones')
// undo.undo('one').then(res => console.log(res))
// undo.undo('one').then(res => console.log(res))
undo.update('one', 'fuu')
undo.update('one', 'foo')

// @ts-ignore
globalThis.$undo = undo
