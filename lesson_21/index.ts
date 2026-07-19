function zipStr(str: string) {
    return str.replace(/(.)\1+/g, '$1');
}

// Вариант 1: abbaabbafffbezza
console.log(zipStr('abbaabbafffbezza')); // "abafbeza" ✅



function format(str:string, params: Record<string, string | number>):string {
    return str.replace(/\$\{([^}]+)}/g, (match, key)=> {
        const trimmedKey = key.trim();
        return trimmedKey in params ? String(params[trimmedKey]) : match;
    })
}

const res = format('Hello, ${user}! Your age is ${age}.', {user: 'Bob', age: 12});

console.log(res)


function calc(text: string): string {
    function hasBalancedParentheses (expr: string): boolean  {
        let balance = 0;
        for (const char of expr) {
            if (char === '(') balance++;
            if (char === ')') {
                balance--;
                if (balance < 0) return false;
            }
        }
        return balance === 0;
    }

    const evaluate = (expr: string): string => {
        expr = expr.trim();
        if (!hasBalancedParentheses(expr)) {
            return 'Невалидное выражение { ' + expr + ' }';
        }
        while (expr.includes('(')) {
            expr = expr.replace(/\(([^()]+)\)/g, (_, inner: string): string => {
                return evaluate(inner);
            });
        }

        // Возведение в степень
        const power = /(\d+)\s*\*\*\s*(\d+)/;
        while (power.test(expr)) {
            expr = expr.replace(power, (_, a: string, b: string): string => {
                return String(Math.pow(Number(a), Number(b)));
            });
        }

        // Умножение и деление
        const mulDiv = /(\d+)\s*([*/])\s*(\d+)/;
        while (mulDiv.test(expr)) {
            expr = expr.replace(mulDiv, (_, a: string, operator: string, b: string): string => {
                const num1 = Number(a);
                const num2 = Number(b);
                return String(operator === '*' ? num1 * num2 : num1 / num2);
            });
        }

        // Сложение и вычитание
        const addSub = /(\d+)\s*([+\-])\s*(\d+)/;
        while (addSub.test(expr)) {
            expr = expr.replace(addSub, (_, a: string, operator: string, b: string): string => {
                const num1 = Number(a);
                const num2 = Number(b);
                return String(operator === '+' ? num1 + num2 : num1 - num2);
            });
        }

        return expr;
    };

    return text.replace(/([0-9+\-*/()\s]+)/g, (match: string): string => {
        console.log(match)
        if (/\d/.test(match) && /[+\-*/]/.test(match)) {
            try {
                const result = evaluate(match);
                return ` ${result}\n`;
            } catch {
                return match;
            }
        }
        return match;
    });
}

// Пример использования
const result = calc(`
Какой-то текст ((10 * 2 + 15 - 24 ) * 2) ** 2
Еще какой то текст 2 * 10
`);

console.log(result);