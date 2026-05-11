

class RGBA {
    static BYTES_PER_ELEMENTS = 4
    #bytes: Uint8Array
    #byteOffset: number

    set red(value: number) {
        this.#bytes[this.#byteOffset ] = value
    }

    set green(value: number) {
        this.#bytes[this.#byteOffset + 1] = value
    }

    set blue(value: number) {
        this.#bytes[this.#byteOffset + 2] = value
    }

    set alpha(value: number) {
        this.#bytes[this.#byteOffset + 3] = value
    }

    get red() {
        return this.#bytes[this.#byteOffset]
    }
    get green() {
        return this.#bytes[this.#byteOffset + 1]
    }

    get blue() {
        return this.#bytes[this.#byteOffset + 2]
    }

    get alpha() {
        return this.#bytes[this.#byteOffset + 3]
    }

    get bytes () {

        return new Uint8Array(
            this.#bytes.buffer,
            this.#bytes.byteOffset + this.#byteOffset,
            4
        );
    }

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
        } else if (data instanceof ArrayBuffer) {
            // Создаем Uint8Array из ArrayBuffer
            this.#bytes = new Uint8Array(data, 0, data.byteLength)
        } else {
            throw new Error("data must be Uint8Array or ArrayBuffer")
        }
    }

    static get (bytes: Uint8Array, byteOffset = 0) {
        return [bytes[byteOffset], bytes[byteOffset +1], bytes[byteOffset + 2], bytes[byteOffset + 3]]
    }

    static set(bytes: Uint8Array, byteOffset = 0, color : string | Array<number>) {
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

// class Matrix2D  {
//
//     get BYTES_PER_ELEMENT() {
//         return this.#view.BYTES_PER_ELEMENTS;
//     }
//     #rows: number
//     #cols: number
//     #view: typeof RGBA
//
//     #bytes: Uint8Array
//     #byteOffset = 0;
//
//     constructor(rows: number, cols: number, view: typeof RGBA, existBuffer ?: Uint8Array ) {
//         this.#rows = rows
//         this.#cols = cols
//         this.#view = view
//
//
//         if(existBuffer) {
//             this.#bytes = existBuffer
//         } else {
//             const byteLength = rows * cols * view.BYTES_PER_ELEMENTS
//             let buffer: ArrayBuffer = new ArrayBuffer(byteLength)
//
//             this.#bytes = new Uint8Array(buffer, this.#byteOffset, byteLength);
//         }
//
//     }
//
//     get bytes() {
//         return this.#bytes;
//     }
//
//     view(row : number, col: number) {
//         return new this.#view(this.#bytes, this.#getOffset(row, col))
//     }
//
//     get(row:number,col:number) {
//         if(row > this.#rows || col > this.#cols) {
//             throw new Error("invalid argument")
//         }
//         return this.#view.get(this.#bytes,  this.#getOffset(row,col));
//     }
//
//     set(row:number, col:number,value: number[] | string) {
//         if(row > this.#rows || col > this.#cols) {
//             throw new Error("invalid argument")
//         }
//         this.#view.set(this.#bytes, this.#getOffset(row, col), value);
//     }
//
//     #getOffset (row, col) {
//         return (row * this.#cols +col) * this.#view.BYTES_PER_ELEMENTS
//     }
//
//     fill(value) {
//         console.log('Длина',this.#bytes.length)
//         console.log(this.BYTES_PER_ELEMENT)
//         for (let byteOffset = 0; byteOffset < this.#bytes.length; byteOffset += this.BYTES_PER_ELEMENT) {
//             this.#view.set(this.#bytes, byteOffset, value);
//         }
//     }
//
//     submatrix(startRow: number, endRow: number, startCol: number, endCol: number) {
//         if (startRow < 0 || startCol < 0 || endRow > this.#rows || endCol > this.#cols) {
//             throw new RangeError("Submatrix bounds exceed original matrix");
//         }
//
//         if (startRow >= endRow || startCol >= endCol) {
//             throw new Error("Invalid submatrix dimensions");
//         }
//
//         const rows = endRow - startRow;
//         const cols = endCol - startCol;
//
//         const startOffset = this.#getOffset(startRow, startCol)
//
//         const subBytes = new Uint8Array(this.#bytes.buffer, startOffset + this.#bytes.byteOffset, rows * cols * this.BYTES_PER_ELEMENT)
//
//         return new Matrix2D(rows, cols, this.#view, subBytes)
//     }
//
//     *[Symbol.iterator]() {
//         let byteOffset = 0;
//
//         while (byteOffset < this.#bytes.byteLength) {
//             yield new this.#view(this.#bytes, byteOffset);
//             byteOffset += this.BYTES_PER_ELEMENT;
//         }
//     }
// }

// const matrix = new Matrix2D(4,4, RGBA)
// matrix.fill('#FFF')
// const submatrix = matrix.submatrix(2,3,2,3)
// console.log('Подматрица', submatrix)
// submatrix.set(1,1, [1,1,1,1])
// console.log(submatrix.get(0,0))
// console.log(matrix.bytes)
// console.log(matrix.get(1,1))
// console.log(matrix.view(1,1).red = 28)
// const testGreen = matrix.view(1,1)
// console.log(testGreen.green)
// console.log(matrix.get(1,1))
//
// for (let rgba of matrix) {
//     console.log(rgba.bytes)
// }


class Vector {
    #capacity: number
    #length: number
    #bytes: Uint8Array
    #byteOffset: number = 0

    #view: typeof RGBA

    constructor({capacity, length = 0} : {capacity: number, length: number}, view: typeof RGBA, data: Uint8Array | null = null) {
        capacity ??= length;
        if (capacity < length) {
            throw new TypeError("capacity must be greater than length")
        }
        this.#length = length
        this.#view = view
        this.#capacity = capacity

        const bytesLength = capacity * view.BYTES_PER_ELEMENTS
        let buffer: ArrayBuffer
        if (data != null){
            buffer = new ArrayBuffer(bytesLength)
        } else {
            const minByteLength = 1024

            const maxByteLength = Math.max(bytesLength, minByteLength, bytesLength * 2);

            buffer = new ArrayBuffer(bytesLength, {maxByteLength})
        }
        this.#bytes = new Uint8Array(buffer, this.#byteOffset, bytesLength)
    }

    get length(): number {
        return this.#length
    }

    get bytes() {
        return this.#bytes;
    }

    get(index: number) {
        return this.#view.get(this.#bytes, this.getOffset(index))
    }

    get capacity(): number {
        return this.#capacity;
    }

    set(index: number, value: string | number[]) {
        return this.#view.set(this.#bytes,this.getOffset(index), value)
    }

    push(...values: (number[] | string)[]) {
        if (values.length === 0) {
            return this.length;
        }

        const newLength = this.length + values.length

        if(newLength >= this.#capacity) {
            this.reserve(newLength)
        }
        for(const value of values) {
            console.log(this.getOffset(this.#length))
            this.#view.set(this.#bytes,this.getOffset(this.length),value)
            this.#length++
        }

        return this.#length
    }

    pop() {
        if (this.#length === 0) {
            return undefined
        }
        this.#length--
        return this.#view.get(this.#bytes, this.getOffset(this.#length ))
    }

    unshift(...values: (number[] | string)[]) {
        if (values.length === 0) {
            return this.length
        }

        const newLength = this.length + values.length

        if(newLength >= this.#capacity) {
            this.#reserve(newLength)
        }

        if(this.length>0) {
            const targetOffset = values.length * this.#view.BYTES_PER_ELEMENTS
            this.#bytes.copyWithin(targetOffset,0, this.length * this.#view.BYTES_PER_ELEMENTS)
        }

        for (let i = 0; i<values.length; i++) {
            this.#view.set(this.#bytes,i* this.#view.BYTES_PER_ELEMENTS,values[i])
        }
        this.#length+= values.length
        return this.length
    }

    shift() {
        if(this.length===0) {
            return undefined
        }

        const first = this.#view.get(this.#bytes,0)

        if (this.length > 1) {
            this.#bytes.copyWithin(0, this.#view.BYTES_PER_ELEMENTS,this.length*this.#view.BYTES_PER_ELEMENTS)
        }
        this.#length--
        return  first

    }


    reserve(minCapacity: number) {
        minCapacity >>>= 0

        if (minCapacity <= this.#capacity) {
            return
        }

        this.#reserve(minCapacity)
    }

    shrinkToFit() {
        if(this.#length === this.#capacity) {
            return
        }

        const newBytesLength = this.length*this.#view.BYTES_PER_ELEMENTS
        const buffer = this.#bytes.buffer as ArrayBuffer

        if (buffer.resizable) {
            buffer.resize(newBytesLength)
           this.#bytes = new Uint8Array(buffer, this.#byteOffset,newBytesLength)
        } else {
            const maxByteLength = buffer.maxByteLength||(newBytesLength *2)
            const newBuffer = new ArrayBuffer(newBytesLength, {maxByteLength})

            const bytes = new Uint8Array(newBuffer)
            bytes.set(this.#bytes.subarray(0, newBytesLength) )
            this.#bytes = bytes
            this.#byteOffset =0
        }

        this.#capacity = this.length
    }

    #reserve(minCapacity: number) {
        let newCapacity = this.capacity || 1;

        while (newCapacity < minCapacity) {
            newCapacity = Math.ceil(newCapacity * 1.5); // Рост на 50% вместо ×2
        }

        const bytesPerElement  = this.#view.BYTES_PER_ELEMENTS;
        const newByteLength = newCapacity * bytesPerElement;

        const buffer = this.#bytes.buffer as ArrayBuffer;

        // Пытаемся использовать resize, если буфер поддерживает
        if (buffer.resizable && newByteLength > buffer.maxByteLength) {
            buffer.resize(newByteLength);
            this.#bytes = new Uint8Array(buffer, this.#byteOffset, newByteLength);

        } else {
            const maxByteLength = Math.max(newByteLength, buffer.maxByteLength || newByteLength);

            const newBuffer = new ArrayBuffer(newByteLength, { maxByteLength });
            const newBytes = new Uint8Array(newBuffer);
            newBytes.set(this.#bytes);

            this.#bytes = newBytes;
            this.#byteOffset = 0;
        }

        this.#capacity = newCapacity;
    }

    fill(value: string | number[]) {
        this.#length = this.#capacity
        for (let byteOffset = 0; byteOffset < this.#bytes.byteLength; byteOffset+=this.#view.BYTES_PER_ELEMENTS) {
            this.#view.set(this.#bytes, byteOffset, value)
        }
    }

    view(index: number) {
        return new this.#view(this.#bytes, this.getOffset(index))
    }



    getOffset(index: number) {
        if (index < 0 || index >= this.#capacity) {
            throw new RangeError(`Index out of bounds: ${index}`);
        }
        return index * this.#view.BYTES_PER_ELEMENTS
    }

    *[Symbol.iterator]() {
        let index = 0
        while(index < this.#length ) {
            yield this.get(index)
            index++
        }
    }
}

const vector = new Vector({capacity: 8, length:0}, RGBA)
// vector.fill([1,1,1,1])
const view = vector.view(0)
console.log(vector.length)
view.alpha = 6
vector.shrinkToFit()
console.log(vector.bytes)
// console.log(vector.get(1))


console.log(vector.length)
vector.unshift([10,10,10,10], [20,20,20,20])
console.log(vector.shift())
console.log(vector.shift())
vector.push([1,2,3,4],[3,4,5,6],[7,8,9,10])

console.log(vector.bytes)

for (const v of vector) {
    console.log(1, v)
}

