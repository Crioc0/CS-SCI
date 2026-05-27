// type TypedArray =  Uint8Array |
//     Uint16Array |
//     Uint32Array;
//
// type TypedArrayConstructor<T extends TypedArray> = {
//     new(capacity: number): T;
// };
//
// abstract class BaseDequeue<
//     TBuffer extends Array<number> | TypedArray
// > {
//     protected start: number;
//     protected end: number;
//     protected _length: number = 0;
//
//     protected abstract buffer: TBuffer;
//
//     protected constructor(capacity: number = 4) {
//         this.start = Math.floor(capacity / 2);
//         this.end = this.start;
//     }
//
//     get capacity() {
//         return this.buffer.length;
//     }
//
//     get data(){
//         return this.buffer;
//     }
//
//     get length() {
//         return this._length
//     }
//
//
//
//     push(value: number) {
//         if (this.end >= this.capacity) {
//             this.resize(this.capacity * 2);
//         }
//
//         this.buffer[this.end] = value as never;
//
//         this.end++;
//         this._length++;
//
//         return this.length;
//     }
//
//     unshift(value: number) {
//         if (this.start <= 0) {
//             this.resize(this.capacity * 2);
//         }
//
//         this.start--;
//
//         this.buffer[this.start] = value;
//
//         this._length++;
//
//         return this.length;
//     }
//
//     shift(){
//         if(this.length === 0) return
//
//
//         const value = this.buffer[this.start];
//
//         this.buffer[this.start] = 0
//         this.start++
//         this._length--;
//         return value
//     }
//
//     pop() {
//         if (this.length === 0) return;
//
//         this.end--;
//
//         const value = this.buffer[this.end];
//
//         this.buffer[this.end] = 0 ;
//
//         this._length--;
//
//         return value;
//     }
//
//     abstract resize(newCapacity: number): void;
// }
//
// class TypedDequeue<
//     T extends TypedArray
// > extends BaseDequeue<T> {
//
//     protected buffer: T;
//
//     constructor(
//         private View: TypedArrayConstructor<T>,
//         capacity: number = 4
//     ) {
//         super(capacity);
//
//         this.buffer = new View(capacity);
//     }
//
//     resize(newCapacity = this.length) {
//         if (newCapacity < this.length) {
//             newCapacity = this.length;
//         }
//
//         const offset =
//             Math.floor((newCapacity - this.length) / 2);
//
//         const newBuffer = new this.View(newCapacity);
//
//         newBuffer.set(
//             this.buffer.subarray(this.start, this.end),
//             offset
//         );
//
//         this.buffer = newBuffer;
//
//         this.start = offset;
//         this.end = offset + this.length;
//     }
// }
//
//
// class ArrayDequeue
//     extends BaseDequeue<number[]> {
//
//     protected buffer: number[];
//
//     constructor(capacity: number = 4) {
//         super(capacity);
//
//         this.buffer = new Array(capacity).fill(0);
//     }
//
//     resize(newCapacity = this.length) {
//         if (newCapacity < this.length) {
//             newCapacity = this.length;
//         }
//
//         const offset =
//             Math.floor((newCapacity - this.length) / 2);
//
//         const newBuffer =
//             new Array(newCapacity).fill(0);
//
//         for (
//             let i = this.start;
//             i < this.end;
//             i++
//         ) {
//             newBuffer[offset + (i - this.start)] =
//                 this.buffer[i];
//         }
//
//         this.buffer = newBuffer;
//
//         this.start = offset;
//         this.end = offset + this.length;
//     }
// }
//
// class ArrayLinkedDeque {
//
// }
//
// const arrayDequeue = new ArrayDequeue(8)
// arrayDequeue.unshift(1)
// arrayDequeue.unshift(2)
// arrayDequeue.unshift(3)
//
// console.log(arrayDequeue.length)
// console.log(arrayDequeue.shift())
//
// arrayDequeue.push(4)
// arrayDequeue.push(5)
// arrayDequeue.push(6)
//
// console.log(arrayDequeue.pop())
// const typedDequeue = new TypedDequeue(Uint32Array,4)
//
// typedDequeue.unshift(1)
// typedDequeue.unshift(2)
// typedDequeue.unshift(3)
//
// console.log(typedDequeue.length)
// console.log(typedDequeue.shift())
//
// typedDequeue.push(4)
// typedDequeue.push(5)
// typedDequeue.push(6)
//
// console.log(typedDequeue.pop())
//
//
//
// function benchmark(
//     name: string,
//     fn: () => void
// ) {
//     const start = performance.now();
//
//     fn();
//
//     const end = performance.now();
//
//     console.log(
//         `${name}: ${(end - start).toFixed(2)}ms`
//     );
// }
//
// const ITERATIONS = 10_000_000;
//
// benchmark("ArrayDequeue push", () => {
//     const deque = new ArrayDequeue(8);
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.push(i);
//     }
// });
//
// benchmark("TypedDequeue push", () => {
//     const deque = new TypedDequeue(
//         Uint32Array,
//         8
//     );
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.push(i);
//     }
// });
//
// benchmark("ArrayDequeue push/pop", () => {
//     const deque = new ArrayDequeue(8);
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.push(i);
//     }
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.pop();
//     }
// });
//
// benchmark("TypedDequeue push/pop", () => {
//     const deque = new TypedDequeue(
//         Uint32Array,
//         8
//     );
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.push(i);
//     }
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.pop();
//     }
// });
//
// benchmark("ArrayDequeue unshift", () => {
//     const deque = new ArrayDequeue(8);
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.unshift(i);
//     }
// });
//
//
//
// benchmark("TypedDequeue unshift", () => {
//     const deque = new TypedDequeue(
//         Uint32Array,
//         8
//     );
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.unshift(i);
//     }
// });
//
// benchmark("ArrayDequeue unshift/shift", () => {
//     const deque = new ArrayDequeue(8);
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.unshift(i);
//     }
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.shift();
//     }
// });
//
// benchmark("TypedDequeue unshift/shift", () => {
//     const deque = new TypedDequeue(
//         Uint32Array,
//         8
//     );
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.unshift(i);
//     }
//
//     for (let i = 0; i < ITERATIONS; i++) {
//         deque.shift();
//     }
// });
//

