interface Methods<T> {
    timeout?: number;
    value: () => T;
    namespace: () => string;
    onChange: (value: T) => void;
}
export declare class UndoStack<T> {
    private section;
    private methods;
    private timeout;
    constructor(section?: string, methods?: Methods<T>);
    private get enabled();
    private get ns();
    private get value();
    change(value: any): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    update(): void;
}
export {};