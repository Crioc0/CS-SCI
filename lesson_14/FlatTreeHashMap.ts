type Comparator<K> = (a: K, b: K) => number;

class TreeNode<K, V> {
    key: K
    value: V

    constructor(key: K, value: V) {
        this.key = key
        this.value = value
    }
}

export class ArrayTreeMap<K, V> {
    readonly #comparator: Comparator<K>
    #capacity: number
    readonly #initialCapacity: number;

    #array: (TreeNode<K, V> | null)[]
    #size: number = 0

    constructor(capacity = 16, comparator?: Comparator<K>) {
        this.#initialCapacity = Math.max(capacity, 1)
        this.#capacity = this.#initialCapacity
        this.#array = new Array(capacity).fill(null);
        this.#comparator = comparator ?? this.#defaultComparator;
    }

    #defaultComparator(a: K, b: K): number {
        if (a < b) {
            return -1;
        }

        if (a > b) {
            return 1;
        }

        return 0;
    }

    has(key: K): boolean {
        return this.getIndex(key) !== -1;
    }

    get(key: K): V | undefined {
        const index = this.getIndex(key);
        return index !== -1 ? this.#array[index]!.value : undefined;
    }

    getIndex(key: K): number {
        let index = 0;
        let current = this.#array[0]
        while (current != null && index < this.#capacity) {
            const comparison = this.#comparator(key, current.key);
            if (comparison === 0) {
                return index;
            }

            if (comparison < 0) {
                index = this.#getLeftChildIndex(index)
                if (index >= this.#capacity) {
                    return -1
                }
                current = this.#array[index]
            } else if (comparison > 0) {
                index = this.#getRightChildIndex(index)
                if (index >= this.#capacity) {
                    return -1
                }
                current = this.#array[index]
            }

        }
        return -1
    }

    delete(key: K): boolean {
        const currentIndex = this.getIndex(key);
        if (currentIndex === -1) {
            return false;
        }

        const current = this.#array[currentIndex]!;

        const leftIndex = this.#getLeftChildIndex(currentIndex);
        const rightIndex = this.#getRightChildIndex(currentIndex);

        const leftChild = leftIndex < this.#capacity ? this.#array[leftIndex] : null;
        const rightChild = rightIndex < this.#capacity ? this.#array[rightIndex] : null;

        if (leftChild == null && rightChild == null) {
            this.#array[currentIndex] = null
            this.#size--
            return true
        }

        if (leftChild == null || rightChild == null) {
            this.#shiftSubtree(leftChild == null ? rightIndex : leftIndex, currentIndex);
        }

        let successorIndex = rightIndex
        let successor = rightChild!

        while (true) {
            const nextLeftIndex = this.#getLeftChildIndex(successorIndex)

            if (nextLeftIndex >= this.#capacity) {
                break;
            }

            const nextLeft = this.#array[nextLeftIndex];
            if (nextLeft == null) {
                break;
            }
            successorIndex = nextLeftIndex
            successor = nextLeft
        }
        // Копируем данные преемника в удаляемый узел
        current.key = successor.key;
        current.value = successor.value;


        // Удаляем преемника (у него точно нет левого потомка)
        const successorRightIndex = this.#getRightChildIndex(successorIndex)
        const successorRight = successorRightIndex < this.#capacity ? this.#array[successorRightIndex] : null;

        if (successorRight != null) {
            this.#shiftSubtree(successorRightIndex, successorIndex);

        } else {
            this.#array[successorIndex] = null;
        }

        this.#size--;
        return true;


    }

    #shiftSubtree(fromIndex: number, toIndex: number) {
        if(fromIndex >= this.#capacity || toIndex >= this.#initialCapacity) {
            return
        }

        const node = this.#array[fromIndex];

        if(node == null) {
            this.#array[toIndex] = null;
            return;
        }

        this.#array[toIndex] = node;
        this.#array[fromIndex] = null

        this.#shiftSubtree(this.#getLeftChildIndex(fromIndex), this.#getLeftChildIndex(toIndex));
        this.#shiftSubtree(this.#getRightChildIndex(fromIndex), this.#getRightChildIndex(toIndex));
    }

    set(key: K, value: V) {
        if (this.#size === 0) {
            this.#array[0] = new TreeNode(key, value)
            this.#size++
            return this
        }
        let currentIndex = 0
        let current = this.#array[0]!

        while (true) {
            const comparison = this.#comparator(key, current.key)
            if (comparison === 0) {
                current.value = value
                return this
            }
            if (comparison < 0) {
                const leftIndex = this.#getLeftChildIndex(currentIndex)
                this.#ensureCapacity(leftIndex);

                if (this.#array[leftIndex] === null) {
                    this.#array[leftIndex] = new TreeNode(key, value)
                    this.#size++
                    return this
                }

                currentIndex = leftIndex
                current = this.#array[leftIndex]
            } else if (comparison > 0) {
                const rightIndex = this.#getRightChildIndex(currentIndex)
                this.#ensureCapacity(rightIndex);
                if (this.#array[rightIndex] === null) {
                    this.#array[rightIndex] = new TreeNode(key, value)
                    this.#size++
                    return this
                }
                currentIndex = rightIndex
                current = this.#array[rightIndex]
            }

        }
    }

    #getLeftChildIndex(index: number) {
        return 2 * index + 1
    }

    #getRightChildIndex(index: number) {
        return 2 * index + 2
    }

    keys() {
        return this.#entries((node: TreeNode<K, V>) => node.key)
    }

    values() {
        return this.#entries((node: TreeNode<K, V>) => node.value)
    }

    entries() {
        return this.#entries((node: TreeNode<K, V>) =>[node.key, node.value])
    }

    #entries<T>(extract: (node: TreeNode<K, V>) => T): T[] {
        const result: T[] = []
        const stack: { node: TreeNode<K, V>; index: number }[] = []
        let index = 0
        let current = this.#array[0]

        while ((current !== null || stack.length > 0) && index < this.#capacity) {
            while (current != null && index < this.#capacity) {
                stack.push({node: current, index})
                const leftIndex = this.#getLeftChildIndex(index)

                if (leftIndex >= this.#capacity) {
                    break
                }

                index = leftIndex
                current = this.#array[leftIndex]
            }

            const popped = stack.pop()

            if (popped == null) {
                break
            }
            result.push(extract(popped.node))

            const rightIndex = this.#getRightChildIndex(popped.index)
            if (rightIndex >= this.#capacity) {
                current = null;
            } else {
                index = rightIndex
                current = this.#array[rightIndex]
            }
        }
        return result
    }
    #ensureCapacity(index: number) {
        if(index < this.#capacity) {
            return
        }

        let newCapacity = this.#capacity
        while (index >= newCapacity) {
            newCapacity*=2
        }

        const newArray = new Array(newCapacity).fill(null);

        for(let i = 0; i < this.#capacity; i++) {
            newArray[i] = this.#array[i]
        }

        this.#array = newArray
        this.#capacity = newCapacity
    }
}