type QueueTypes =
    Array<any> |
    Uint8Array |
    Uint8ClampedArray |
    Int8Array |
    Uint16Array |
    Int16Array |
    Uint32Array |
    Int32Array |
    Float32Array |
    Float64Array |
    BigUint64Array |
    BigInt64Array;

type ArrayConstructor<T> = new (capacity: number) => T;

type ArrayValue<T> = T extends Array<infer E> ? E : T extends BigUint64Array | BigInt64Array ? bigint : number;

class ListNode<T> {
    value: T

    prev: ListNode<T> | null = null
    next: ListNode<T> | null = null

    constructor(value: T, {prev, next}: { prev?: ListNode<T> | null; next?: ListNode<T> | null }) {
        this.value = value

        if(prev != null) {
            this.prev = prev
            prev.next = this
        }

        if (next != null) {
            this.next = next
            next.prev = this
        }
    }
}

class LinkedList<T> {
    first: ListNode<T> | null = null;
    last: ListNode<T> | null = null;

    [Symbol.iterator]() {
        return this.values();
    }

    pushFront(value: T) {
        const { first } = this;
        this.first = new ListNode(value, { next: first });

        if (this.last == null) {
            this.last = this.first;
        }
    }

    popFront(): T | undefined {
        const { first } = this;

        if (first == null || first === this.last) {
            this.first = null;
            this.last = null;

        } else {
            this.first = first.next;
            this.first!.prev = null;
        }

        return first?.value;
    }

    pushBack(value: T) {
        const { last } = this;
        this.last = new ListNode(value, { prev: last });

        if (this.first == null) {
            this.first = this.last;
        }
    }

    popBack(): T | undefined {
        const { last } = this;

        if (last == null || last === this.first) {
            this.first = null;
            this.last = null;

        } else {
            this.last = last.prev;
            this.last!.next = null;
        }

        return last?.value;
    }

    *values() {
        let node = this.first;

        while (node != null) {
            yield node.value;
            node = node.next;
        }
    }

