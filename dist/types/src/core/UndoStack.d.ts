import { Undo } from './Undo';
export declare const undo: Undo;
interface Methods<T> {
    timeout?: number;
    maxdistance?: number;
    value: () => T | Promise<T>;
    namespace: () => string;
    onChange: (value: T) => void;
}
export declare class UndoStack<T> {
    private section;
    private methods;
    private timeout;
    private maxdistance;
    constructor(section?: string, methods?: Methods<T>);
    private get enabled();
    private get ns();
    change(value: any): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    serial(): number;
    update(maxdistance?: number): Promise<void>;
    private checkenable;
}
export {};
