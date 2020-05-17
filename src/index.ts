interface IConfig {
    maxSize?: number;
    getInstance: (...arg: any[]) => any;
}

interface IPoolWorker {
    start: (fn: Function) => void;
    release: () => void;
    clean: () => void;
}

const sleep = (time: number = 1) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

class ImitatePool {
    private busyQueue: any[] = [];
    private waitQueue: any[] = [];
    private resolveQueue: any[] = [];
    private maxSize: number = 100;
    private getInstance: (...arg: any[]) => any;
    constructor(config: IConfig) {
        this.maxSize = config.maxSize || this.maxSize;
        this.getInstance = config.getInstance;
    }
    public getWorker = async (): Promise<IPoolWorker> => {
        const { waitQueue, busyQueue, maxSize, getInstance } = this;
        const releaseKey: unique symbol = Symbol.for("release");
        const validKey: unique symbol = Symbol.for("valid");
        const instanceKey: unique symbol = Symbol.for("instance");
        await sleep();
        if (waitQueue.length > 0) {
            let worker = waitQueue.shift();
            while (
                (!worker[releaseKey] || !worker[validKey]) &&
                waitQueue.length > 0
            ) {
                worker = waitQueue.shift();
            }
            worker[releaseKey] = false;
            busyQueue.push(worker);
            return worker;
        }
        if (busyQueue.length >= maxSize) {
            return new Promise((resolve) => {
                const resolveFn = () => {
                    resolve(this.getWorker());
                };
                this.resolveQueue.push(resolveFn);
            });
        }
        const instance = await getInstance();
        const worker = {
            [releaseKey]: false,
            [validKey]: true,
            [instanceKey]: instance,
            start: async (fn: any) => {
                if (worker[releaseKey]) {
                    console.error("实例已被释放");
                    return;
                }
                if (!worker[validKey]) {
                    worker[instanceKey] = await getInstance();
                }
                await fn(worker[instanceKey]);
            },
            release: () => {
                if (worker[releaseKey]) {
                    return;
                }
                worker[releaseKey] = true;
                const newBusyQueue: any[] = [];
                for (const item of this.busyQueue) {
                    if (item !== worker) {
                        newBusyQueue.push(item);
                    }
                }
                this.busyQueue = newBusyQueue;
                this.waitQueue.push(worker);
                const resolve = this.resolveQueue.shift();
                resolve && resolve();
            },
            clean: () => {
                worker[validKey] = false;
            },
        };
        this.busyQueue.push(worker);
        return worker;
    };
}

export default ImitatePool;
