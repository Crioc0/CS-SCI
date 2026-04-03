// Типы и интерфейсы
type RGBA = [red: number, green: number, blue: number, alpha: number];

enum TraverseMode {
  RowMajor,
  ColMajor,
}

interface PixelStream {
  getPixel(x: number, y: number): RGBA;
  setPixel(x: number, y: number, rgba: RGBA): RGBA;
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void;
}

// 1. Flat Array Implementation
class FlatArrayPixelStream implements PixelStream {
  private data: number[];
  private width: number;
  private height: number;

  constructor(
    width: number,
    height: number,
    initialColor: RGBA = [0, 0, 0, 255],
  ) {
    this.width = width;
    this.height = height;
    const totalPixels = width * height;
    this.data = new Array(totalPixels * 4);

    for (let i = 0; i < totalPixels; i++) {
      this.data[i * 4] = initialColor[0];
      this.data[i * 4 + 1] = initialColor[1];
      this.data[i * 4 + 2] = initialColor[2];
      this.data[i * 4 + 3] = initialColor[3];
    }
  }

  private getIndex(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  getPixel(x: number, y: number): RGBA {
    const idx = this.getIndex(x, y);
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    const idx = this.getIndex(x, y);
    const old = [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return old as RGBA;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          callback(this.getPixel(x, y), x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          callback(this.getPixel(x, y), x, y);
        }
      }
    }
  }
}

// 2. Array of Arrays Implementation
class ArrayOfArraysPixelStream implements PixelStream {
  private data: number[][][];
  private width: number;
  private height: number;

  constructor(
    width: number,
    height: number,
    initialColor: RGBA = [0, 0, 0, 255],
  ) {
    this.width = width;
    this.height = height;
    this.data = new Array(height);

    for (let y = 0; y < height; y++) {
      this.data[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        this.data[y][x] = [...initialColor];
      }
    }
  }

  getPixel(x: number, y: number): RGBA {
    return [...this.data[y][x]] as RGBA;
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    const old = [...this.data[y][x]] as RGBA;
    this.data[y][x] = [...rgba];
    return old;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          callback([...this.data[y][x]] as RGBA, x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          callback([...this.data[y][x]] as RGBA, x, y);
        }
      }
    }
  }
}

// 3. Array of Objects Implementation
interface RGBAPixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

class ArrayOfObjectsPixelStream implements PixelStream {
  private data: RGBAPixel[][];
  private width: number;
  private height: number;

  constructor(
    width: number,
    height: number,
    initialColor: RGBA = [0, 0, 0, 255],
  ) {
    this.width = width;
    this.height = height;
    this.data = new Array(height);

    for (let y = 0; y < height; y++) {
      this.data[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        this.data[y][x] = {
          r: initialColor[0],
          g: initialColor[1],
          b: initialColor[2],
          a: initialColor[3],
        };
      }
    }
  }

  getPixel(x: number, y: number): RGBA {
    const pixel = this.data[y][x];
    return [pixel.r, pixel.g, pixel.b, pixel.a];
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    const pixel = this.data[y][x];
    const old: RGBA = [pixel.r, pixel.g, pixel.b, pixel.a];
    pixel.r = rgba[0];
    pixel.g = rgba[1];
    pixel.b = rgba[2];
    pixel.a = rgba[3];
    return old;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const pixel = this.data[y][x];
          callback([pixel.r, pixel.g, pixel.b, pixel.a], x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          const pixel = this.data[y][x];
          callback([pixel.r, pixel.g, pixel.b, pixel.a], x, y);
        }
      }
    }
  }
}

// 4. Typed Array Implementation
class TypedArrayPixelStream implements PixelStream {
  private data: Uint8Array;
  private width: number;
  private height: number;

  constructor(
    width: number,
    height: number,
    initialColor: RGBA = [0, 0, 0, 255],
  ) {
    this.width = width;
    this.height = height;
    const totalPixels = width * height;
    this.data = new Uint8Array(totalPixels * 4);

    for (let i = 0; i < totalPixels; i++) {
      this.data[i * 4] = initialColor[0];
      this.data[i * 4 + 1] = initialColor[1];
      this.data[i * 4 + 2] = initialColor[2];
      this.data[i * 4 + 3] = initialColor[3];
    }
  }

  private getIndex(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  getPixel(x: number, y: number): RGBA {
    const idx = this.getIndex(x, y);
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    const idx = this.getIndex(x, y);
    const old: RGBA = [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return old;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = this.getIndex(x, y);
          callback(
            [
              this.data[idx],
              this.data[idx + 1],
              this.data[idx + 2],
              this.data[idx + 3],
            ],
            x,
            y,
          );
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          const idx = this.getIndex(x, y);
          callback(
            [
              this.data[idx],
              this.data[idx + 1],
              this.data[idx + 2],
              this.data[idx + 3],
            ],
            x,
            y,
          );
        }
      }
    }
  }
}

