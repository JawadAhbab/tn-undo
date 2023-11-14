import { Undo } from './Undo';
import { Func } from 'tn-typescript';
export declare const undo: Undo;
interface Methods<T> {
    timeout?: number;
    maxdistance?: number;
    value: () => T | Promise<T>;
    namespace: () => string;
    onChange: (value: T, prevalue: T) => void;
}
export declare class UndoStack<T> {
    private section;
    private methods;
    private timeout;
    private maxdistance;
    constructor(section?: string, methods?: Methods<T>);
    private get enabled();
    private get ns();
    change(value: any, prevalue: any): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    serial(): Promise<number>;
    update(maxdistance?: number, callback?: Func): Promise<void>;
    private checkenable;
}
export {};
