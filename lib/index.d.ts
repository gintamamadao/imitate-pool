interface IConfig {
    maxSize?: number;
    getInstance: (...arg: any[]) => any;
}
interface IPoolWorker {
    start: (fn: Function) => void;
    release: () => void;
    clean: () => void;
}
declare class ImitatePool {
    private busyQueue;
    private waitQueue;
    private resolveQueue;
    private maxSize;
    private getInstance;
    constructor(config: IConfig);
    getWorker: () => Promise<IPoolWorker>;
}
export default ImitatePool;