    *reversedValues() {
        let node = this.last;

        while (node != null) {
            yield node.value;
            node = node.prev;
        }
    }
}

class Deque<T extends QueueTypes> {
    length: number = 0;

    readonly capacity: number;
    readonly ArrayConstructor: ArrayConstructor<T>;

    list: LinkedList<T>;
    firstIndex: number | null = null;
    lastIndex: number | null = null;

    get first(): ArrayValue<T> | undefined {
        if (this.firstIndex === null) {
            return undefined
        }
        return this.list.first!.value[this.firstIndex];
    }

    get last(): ArrayValue<T> | undefined {
        if (this.lastIndex === null) {
            return undefined
        }
        return this.list.last!.value[this.lastIndex];
    }

    constructor(ArrayConstructor: ArrayConstructor<T>, capacity: number) {
        if (!Number.isSafeInteger(capacity) || capacity <= 0) {
            throw new TypeError(`Capacity must be a positive safe integer, got ${capacity}`);
        }
        this.capacity = capacity;
        this.ArrayConstructor = ArrayConstructor;

        this.list = new LinkedList<T>();
        this.list.pushFront(new ArrayConstructor(capacity));
    }

    push(value: ArrayValue<T>): number {
        return this.pushBack(value);
    }

    pop(): ArrayValue<T> | undefined {
        return this.popBack();
    }

    unshift(value: ArrayValue<T>): number {
        return this.pushFront(value);
    }

    shift(): number | undefined {
        return this.popFront();
    }

    pushFront(value: ArrayValue<T>): number {
        this.length++

        let {firstIndex} = this
        if(firstIndex == null ) {
            firstIndex = Math.floor(this.capacity / 2)
        } else {
            firstIndex--

            if(firstIndex < 0) {
                firstIndex = this.capacity - 1
                this.list.pushFront(new this.ArrayConstructor(this.capacity));
            }
        }
        this.firstIndex = firstIndex;
        this.list.first!.value[firstIndex] = value;

        if (this.lastIndex == null) {
            this.lastIndex = this.firstIndex;
        }

        return this.length;
    }

    popFront(): ArrayValue<T>| undefined {
        let {firstIndex} = this

        if (firstIndex == null) {
            return undefined;
        }

        this.length--
        const value = this.list.first!.value[firstIndex];

        if (firstIndex === this.lastIndex && this.list.first === this.list.last)  {
            this.firstIndex = null
            this.lastIndex = null
        } else {
            firstIndex++

            if( firstIndex >= this.capacity )  {
                firstIndex=0
                this.list.popFront()
            }

            this.firstIndex = firstIndex
        }
        return value
    }

    pushBack(value: T) {
        this.length++;
        let {lastIndex} = this
        if (lastIndex == null) {
            lastIndex = Math.floor(this.capacity / 2)
        } else  {
            lastIndex++
            if(lastIndex > this.capacity) {
                lastIndex = 0
                this.list.pushBack(new this.ArrayConstructor(this.capacity));
            }
        }
        this.lastIndex = lastIndex
        this.list.last!.value[lastIndex] = value;

        if (this.firstIndex == null) {
            this.firstIndex = this.lastIndex;
        }

        return this.length;

    }
    popBack(): ArrayValue<T> | undefined {
        let { lastIndex } = this;

        if (lastIndex == null) {
            return undefined;
        }

        this.length--;
        const value = this.list.last!.value[lastIndex];

        if (lastIndex === this.firstIndex && this.list.first === this.list.last) {
            this.firstIndex = null;
            this.lastIndex = null;

        } else {
            lastIndex--;

            if (lastIndex < 0) {
                lastIndex = this.capacity - 1;
                this.list.popBack();
            }

            this.lastIndex = lastIndex;
        }

        return value;
    }

}


const dequeue = new Deque(Uint8Array, 2);

dequeue.unshift(1)
dequeue.unshift(2)
dequeue.unshift(3)

console.log(dequeue.shift() ); // Удаляет с начала, возвращает удаленный элемент - 3

dequeue.push(4)
dequeue.push(5)
dequeue.push(6)

console.log(dequeue.pop() );