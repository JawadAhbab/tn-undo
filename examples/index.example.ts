import { Undo } from '../src'

bootstrap()
async function bootstrap() {
  const undo = new Undo()
  await undo.update('one', 'one')
  await undo.update('one', 'ones')
  await undo.update('one', 'onesx')
  // undo.update('two', 'ones')

  // @ts-ignore
  globalThis.$undo = undo
}
