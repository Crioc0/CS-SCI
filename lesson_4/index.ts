// Реализовация операции циклического сдвига влево и вправо

function cyclicLeftShift(value: number, shift: number): number {
  const left = value << shift;
  const right = value >>> (32 - shift);
  return (left | right) >>> 0;
}

function cyclicRightShift(value: number, shift: number): number {
  const left = value >>> shift;
  const right = value << (32 - shift);
  return (left | right) >>> 0;
}

function toBinary32(num: number): string {
  return (num >>> 0).toString(2).padStart(32, "0");
}

const value = 0b11110000111100001111000011110000;

// console.log("Исходное:      ", toBinary32(value));
// console.log("Влево на 16:   ", toBinary32(cyclicLeftShift(value, 16)));
// console.log("Вправо на 16:  ", toBinary32(cyclicRightShift(value, 16)));

// Поддержка кодирования двух цифр BCD 8421 в рамках одного байта

class BСD {
  private size: number;
  private data: Uint8Array;
  private mask: number;

  constructor(value: number | bigint) {
    if (value < 0) {
      throw new Error("Введите положительное число");
    }

    let num = value;
    const digits = [];

    do {
      if (typeof num === "bigint") {
        const lastDigit = Number(num % 10n); // берем последнюю цифру
        digits.push(lastDigit);
        num = num / 10n; // отбрасываем последнюю цифру
      } else {
        const lastDigit = num % 10; // берем последнюю цифру
        digits.push(lastDigit);
        num = Math.floor(num / 10); // отбрасываем последнюю цифру
      }
    } while (num !== 0);

    this.size = digits.length;
    this.data = new Uint8Array(Math.ceil(digits.length / 2));
    let index = 0;
    while (index < digits.length) {
      this.data[index >> 1] = (digits[index] << 4) | (digits[index + 1] ?? 0);
      index += 2;
    }
    this.mask = (1 << 4) - 1; // маска для получения 4 бит
  }

  toString(): string {
    let result = "";
    let shouldIngnoreFirstChar = this.size % 2 !== 0;
    for (let i = this.data.length; i >= 0; i--) {
      const byte = this.data[i];
      if (!shouldIngnoreFirstChar) {
        result += (byte >> 4) & this.mask;
      }

      if ((i + 1) * 2 <= this.size) {
        result += byte & this.mask;
      }
      shouldIngnoreFirstChar = false;
    }

    return result;
  }

  toNumber() {
    let result = 0;
    let power = 0;
    for (let i = 0; i < this.data.length; i++) {
      const byte = this.data[i];
      result += ((byte >> 4) & this.mask) * 10 ** power++;
      if ((i + 1) * 2 <= this.size) {
        result += (byte & this.mask) * 10 ** power++;
      }
    }
    return result;
  }

  toBigint() {
    let result = 0n;
    let power = 0n;
    for (let i = 0; i < this.data.length; i++) {
      const byte = this.data[i];
      result += BigInt((byte >> 4) & this.mask) * 10n ** power++;
      if ((i + 1) * 2 <= this.size) {
        result += BigInt(byte & this.mask) * 10n ** power++;
      }
    }

    return result;
  }

  at(index: number) {
    const normalizedIndex = index < 0 ? index + this.size : index;
    if (normalizedIndex < 0 || normalizedIndex >= this.size) {
      throw new Error("Введите корректный индекс");
    }
    const reversedIndex = this.size - 1 - normalizedIndex;
    const byte = this.data[reversedIndex >> 1];
    return reversedIndex % 2 ? byte & this.mask : (byte >> 4) & this.mask;
  }
}

const n = new BСD(12345);

console.log(n.toNumber());
console.log(n.toString());
console.log(n.toBigint());

console.log(n.at(4));

// Функция для кодирования и декодирования строк

// Таблица символов (код -> символ)
const codeToChar = new Map([
  ["001", " "],
  ["1101", "о"],
  ["1011", "е"],
  ["0101", "а"],
  ["0000", "и"],
  ["0001", "н"],
  ["11101", "т"],
  ["11110", "с"],
  ["10101", "р"],
  ["11000", "в"],
  ["10100", "л"],
  ["111000", "к"],
  ["111001", "м"],
  ["110010", "д"],
  ["110011", "п"],
  ["111110", "у"],
  ["011101", "я"],
  ["010010", "ы"],
  ["010011", "ь"],
  ["010000", "г"],
  ["010001", "з"],
  ["1111110", "б"],
  ["0110110", "ч"],
  ["0110111", "й"],
  ["0110100", "х"],
  ["0110101", "ж"],
  ["1001010", "ш"],
  ["1001011", "ю"],
  ["1001000", "ц"],
  ["1001001", "щ"],
  ["1001110", "э"],
  ["1001111", "ф"],
  ["1001100", "ъ"],
  ["1001101", "ё"],
  ["1111111", "\u{1F4A0}"], // верхний регистр (используем спецсимвол)
  ["0111001", "1"],
  ["0111110", "2"],
  ["0111111", "3"],
  ["0111100", "4"],
  ["0111101", "5"],
  ["0110010", "6"],
  ["0110011", "7"],
  ["0110000", "8"],
  ["0110001", "9"],
  ["0111000", "0"],
  ["1000110", "?"],
  ["1000111", "!"],
  ["1000001", ":"],
  ["1000000", ";"],
  ["1000010", "."],
  ["1000011", ","],
  ["1000101", "\n"],
  ["1000100", "\t"],
]);

