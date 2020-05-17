'use strict';

const sleep = (time = 1) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

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
      const validKey = Symbol.for("valid");
      const instanceKey = Symbol.for("instance");
      await sleep();

      if (waitQueue.length > 0) {
        let worker = waitQueue.shift();

        while ((!worker[releaseKey] || !worker[validKey]) && waitQueue.length > 0) {
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
        [validKey]: true,
        [instanceKey]: instance,
        start: async fn => {
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
          const newBusyQueue = [];

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
