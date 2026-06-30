import * as assert from "node:assert";

type Comparator<K> = (a: K, b: K) => number;

 class TreeNode<K, V> {
    key: K
    value: V
    left: TreeNode<K, V> | null = null
    right: TreeNode<K, V> | null = null

    constructor(key: K, value: V) {
        this.key = key
        this.value = value
    }
}

export class TreeMap<K, V> {
    #root: TreeNode<K, V> | null = null
    #size: number = 0

    readonly #comparator: Comparator<K>

    constructor(comparator?: Comparator<K>) {
        this.#comparator = comparator ?? this.#defaultComparator
    }

    has(key: K): boolean {
        return this.getEntry(key) != null;
    }

    get(key: K): V | undefined {
        return this.getEntry(key)?.value ?? undefined;
    }

    getEntry(key: K): TreeNode<K, V> | null {
        let current = this.#root;

        while (current != null) {
            const comparison = this.#comparator(key, current.key);

            if (comparison === 0) {
                return current;
            }

            current = comparison < 0 ? current.left : current.right;
        }

        return null;
    }

    get size(): number {
        return this.#size;
    }

    isEmpty() {
        return this.#size === 0;
    }

    clear() {
        this.#root = null;
        this.#size = 0;

    }

    set(key: K, value: V) {
        if (!this.#root) {
            this.#root = new TreeNode(key, value)
            this.#size++
            return this
        }

        let current = this.#root
        while (current != null) {
            const comparison = this.#comparator(key, current.key)
            if (comparison === 0) {
                console.log(comparison)
                current.value = value
                return this
            }
            if (comparison < 0) {
                console.log(comparison)
                if (current.left === null) {
                    current.left = new TreeNode(key, value)
                    this.#size++
                    return this
                }
                current = current.left
            } else if (comparison > 0) {
                console.log(comparison)
                if (current.right === null) {
                    current.right = new TreeNode(key, value)
                    this.#size++
                    return this
                }
                current = current.right
            }
        }
    }

    delete(key: K) {
        let parent: TreeNode<K, V> | null = null
        let current = this.#root
        while (current != null) {
            const comparison = this.#comparator(key, current.key)
            if (comparison === 0) {
                break
            }
            parent = current
            current = comparison < 0 ? current.left : current.right;
        }

        if (current === null) {
            return false
        }
        // Нет потомков
        if (current.left === null && current.right === null) {
            if (parent === null) {
                this.#root = null
            } else if (parent.left === current) {
                parent.left = null

            } else {
                parent.right = null
            }
            this.#size--
            return true
        }
        // 1 потомок
        if (current.right === null || current.left === null) {
            const child = current.left ?? current.right
            if (parent === null) {
                this.#root = child
            } else if (parent.left === current) {
                parent.left = child
            } else {
                parent.right = child
            }
            this.#size--
            return true
        }
        // Случай 3: Два потомка
        // Находим минимальный узел в правом поддереве (преемник)
        let successorParent = current
        let successor = current.right

        while (successor.left !== null) {
            successorParent = successor
            successor = successor.left
        }

        current.key = successor.key
        current.value = successor.value
        if (successorParent.left === successor) {
            successorParent.left = successor.right
        } else {
            successorParent.right = successor.right
        }
        this.#size--
        return true

    }

    keys() {
        return this.#entries((node) => node.key)
    }

    values() {
        return this.#entries((node) => node.value)
    }

    entries() {
        return this.#entries((node) => [node.key, node.value])
    }

    #entries<T>(extract: (node: TreeNode<K, V>) => T): T[] {
        const result: T[] = []
        const stack: TreeNode<K, V>[] = []
        let current = this.#root
        while (current != null || stack.length > 0) {
            while (current != null) {
                stack.push(current)
                current = current.left
            }
            current = stack.pop()!
            result.push(extract(current))
            current = current.right

        }
        return result
    }


    #defaultComparator(a: K, b: K): number {
        if (a < b) {
            return -1
        }
        if (a > b) {
            return 1
        }
        return 0
    }
}

export const runBinaryTreeHashTests=()=>{
    const map = new TreeMap<string, number>();



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
    const map2 = new TreeMap<number, string>();
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
    const map3 = new TreeMap<number, string>();
    map3.set(10, "ten");
    map3.set(5, "five");
    map3.set(15, "fifteen");

    assert.strictEqual(map3.size, 3);
    map3.delete(5); // Удаление листа
    assert.strictEqual(map3.size, 2);
    assert.strictEqual(map3.has(5), false);
    assert.deepStrictEqual(map3.keys(), [10, 15]);

// Тест удаления узла с одним потомком
    const map4 = new TreeMap<number, string>();
    map4.set(10, "ten");
    map4.set(5, "five");
    map4.set(3, "three");

    assert.strictEqual(map4.size, 3);
    map4.delete(5); // Удаление узла с одним потомком
    assert.strictEqual(map4.size, 2);
    assert.strictEqual(map4.has(5), false);
    assert.deepStrictEqual(map4.keys(), [3, 10]);

// Тест с кастомным компаратором (сортировка по убыванию)
    const reverseMap = new TreeMap<number, string>((a, b) => b - a);
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
    const caseInsensitiveMap = new TreeMap<string, number>((a, b) =>
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

    console.log("Все тесты пройдены успешно!");
}

