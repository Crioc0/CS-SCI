# Dequeue на Array и TypedArray в TypeScript

## Цель

Реализовать Dequeue (двустороннюю очередь), которая:

- работает с обычными массивами
- работает с TypedArray
- поддерживает:
    - push
    - pop
    - unshift
    - shift
- автоматически расширяет буфер
- позволяет сравнить производительность и память

---

# Реализация

<details>
<summary>Решение</summary>

```ts
type TypedArray =  Uint8Array |
    Uint16Array |
    Uint32Array;

type TypedArrayConstructor<T extends TypedArray> = {
    new(capacity: number): T;
};

abstract class BaseDequeue<
    TBuffer extends Array<number> | TypedArray
> {
    protected start: number;
    protected end: number;
    protected _length: number = 0;

    protected abstract buffer: TBuffer;

    protected constructor(capacity: number = 4) {
        this.start = Math.floor(capacity / 2);
        this.end = this.start;
    }

    get capacity() {
        return this.buffer.length;
    }

    get data(){
        return this.buffer;
    }

    get length() {
        return this._length
    }



    push(value: number) {
        if (this.end >= this.capacity) {
            this.resize(this.capacity * 2);
        }

        this.buffer[this.end] = value as never;

        this.end++;
        this._length++;

        return this.length;
    }

    unshift(value: number) {
        if (this.start <= 0) {
            this.resize(this.capacity * 2);
        }

        this.start--;

        this.buffer[this.start] = value;

        this._length++;

        return this.length;
    }

    shift(){
        if(this.length === 0) return


        const value = this.buffer[this.start];

        this.buffer[this.start] = 0
        this.start++
        this._length--;
        return value
    }

    pop() {
        if (this.length === 0) return;

        this.end--;

        const value = this.buffer[this.end];

        this.buffer[this.end] = 0 ;

        this._length--;

        return value;
    }

    abstract resize(newCapacity: number): void;
}

class TypedDequeue<
    T extends TypedArray
> extends BaseDequeue<T> {

    protected buffer: T;

    constructor(
        private View: TypedArrayConstructor<T>,
        capacity: number = 4
    ) {
        super(capacity);

        this.buffer = new View(capacity);
    }

    resize(newCapacity = this.length) {
        if (newCapacity < this.length) {
            newCapacity = this.length;
        }

        const offset =
            Math.floor((newCapacity - this.length) / 2);

        const newBuffer = new this.View(newCapacity);

        newBuffer.set(
            this.buffer.subarray(this.start, this.end),
            offset
        );

        this.buffer = newBuffer;

        this.start = offset;
        this.end = offset + this.length;
    }
}


class ArrayDequeue
    extends BaseDequeue<number[]> {

    protected buffer: number[];

    constructor(capacity: number = 4) {
        super(capacity);

        this.buffer = new Array(capacity).fill(0);
    }

    resize(newCapacity = this.length) {
        if (newCapacity < this.length) {
            newCapacity = this.length;
        }

        const offset =
            Math.floor((newCapacity - this.length) / 2);

        const newBuffer =
            new Array(newCapacity).fill(0);

        for (
            let i = this.start;
            i < this.end;
            i++
        ) {
            newBuffer[offset + (i - this.start)] =
                this.buffer[i];
        }

        this.buffer = newBuffer;

        this.start = offset;
        this.end = offset + this.length;
    }
}
```
</details>

---

# Пример использования

```ts
const arrayDequeue = new ArrayDequeue(8);

arrayDequeue.unshift(1);
arrayDequeue.unshift(2);
arrayDequeue.unshift(3);

console.log(arrayDequeue.length);
console.log(arrayDequeue.shift());

arrayDequeue.push(4);
arrayDequeue.push(5);
arrayDequeue.push(6);

console.log(arrayDequeue.pop());

const typedDequeue = new TypedDequeue(
    Uint32Array,
    4
);

typedDequeue.unshift(1);
typedDequeue.unshift(2);
typedDequeue.unshift(3);

console.log(typedDequeue.length);
console.log(typedDequeue.shift());

typedDequeue.push(4);
typedDequeue.push(5);
typedDequeue.push(6);

console.log(typedDequeue.pop());
```

---

# Benchmark

