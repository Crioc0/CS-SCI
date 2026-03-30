class BСD {
  private size: number;
  private data: Uint8Array;

  constructor(value: number | bigint) {
    if (value < 0) {
      throw new Error("Введите положительное число");
    }

    let num = value;
    const digits = [];

    while (num > 0) {
      if (typeof num === "bigint") {
        const lastDigit = Number(num % 10n); // берем последнюю цифру
        digits.push(lastDigit);
        num = num / 10n; // отбрасываем последнюю цифру
      } else {
        const lastDigit = num % 10; // берем последнюю цифру
        digits.push(lastDigit);
        num = Math.floor(num / 10); // отбрасываем последнюю цифру
      }
    }

    this.size = digits.length;
    this.data = new Uint8Array(digits);
  }

  toString() {
    let result = "";
    for (let i = this.size - 1; i >= 0; i--) {
      result += this.data[i];
    }
    return result;
  }

  toNumber() {
    let result = 0;
    let pow = 0;
    for (let i = 0; i < this.size; i++) {
      result += this.data[i] * 10 ** pow;
      pow++;
    }
    return result;
  }

  toBigint() {
    let result = 0n;
    for (let i = 0; i < this.size; i++) {
      result = result * 10n + BigInt(this.data[i]);
    }
    return result;
  }

  at(index: number) {
    const normalizedIndex = index < 0 ? index + this.size : index;
    if (normalizedIndex < 0 || normalizedIndex >= this.size) {
      throw new Error("Введите корректный индекс");
    }
    return this.data[normalizedIndex];
  }
}

const n = new BСD(65536n);

console.log(n.toNumber());
console.log(n.toString());
console.log(n.toBigint());

console.log(n.at(-1));
