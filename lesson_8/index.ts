import * as fs from "node:fs";
import * as readline from "node:readline";

parseCSV("users.csv", ",", (err, data) => {
  if (err != null) {
    console.error(err);
    return;
  }

  console.log(data);
});

function parseCSV(
  file: string,
  separator: string,
  cb: (err: Error | null, data: Record<string, string>[]) => void,
) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  });
  let headers: string[] | null = null;
  const result: Record<string,string>[] = [];
  let isHeadersLine = true;
  rl.on("line", (line) => {
    if (isHeadersLine) {
      headers = parseCSVLine(line);
      isHeadersLine = false;
    } else {
      result.push(createRecord(parseCSVLine(line)));
    }
  });

  rl.once("close", () => {
    cb(null, result)
  });

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  function createRecord(values: string[]) {
    const record: Record<string, string> = {};
    headers!.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    return record;
  }
}
