type URRetrun<D extends boolean> = Promise<D extends true ? {
    change: boolean;
    value: any;
} : any>;
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
    private urr;
    undo<D extends boolean = false>(namespace: string, details?: D): URRetrun<D>;
    redo<D extends boolean = false>(namespace: string, details?: D): URRetrun<D>;
    serial(namespace: string): Promise<number>;
    lastvalue(namespace: string): Promise<any>;
}
export {};
