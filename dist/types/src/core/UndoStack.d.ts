import { Func } from 'tn-typescript';
import { Undo } from './Undo';
export declare const $undo: Undo;
export type UndoStackChangeAction = 'undo' | 'redo';
interface Methods<T> {
    timeout?: number;
    maxdistance?: number;
    value: () => T | Promise<T>;
    namespace: () => string;
    onChange: (value: T, prevalue: T, action: UndoStackChangeAction) => void;
}
export declare class UndoStack<T> {
    private section;
    private methods;
    private timeout;
    private maxdistance;
    constructor(section?: string, methods?: Methods<T>);
    private get enabled();
    private get ns();
    change(value: any, prevalue: any, action: UndoStackChangeAction): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    serial(): Promise<number>;
    lastvalue(): Promise<any>;
    update(maxdistance?: number, callback?: Func): Promise<void>;
    private checkenable;
}
export {};
