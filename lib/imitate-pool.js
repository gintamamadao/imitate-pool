'use strict';

class ImitatePool {
  constructor(config) {
    this.busyQueue = [];
    this.waitQueue = [];
    this.resolveQueue = [];
    this.maxSize = 100;

    this.getWorker = async () => {
      const {
        waitQueue,
        busyQueue,
        maxSize,
        getInstance
      } = this;
      const releaseKey = Symbol.for("release");

      if (waitQueue.length > 0) {
        let worker = waitQueue.shift();

        while (!worker[releaseKey] && waitQueue.length > 0) {
          worker = waitQueue.shift();
        }

        worker[releaseKey] = false;
        busyQueue.push(worker);
        return worker;
      }

      if (busyQueue.length >= maxSize) {
        return new Promise(resolve => {
          const resolveFn = () => {
            resolve(this.getWorker());
          };

          this.resolveQueue.push(resolveFn);
        });
      }

      const instance = await getInstance();
      const worker = {
        [releaseKey]: false,
        start: async fn => {
          if (!worker[releaseKey]) {
            await fn(instance);
          } else {
            throw new Error("实例已被释放");
          }
        },
        release: () => {
          if (worker[releaseKey]) {
            return;
          }

          worker[releaseKey] = true;
          const newBusyQueue = [];

          for (const item of busyQueue) {
            if (item !== worker) {
              newBusyQueue.push(item);
            }
          }

          this.waitQueue.push(worker);
          this.busyQueue = newBusyQueue;
          const resolve = this.resolveQueue.shift();
          resolve && resolve();
        }
      };
      this.busyQueue.push(worker);
      return worker;
    };

    this.maxSize = config.maxSize || this.maxSize;
    this.getInstance = config.getInstance;
  }

}

module.exports = ImitatePool;
