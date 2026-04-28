type RGBA = Uint8Array & {length: 4}

class Tuple {
    static readonly BYTES_PER_ELEMENTS = 8

    static set(view: DataView, offset: number = 0, rgba: [number,number,number,number]) {
        for (let color of rgba) {
            view.setUint8(offset, color)
            offset+= this.BYTES_PER_ELEMENTS
        }
    }

    static get(view: DataView, offset: number) {
        if(offset % this.BYTES_PER_ELEMENTS !==0) {
            throw new Error('Введите число, кратное размеру элемента')
        }
        const result = new Uint8Array(4)
        for (let i = 0;i < 4; i++) {
            result[i] = view.getUint8(offset + this.BYTES_PER_ELEMENTS * i)
        }
        return result
        //  return [
        // view.getUint8(offset),
        // view.getUint8(offset + this.BYTES_PER_ELEMENTS),
        // view.getUint8(offset + this.BYTES_PER_ELEMENTS * 2),
        // view.getUint8(offset + this.BYTES_PER_ELEMENTS * 3)
    // ];
    }
}

class TupleArray {
    readonly buffer: ArrayBuffer
    readonly BYTES_PER_ELEMENT = Tuple.BYTES_PER_ELEMENTS * 4
    readonly #dataView: DataView

    constructor(length: number) {
        this.buffer = new ArrayBuffer(length * this.BYTES_PER_ELEMENT)
        this.#dataView = new DataView(this.buffer)

    }  

    getDataView() {
        return this.#dataView
    }

    

    set(index:number, value: [number,number,number,number]) {
        const i = this.getIndex(index)
        Tuple.set(this.#dataView, i, value)
    }

    get(index:number) {
        const i = this.getIndex(index)
        
        return Tuple.get(this.#dataView, i)
    }

    getIndex(index: number) {
        return index * this.BYTES_PER_ELEMENT
    }
}

const buffer = new ArrayBuffer(31)

const tupleView = new DataView(buffer)

const tuple = new Tuple

// Tuple.set(tupleView, 0 , [255,12,31,41])

// console.log(Tuple.get(tupleView,8))

const tupleArray = new TupleArray(2)

tupleArray.set(0, [1,2,3,4])
tupleArray.set(1, [255,122,314,123])

console.log(tupleArray.get(1))

// console.log(tupleArray.getDataView())


