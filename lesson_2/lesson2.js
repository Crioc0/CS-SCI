const instructions = {
  "SET A": 0,
  "PRINT A": 1,
  "IFN A": 2,
  RET: 3,
  "DEC A": 4,
  JMP: 5,
};

const program = [
  instructions["SET A"],  // 0 - установить начальное значение
  40,                     // 1
  instructions["PRINT A"], // 2 - вывести значение
  instructions["DEC A"],   // 3 - уменьшить A на 1
  instructions["IFN A"],   // 4 - если A не 0, то перейти на PRINT A
  instructions["RET"],     // 5 - иначе завершиться
  0,                       // 6 - код возврата
  instructions["JMP"],     // 7 - переход на PRINT A (когда A != 0)
  2,                       // 8 - индекс PRINT A
];

function execute(program) {
  let acc;
  let i = 0;

  while (true) {
    const currentInst = program[i];
    
    switch (program[i]) {
      case instructions["SET A"]: {
        acc = program[i + 1];
        i += 2;
        break;
      }
      
      case instructions["PRINT A"]: {
        i++;
        break;
      }
      
      case instructions["IFN A"]: {
        console.log(`  -> IFN A: A=${acc}`);
        if (acc !== 0) {
          i += 3; // пропуск условия
        } else {
          i++; // прямой переход на RET
        }
        break;
      }
      
      case instructions["RET"]: {
        const returnCode = program[i + 1];
        return returnCode;
      }
      
      case instructions["DEC A"]: {
        acc--;
        i++;
        break;
      }
      
      case instructions["JMP"]: {
        const jumpTo = program[i + 1];
        i = jumpTo;
        break;
      }
      
      default: {
        console.error(`Unknown instruction: ${currentInst} at index ${i}`);
        return -1;
      }
    }
  }
}

const result = execute(program);
console.log(`\n=== Программа завершилась с кодом: ${result} ===`);
