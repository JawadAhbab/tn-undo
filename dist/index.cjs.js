'use strict';

var Dexie = require('dexie');
var tnCloneobj = require('tn-cloneobj');
var tnDiff = require('tn-diff');
var tnTimeout = require('tn-timeout');
class Undo {
  db;
  version = 0;
  namespaces = {};
  constructor() {
    let dbname = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Undo';
    this.ensureDatabase(dbname);
  }
  tasks = [];
  running = false;
  task(exec) {
    return new Promise((resolve, reject) => {
      this.tasks.push({
        resolve,
        reject,
        exec
      });
      this.runTask();
    });
  }
  async runTask() {
    if (this.running) return;
    const task = this.tasks.shift();
    if (!task) return;
    this.running = true;
    task.exec().then(res => task.resolve(res)).catch(err => task.reject(err)).finally(() => {
      this.running = false;
      this.runTask();
    });
  }
  async ensureDatabase(dbname) {
    this.task(async () => {
      await Dexie.delete(dbname);
      this.db = new Dexie(dbname);
      this.db.version(++this.version).stores({});
      await this.db.open();
      return true;
    });
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
  update(namespace, curr) {
    let maxdistance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    return this.task(async () => {
      const currval = tnCloneobj.cloneobj(curr, true, false);
      const ns = this.namespaces[namespace];
      if (!ns) return await this.createTable(namespace, currval);
      const diff = tnDiff.diff(ns.lastvalue, currval);
      if (diff[0] === tnDiff.DiffKind.IDENTICAL) return;
      const table = this.table(namespace);
      const remkeys = await table.where('serial').above(ns.serial).keys();
      table.bulkDelete(remkeys);
      const laststack = await table.get(ns.serial);
      if (laststack) {
        const merge = tnDiff.mergeable(maxdistance, currval, laststack.diff, diff);
        if (merge.merged) await table.update(laststack, {
          diff: merge.diff
        });else await table.put({
          serial: ++ns.serial,
          diff
        });
        ns.lastvalue = currval;
      } else {
        await table.put({
          serial: ++ns.serial,
          diff
        });
        ns.lastvalue = currval;
      }
    });
  }
  undo(namespace) {
    return this.task(async () => {
      const ns = this.namespaces[namespace];
      if (!ns) return undefined;
      const laststack = await this.table(namespace).get(ns.serial);
      if (!laststack) return ns.lastvalue;
      const undovalue = tnDiff.undo(ns.lastvalue, laststack.diff);
      ns.serial -= 1;
      ns.lastvalue = undovalue;
      return undovalue;
    });
  }
  redo(namespace) {
    return this.task(async () => {
      const ns = this.namespaces[namespace];
      if (!ns) return undefined;
      const nextstack = await this.table(namespace).get(ns.serial + 1);
      if (!nextstack) return ns.lastvalue;
      const redovalue = tnDiff.redo(ns.lastvalue, nextstack.diff);
      ns.serial += 1;
      ns.lastvalue = redovalue;
      return redovalue;
    });
  }
  serial(namespace) {
    const ns = this.namespaces[namespace];
    return ns.serial;
  }
}
const undo = new Undo();
class UndoStack {
  section;
  methods;
  timeout = null;
  constructor(section, methods) {
    this.section = section;
    this.methods = methods;
    if (methods?.timeout) this.timeout = new tnTimeout.Timeout(methods?.timeout);
  }
  get enabled() {
    return !!this.methods;
  }
  get ns() {
    return `${this.section}.${this.methods.namespace()}`;
  }
  get value() {
    return this.methods.value();
  }
  async change(value) {
    if (value === undefined) return;
    this.methods.onChange(value);
  }
  async undo() {
    if (!this.enabled) return;
    this.change(await undo.undo(this.ns));
  }
  async redo() {
    if (!this.enabled) return;
    this.change(await undo.redo(this.ns));
  }
  async serial() {
    if (!this.enabled) return;
    return undo.serial(this.ns);
  }
  update() {
    let maxdistance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    if (!this.enabled) return;
    if (!this.timeout) undo.update(this.ns, this.value);else this.timeout.queue(() => undo.update(this.ns, this.value, maxdistance));
  }
}
exports.Undo = Undo;
exports.UndoStack = UndoStack;
