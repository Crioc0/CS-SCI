class RGBA {
    static BYTES_PER_ELEMENTS = 4
    #bytes: Uint8Array | ArrayBuffer
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

        return [
            this.#bytes[this.#byteOffset],
            this.#bytes[this.#byteOffset + 1],
            this.#bytes[this.#byteOffset + 2],
            this.#bytes[this.#byteOffset + 3]
        ];
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

class Matrix2D  {

    get BYTES_PER_ELEMENT() {
        return this.#view.BYTES_PER_ELEMENTS;
    }
    #rows: number
    #cols: number
    #view: typeof RGBA

    #bytes: Uint8Array
    #byteOffset = 0;

    constructor(rows: number, cols: number, view: typeof RGBA, existBuffer ?: Uint8Array ) {
        this.#rows = rows
        this.#cols = cols
        this.#view = view


        if(existBuffer) {
            this.#bytes = existBuffer
        } else {
            const byteLength = rows * cols * view.BYTES_PER_ELEMENTS
            let buffer: ArrayBuffer = new ArrayBuffer(byteLength)

            this.#bytes = new Uint8Array(buffer, this.#byteOffset, byteLength);
        }

    }

    get bytes() {
        return this.#bytes;
    }

    view(row : number, col: number) {
        return new this.#view(this.#bytes, this.#getOffset(row, col))
    }

    get(row:number,col:number) {
        if(row > this.#rows || col > this.#cols) {
            throw new Error("invalid argument")
        }
        return this.#view.get(this.#bytes,  this.#getOffset(row,col));
    }

    set(row:number, col:number,value: number[] | string) {
        if(row > this.#rows || col > this.#cols) {
            throw new Error("invalid argument")
        }
        this.#view.set(this.#bytes, this.#getOffset(row, col), value);
    }

    #getOffset (row, col) {
        return (row * this.#cols +col) * this.#view.BYTES_PER_ELEMENTS
    }

    fill(value) {
        console.log('Длина',this.#bytes.length)
        console.log(this.BYTES_PER_ELEMENT)
        for (let byteOffset = 0; byteOffset < this.#bytes.length; byteOffset += this.BYTES_PER_ELEMENT) {
            this.#view.set(this.#bytes, byteOffset, value);
        }
    }

    submatrix(startRow: number, endRow: number, startCol: number, endCol: number) {
        if (startRow < 0 || startCol < 0 || endRow > this.#rows || endCol > this.#cols) {
            throw new RangeError("Submatrix bounds exceed original matrix");
        }

        if (startRow >= endRow || startCol >= endCol) {
            throw new Error("Invalid submatrix dimensions");
        }

        const rows = endRow - startRow;
        const cols = endCol - startCol;

        const startOffset = this.#getOffset(startRow, startCol)

        const subBytes = new Uint8Array(this.#bytes.buffer, startOffset + this.#bytes.byteOffset, rows * cols * this.BYTES_PER_ELEMENT)

        return new Matrix2D(rows, cols, this.#view, subBytes)
    }

    *[Symbol.iterator]() {
        let byteOffset = 0;

        while (byteOffset < this.#bytes.byteLength) {
            yield new this.#view(this.#bytes, byteOffset);
            byteOffset += this.BYTES_PER_ELEMENT;
        }
    }
}

const matrix = new Matrix2D(4,4, RGBA)
matrix.fill('#FFF')
const submatrix = matrix.submatrix(2,3,2,3)
console.log('Подматрица', submatrix)
submatrix.set(1,1, [1,1,1,1])
console.log(submatrix.get(0,0))
console.log(matrix.bytes)
console.log(matrix.get(1,1))
console.log(matrix.view(1,1).red = 28)
const testGreen = matrix.view(1,1)
console.log(testGreen.green)
console.log(matrix.get(1,1))

for (let rgba of matrix) {
    console.log(rgba.bytes)
}