// Бенчмарк система (исправленная версия)
interface BenchmarkResult {
  implementation: string;
  operation: string;
  imageSize: string;
  width: number;
  height: number;
  timeMs: number;
  operationsPerSecond: number;
}

class Benchmark {
  static async measure(
    operation: () => void,
    iterations: number = 5,
  ): Promise<number> {
    // Прогрев
    for (let i = 0; i < 2; i++) {
      operation();
    }

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      operation();
    }
    const end = performance.now();
    return (end - start) / iterations;
  }

  static async runBenchmarks(
    implementations: Array<{
      name: string;
      create: (w: number, h: number) => PixelStream;
    }>,
    sizes: Array<{ width: number; height: number; name: string }>,
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      console.log(`\n${"=".repeat(70)}`);
      console.log(
        `📐 Тестирование: ${size.name} (${size.width}x${size.height} = ${size.width * size.height} пикселей)`,
      );
      console.log(`${"=".repeat(70)}`);

      for (const impl of implementations) {
        console.log(`\n  🔬 ${impl.name}:`);

        const stream = impl.create(size.width, size.height);

        // 1. getPixel бенчмарк (чтение 1000 случайных пикселей)
        const getTime = await Benchmark.measure(() => {
          for (let i = 0; i < 1000; i++) {
            const x = Math.floor(Math.random() * size.width);
            const y = Math.floor(Math.random() * size.height);
            stream.getPixel(x, y);
          }
        }, 10);

        results.push({
          implementation: impl.name,
          operation: "getPixel",
          imageSize: size.name,
          width: size.width,
          height: size.height,
          timeMs: getTime,
          operationsPerSecond: 1000 / getTime,
        });

        // 2. setPixel бенчмарк (запись 1000 случайных пикселей)
        const setTime = await Benchmark.measure(() => {
          for (let i = 0; i < 1000; i++) {
            const x = Math.floor(Math.random() * size.width);
            const y = Math.floor(Math.random() * size.height);
            stream.setPixel(x, y, [255, 100, 50, 255]);
          }
        }, 10);

        results.push({
          implementation: impl.name,
          operation: "setPixel",
          imageSize: size.name,
          width: size.width,
          height: size.height,
          timeMs: setTime,
          operationsPerSecond: 1000 / setTime,
        });

        // 3. forEach RowMajor бенчмарк
        let rowCounter = 0;
        const rowTime = await Benchmark.measure(() => {
          stream.forEach(TraverseMode.RowMajor, () => {
            rowCounter++;
          });
        }, 3);

        const pixelsPerSecRow = (size.width * size.height) / (rowTime / 1000);
        results.push({
          implementation: impl.name,
          operation: "forEach (Построчный)",
          imageSize: size.name,
          width: size.width,
          height: size.height,
          timeMs: rowTime,
          operationsPerSecond: pixelsPerSecRow,
        });

        // 4. forEach ColMajor бенчмарк
        let colCounter = 0;
        const colTime = await Benchmark.measure(() => {
          stream.forEach(TraverseMode.ColMajor, () => {
            colCounter++;
          });
        }, 3);

        const pixelsPerSecCol = (size.width * size.height) / (colTime / 1000);
        results.push({
          implementation: impl.name,
          operation: "forEach (Постолбцовый)",
          imageSize: size.name,
          width: size.width,
          height: size.height,
          timeMs: colTime,
          operationsPerSecond: pixelsPerSecCol,
        });

        // Вывод индивидуальных результатов
        console.log(
          `    getPixel:  ${getTime.toFixed(4)}мс (${(1000 / getTime).toFixed(0)} оп/сек)`,
        );
        console.log(
          `    setPixel:  ${setTime.toFixed(4)}мс (${(1000 / setTime).toFixed(0)} оп/сек)`,
        );
        console.log(
          `    Построчный:  ${rowTime.toFixed(4)}мс (${Math.round(pixelsPerSecRow / 1000)}K пикс/сек)`,
        );
        console.log(
          `    Постолбцовый: ${colTime.toFixed(4)}мс (${Math.round(pixelsPerSecCol / 1000)}K пикс/сек)`,
        );
      }
    }

    return results;
  }

  static printSummary(results: BenchmarkResult[]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(
      "📊 СВОДНАЯ ТАБЛИЦА ПРОИЗВОДИТЕЛЬНОСТИ (нормализовано к самой быстрой реализации)",
    );
    console.log(`${"=".repeat(80)}`);

    // Группировка по размеру изображения и операции
    const operations = [
      "getPixel",
      "setPixel",
      "forEach (Построчный)",
      "forEach (Постолбцовый)",
    ];
    const imageSizes = [...new Set(results.map((r) => r.imageSize))];

    for (const imageSize of imageSizes) {
      console.log(`\n🎯 ${imageSize}:`);
      console.log(`${"-".repeat(70)}`);

      for (const operation of operations) {
        console.log(`\n  📌 ${operation}:`);

        const filtered = results.filter(
          (r) => r.imageSize === imageSize && r.operation === operation,
        );

        if (filtered.length === 0) continue;

        const fastest = Math.min(...filtered.map((r) => r.timeMs));
        const sorted = filtered.sort((a, b) => a.timeMs - b.timeMs);

        for (const result of sorted) {
          const ratio = result.timeMs / fastest;
          const marker = result.timeMs === fastest ? "🏆 САМЫЙ БЫСТРЫЙ" : "";

          console.log(
            `    ${result.implementation.padEnd(18)}: ${result.timeMs.toFixed(4)}мс (медленнее в ${ratio.toFixed(2)}x) ${marker}`,
          );
        }
      }
    }

    // Сравнение лучших реализаций по размерам
    console.log(`\n${"=".repeat(80)}`);
    console.log("🏆 ЛУЧШАЯ РЕАЛИЗАЦИЯ ПО ОПЕРАЦИИ И РАЗМЕРУ:");
    console.log(`${"=".repeat(80)}`);

    for (const operation of operations) {
      console.log(`\n  ${operation}:`);
      for (const imageSize of imageSizes) {
        const filtered = results.filter(
          (r) => r.imageSize === imageSize && r.operation === operation,
        );
        const best = filtered.reduce((min, curr) =>
          curr.timeMs < min.timeMs ? curr : min,
        );
        console.log(
          `    ${imageSize.padEnd(20)}: ${best.implementation} (${best.timeMs.toFixed(4)}мс)`,
        );
      }
    }
  }

}

