import { Undo } from '../src'

const undo = new Undo()

// @ts-ignore
globalThis.$undo = undo
