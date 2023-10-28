import Dexie from 'dexie'
import { Diff, diff as getDiff } from 'tn-diff'
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
    // if(diff[0] === Diff )

    this.table(namespace).put({ serial: ++ns.serial, diff })
    ns.lastvalue = value
  }
}
