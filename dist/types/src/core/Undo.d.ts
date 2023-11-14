export declare class Undo {
    private db;
    private version;
    private namespaces;
    constructor(dbname?: string);
    private tasks;
    private running;
    private task;
    private runTask;
    private ensureDatabase;
    private createTable;
    private table;
    update(namespace: string, curr: any, maxdistance?: number): Promise<void>;
    undo(namespace: string): Promise<any>;
    redo(namespace: string): Promise<any>;
}
