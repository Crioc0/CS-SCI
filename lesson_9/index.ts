// type RGBA = Uint8Array & { length: 4 }
//
// class Tuple {
//     static readonly BYTES_PER_ELEMENTS = 8
//
//     static set(view: DataView, offset: number = 0, rgba: [number, number, number, number]) {
//         for (let color of rgba) {
//             view.setUint8(offset, color)
//             offset += this.BYTES_PER_ELEMENTS
//         }
//     }
//
//     static get(view: DataView, offset: number) {
//         if (offset % this.BYTES_PER_ELEMENTS !== 0) {
//             throw new Error('Введите число, кратное размеру элемента')
//         }
//         const result = new Uint8Array(4)
//         for (let i = 0; i < 4; i++) {
//             result[i] = view.getUint8(offset + this.BYTES_PER_ELEMENTS * i)
//         }
//         return result
//     }
// }
//
// class TupleArray {
//     readonly buffer: ArrayBuffer
//     readonly BYTES_PER_ELEMENT = Tuple.BYTES_PER_ELEMENTS * 4
//     readonly #dataView: DataView
//
//     constructor(length: number) {
//         this.buffer = new ArrayBuffer(length * this.BYTES_PER_ELEMENT)
//         this.#dataView = new DataView(this.buffer)
//
//     }
//
//     getDataView() {
//         return this.#dataView
//     }
//
//
//     set(index: number, value: [number, number, number, number]) {
//         const i = this.getIndex(index)
//         Tuple.set(this.#dataView, i, value)
//     }
//
//     get(index: number) {
//         const i = this.getIndex(index)
//
//         return Tuple.get(this.#dataView, i)
//     }
//
//     getIndex(index: number) {
//         return index * this.BYTES_PER_ELEMENT
//     }
// }
//
// const buffer = new ArrayBuffer(31)
//
// const tupleView = new DataView(buffer)
//
// const tuple = new Tuple
//
// Tuple.set(tupleView, 0, [255, 12, 31, 41])
//
// // console.log(Tuple.get(tupleView,8))
//
// const tupleArray = new TupleArray(2)
//
// tupleArray.set(0, [1, 2, 3, 4])
// tupleArray.set(1, [255, 122, 314, 123])
//
// console.log(tupleArray.get(1))
//
// console.log(tupleArray.getDataView())

class RGBA {
    static BYTES_PER_ELEMENTS = 4
    #bytes: Uint8Array | ArrayBuffer
    #byteOffset: number

    // TODO Сделать методы для установки и получения отдельных значений R G B A

    constructor(data: Uint8Array | ArrayBuffer, byteOffset = 0) {
        if (byteOffset >= data.byteLength) {
            throw new Error("byteOffset must be lower than data.byteLength")
        }

        this.#byteOffset = byteOffset

        if(data instanceof Uint8Array) {
            if(byteOffset >= data.length) {
                throw new Error("byteOffset must be lower than data.length")
            }

            this.#bytes = data
        }
    }

    static get (bytes, byteOffset = 0) {
        return [bytes[byteOffset], bytes[byteOffset +1], bytes[byteOffset + 2], bytes[byteOffset + 3]]
    }

    static set(bytes, byteOffset = 0, color : string | Array<number>) {
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                let cleanHex = color.replace(/^#/, '');
                let r, g, b, a = 255;

                if (cleanHex.length === 3) {
                    r = parseInt(cleanHex[0] + cleanHex[0], 16);
                    g = parseInt(cleanHex[1] + cleanHex[1], 16);
                    b = parseInt(cleanHex[2] + cleanHex[2], 16);
                } else if (cleanHex.length === 6) {
                    r = parseInt(cleanHex.substring(0, 2), 16);
                    g = parseInt(cleanHex.substring(2, 4), 16);
                    b = parseInt(cleanHex.substring(4, 6), 16);
                } else {
                    throw new Error('Invalid hex format');
                }

                bytes[byteOffset] = r;
                bytes[byteOffset + 1] = g;
                bytes[byteOffset + 2] = b;
                bytes[byteOffset + 3] = a;
                return;
            }
        }


        if(!Array.isArray(color) || color.length < 3) {
            throw new TypeError("invalid argument")
        }

        bytes[byteOffset] = color[0]
        bytes[byteOffset + 1] = color[1]
        bytes[byteOffset + 2] = color[2]
        bytes[byteOffset + 3] = color[3] ?? 255
    }
}

const data = new Uint8Array(4)

const test = new RGBA(data)

RGBA.set(data,0,[0,1,2,3])
console.log(RGBA.get(data))

class Matrix2D  {

    get BYTES_PER_ELEMENT() {
        return this.#view.BYTES_PER_ELEMENTS;
    }
    #rows: number
    #cols: number
    #view: typeof RGBA

    #bytes;
    #byteOffset = 0;

    constructor(rows: number, cols: number, view: typeof RGBA) {
        this.#rows = rows
        this.#cols = cols
        this.#view = view

        const byteLength = rows * cols * view.BYTES_PER_ELEMENTS
        let buffer: ArrayBuffer = new ArrayBuffer(byteLength)

        this.#bytes = new Uint8Array(buffer, this.#byteOffset, byteLength);
    }

    get bytes() {
        return this.#bytes;
    }

    get(row:number,col:number) {
        return this.#view.get(this.#bytes,  this.#getOffset(row,col));
    }

    set(row:number, col:number,value) {
        this.#view.set(this.#bytes, this.#getOffset(row, col), value);
    }

    #getOffset (row, col) {
        return (row * this.#cols +col) * this.#view.BYTES_PER_ELEMENTS
    }

    fill(value) {
        console.log('Длина',this.#bytes.length)
        console.log(this.BYTES_PER_ELEMENT)
        for (let byteOffset = 0; byteOffset < this.#bytes.length; byteOffset += this.BYTES_PER_ELEMENT) {
            console.log(byteOffset)
            this.#view.set(this.#bytes, byteOffset, value);
        }
    }
}

const matrix = new Matrix2D(2,2, RGBA)
matrix.fill('#00fe81')

console.log(matrix.bytes)
console.log(matrix.get(1,1))




