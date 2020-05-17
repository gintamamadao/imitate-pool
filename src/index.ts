interface IConfig {
    maxSize?: number;
    workerClass: any;
}

class ImitatePool {
    private busyQueue: any[] = [];
    private waitQueue: any[] = [];
    private resolveQueue: any[] = [];
    private workerClass: any;
    private maxSize: number = 100;
    constructor(config: IConfig) {
        this.maxSize = config.maxSize || this.maxSize;
        this.workerClass = config.workerClass;
    }
    public getWorker = () => {
        const { waitQueue, busyQueue, maxSize, workerClass } = this;
        const releaseKey: unique symbol = Symbol.for("release");
        if (waitQueue.length > 0) {
            let worker = waitQueue.shift();
            while (!worker[releaseKey] && waitQueue.length > 0) {
                worker = waitQueue.shift();
            }
            worker[releaseKey] = false;
            busyQueue.push(worker);
            return worker;
        }
        if (
            waitQueue.length + busyQueue.length >= maxSize &&
            busyQueue.length > 0
        ) {
            return new Promise((resolve) => {
                const resolveFn = () => {
                    resolve(this.getWorker());
                };
                this.resolveQueue.push(resolveFn);
            });
        }
        const workerInstance = new workerClass();
        const worker = {
            [releaseKey]: false,
            start: (...arg) => {
                if (!worker[releaseKey]) {
                    workerInstance.start.apply(workerInstance, arg);
                } else {
                    throw new Error("实例已被释放");
                }
            },
            end: (...arg) => {
                workerInstance.end &&
                    workerInstance.end.apply(workerInstance, arg);
                worker.release();
            },
            release: () => {
                if (worker[releaseKey]) {
                    return;
                }
                worker[releaseKey] = true;
                const newBusyQueue: any[] = [];
                for (const item of busyQueue) {
                    if (item !== worker) {
                        newBusyQueue.push(item);
                    }
                }
                this.waitQueue.push(worker);
                this.busyQueue = newBusyQueue;
                const resolve = this.resolveQueue.shift();
                resolve && resolve();
            },
        };
        busyQueue.push(worker);
        return worker;
    };
}

export default ImitatePool;
