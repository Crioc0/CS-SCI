import { deepEqual, throws } from "node:assert";

interface MemoryOptions {
    stack?: number;
}

type Data =
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

interface ViewConstructor<T extends Data> {
    BYTES_PER_ELEMENT: number;
    new (buffer: ArrayBufferLike, bytesOffset: number, length: number): T;
}

interface PointerOptions<T extends Data> {
    length: number;
    alignment: number;
    memory: Uint8Array;
    destructor: () => void;
    View: ViewConstructor<T>;
}

class Pointer<T extends Data> {
    readonly index: number;
    readonly length: number;
    readonly alignment: number;
    readonly memory: Uint8Array;

    readonly destructor: () => void;
    readonly View: ViewConstructor<T>;

    released = false;

    get byteLength(): number {
        return this.memory.byteLength;
    }

    get byteOffset(): number {
        return this.memory.byteOffset;
    }

    get buffer(): ArrayBufferLike {
        return this.memory.buffer;
    }

    constructor(index: number, { memory, length, alignment, destructor, View }: PointerOptions<T>) {
        this.index = index;
        this.length = length;
        this.alignment = alignment;
        this.memory = memory;
        this.destructor = destructor;
        this.View = View;
    }

    [Symbol.dispose]() {
        if (this.released) {
            return;
        }

        this.destructor();
        this.released = true;
    }

    deref(): T {
        if (this.released) {
            throw new Error(
                `Use-after-free: cannot dereference pointer at offset ${this.index} ` +
                `(${this.length} elements, ${this.View.name}). ` +
                `The memory has been released and may be reused for other allocations.`
            );
        }

        // Проверка, что указатель не указывает за пределы памяти
        const endIndex = this.index + this.length * this.View.BYTES_PER_ELEMENT;

        if (endIndex > this.byteLength) {
            throw new RangeError(
                `Pointer out of bounds: index ${this.index}, length ${this.length}, ` +
                `total bytes ${endIndex} exceeds memory size ${this.byteLength}`
            );
        }

        const { View } = this;
        return new View(this.buffer, this.byteOffset + this.index, this.length);
    }

    change(data: T) {
        if (this.released) {
            throw new Error(
                `Use-after-free: cannot modify pointer at offset ${this.index} ` +
                `(${this.length} elements, ${this.View.name}). ` +
                `The memory has been released and may be reused for other allocations.`
            );
        }

        const view = this.deref();

        if (data.length > view.length) {
            throw new RangeError(
                `Data too large: cannot fit ${data.length} elements into buffer of ${view.length}. ` +
                `Each element is ${view.BYTES_PER_ELEMENT} bytes`
            );
        }

        view.set(data as any);

        if (data.length < view.length) {
            const end = this.index + view.length * view.BYTES_PER_ELEMENT;
            this.memory.fill(0, end - (view.length - data.length) * view.BYTES_PER_ELEMENT, end);
        }
    }
}

interface FreeBlock {
    offset: number;
    size: number;
}

class Memory {
    readonly buffer: ArrayBuffer;

    #SP: number;
    readonly #stack: Uint8Array;

    readonly #heap: Uint8Array;
    readonly #freeBlocks: FreeBlock[];

    constructor(size: number, { stack }: MemoryOptions = {}) {
        size >>>= 0;

        if (size === 0) {
            throw new RangeError(`Memory size must be positive, got ${size}`);
        }

        stack ??= Math.floor(size * 0.3);

        if (stack > size * 0.5) {
            throw new RangeError(
                `Stack size (${stack}) exceeds maximum allowed (${size * 0.5}). ` +
                `Stack cannot use more than 50% of total memory`
            );
        }

        this.buffer = new ArrayBuffer(size);

        this.#SP = -1;
        this.#stack = new Uint8Array(this.buffer, 0, stack);

        this.#heap = new Uint8Array(this.buffer, stack);
        this.#freeBlocks = [{ offset: 0, size: this.#heap.length }];
    }

    push<T extends Data>(data: T): Pointer<T> {
        const bytesLength = data.length * data.BYTES_PER_ELEMENT;

        if (bytesLength === 0) {
            throw new Error("Cannot push empty data buffer");
        }

        this.#SP++;

        const alignment = this.#findNextDivisible(this.#SP, data.BYTES_PER_ELEMENT) - this.#SP;
        const requiredSpace = alignment + bytesLength;

        if (this.#SP + requiredSpace >= this.#stack.length) {
            const available = this.#stack.length - this.#SP;
            this.#SP--;

            throw new RangeError(
                `Stack overflow: need ${requiredSpace} bytes, only ${available} available. ` +
                `Stack capacity: ${this.#stack.length} bytes`
            );
        }

        this.#SP += alignment;

        const bytes = new Uint8Array(data.buffer, data.byteOffset, bytesLength);

        this.#stack.set(bytes, this.#SP);

        const pt = new Pointer<T>(this.#SP, {
            memory: this.#stack,
            length: data.length,
            alignment,
            destructor: () => this.pop(pt),
            View: data.constructor as ViewConstructor<T>,
        });

