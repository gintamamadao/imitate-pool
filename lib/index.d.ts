interface IConfig {
    maxSize?: number;
    workerClass: any;
}
declare class ImitatePool {
    private busyQueue;
    private waitQueue;
    private resolveQueue;
    private workerClass;
    private maxSize;
    constructor(config: IConfig);
    getWorker: () => any;
}
export default ImitatePool;
