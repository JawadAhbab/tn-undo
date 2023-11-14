import { Timeout } from 'tn-timeout'
import { Undo } from './Undo'
import { Func } from 'tn-typescript'
export const undo = new Undo('UndoStack')
interface Methods<T> {
  timeout?: number
  maxdistance?: number
  value: () => T | Promise<T>
  namespace: () => string
  onChange: (value: T, prevalue: T) => void
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
  public async change(value: any, prevalue: any) {
    if (value === undefined) return
    this.methods.onChange(value, prevalue)
  }

  public async undo() {
    this.checkenable()
    const prevalue = await undo.lastvalue(this.ns)
    this.change(await undo.undo(this.ns), prevalue)
  }
  public async redo() {
    this.checkenable()
    const prevalue = await undo.lastvalue(this.ns)
    this.change(await undo.redo(this.ns), prevalue)
  }
  public async serial() {
    this.checkenable()
    return undo.serial(this.ns)
  }
  public async update(maxdistance = this.maxdistance, callback?: Func) {
    this.checkenable()
    const value = await this.methods.value()
    const update = async () => {
      await undo.update(this.ns, value, maxdistance)
      callback && callback()
    }
    if (!this.timeout) update()
    else this.timeout.queue(() => update())
  }

  private checkenable() {
    if (!this.enabled) throw new Error('UndoStack is disabled as noting given in new UndoStack()')
  }
}
