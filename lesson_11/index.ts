class Block {
    constructor(
        public address: number,
        public size: number
    ) {}
}

class Pointer {
    address: number
    capacity: number
    length: number = 0
    private isValid = true

    constructor(
        public memory: Memory,
        address: number,
        capacity: number,
        public block: Block
    ) {
        this.address = address
        this.capacity = capacity
    }

    deref(): Uint8Array {
        if (!this.isValid) {
            throw new Error('Pointer is freed')
        }

        return new Uint8Array(
            this.memory.view,
            this.address,
            this.length || this.capacity
        )
    }

    change(buffer: ArrayBuffer) {
        if (!this.isValid) {
            throw new Error('Pointer is freed')
        }

        const bytes = new Uint8Array(buffer)

        if (bytes.byteLength > this.capacity) {
            throw new Error('Buffer too large for pointer')
        }

        this.memory.u8.set(bytes, this.address)
        this.length = bytes.byteLength
    }

    free() {
        if (!this.isValid) {
            throw new Error('Double free or invalid pointer')
        }

        this.isValid = false
        this.memory.free(this.block)
    }
}

class Memory {
    view: ArrayBuffer
    u8: Uint8Array


    stackSize: number
    stackTop: number = 0
    stackMeta: number[] = []


    bins: Map<number, Block[]> = new Map()
    largeFreeList: Block[] = []
    heapTop: number

    constructor(totalSize: number, config: { stack: number }) {
        this.view = new ArrayBuffer(totalSize)
        this.u8 = new Uint8Array(this.view)

        this.stackSize = config.stack
        this.heapTop = config.stack
    }

    push(data: ArrayBuffer): Pointer {
        const size = data.byteLength

        if (this.stackTop + size > this.stackSize) {
            throw new Error('Stack overflow')
        }

        const address = this.stackTop

        this.u8.set(new Uint8Array(data), address)

        this.stackMeta.push(size)
        this.stackTop += size

        return new Pointer(
            this,
            address,
            size,
            new Block(address, size)
        )
    }

    pop(): Pointer | undefined {
        if (this.stackMeta.length === 0) return undefined

        const size = this.stackMeta.pop()!
        this.stackTop -= size

        const address = this.stackTop

        return new Pointer(
            this,
            address,
            size,
            new Block(address, size)
        )
    }

    private isSmall(size: number): boolean {
        return size <= 256
    }

    private sizeClass(size: number): number {
        if (size <= 16) return 16
        if (size <= 32) return 32
        if (size <= 64) return 64
        if (size <= 128) return 128
        return 256
    }

    private pushBin(block: Block) {
        const cls = this.sizeClass(block.size)
        const bin = this.bins.get(cls) || []
        bin.push(block)
        this.bins.set(cls, bin)
    }

    alloc(size: number): Pointer {

        if (this.isSmall(size)) {

            const cls = this.sizeClass(size)
            const bin = this.bins.get(cls)

            if (bin && bin.length > 0) {
                const block = bin.pop()!

                const remaining = block.size - size

                if (remaining >= 16) {
                    this.pushBin(
                        new Block(block.address + size, remaining)
                    )
                }

                return new Pointer(
                    this,
                    block.address,
                    size,
                    new Block(block.address, cls)
                )
            }

            const address = this.heapTop
            this.heapTop += cls

            return new Pointer(
                this,
                address,
                size,
                new Block(address, cls)
            )
        }

        for (let i = 0; i < this.largeFreeList.length; i++) {
            const block = this.largeFreeList[i]

            if (block.size >= size) {

                this.largeFreeList.splice(i, 1)

                const remaining = block.size - size

                if (remaining >= 16) {
                    this.largeFreeList.push(
                        new Block(block.address + size, remaining)
                    )
                }

                return new Pointer(
                    this,
                    block.address,
                    size,
                    new Block(block.address, block.size)
                )
            }
        }

        const address = this.heapTop
        this.heapTop += size

        return new Pointer(
            this,
            address,
            size,
            new Block(address, size)
        )
    }

    free(block: Block) {

        if (this.isSmall(block.size)) {
            this.pushBin(block)
            return
        }

        this.largeFreeList.push(block)
    }
}

const mem = new Memory(100 * 1024, { stack: 10 * 1024 })

const enc = new TextEncoder()
const dec = new TextDecoder()

console.log("========== ТЕСТ STACK ==========")

const s1 = mem.push(enc.encode("Привет").buffer)
const s2 = mem.push(enc.encode("Мир").buffer)

console.log("STACK 1:", dec.decode(s1.deref()))
console.log("STACK 2:", dec.decode(s2.deref()))

const popped = mem.pop()
console.log("POP STACK:", dec.decode(popped!.deref()))

console.log("========== ТЕСТ SMALL BINS ==========")

const p1 = mem.alloc(10)   // bin 16
const p2 = mem.alloc(20)   // bin 32
const p3 = mem.alloc(50)   // bin 64

p1.change(enc.encode("A").buffer)
p2.change(enc.encode("B").buffer)
p3.change(enc.encode("C").buffer)

console.log("МАЛЫЙ 1:", dec.decode(p1.deref()))
console.log("МАЛЫЙ 2:", dec.decode(p2.deref()))
console.log("МАЛЫЙ 3:", dec.decode(p3.deref()))

console.log("========== ТЕСТ FREE + REUSE (BINS) ==========")

p1.free()
p2.free()

const r1 = mem.alloc(10) // должен переиспользовать bin 16
const r2 = mem.alloc(15) // должен переиспользовать bin 32

r1.change(enc.encode("16 бай").buffer)
r2.change(enc.encode("32 байта").buffer)

console.log("REUSE 16:", dec.decode(r1.deref()))
console.log("REUSE 32:", dec.decode(r2.deref()))

console.log("========== ТЕСТ LARGE FREE-LIST ==========")

const big1 = mem.alloc(500)
const big2 = mem.alloc(800)

big1.change(enc.encode("БОЛЬШОЙ БЛОК 1").buffer)
big2.change(enc.encode("БОЛЬШОЙ БЛОК 2").buffer)

console.log("LARGE 1:", dec.decode(big1.deref()))
console.log("LARGE 2:", dec.decode(big2.deref()))

big1.free()
big2.free()

console.log("========== ТЕСТ REUSE LARGE ==========")

const bigReuse = mem.alloc(400)
bigReuse.change(enc.encode("ПЕРЕИСПОЛЬЗОВАН БОЛЬШОЙ").buffer)

console.log("REUSE LARGE:", dec.decode(bigReuse.deref()))

console.log("========== ТЕСТ SPLIT ==========")

const split1 = mem.alloc(60)
split1.change(enc.encode("SPLIT TEST").buffer)

console.log("SPLIT:", dec.decode(split1.deref()))

console.log("========== ГОТОВО ==========")

