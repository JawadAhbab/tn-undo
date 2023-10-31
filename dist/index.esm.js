import Dexie from 'dexie';
import { cloneobj } from 'tn-cloneobj';
import { diff, DiffKind, mergeable, undo, redo } from 'tn-diff';
class Undo {
  db;
  version = 0;
  namespaces = {};
  constructor(dbname) {
    this.createDatabase(dbname);
  }
  async createDatabase() {
    let dbname = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Undo';
    await Dexie.delete(dbname);
    this.db = new Dexie(dbname);
  }
  async createTable(namespace, initvalue) {
    this.namespaces[namespace] = {
      serial: 0,
      lastvalue: initvalue
    };
    this.db.close();
    this.db.version(++this.version).stores({
      [namespace]: 'serial'
    });
    await this.db.open();
  }
  table(namespace) {
    return this.db[namespace];
  }
  async update(namespace, curr) {
    const currval = cloneobj(curr, true, false);
    const ns = this.namespaces[namespace];
    if (!ns) return await this.createTable(namespace, currval);
    const diff$1 = diff(ns.lastvalue, currval);
    if (diff$1[0] === DiffKind.IDENTICAL) return;
    const remkeys = await this.table(namespace).where('serial').above(ns.serial).keys();
    this.table(namespace).bulkDelete(remkeys);
    const laststack = await this.table(namespace).get(ns.serial);
    if (laststack) {
      const merge = mergeable(1, currval, laststack.diff, diff$1);
      if (merge.merged) await this.table(namespace).update(laststack, {
        diff: merge.diff
      });else await this.table(namespace).put({
        serial: ++ns.serial,
        diff: diff$1
      });
      ns.lastvalue = currval;
    } else {
      await this.table(namespace).put({
        serial: ++ns.serial,
        diff: diff$1
      });
      ns.lastvalue = currval;
    }
  }
  async undo(namespace) {
    const ns = this.namespaces[namespace];
    if (!ns) return undefined;
    const laststack = await this.table(namespace).get(ns.serial);
    if (!laststack) return ns.lastvalue;
    const undovalue = undo(ns.lastvalue, laststack.diff);
    ns.serial -= 1;
    ns.lastvalue = undovalue;
    return undovalue;
  }
  async redo(namespace) {
    const ns = this.namespaces[namespace];
    if (!ns) return undefined;
    const nextstack = await this.table(namespace).get(ns.serial + 1);
    if (!nextstack) return ns.lastvalue;
    const redovalue = redo(ns.lastvalue, nextstack.diff);
    ns.serial += 1;
    ns.lastvalue = redovalue;
    return redovalue;
  }
}
export { Undo };