export const flatMapTests = () => {
    // Тесты для ArrayTreeMap со стандартным компаратором
    const map = new ArrayTreeMap<string, number>();

// Тест set и get
    map.set("banana", 3);
    map.set("apple", 2);
    map.set("cherry", 5);
    map.set("date", 1);

    assert.strictEqual(map.get("apple"), 2);
    assert.strictEqual(map.get("banana"), 3);
    assert.strictEqual(map.get("cherry"), 5);
    assert.strictEqual(map.get("date"), 1);
    assert.strictEqual(map.get("unknown"), undefined);

// Тест has
    assert.strictEqual(map.has("banana"), true);
    assert.strictEqual(map.has("apple"), true);
    assert.strictEqual(map.has("grape"), false);

// Тест size
    assert.strictEqual(map.size, 4);

// Тест getIndex - проверяем только наличие индекса, а не конкретное значение
// так как индексы зависят от порядка вставки
    assert.notStrictEqual(map.getIndex("apple"), -1);
    assert.notStrictEqual(map.getIndex("banana"), -1);
    assert.notStrictEqual(map.getIndex("cherry"), -1);
    assert.notStrictEqual(map.getIndex("date"), -1);
    assert.strictEqual(map.getIndex("unknown"), -1);

// Тест keys
    assert.deepStrictEqual(map.keys(), ["apple", "banana", "cherry", "date"]);

// Тест entries
    assert.deepStrictEqual(map.entries(), [
        ["apple", 2],
        ["banana", 3],
        ["cherry", 5],
        ["date", 1]
    ]);

// Тест delete
    const deleted = map.delete("cherry");
    assert.strictEqual(deleted, true);
    assert.strictEqual(map.size, 3);
    assert.strictEqual(map.has("cherry"), false);
    assert.deepStrictEqual(map.keys(), ["apple", "banana", "date"]);
    assert.deepStrictEqual(map.entries(), [
        ["apple", 2],
        ["banana", 3],
        ["date", 1]
    ]);

// Тест delete несуществующего ключа
    const deletedNotFound = map.delete("grape");
    assert.strictEqual(deletedNotFound, false);
    assert.strictEqual(map.size, 3);

// Тест update значения
    map.set("apple", 100);
    assert.strictEqual(map.get("apple"), 100);
    assert.strictEqual(map.size, 3);

// Тест isEmpty
    assert.strictEqual(map.isEmpty(), false);

// Тест clear
    map.clear();
    assert.strictEqual(map.size, 0);
    assert.strictEqual(map.isEmpty(), true);
    assert.strictEqual(map.get("apple"), undefined);
    assert.deepStrictEqual(map.keys(), []);
    assert.deepStrictEqual(map.entries(), []);

// Тест удаления корня с двумя потомками
    const map2 = new ArrayTreeMap<number, string>();
    map2.set(5, "five");
    map2.set(3, "three");
    map2.set(7, "seven");
    map2.set(2, "two");
    map2.set(4, "four");
    map2.set(6, "six");
    map2.set(8, "eight");

    assert.deepStrictEqual(map2.keys(), [2, 3, 4, 5, 6, 7, 8]);
    assert.strictEqual(map2.size, 7);

    map2.delete(5); // Удаление корня
    assert.deepStrictEqual(map2.keys(), [2, 3, 4, 6, 7, 8]);
    assert.strictEqual(map2.size, 6);
    assert.strictEqual(map2.has(5), false);

// Тест удаления узла без потомков
    const map3 = new ArrayTreeMap<number, string>();
    map3.set(10, "ten");
    map3.set(5, "five");
    map3.set(15, "fifteen");

    assert.strictEqual(map3.size, 3);
    map3.delete(5); // Удаление листа
    assert.strictEqual(map3.size, 2);
    assert.strictEqual(map3.has(5), false);
    assert.deepStrictEqual(map3.keys(), [10, 15]);

// Тест удаления узла с одним потомком
    const map4 = new ArrayTreeMap<number, string>();
    map4.set(10, "ten");
    map4.set(5, "five");
    map4.set(3, "three");

    assert.strictEqual(map4.size, 3);
    map4.delete(5); // Удаление узла с одним потомком
    assert.strictEqual(map4.size, 2);
    assert.strictEqual(map4.has(5), false);
    assert.deepStrictEqual(map4.keys(), [3, 10]);

// Тест: удаление узла с двумя потомками (происходит сдвиг)
    const shiftTest = new ArrayTreeMap<number, string>();
    shiftTest.set(10, "A");
    shiftTest.set(5, "B");
    shiftTest.set(15, "C");
    shiftTest.set(3, "D");
    shiftTest.set(7, "E");

    shiftTest.delete(5); // Удаляем узел с двумя потомками

    assert.deepStrictEqual(shiftTest.keys(), [3, 7, 10, 15]);
    assert.strictEqual(shiftTest.size, 4);
    assert.strictEqual(shiftTest.has(5), false);
    assert.strictEqual(shiftTest.get(7), "E");

// Тест с кастомным компаратором (сортировка по убыванию)
    const reverseMap = new ArrayTreeMap<number, string>(16, (a, b) => b - a);
    reverseMap.set(5, "five");
    reverseMap.set(3, "three");
    reverseMap.set(7, "seven");
    reverseMap.set(1, "one");

    assert.deepStrictEqual(reverseMap.keys(), [7, 5, 3, 1]);
    assert.deepStrictEqual(reverseMap.entries(), [
        [7, "seven"],
        [5, "five"],
        [3, "three"],
        [1, "one"]
    ]);

// Тест с кастомным компаратором для строк (без учета регистра)
    const caseInsensitiveMap = new ArrayTreeMap<string, number>(16, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    caseInsensitiveMap.set("Apple", 1);
    caseInsensitiveMap.set("banana", 2);
    caseInsensitiveMap.set("CHERRY", 3);
    caseInsensitiveMap.set("date", 4);

    assert.strictEqual(caseInsensitiveMap.get("apple"), 1);
    assert.strictEqual(caseInsensitiveMap.get("Banana"), 2);
    assert.strictEqual(caseInsensitiveMap.get("cherry"), 3);
    assert.deepStrictEqual(caseInsensitiveMap.keys(), ["Apple", "banana", "CHERRY", "date"]);

// Тест автоматического расширения массива
    const smallMap = new ArrayTreeMap<number, string>(4);

    smallMap.set(10, "A");
    smallMap.set(5, "B");
    smallMap.set(15, "C");
    smallMap.set(3, "D");
    smallMap.set(7, "E");

    assert.strictEqual(smallMap.size, 5);
    assert.strictEqual(smallMap.capacity >= 4, true);
    assert.strictEqual(smallMap.get(10), "A");
    assert.strictEqual(smallMap.get(7), "E");

    assert.deepStrictEqual(smallMap.keys(), [3, 5, 7, 10, 15]);

// Тест getIndex для конкретной структуры
    const indexMap = new ArrayTreeMap<number, string>(16);
    indexMap.set(10, "A");
    indexMap.set(5, "B");
    indexMap.set(15, "C");
    indexMap.set(3, "D");
    indexMap.set(7, "E");

// Проверяем индексы для известной структуры
// Корень 10 на индексе 0
// Левый потомок 5 на индексе 1
// Правый потомок 15 на индексе 2
// Левый потомок 5 -> левый потомок 3 на индексе 3
// Левый потомок 5 -> правый потомок 7 на индексе 4
    assert.strictEqual(indexMap.getIndex(10), 0);
    assert.strictEqual(indexMap.getIndex(5), 1);
    assert.strictEqual(indexMap.getIndex(15), 2);
    assert.strictEqual(indexMap.getIndex(3), 3);
    assert.strictEqual(indexMap.getIndex(7), 4);
    assert.strictEqual(indexMap.getIndex(100), -1);

    console.log("Все тесты пройдены успешно!");
}
