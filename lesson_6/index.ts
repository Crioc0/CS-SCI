class Benchmark {
  // Замер суммарного времени выполнения operation 100_000 раз на одном массиве
  static measureTotalTime(
    createArray: () => number[],
    operation: (arr: number[]) => void,
    iterations: number = 100_000,
  ): number {
    // Прогрев JIT на отдельном массиве
    const warmupArr = createArray();
    for (let i = 0; i < 100; i++) {
      operation(warmupArr);
    }

    // Основной замер
    const arr = createArray();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      operation(arr);
    }
    const end = performance.now();
    return end - start;
  }

  static createArrayWithFill(length: number): number[] {
    return new Array(length).fill(0);
  }

  static createArrayWithNewArray(length: number): number[] {
    return new Array(length);
  }

  static createArrayWithHoles(length: number): number[] {
    const result = [];
    result[length - 1] = 0;
    return result;
  }

  static createArrayWithRandomHoles(
    length: number,
    fillRatio: number = 0.5, // доля заполненных элементов (0..1)
    useSeed: number | null = 42, // null = без фиксации seed, число = детерминированный random
  ): number[] {
    // Создаём массив с дырами (ни одного элемента не присвоено)
    const array = new Array(length);

    // Простая детерминированная "случайность" (если нужен повторяемый результат)
    const random =
      useSeed !== null
        ? (() => {
            let seed = useSeed;
            return () => {
              seed = (seed * 9301 + 49297) % 233280;
              return seed / 233280;
            };
          })()
        : () => Math.random();

    for (let i = 0; i < length; i++) {
      if (random() < fillRatio) {
        array[i] = 0; // заполненная ячейка
      }
      // иначе — дыра (не присваиваем ничего)
    }
    return array;
  }

  private static runOperationBenchmark(
    operationName: string,
    operation: (arr: number[]) => void,
    size: number,
  ) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📌 ${operationName}: начальный размер = ${size}`);
    console.log("=".repeat(60));

    const creators = [
      { name: "▶ fill-массив", fn: () => Benchmark.createArrayWithFill(size) },
      {
        name: "▶ new Array(length)",
        fn: () => Benchmark.createArrayWithNewArray(size),
      },
      {
        name: "▶ массив с рандомными дырками",
        fn: () => Benchmark.createArrayWithRandomHoles(size),
      },
      {
        name: "▶ массив с элементом в конце",
        fn: () => Benchmark.createArrayWithHoles(size),
      },
    ];

    for (const { name, fn } of creators) {
      console.log(name);
      const time = Benchmark.measureTotalTime(fn, operation);
      console.log(`   Время 100 000 ${operationName}: ${time.toFixed(2)} мс`);
    }
  }

  // Запуск всех тестов для всех размеров и операций
  static runAll(sizes: number[]) {
    const operations = [
      { name: "push", fn: (arr: number[]) => arr.push(1) },
      { name: "pop", fn: (arr: number[]) => arr.pop() },
      { name: "unshift", fn: (arr: number[]) => arr.unshift(1) },
      { name: "shift", fn: (arr: number[]) => arr.shift() },
    ];

    for (const size of sizes) {
      for (const { name, fn } of operations) {
        Benchmark.runOperationBenchmark(name, fn, size);
      }
    }
  }
}

// ------------------ Запуск ------------------
const sizes = [100, 1000, 10000, 100_000];
Benchmark.runAll(sizes);

// Плотный массив (все ячейки заполнены) — работает быстро и предсказуемо.
// Массив с дырками (пустые места) — обычно тоже нормально, но может тормозить.
// Массив, у которого заполнена только последняя ячейка — это катастрофа для скорости, особенно если удалять или добавлять элементы в начало.

export class RingBuffer<T> {
  private buffer: (T | null)[];
  private head: number = 0; // Индекс для записи (push)
  private tail: number = 0; // Индекс для чтения (shift)
  private size: number = 0; // Текущее количество элементов

  constructor(private capacity: number) {
    if (capacity <= 0) throw new Error("Вместимость должна быть больше 0");
    this.buffer = new Array(capacity).fill(null);
  }

  // Добавление в конец (O(1))
  public push(value: T): void {
    if (this.isFull()) {
      // Перезаписываем старый элемент, сдвигая tail
      this.tail = (this.tail + 1) % this.capacity;
    } else {
      this.size++;
    }
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
  }

  // Удаление из начала (O(1))
  public shift(): T | null {
    if (this.isEmpty()) return null;
    const value = this.buffer[this.tail];
    this.buffer[this.tail] = null;
    this.tail = (this.tail + 1) % this.capacity;
    this.size--;
    return value;
  }

  // Добавление в начало (O(1))
  public unshift(value: T): void {
    if (this.isFull()) {
      // Перезаписываем последний элемент, сдвигая head
      this.head = (this.head - 1 + this.capacity) % this.capacity;
    } else {
      this.size++;
    }
    this.tail = (this.tail - 1 + this.capacity) % this.capacity;
    this.buffer[this.tail] = value;
  }

  // Удаление из конца (O(1))
  public pop(): T | null {
    if (this.isEmpty()) return null;
    this.head = (this.head - 1 + this.capacity) % this.capacity;
    const value = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.size--;
    return value;
  }

  public isFull(): boolean {
    return this.size === this.capacity;
  }
  public isEmpty(): boolean {
    return this.size === 0;
  }
  public getLength(): number {
    return this.size;
  }
}

function runBenchmark() {
  const SIZE = 300_000;

  // ---- RingBuffer ----
  const rb = new RingBuffer(SIZE);
  console.time("Буфер");
  for (let i = 0; i < SIZE; i++) {
    if (i % 2 === 0) rb.push(i);
    else rb.unshift(i);
    if (i % 10 === 0) {
      rb.pop();
      rb.shift();
    }
  }
  console.timeEnd("Буфер");

  // ---- Array ----
  const arr = [];
  console.time("Массив");
  for (let i = 0; i < SIZE; i++) {
    if (i % 2 === 0) arr.push(i);
    else arr.unshift(i);
    if (i % 10 === 0) {
      arr.pop();
      arr.shift();
    }
  }
  console.timeEnd("Массив");
}
runBenchmark();
