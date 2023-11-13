import Dexie from 'dexie'
import { cloneobj } from 'tn-cloneobj'
import { Diff, DiffKind, diff as getDiff, mergeable, redo, undo } from 'tn-diff'
import { ObjectOf } from 'tn-typescript'
type UndoStack = { serial: number; diff: Diff }
type Namespace = { lastvalue: any; serial: number }

export class Undo {
  private db!: Dexie
  private version = 0
  private namespaces: ObjectOf<Namespace> = {}
  constructor(dbname = 'Undo') {
    this.ensureDatabase(dbname)
  }

  private tasks = []
  private task<T>(exec: () => T | Promise<T>): Promise<T> {}

  private async ensureDatabase(dbname: string) {
    this.task(async () => {
      await Dexie.delete(dbname)
      this.db = new Dexie(dbname)
      this.db.version(++this.version).stores({})
      await this.db.open()
      return true
    })
  }

  private async createTable(namespace: string, initvalue: any) {
    this.namespaces[namespace] = { serial: 0, lastvalue: initvalue }
    this.db.close()
    this.db.version(++this.version).stores({ [namespace]: 'serial' })
    await this.db.open()
  }

  private table(namespace: string): Dexie.Table<UndoStack, string> {
    return (this.db as any)[namespace]
  }

  public update(namespace: string, curr: any) {
    return this.task(async () => {
      const currval = cloneobj(curr, true, false)
      const ns = this.namespaces[namespace]
      if (!ns) return await this.createTable(namespace, currval)
      const diff = getDiff(ns.lastvalue, currval)
      if (diff[0] === DiffKind.IDENTICAL) return

      const table = this.table(namespace)
      const remkeys = await table.where('serial').above(ns.serial).keys()
      table.bulkDelete(remkeys as any)

      const laststack = await table.get(ns.serial as any)
      if (laststack) {
        const merge = mergeable(1, currval, laststack.diff, diff)
        if (merge.merged) await table.update(laststack, { diff: merge.diff })
        else await table.put({ serial: ++ns.serial, diff })
        ns.lastvalue = currval
      } else {
        await table.put({ serial: ++ns.serial, diff })
        ns.lastvalue = currval
      }
    })
  }

  public undo(namespace: string) {
    return this.task(async () => {
      const ns = this.namespaces[namespace]
      if (!ns) return undefined
      const laststack = await this.table(namespace).get(ns.serial as any)
      if (!laststack) return ns.lastvalue
      const undovalue = undo(ns.lastvalue, laststack.diff)
      ns.serial -= 1
      ns.lastvalue = undovalue
      return undovalue
    })
  }

  public redo(namespace: string) {
    return this.task(async () => {
      const ns = this.namespaces[namespace]
      if (!ns) return undefined
      const nextstack = await this.table(namespace).get((ns.serial + 1) as any)
      if (!nextstack) return ns.lastvalue
      const redovalue = redo(ns.lastvalue, nextstack.diff)
      ns.serial += 1
      ns.lastvalue = redovalue
      return redovalue
    })
  }
}