// Анализатор памяти
class MemoryAnalyzer {
  static estimateMemoryUsage(
    stream: PixelStream,
    width: number,
    height: number,
  ): number {
    const pixels = width * height;

    if (stream instanceof FlatArrayPixelStream) {
      return pixels * 4 * 8;
    } else if (stream instanceof ArrayOfArraysPixelStream) {
      return pixels * 4 * 8 + pixels * 8 + height * 8;
    } else if (stream instanceof ArrayOfObjectsPixelStream) {
      return pixels * (4 * 8 + 64) + height * 8;
    } else if (stream instanceof TypedArrayPixelStream) {
      return pixels * 4;
    }
    return 0;
  }

  static analyze(
    implementations: Array<{
      name: string;
      create: (w: number, h: number) => PixelStream;
    }>,
    sizes: Array<{ width: number; height: number; name: string }>,
  ) {
    console.log(`\n${"=".repeat(70)}`);
    console.log("💾 АНАЛИЗ ИСПОЛЬЗОВАНИЯ ПАМЯТИ (оценочно в байтах)");
    console.log(`${"=".repeat(70)}`);

    for (const size of sizes) {
      console.log(
        `\n  📐 ${size.name} (${size.width}x${size.height} = ${size.width * size.height} пикселей):`,
      );

      for (const impl of implementations) {
        const stream = impl.create(size.width, size.height);
        const memory = this.estimateMemoryUsage(
          stream,
          size.width,
          size.height,
        );
        const perPixel = memory / (size.width * size.height);
        console.log(
          `    ${impl.name.padEnd(18)}: ${(memory / 1024 / 1024).toFixed(2)} МБ (${perPixel.toFixed(1)} байт/пиксель)`,
        );
      }
    }
  }
}

// Запуск бенчмарка
async function runBenchmarkOnly() {
  // Определяем реализации
  const implementations = [
    {
      name: "Плоский массив",
      create: (w: number, h: number) => new FlatArrayPixelStream(w, h),
    },
    {
      name: "Массив массивов",
      create: (w: number, h: number) => new ArrayOfArraysPixelStream(w, h),
    },
    {
      name: "Массив объектов",
      create: (w: number, h: number) => new ArrayOfObjectsPixelStream(w, h),
    },
    {
      name: "Типизированный массив",
      create: (w: number, h: number) => new TypedArrayPixelStream(w, h),
    },
  ];

  // Размеры изображений для тестирования
  const testSizes = [
    { width: 64, height: 64, name: "Маленькое (64x64)" },
    { width: 256, height: 256, name: "Среднее (256x256)" },
    { width: 1024, height: 1024, name: "Большое (1024x1024)" },
    { width: 2048, height: 2048, name: "Большое (2058x2048)" },
  ];

  console.log("🚀 PixelStream: Сравнение производительности реализаций\n");

  // Анализ памяти
  MemoryAnalyzer.analyze(implementations, testSizes);

  // Бенчмарки производительности
  const results = await Benchmark.runBenchmarks(implementations, testSizes);

  // Сводка
  Benchmark.printSummary(results);


}

// Запуск
runBenchmarkOnly();
