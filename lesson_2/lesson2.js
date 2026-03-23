const instructions = {
  "SET A": 0,
  "PRINT A": 1,
  "IFN A": 2,
  RET: 3,
  "DEC A": 4,
  JMP: 5,
};

const program = [
  instructions["SET A"], // 0 - установить начальное значение
  40, // 1
  instructions["PRINT A"], // 2 - вывести значение
  instructions["DEC A"], // 3 - уменьшить A на 1
  instructions["IFN A"], // 4 - если A не 0, то перейти на PRINT A
  instructions["RET"], // 5 - иначе завершиться
  0, // 6 - код возврата
  instructions["JMP"], // 7 - переход на PRINT A (когда A != 0)
  2, // 8 - индекс PRINT A
];

function execute(program) {
    let memory = 0;
    let pointer = 0;

    const instructionLengths = {
        0: 2, // SET A 
        1: 1, // PRINT A
        2: 1, // IFN A
        3: 2, // RET 
        4: 1, // DEC A
        5: 2,  // JMP 
    };

    while (pointer < program.length) {
        const opcode = program[pointer];

        switch (opcode) {
            case instructions['SET A']: 
                memory = program[pointer + 1];
                pointer += 2;
                break;

            case instructions['PRINT A']:
                console.log(memory);
                pointer += 1;
                break;

            case instructions['IFN A']: 
                pointer += 1;

                // Если A не равно 0, пропускаем 
                if (memory !== 0) {

                    const nextOpcode = program[pointer];
                    const nextLength = instructionLengths[nextOpcode];

                    pointer += nextLength;
                }

                break;

            case instructions['RET']:
                const retVal = program[pointer + 1];
                return retVal;

            case instructions['DEC A']: 
                memory -= 1;
                pointer += 1;
                break;

            case instructions['JMP']:
                const addr = program[pointer + 1];
                pointer = addr;
                break;

            default:
                throw new Error(`Неизвестная команда: ${ opcode } в позиции ${ pointer }`);
        }
    }
}


const result = execute(program);
console.log(`\n=== Программа завершилась с кодом: ${result} ===`);
