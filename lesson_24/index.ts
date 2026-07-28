function random(min: number, max: number) {
    return {
        [Symbol.iterator]() {
            return this;
        },

        next() {
            return {
                done: false,
                value: Math.floor(Math.random() * (max - min)) + min,
            }
        }
    }
}

function take<T>(iterator: Iterator<T>, limit: number) {
    let count = 0
    return {
        [Symbol.iterator]() {
            return this
        },
        next() {
            if (count >= limit) {
                return {done: true, value: undefined};
            }
            count++
            const result = iterator.next()
            if (result.done) {
                return {done: true, value: undefined};
            }
            return {
                done: false,
                value: result.value
            }
        }
    }
}

function filter<T>(iterator: Iterator<T>, fn: (value: T) => boolean) {
    return {
        [Symbol.iterator]() {
            return this
        },
        next() {
            while (true) {
                const result = iterator.next();

                if (result.done) {
                    return {done: true, value: undefined};
                }

                if (fn(result.value)) {
                    return {
                        done: false,
                        value: result.value
                    };
                }
            }
        }
    }
}

function enumerate<T>(iterator: Iterator<T>) {
    let count = 0
    return {
        [Symbol.iterator]() {
            return this
        },
        next() {
            const result = iterator.next()
            if (result.done) {
                return {done: true, value: undefined};
            }
            return {
                done: false,
                value: [count++, result.value]
            }

        }
    }
}

function seq(...iterables: Iterable<unknown>[]): IterableIterator<unknown> {
    let iterators = iterables.map(it => it[Symbol.iterator]());
    let currentIdx = 0;

    return {
        [Symbol.iterator](): IterableIterator<unknown> {
            return this;
        },
        next(): IteratorResult<unknown> {
            while (currentIdx < iterators.length) {
                const result = iterators[currentIdx].next();
                if (!result.done) {
                    return {done: false, value: result.value};
                }
                currentIdx++;
            }
            return {done: true, value: undefined};
        }
    };
}

function mapSeq<T>(iterable: Iterable<T>, functions: Iterable<(value: T) => T>): IterableIterator<T> {
    const iterator = iterable[Symbol.iterator]();
    const funcs = [...functions]

    return {
        [Symbol.iterator]() {
            return this
        },
        next(){
            const result = iterator.next()
            if (result.done) {
                return {done: true,value: undefined};
            }
            let value = result.value
            for (const fn of funcs) {
                value = fn(value)
            }

            return {
                done: false,
                value: value
            }
        }
    }
}



const randomInt = random(1, 100);

console.log([...take(randomInt, 5)]);

console.log([...take(filter(randomInt, (el) => el < 30), 15)]);

console.log([...take(enumerate(randomInt), 3)]); // [[0, ...], [1, ...], [2, ...]]

console.log([...seq([1, 2], new Set([3, 4]), 'bla')]);

console.log([...filter(mapSeq([1, 2, 3], [(el) => el * 2, (el) => el - 1]), (el) => el < 2)]);

