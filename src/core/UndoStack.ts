import { Timeout } from 'tn-timeout'
import { Undo } from './Undo'
export const undo = new Undo('UndoStack')
interface Methods<T> {
  timeout?: number
  maxdistance?: number
  value: () => T | Promise<T>
  namespace: () => string
  onChange: (value: T) => void
}

export class UndoStack<T> {
  private section!: string
  private methods!: Methods<T>
  private timeout: Timeout | null = null
  private maxdistance: number
  constructor(section?: string, methods?: Methods<T>) {
    this.section = section!
    this.methods = methods!
    this.maxdistance = methods?.maxdistance ?? 1
    if (methods?.timeout) this.timeout = new Timeout(methods?.timeout)
  }

  private get enabled() {
    return !!this.methods
  }
  private get ns() {
    return `${this.section}.${this.methods.namespace()}`
  }
  public async change(value: any) {
    if (value === undefined) return
    this.methods.onChange(value)
  }

  public async undo() {
    this.checkenable()
    this.change(await undo.undo(this.ns))
  }
  public async redo() {
    this.checkenable()
    this.change(await undo.redo(this.ns))
  }
  public async serial() {
    this.checkenable()
    return undo.serial(this.ns)
  }
  public async update(maxdistance = this.maxdistance) {
    this.checkenable()
    const value = await this.methods.value()
    if (!this.timeout) undo.update(this.ns, value)
    else this.timeout.queue(() => undo.update(this.ns, value, maxdistance))
  }

  private checkenable() {
    if (!this.enabled) throw new Error('UndoStack is disabled as noting given in new UndoStack()')
  }
}
