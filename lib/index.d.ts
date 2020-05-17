interface IConfig {
    maxSize?: number;
    getInstance: (...arg: any[]) => any;
}
declare class ImitatePool {
    private busyQueue;
    private waitQueue;
    private resolveQueue;
    private maxSize;
    private getInstance;
    constructor(config: IConfig);
    getWorker: () => Promise<any>;
}
export default ImitatePool;
