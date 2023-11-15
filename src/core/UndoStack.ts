import { Timeout } from 'tn-timeout'
import { Func } from 'tn-typescript'
import { Undo } from './Undo'
export const $undo = new Undo('UndoStack')
export type UndoStackChangeAction = 'undo' | 'redo'
interface Methods<T> {
  timeout?: number
  maxdistance?: number
  value: () => T | Promise<T>
  namespace: () => string
  onChange: (value: T, prevalue: T, action: UndoStackChangeAction) => void
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
  public async change(value: any, prevalue: any, action: UndoStackChangeAction) {
    if (value === undefined) return
    this.methods.onChange(value, prevalue, action)
  }

  public async undo() {
    this.checkenable()
    const prevalue = await $undo.lastvalue(this.ns)
    this.change(await $undo.undo(this.ns), prevalue, 'undo')
  }
  public async redo() {
    this.checkenable()
    const prevalue = await $undo.lastvalue(this.ns)
    this.change(await $undo.redo(this.ns), prevalue, 'redo')
  }
  public async serial() {
    this.checkenable()
    return $undo.serial(this.ns)
  }
  public async lastvalue(): Promise<T> {
    this.checkenable()
    return $undo.lastvalue(this.ns)
  }
  public async update(maxdistance = this.maxdistance, callback?: Func) {
    this.checkenable()
    const value = await this.methods.value()
    const update = async () => {
      await $undo.update(this.ns, value, maxdistance)
      callback && callback()
    }
    if (!this.timeout) update()
    else this.timeout.queue(() => update())
  }

  private checkenable() {
    if (!this.enabled) throw new Error('UndoStack is disabled as noting given in new UndoStack()')
  }
}
