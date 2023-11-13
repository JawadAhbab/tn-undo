import { Undo } from '../src'

bootstrap()
async function bootstrap() {
  const undo = new Undo()
  undo.update('one', 'one')
  undo.update('one', 'ones')
  undo.update('one', 'onesx')
  // undo.update('two', 'ones')

  // @ts-ignore
  globalThis.$undo = undo
}
