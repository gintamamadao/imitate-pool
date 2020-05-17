# imitate-pool

-   模拟连接池的逻辑，传入获取实例的函数，限制实例化的次数，如果实例存在且空闲就是用当前实例

# 实例

```js
import ImitatePool from "imitate-pool";

function a() {
    this.start = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
                console.log("do something");
            }, 1000);
        });
    };
}

const pool = new ImitatePool({
    getInstance: () => {
        return new a();
    },
    maxSize: 3,
});

for (let i = 0; i <= 1000; i++) {
    pool.getWorker().then((worker) => {
        worker.start(async (instance) => {
            instance.start().finally(() => {
                worker.release();
            });
        });
    });
}
```
