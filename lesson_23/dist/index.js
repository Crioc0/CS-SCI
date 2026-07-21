"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function random(min, max) {
    return {
        [Symbol.iterator]() {
            return this;
        },
        next() {
            return {
                done: false,
                value: Math.floor(Math.random() * (max - min)) + min,
            };
        }
    };
}
const randomInt = random(0, 100);
console.log(randomInt.next().value); // Случайное число от 0 до 100
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
class Range {
    static convert = {
        default: {
            from: (v) => v,
            into: (v) => v,
        },
        string: {
            from: (v) => v.codePointAt(0),
            into: (v) => String.fromCodePoint(v),
        },
    };
    #min;
    #start;
    #max;
    #end;
    #step;
    into;
    constructor(min, max, step = 1) {
        const typeA = typeof min;
        const typeB = typeof max;
        if (typeA !== typeB) {
            throw new Error(`Invalid type`);
        }
        const converter = typeA in Range.convert ? Range.convert[typeA] : Range.convert["default"];
        this.#min = min;
        const start = converter.from(min);
        const end = converter.from(max);
        if (!start || !end) {
            throw new Error(`Invalid values`);
        }
        this.#start = start;
        this.#end = end;
        this.#max = max;
        this.#step = Math.abs(step) * (start < end ? 1 : -1);
        this.into = converter.into;
    }
    reverse() {
        return new Range(this.#max, this.#min, this.#step);
    }
    [Symbol.iterator]() {
        let current = this.#start;
        const end = this.#end;
        const step = this.#step;
        const into = this.into;
        return {
            next: () => {
                const done = step > 0 ? current > end : current < end;
                if (done) {
                    return { value: undefined, done };
                }
                const value = into(current);
                current += step;
                return { value: value, done };
            }
        };
    }
}
const symbolRange = new Range(20, 1);
console.log(...symbolRange);
console.log(...symbolRange.reverse());
function querySelectorAllLazy(selector, source) {
    const treeWalker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
            return node.matches(selector) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
    });
    return {
        [Symbol.iterator]() {
            return this;
        },
        next() {
            const value = treeWalker.nextNode();
            return { value: value, done: value == null };
        }
    };
}
const iter = querySelectorAllLazy(".item", document.body);
