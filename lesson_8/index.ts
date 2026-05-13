import fs from 'fs';
import readline from 'readline';
import { performance } from 'perf_hooks';
import { PackrStream, UnpackrStream } from 'msgpackr';
import { gzipSync } from 'zlib';

// ========== CSV потоковый парсер ==========
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSVStreaming(
  file: string,
  separator: string,
  onRow: (row: Record<string, string>) => void,
  onEnd: (err?: Error) => void,
) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  });
  let headers: string[] | null = null;
  let isFirstLine = true;
  let pendingField = '';
  let insideQuotes = false;
  let pendingRow: string[] = [];

  const flushRow = () => {
    if (headers && pendingRow.length === headers.length) {
      const record: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        record[headers[i]] = pendingRow[i] || '';
      }
      onRow(record);
    }
    pendingRow = [];
    pendingField = '';
    insideQuotes = false;
  };

  rl.on('line', (rawLine) => {
    let line = rawLine;
    if (isFirstLine && line.charCodeAt(0) === 0xFEFF) {
      line = line.slice(1);
    }

    let current = pendingField;
    let inQuotes = insideQuotes;
    if (inQuotes) current += '\n';

    let i = 0;
    const len = line.length;
    while (i < len) {
      const ch = line[i];
      if (ch === '"') {
        if (i + 1 < len && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (ch === separator && !inQuotes) {
        pendingRow.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }

    if (!inQuotes) {
      pendingRow.push(current);
      if (isFirstLine) {
        headers = pendingRow;
        isFirstLine = false;
        pendingRow = [];
      } else {
        flushRow();
      }
    } else {
      pendingField = current;
      insideQuotes = true;
    }
  });

  rl.on('close', () => {
    if (pendingField !== '' || pendingRow.length > 0) {
      if (!isFirstLine && pendingField !== '') {
        pendingRow.push(pendingField);
      }
      flushRow();
    }
    onEnd();
  });

  rl.on('error', (err) => onEnd(err));
}

// ========== Генерация тестовых данных ==========
const ROWS = 50000;

function writeCSV(file: string, data: any[]): Promise<void> {
  const esc = (s: any) => {
    const str = String(s);
    if (str.includes(',') || str.includes('"') || str.includes('\n'))
      return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const stream = fs.createWriteStream(file);
  stream.write('id,name,value,description\n');
  for (const row of data) {
    stream.write(`${row.id},${esc(row.name)},${row.value},${esc(row.description)}\n`);
  }
  stream.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function writeMsgpackStream(file: string, data: any[]): Promise<void> {
  const packStream = new PackrStream({ useRecords: false });
  const writeStream = fs.createWriteStream(file);
  packStream.pipe(writeStream);
  for (const item of data) {
    packStream.write(item);
  }
  packStream.end();
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function generateTestData() {
  console.log('Генерация тестовых данных...');
  const data = Array.from({ length: ROWS }, (_, i) => ({
    id: i,
    name: `User${i}`,
    value: Math.random() * 10000,
    description: `Text with "quotes", comma, and newline\nsecond line ${i}`,
  }));

  await writeCSV('large.csv', data);
  fs.writeFileSync('large.json', JSON.stringify(data));
  await writeMsgpackStream('large.msgpack', data);
  console.log('Файлы созданы: large.csv, large.json, large.msgpack\n');
}

// ========== Измерение пиковой памяти ==========
async function measurePeakMemory(fn: () => Promise<void>): Promise<number> {
  const start = process.memoryUsage().rss;
  let peak = start;
  const interval = setInterval(() => {
    peak = Math.max(peak, process.memoryUsage().rss);
  }, 20);
  await fn();
  clearInterval(interval);
  return (peak - start) / (1024 * 1024);
}

// ========== Бенчмарки ==========
async function benchCSV(file: string, sep: string) {
  let firstRowTime: number | null = null;
  let rows = 0;
  const startTotal = performance.now();

  const peakMem = await measurePeakMemory(async () => {
    await new Promise<void>((resolve, reject) => {
      parseCSVStreaming(file, sep, (row) => {
        if (firstRowTime === null) firstRowTime = performance.now() - startTotal;
        rows++;
      }, (err) => err ? reject(err) : resolve());
    });
  });

  return {
    totalTime: performance.now() - startTotal,
    firstRowLatency: firstRowTime!,
    peakMemoryMB: peakMem,
    rows,
  };
}

async function benchJSON(file: string) {
  let rows = 0;
  const startTotal = performance.now();

  const peakMem = await measurePeakMemory(async () => {
    const content = await fs.promises.readFile(file, 'utf-8');
    const data = JSON.parse(content);
    rows = data.length;
  });

  return {
    totalTime: performance.now() - startTotal,
    firstRowLatency: performance.now() - startTotal,
    peakMemoryMB: peakMem,
    rows,
  };
}

async function benchMsgpack(file: string) {
  let firstRowTime: number | null = null;
  let rows = 0;
  const startTotal = performance.now();

  const peakMem = await measurePeakMemory(async () => {
    await new Promise<void>((resolve, reject) => {
      const readStream = fs.createReadStream(file);
      const unpack = new UnpackrStream({ useRecords: false });
      readStream.pipe(unpack);
      unpack.on('data', (obj) => {
        if (firstRowTime === null) firstRowTime = performance.now() - startTotal;
        rows++;
      });
      unpack.on('end', () => resolve());
      unpack.on('error', reject);
    });
  });

  return {
    totalTime: performance.now() - startTotal,
    firstRowLatency: firstRowTime!,
    peakMemoryMB: peakMem,
    rows,
  };
}

// ========== Запуск ==========
async function runBenchmarks() {
  console.log('=== Бенчмарк (50 000 строк, ~12 МБ) ===\n');
  
  const csv = await benchCSV('large.csv', ',');
  console.log('📄 CSV (потоковый парсер):');
  console.log(`   Время обработки: ${csv.totalTime.toFixed(2)} мс`);
  console.log(`   Задержка до первой строки: ${csv.firstRowLatency.toFixed(2)} мс`);
  console.log(`   Пиковая память (RSS): ${csv.peakMemoryMB.toFixed(2)} МБ`);
  console.log(`   Строк: ${csv.rows}\n`);

  const json = await benchJSON('large.json');
  console.log('📦 JSON (native parse):');
  console.log(`   Время обработки: ${json.totalTime.toFixed(2)} мс`);
  console.log(`   Задержка до первой строки: ${json.firstRowLatency.toFixed(2)} мс`);
  console.log(`   Пиковая память (RSS): ${json.peakMemoryMB.toFixed(2)} МБ`);
  console.log(`   Строк: ${json.rows}\n`);

  const msg = await benchMsgpack('large.msgpack');
  console.log('🔷 MessagePack (потоковый UnpackrStream):');
  console.log(`   Время обработки: ${msg.totalTime.toFixed(2)} мс`);
  console.log(`   Задержка до первой строки: ${msg.firstRowLatency.toFixed(2)} мс`);
  console.log(`   Пиковая память (RSS): ${msg.peakMemoryMB.toFixed(2)} МБ`);
  console.log(`   Строк: ${msg.rows}\n`);

  // Размеры файлов
  const files = ['large.csv', 'large.json', 'large.msgpack'];
  console.log('=== Размеры файлов ===');
  for (const f of files) {
    const size = fs.statSync(f).size / 1024;
    const comp = gzipSync(fs.readFileSync(f), { level: 6 }).length / 1024;
    console.log(`${f}: ${size.toFixed(1)} KB → gzip: ${comp.toFixed(1)} KB`);
  }
}

// Главная функция
(async () => {
  await generateTestData();
  await runBenchmarks();
})().catch(console.error);