const charToCode = new Map();
for (const [code, char] of codeToChar) {
  charToCode.set(char, code);
}

const UPPERCASE_CODE = "1111111";

const CYRILLIC_UPPERCASE_REGEX = /^[А-Я]/;
const CYRILLIC_LOWERCASE_REGEX = /^[а-я]/;

function encodeToBytes(str: string) {
  const bits = [];

  for (let i = 0; i < str.length; i++) {
    let char = str[i];

    // Обработка верхнего регистра
    if (CYRILLIC_UPPERCASE_REGEX.test(char)) {
      bits.push(UPPERCASE_CODE); // спецсимвол для КАЖДОЙ заглавной буквы
      char = char.toLowerCase();
    }

    const code = charToCode.get(char);
    if (!code) {
      throw new Error(`Символ '${char}' не найден в таблице кодировки`);
    }
    bits.push(code);
  }

  // Объединяем все битовые строки в одну
  const bitsString = bits.join("");

  // Дополняем до кратности 8
  const paddingLength = (8 - (bitsString.length % 8)) % 8;
  const paddedBits = bitsString + "0".repeat(paddingLength);

  // Преобразуем в байты
  const bytes = new Uint8Array(paddedBits.length / 8);
  for (let i = 0; i < paddedBits.length; i += 8) {
    const byteBits = paddedBits.slice(i, i + 8);
    bytes[i / 8] = parseInt(byteBits, 2);
  }

  return {
    bytes,
    paddingBits: paddingLength, // сохраняем информацию о дополнении
  };
}

// Функция для декодирования из потока байтов в строку
function decodeFromBytes(bytes: Uint8Array, paddingBits = 0) {
  // Преобразуем байты в битовую строку
  let bitsString = "";
  for (let i = 0; i < bytes.length; i++) {
    bitsString += bytes[i].toString(2).padStart(8, "0");
  }

  // Удаляем дополнение
  if (paddingBits > 0) {
    bitsString = bitsString.slice(0, -paddingBits);
  }

  // Декодируем битовую строку
  const result = [];
  let i = 0;
  let upperMode = false;

  while (i < bitsString.length) {
    let found = false;

    // Ищем код переменной длины (от 3 до 7 бит)
    for (let length = 3; length <= 7; length++) {
      if (i + length <= bitsString.length) {
        const code = bitsString.slice(i, i + length);

        // СНАЧАЛА проверяем на код переключения регистра
        if (code === UPPERCASE_CODE) {
          upperMode = true;
          i += length;
          found = true;
          break;
        }

        // ПОТОМ ищем обычный символ в таблице
        const char = codeToChar.get(code);
        if (char) {
          if (
            upperMode &&
            char.length === 1 &&
            CYRILLIC_LOWERCASE_REGEX.test(char)
          ) {
            result.push(char.toUpperCase());
            upperMode = false;
          } else {
            result.push(char);
          }
          i += length;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      throw new Error(
        `Не удалось декодировать битовую последовательность на позиции ${i}`,
      );
    }
  }

  return result.join("");
}

console.time("тест 1");

for (let i = 0; i < 10; i++) {
  encodeToBytes("прогрев");
}
// Тестирование
// console.log("=== Тест 1: Слово с заглавной буквы ===");
// const test1 = "Привет";
// console.log("Исходная:", test1);
// const { bytes: bytes1, paddingBits: pad1 } = encodeToBytes(test1);
// console.log("Байты:", Array.from(bytes1));
// console.log("Дополнение:", pad1, "бит");
// const decoded1 = decodeFromBytes(bytes1, pad1);
// console.log("Декодированная:", decoded1);
// console.log("Успешно:", test1 === decoded1);
// console.timeEnd('тест 1')

// console.time('тест 2')
// console.log("\n=== Тест 2: Вся строка с разным регистром ===");
// const test2 = "Привет Мир!";
// console.log("Исходная:", test2);
// const { bytes: bytes2, paddingBits: pad2 } = encodeToBytes(test2);
// console.log("Байты:", Array.from(bytes2));
// console.log("Дополнение:", pad2, "бит");
// const decoded2 = decodeFromBytes(bytes2, pad2);
// console.log("Декодированная:", decoded2);
// console.log("Успешно:", test2 === decoded2);
// console.timeEnd('тест 2')

// console.time('тест 3')
// console.log("\n=== Тест 3: Только заглавные ===");
// const test3 = "АБВГД";
// console.log("Исходная:", test3);
// const { bytes: bytes3, paddingBits: pad3 } = encodeToBytes(test3);
// console.log("Байты:", Array.from(bytes3));
// console.log("Дополнение:", pad3, "бит");
// const decoded3 = decodeFromBytes(bytes3, pad3);
// console.log("Декодированная:", decoded3);
// console.log("Успешно:", test3 === decoded3);
// console.timeEnd('тест 3')
