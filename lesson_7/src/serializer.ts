class StringBuffer {
  private buffer: ArrayBuffer;
  private offsets: { start: number; length: number }[] | null;
  private decoder: TextDecoder;
  private encoder: TextEncoder;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();
    this.offsets = null;
  }

  [Symbol.iterator](): Iterator<string> {
    let index = 0;
    const length = this.length;
    const self = this;

    return {
      next(): IteratorResult<string> {
        if (index < length) {
          return { value: self.at(index++)!, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }

  at(index: number): string | undefined {
    if (!this.offsets) {
      this.calculateOffsets();
    }
    const actualIndex = index >= 0 ? index : this.offsets!.length + index;

    if (actualIndex < 0 || actualIndex >= this.offsets!.length) {
      return undefined;
    }
    const { start, length } = this.offsets![actualIndex];
    const bytes = new Uint8Array(this.buffer, start, length);
    return this.decoder.decode(bytes);
  }

  get length(): number {
    if (!this.offsets) {
      this.calculateOffsets();
    }
    return this.offsets!.length;
  }

  set(index: number, newValue: string): boolean {
    if (!this.offsets) {
      this.calculateOffsets();
    }

    const actualIndex = index >= 0 ? index : this.offsets!.length + index;

    if (actualIndex < 0 || actualIndex >= this.offsets!.length) {
      return false;
    }

    const newEncoded = this.encoder.encode(newValue);
    const oldOffset = this.offsets![actualIndex];
    const oldLength = oldOffset.length;
    const oldStart = oldOffset.start;

    // Случай 1: новая строка такой же длины
    if (newEncoded.length === oldLength) {
      const bytes = new Uint8Array(this.buffer);
      bytes.set(newEncoded, oldStart);
      return true;
    }

    // Случай 2: новая строка короче
    if (newEncoded.length < oldLength) {
      const bytes = new Uint8Array(this.buffer);

      // Записываем новую строку
      bytes.set(newEncoded, oldStart);

      // Сдвигаем оставшиеся данные влево
      const shift = oldLength - newEncoded.length;
      const nextStart = oldStart + oldLength;
      const remainingBytes = this.buffer.byteLength - nextStart;

      // Создаем новый буфер с уменьшенным размером
      const newBuffer = new ArrayBuffer(this.buffer.byteLength - shift);
      const newBytes = new Uint8Array(newBuffer);

      // Копируем данные до измененной строки
      newBytes.set(new Uint8Array(this.buffer, 0, oldStart));

      // Копируем новую строку
      newBytes.set(newEncoded, oldStart);

      // Копируем остаток после сдвига
      if (remainingBytes > 0) {
        newBytes.set(
          new Uint8Array(this.buffer, nextStart, remainingBytes),
          oldStart + newEncoded.length,
        );
      }

      // Обновляем буфер
      this.buffer = newBuffer;

      // Обновляем смещения и длины в offsets для всех последующих строк
      for (let i = actualIndex + 1; i < this.offsets!.length; i++) {
        this.offsets![i].start -= shift;
      }

      // Обновляем текущую строку
      this.offsets![actualIndex].length = newEncoded.length;

      // Обновляем метаданные в буфере (длины в начале каждой строки)
      this.updateMetadataLengths();

      return true;
    }

    // Случай 3: новая строка длиннее
    if (newEncoded.length > oldLength) {
      const shift = newEncoded.length - oldLength;
      const nextStart = oldStart + oldLength;
      const remainingBytes = this.buffer.byteLength - nextStart;

      // Создаем новый буфер с увеличенным размером
      const newBuffer = new ArrayBuffer(this.buffer.byteLength + shift);
      const newBytes = new Uint8Array(newBuffer);

      // Копируем данные до измененной строки
      newBytes.set(new Uint8Array(this.buffer, 0, oldStart));

      // Копируем новую строку
      newBytes.set(newEncoded, oldStart);

      // Копируем остаток после сдвига
      if (remainingBytes > 0) {
        newBytes.set(
          new Uint8Array(this.buffer, nextStart, remainingBytes),
          oldStart + newEncoded.length,
        );
      }

      // Обновляем буфер
      this.buffer = newBuffer;

      // Обновляем смещения для всех последующих строк
      for (let i = actualIndex + 1; i < this.offsets!.length; i++) {
        this.offsets![i].start += shift;
      }

      // Обновляем текущую строку
      this.offsets![actualIndex].length = newEncoded.length;

      // Обновляем метаданные в буфере
      this.updateMetadataLengths();

      return true;
    }

    return false;
  }

  // Вспомогательный метод для обновления метаданных (длин) в буфере
  private updateMetadataLengths(): void {
    const view = new DataView(this.buffer);
    let offset = 4; // пропускаем количество строк

    for (let i = 0; i < this.offsets!.length; i++) {
      view.setUint32(offset, this.offsets![i].length);
      offset += 4 + this.offsets![i].length;
    }
  }

  toArray(): string[] {
    if (!this.offsets) {
      this.calculateOffsets();
    }

    const result: string[] = [];
    for (let i = 0; i < this.offsets!.length; i++) {
      const { start, length } = this.offsets![i];
      const bytes = new Uint8Array(this.buffer, start, length);
      result.push(this.decoder.decode(bytes));
    }
    return result;
  }

  calculateOffsets() {
    const offsets: { start: number; length: number }[] = [];
    let offset = 4;
    const view = new DataView(this.buffer);
    const stringsLength = view.getUint32(0);

    for (let i = 0; i < stringsLength; i++) {
      const len = view.getUint32(offset);
      offsets.push({
        start: offset + 4,
        length: len,
      });
      offset += 4 + len;
    }
    this.offsets = offsets;
  }
}

export class Serializer {
  static encode(strings: string[]): StringBuffer {
    const encoder = new TextEncoder();
    const encodedStrings: Uint8Array[] = [];

    for (const string of strings) {
      encodedStrings.push(encoder.encode(string));
    }

    let totalSize = 4;
    encodedStrings.forEach((enc) => {
      totalSize += 4 + enc.byteLength;
    });

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    let offset = 0;
    view.setInt32(offset, strings.length);
    offset += 4;

    encodedStrings.forEach((enc) => {
      view.setUint32(offset, enc.byteLength);
      offset += 4;

      for (let i = 0; i < enc.byteLength; i++) {
        view.setUint8(offset + i, enc[i]);
      }
      offset += enc.byteLength;
    });

    return new StringBuffer(buffer);
  }

  static decode(buffer: StringBuffer | ArrayBuffer): string[] {
    if (buffer instanceof StringBuffer) {
      return buffer.toArray();
    }
    const stringBuffer = new StringBuffer(buffer);
    return stringBuffer.toArray();
  }
}
