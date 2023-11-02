import { Timeout } from 'tn-timeout'
import { Undo } from './Undo'
const $undo = new Undo()
interface Methods<T> {
  timeout?: number
  value: () => T
  namespace: () => string
  onChange: (value: T) => void
}

export class UndoStack<T> {
  private section!: string
  private methods!: Methods<T>
  private timeout: Timeout | null = null
  constructor(section?: string, methods?: Methods<T>) {
    this.section = section!
    this.methods = methods!
    if (methods?.timeout) this.timeout = new Timeout(methods?.timeout)
  }

  private get enabled() {
    return !!this.methods
  }
  private get ns() {
    return `${this.section}.${this.methods.namespace()}`
  }
  private get value() {
    return this.methods.value()
  }
  public async change(value: any) {
    if (value === undefined) return
    this.methods.onChange(value)
  }

  public async undo() {
    if (!this.enabled) return
    this.change(await $undo.undo(this.ns))
  }
  public async redo() {
    if (!this.enabled) return
    this.change(await $undo.redo(this.ns))
  }
  public update() {
    if (!this.enabled) return
    if (!this.timeout) $undo.update(this.ns, this.value)
    else this.timeout.queue(() => $undo.update(this.ns, this.value))
  }
}
