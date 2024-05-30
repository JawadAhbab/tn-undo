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
      await table.bulkDelete(remkeys);
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
  urr(change, value, details) {
    if (!details) return value;
    return {
      change,
      value
    };
  }
  undo(namespace, details) {
    return this.task(async () => {
      const ns = this.namespaces[namespace];
      if (!ns) return this.urr(false, undefined, details);
      const laststack = await this.table(namespace).get(ns.serial);
      if (!laststack) return this.urr(false, ns.lastvalue, details);
      const undovalue = tnDiff.undo(ns.lastvalue, laststack.diff);
      ns.serial -= 1;
      ns.lastvalue = undovalue;
      return this.urr(true, undovalue, details);
    });
  }
  redo(namespace, details) {
    return this.task(async () => {
      const ns = this.namespaces[namespace];
      if (!ns) return this.urr(false, undefined, details);
      const nextstack = await this.table(namespace).get(ns.serial + 1);
      if (!nextstack) return this.urr(false, ns.lastvalue, details);
      const redovalue = tnDiff.redo(ns.lastvalue, nextstack.diff);
      ns.serial += 1;
      ns.lastvalue = redovalue;
      return this.urr(true, redovalue, details);
    });
  }
  serial(namespace) {
    return this.task(async () => {
      const ns = this.namespaces[namespace];
      return ns?.serial || 0;
    });
  }
  lastvalue(namespace) {
    return this.task(async () => {
      const ns = this.namespaces[namespace];
      return ns.lastvalue;
    });
  }
}
const $undo = new Undo('UndoStack');
class UndoStack {
  section;
  methods;
  timeout = null;
  maxdistance;
  constructor(section, methods) {
    this.section = section;
    this.methods = methods;
    this.maxdistance = methods?.maxdistance ?? 1;
    if (methods?.timeout) this.timeout = new tnTimeout.Timeout(methods?.timeout);
  }
  get enabled() {
    return !!this.methods;
  }
  get ns() {
    return `${this.section}.${this.methods.namespace()}`;
  }
  async change(value, prevalue, action) {
    if (value === undefined) return;
    this.methods.onChange(value, prevalue, action);
  }
  async undo() {
    this.checkenable();
    const prevalue = await $undo.lastvalue(this.ns);
    const {
      change,
      value
    } = await $undo.undo(this.ns, true);
    if (change) this.change(value, prevalue, 'undo');
  }
  async redo() {
    this.checkenable();
    const prevalue = await $undo.lastvalue(this.ns);
    const {
      change,
      value
    } = await $undo.redo(this.ns, true);
    if (change) this.change(value, prevalue, 'redo');
  }
  async serial() {
    this.checkenable();
    return $undo.serial(this.ns);
  }
  async lastvalue() {
    this.checkenable();
    return $undo.lastvalue(this.ns);
  }
  async update() {
    let maxdistance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.maxdistance;
    let callback = arguments.length > 1 ? arguments[1] : undefined;
    this.checkenable();
    const value = await this.methods.value();
    const update = async () => {
      await $undo.update(this.ns, value, maxdistance);
      callback && callback();
    };
    if (!this.timeout) update();else this.timeout.queue(() => update());
  }
  checkenable() {
    if (!this.enabled) throw new Error('UndoStack is disabled as noting given in new UndoStack()');
  }
}
exports.$undo = $undo;
exports.Undo = Undo;
exports.UndoStack = UndoStack;
