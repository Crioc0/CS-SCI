class BСD {
  private size: number;
  private data: Uint8Array;

  constructor(value: number | bigint) {
    if(value < 0) {
      throw new Error('Введите положительное число')
    }
    const digits = value
      .toString()
      .split("")
      .map((str) => parseInt(str));
    this.size = digits.length;
    this.data = new Uint8Array(this.size);
    let index = 0;

    while (index < digits.length) {
      this.data[index] = digits[index];
      index++;
    }
  }

  toString() {
    let result = "";
    for (let letter of this.data) {
      result += letter;
    }
    return result
  }

  toNumber() {
    let number = 0;
    const isPositive = this.data[0];
    let pow = 0;
    for (let i = this.size - 1; i >= 0; i--) {
      number += this.data[i] * 10 ** pow;
      pow++;
    }
    return isPositive ? number : number * -1;
  }

  toBigint() {
    let result = 0n;
    const isPositive = this.data[0];
    for (let i = 0; i < this.size; i++) {
      result = result * 10n + BigInt(this.data[i]);
    }
    return isPositive ? result : -result;
  }

  at(index: number) {
    const normalizedIndex = index < 0 ? index + this.size : index;
    if (normalizedIndex < 0 || normalizedIndex >= this.size) {
     throw new Error ('Введите корректный индекс')
    }
    return this.data[normalizedIndex];
  }
}

const n = new BСD(65536n);

console.log(BigInt(65536n))

console.log(n.toNumber());
console.log(n.toBigint());
console.log(n.toString());

console.log(n.at(0));
console.log(n.at(1));

console.log(n.at(-1));
console.log(n.at(-2));