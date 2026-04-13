class StringBufferWithPointers {
  private buffer: ArrayBuffer;
  private decoder: TextDecoder;
  private encoder: TextEncoder;
  private stringsCount: number;
  private pointersOffset: number;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();
    
    const view = new DataView(buffer);
    this.stringsCount = view.getUint32(0);
    this.pointersOffset = 4; // После количества строк
  }

  at(index: number): string | undefined {
    const actualIndex = index >= 0 ? index : this.stringsCount + index;
    
    if (actualIndex < 0 || actualIndex >= this.stringsCount) {
      return undefined;
    }

    const view = new DataView(this.buffer);
    const pointerOffset = this.pointersOffset + actualIndex * 8;
    const length = view.getUint32(pointerOffset);
    const stringStart = view.getUint32(pointerOffset + 4);
    
    const bytes = new Uint8Array(this.buffer, stringStart, length);
    return this.decoder.decode(bytes);
  }

  // Метод set для обновления строки
  set(index: number, newValue: string): boolean {
    const actualIndex = index >= 0 ? index : this.stringsCount + index;
    
    if (actualIndex < 0 || actualIndex >= this.stringsCount) {
      return false;
    }

    const newEncoded = this.encoder.encode(newValue);
    const view = new DataView(this.buffer);
    const pointerOffset = this.pointersOffset + actualIndex * 8;
    const oldLength = view.getUint32(pointerOffset);
    const oldStart = view.getUint32(pointerOffset + 4);
    
    // Случай 1: новая строка такой же длины или короче
    if (newEncoded.length <= oldLength) {
      // Просто перезаписываем данные
      const bytes = new Uint8Array(this.buffer);
      bytes.set(newEncoded, oldStart);
      
      if (newEncoded.length < oldLength) {
        for (let i = oldStart + newEncoded.length; i < oldStart + oldLength; i++) {
          bytes[i] = 0;
        }
      }
      
      // Обновляем длину в таблице указателей
      view.setUint32(pointerOffset, newEncoded.length);
      
      return true;
    }
    
    // Случай 2: новая строка длиннее - нужно перераспределение
    if (newEncoded.length > oldLength) {
      return this.reallocateAndSet(actualIndex, newEncoded);
    }
    
    return false;
  }

  // Приватный метод для перераспределения памяти при увеличении строки
  private reallocateAndSet(index: number, newEncoded: Uint8Array): boolean {
    // Собираем все строки в массив
    const strings: string[] = [];
    for (let i = 0; i < this.stringsCount; i++) {
      if (i === index) {
        strings.push(this.decoder.decode(newEncoded));
      } else {
        strings.push(this.at(i)!);
      }
    }
    
    // Пересоздаем буфер с новыми данными
    const newBuffer = SerializerWithPointers.encode(strings);
    
    // Обновляем внутреннее состояние
    this.buffer = newBuffer.buffer;
    const view = new DataView(this.buffer);
    this.stringsCount = view.getUint32(0);
    
    return true;
  }

  get length(): number {
    return this.stringsCount;
  }

  toArray(): string[] {
    const result: string[] = [];
    for (let i = 0; i < this.stringsCount; i++) {
      result.push(this.at(i)!);
    }
    return result;
  }

  [Symbol.iterator](): Iterator<string> {
    let index = 0;
    const self = this;
    return {
      next(): IteratorResult<string> {
        if (index < self.length) {
          return { value: self.at(index++)!, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

export class SerializerWithPointers {
  static encode(strings: string[]): StringBufferWithPointers {
    const encoder = new TextEncoder();
    const encodedStrings = strings.map(s => encoder.encode(s));
    
    let totalSize = 4 + strings.length * 8;
    const dataOffsets: number[] = [];
    let currentOffset = totalSize;
    
    encodedStrings.forEach(enc => {
      dataOffsets.push(currentOffset);
      currentOffset += enc.byteLength;
    });
    totalSize = currentOffset;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const bytesView = new Uint8Array(buffer);
    
    // Записываем количество строк
    view.setUint32(0, strings.length);
    
    // Записываем указатели
    let pointerOffset = 4;
    for (let i = 0; i < strings.length; i++) {
      const enc = encodedStrings[i];
      
      view.setUint32(pointerOffset, enc.byteLength);
      view.setUint32(pointerOffset + 4, dataOffsets[i]);
      pointerOffset += 8;
      
      bytesView.set(enc, dataOffsets[i]);
    }
    
    return new StringBufferWithPointers(buffer);
  }

  static decode(buffer: StringBufferWithPointers | ArrayBuffer): string[] {
    if (buffer instanceof StringBufferWithPointers) {
      return buffer.toArray();
    }
    const stringBuffer = new StringBufferWithPointers(buffer);
    return stringBuffer.toArray();
  }
}