        this.#SP += bytes.length - 1;
        return pt;
    }

    pop(pt: Pointer<any>) {
        if (pt.released) {
            throw new Error(
                `Double pop detected: pointer at offset ${pt.index} has already been popped from stack. ` +
                `Stack pointers cannot be accessed after pop.`
            );
        }

        if (pt.memory !== this.#stack) {
            throw new Error(
                "Cannot pop pointer that was not allocated on stack. " +
                "Use free() for heap pointers"
            );
        }

        const bytesSize = pt.length * pt.View.BYTES_PER_ELEMENT;
        const totalSize = bytesSize + pt.alignment;

        if (this.#SP - totalSize < -1) {
            throw new Error(
                `Stack corruption detected: pointer points beyond stack boundary. ` +
                `Current SP: ${this.#SP}, pointer claims ${totalSize} bytes`
            );
        }

        pt.released = true;

        this.#SP -= totalSize;

        if (this.#SP < -1) {
            this.#SP = -1;
        }
    }

    alloc<T extends Data>(length: number, DataType: ViewConstructor<T>): Pointer<T> {
        if (length <= 0 || !Number.isInteger(length)) {
            throw new RangeError(
                `Invalid allocation length: ${length}. Length must be a positive integer`
            );
        }

        const size = length * DataType.BYTES_PER_ELEMENT;

        for (const [i, block] of this.#freeBlocks.entries()) {
            const alignment = this.#findNextDivisible(block.offset, DataType.BYTES_PER_ELEMENT) - block.offset;
            const alignedSize = size + alignment;

            if (block.size >= alignedSize) {
                const pt = new Pointer(block.offset + alignment, {
                    memory: this.#heap,
                    length,
                    alignment,
                    destructor: () => this.free(pt),
                    View: DataType
                });

                block.offset += alignedSize;
                block.size -= alignedSize;

                if (block.size === 0) {
                    this.#freeBlocks.splice(i, 1);
                }

                return pt;
            }
        }

        const maxBlock = Math.max(...this.#freeBlocks.map(b => b.size));

        throw new Error(
            `Out of memory: unable to allocate ${size} bytes ` +
            `(requested ${length} elements of ${DataType.BYTES_PER_ELEMENT} bytes each). ` +
            `Largest free block: ${maxBlock} bytes. ` +
            `Total heap size: ${this.#heap.length} bytes`
        );
    }

    free(pt: Pointer<any>) {
        if (pt.released) {
            throw new Error(
                `Double free detected: pointer at offset ${pt.index} (${pt.length} elements, ` +
                `${pt.View.name}) has already been freed. ` +
                `Memory corruption possible if still in use.`
            );
        }

        if (pt.memory !== this.#heap) {
            throw new Error(
                "Cannot free pointer that was not allocated on heap. " +
                "Use pop() for stack pointers"
            );
        }

        const totalSize = pt.length * pt.View.BYTES_PER_ELEMENT + pt.alignment;

        if (pt.index - pt.alignment < 0 ||
            pt.index - pt.alignment + totalSize > this.#heap.length) {
            throw new RangeError(
                `Invalid pointer: points outside heap bounds. ` +
                `Offset: ${pt.index - pt.alignment}, size: ${totalSize}, ` +
                `heap range: 0-${this.#heap.length}`
            );
        }

        pt.released = true;

        this.#freeBlocks.push({
            offset: pt.index - pt.alignment,
            size: totalSize
        });

        this.#freeBlocks.sort((a, b) => a.offset - b.offset);
        this.#mergeFreeBlocks();
    }

    #mergeFreeBlocks() {
        for (let i = 0; i < this.#freeBlocks.length - 1; i++) {
            const current = this.#freeBlocks[i];
            const next = this.#freeBlocks[i + 1];

            if (current.offset + current.size === next.offset) {
                current.size += next.size;
                this.#freeBlocks.splice(i + 1, 1);
                i--;
            }
        }
    }

    #findNextDivisible(n: number, k: number): number {
        let remainder = n % k;

        if (remainder === 0) {
            return n;
        }

        return n + (k - remainder);
    }
}

class Rc<T extends Data> {
    #pt: Pointer<T>;
    #counter = 0;

    constructor(pt: Pointer<T>) {
        this.#pt = pt;
    }

    deref(): T {
        return this.#pt.deref();
    }

    change(data: T) {
        this.#pt.change(data);
    }

    clone(): this {
        if (this.#pt.released) {
            throw new Error("Released clone");
        }

        this.#counter++;
        return this;
    }

    [Symbol.dispose]() {
        if (this.#pt.released) {
            return;
        }

        this.#counter--;

        if (this.#counter < 0) {
            this.#pt[Symbol.dispose]();
        }
    }
}

const memory = new Memory(1024, { stack: 256 });

using block1 = new Rc(memory.alloc(2, Int16Array));

using block2 = block1.clone();

block1.change(new Int16Array([-18, 463]));

deepEqual(block2.deref(), new Int16Array([-18, 463]));

queueMicrotask(() => {
    throws(() => block1.deref());
    throws(() => block2.deref());
});