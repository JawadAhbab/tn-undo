export declare class Undo {
    private db;
    private version;
    private namespaces;
    constructor(dbname?: string);
    private createDatabase;
    private createTable;
    private table;
    update(namespace: string, value: any): Promise<void>;
    undo(namespace: string): Promise<any>;
    redo(namespace: string): Promise<any>;
}
