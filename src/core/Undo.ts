import Dexie from 'dexie'
import { Diff, DiffKind, diff as getDiff, mergeable, redo, undo } from 'tn-diff'
import { ObjectOf } from 'tn-typescript'
type UndoStack = { serial: number; diff: Diff }
type Namespace = { lastvalue: any; serial: number }

export class Undo {
  private db!: Dexie
  private version = 0
  private namespaces: ObjectOf<Namespace> = {}
  constructor(dbname?: string) {
    this.createDatabase(dbname)
  }

  private async createDatabase(dbname = 'Undo') {
    await Dexie.delete(dbname)
    this.db = new Dexie(dbname)
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

  public async update(namespace: string, value: any) {
    const ns = this.namespaces[namespace]
    if (!ns) return await this.createTable(namespace, value)
    const diff = getDiff(ns.lastvalue, value)
    if (diff[0] === DiffKind.IDENTICAL) return

    // ARGENT drop next serials

    const laststack = await this.table(namespace).get(ns.serial as any)
    if (laststack) {
      const merge = mergeable(1, value, laststack.diff, diff)
      if (merge.merged) await this.table(namespace).update(laststack, { diff: merge.diff })
      else await this.table(namespace).put({ serial: ++ns.serial, diff })
      ns.lastvalue = value
    } else {
      await this.table(namespace).put({ serial: ++ns.serial, diff })
      ns.lastvalue = value
    }
  }

  public async undo(namespace: string) {
    const ns = this.namespaces[namespace]
    if (!ns) return undefined
    const laststack = await this.table(namespace).get(ns.serial as any)
    if (!laststack) return ns.lastvalue
    const undovalue = undo(ns.lastvalue, laststack.diff)
    ns.serial -= 1
    ns.lastvalue = undovalue
    return undovalue
  }

  public async redo(namespace: string) {
    const ns = this.namespaces[namespace]
    if (!ns) return undefined
    const nextstack = await this.table(namespace).get((ns.serial + 1) as any)
    if (!nextstack) return ns.lastvalue
    const redovalue = redo(ns.lastvalue, nextstack.diff)
    ns.serial += 1
    ns.lastvalue = redovalue
    return redovalue
  }
}