```ts
function benchmark(
    name: string,
    fn: () => void
) {
    const start = performance.now();

    fn();

    const end = performance.now();

    console.log(
        `${name}: ${(end - start).toFixed(2)}ms`
    );
}

const ITERATIONS = 10_000_000;

benchmark("ArrayDequeue push", () => {
    const deque = new ArrayDequeue(8);

    for (let i = 0; i < ITERATIONS; i++) {
        deque.push(i);
    }
});

benchmark("TypedDequeue push", () => {
    const deque = new TypedDequeue(
        Uint32Array,
        8
    );

    for (let i = 0; i < ITERATIONS; i++) {
        deque.push(i);
    }
});

benchmark("ArrayDequeue push/pop", () => {
    const deque = new ArrayDequeue(8);

    for (let i = 0; i < ITERATIONS; i++) {
        deque.push(i);
    }

    for (let i = 0; i < ITERATIONS; i++) {
        deque.pop();
    }
});

benchmark("TypedDequeue push/pop", () => {
    const deque = new TypedDequeue(
        Uint32Array,
        8
    );

    for (let i = 0; i < ITERATIONS; i++) {
        deque.push(i);
    }

    for (let i = 0; i < ITERATIONS; i++) {
        deque.pop();
    }
});

benchmark("ArrayDequeue unshift", () => {
    const deque = new ArrayDequeue(8);

    for (let i = 0; i < ITERATIONS; i++) {
        deque.unshift(i);
    }
});

benchmark("TypedDequeue unshift", () => {
    const deque = new TypedDequeue(
        Uint32Array,
        8
    );

    for (let i = 0; i < ITERATIONS; i++) {
        deque.unshift(i);
    }
});

benchmark("ArrayDequeue unshift/shift", () => {
    const deque = new ArrayDequeue(8);

    for (let i = 0; i < ITERATIONS; i++) {
        deque.unshift(i);
    }

    for (let i = 0; i < ITERATIONS; i++) {
        deque.shift();
    }
});

benchmark("TypedDequeue unshift/shift", () => {
    const deque = new TypedDequeue(
        Uint32Array,
        8
    );

    for (let i = 0; i < ITERATIONS; i++) {
        deque.unshift(i);
    }

    for (let i = 0; i < ITERATIONS; i++) {
        deque.shift();
    }
});
```

---

# Результаты benchmark

```txt
ArrayDequeue push
Time: 254.57ms

TypedDequeue push
Time: 113.31ms

ArrayDequeue push/pop
Time: 306.59ms

TypedDequeue push/pop
Time: 164.98ms

ArrayDequeue unshift
Time: 245.01ms

TypedDequeue unshift
Time: 77.27ms

ArrayDequeue unshift/shift
Time: 358.57ms

TypedDequeue unshift/shift
Time: 139.73ms
```

---

# Выводы

## TypedArray оказался значительно быстрее

Примерно:

- push → ~2x быстрее
- push/pop → ~2x быстрее
- unshift → ~3x быстрее
- unshift/shift → ~2.5x быстрее

---

# Почему TypedArray быстрее

## 1. Непрерывный участок памяти

TypedArray хранится в памяти как один непрерывный блок данных.

Это даёт:

- лучшую локальность кэша процессора
- меньше переходов по указателям
- предсказуемое расположение данных в памяти

## 2. Фиксированный тип

Например:

```ts
Uint32Array
```

всегда содержит:

```txt
unsigned 32-bit integer
```


---

## 3. Быстрое копирование

В resize используется:

```ts
TypedArray.set()
```


---

# Почему Array медленнее

JS Array:

- более динамический
- поддерживает mixed types
- использует hidden classes
- имеет runtime overhead

Зато:

- гибче
- проще

---


# Где TypedArray особенно полезен

- realtime systems
- game loops
- networking
- audio/video buffers
- streaming
- queues
- data processing
- binary protocols

---

# Итог

## TypedDequeue

Плюсы:

- значительно быстрее
- стабильный memory layout
- меньше GC pressure
- эффективное копирование

Минусы:

- больше native memory
- работает только с числами
- resize всё ещё дорогой

---

## ArrayDequeue

Плюсы:

- универсальность
- простота
- гибкость

Минусы:

- заметно медленнее
- больше runtime overhead
- хуже locality