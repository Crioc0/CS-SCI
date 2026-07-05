import * as assert from "node:assert";

type ArrayTypes =
    Uint8Array |
    Uint8ClampedArray |
    Int8Array |
    Uint16Array |
    Int16Array |
    Uint32Array |
    Int32Array |
    Float32Array |
    Float64Array |
    BigUint64Array |
    BigInt64Array;

type ArrayConstructor<T> = new (capacity: number) => T;

type ArrayValue<T> = T extends BigUint64Array | BigInt64Array ? bigint : number;

class Matrix<T extends ArrayTypes> {
    readonly width: number;
    readonly height: number;

    readonly buffer: T;
    readonly ArrayClass: ArrayConstructor<T>;

    constructor(
        ArrayClass: ArrayConstructor<T>,
        width: number,
        height: number
    ) {
        this.width = width;
        this.height = height;
        this.buffer = new ArrayClass(width * height);
        this.ArrayClass = ArrayClass;
    }

    get(row: number, col: number): ArrayValue<T> {
        return this.buffer[row * this.width + col] as ArrayValue<T>;
    }

    set(row: number, col: number, value: ArrayValue<T>) {
        this.buffer[row * this.width + col] = value;
    }
}

interface Node<T> {
    id: number;
    depth: number;
    weight: T | undefined;
}

class Graph<T extends ArrayTypes> {
    readonly adjacencyMatrix: Matrix<T>;

    get zero(): ArrayValue<T> {
        const { ArrayClass } = this.adjacencyMatrix;

        switch (ArrayClass.name) {
            case "BigInt64Array":
            case "BigUint64Array":
                return 0n as ArrayValue<T>;

            default:
                return 0 as ArrayValue<T>;
        }
    }

    get one(): ArrayValue<T> {
        const { ArrayClass } = this.adjacencyMatrix;

        switch (ArrayClass.name) {
            case "BigInt64Array":
            case "BigUint64Array":
                return 1n as ArrayValue<T>;

            default:
                return 1 as ArrayValue<T>;
        }
    }

    constructor(matrix: Matrix<T>) {
        this.adjacencyMatrix = matrix;

        if (matrix.width !== matrix.height) {
            throw new Error("Adjacency matrix must be square")
        }
    }

    hasEdge(u: number, v: number) {
        return this.adjacencyMatrix.get(u, v) > 0 && this.adjacencyMatrix.get(v, u) > 0;
    }

    hasArc(u: number, v: number) {
        return this.adjacencyMatrix.get(u, v) > 0;
    }

    addEdge(u: number, v: number, weight = this.one) {
        this.adjacencyMatrix.set(u, v, weight);
        this.adjacencyMatrix.set(v, u, weight);
    }

    removeEdge(u: number, v: number) {
        this.adjacencyMatrix.set(u, v, this.zero);
        this.adjacencyMatrix.set(v, u, this.zero);
    }

    addArc(u: number, v: number, weight = this.one) {
        this.adjacencyMatrix.set(u, v, weight);
    }

    removeArc(u: number, v: number) {
        this.adjacencyMatrix.set(u, v, this.zero);
    }

    traverse(id: number, cb: (node: Node<ArrayValue<T>>) => void) {
        const visited = new Set<number>();

        const queue: Node<ArrayValue<T>>[] = [{ id, weight: undefined, depth: 0 }];

        while (queue.length > 0) {
            const { id, weight, depth } = queue.shift()!;
            console.log(id, weight, depth);
            if (visited.has(id)) {
                continue;
            }

            console.log(queue)
            visited.add(id);
            cb({ id, weight, depth });

            for (let neighbor = 0; neighbor < this.adjacencyMatrix.width; neighbor++) {
                const edgeWeight = this.adjacencyMatrix.get(id, neighbor);

                if (edgeWeight > 0 && !visited.has(neighbor)) {
                    queue.push({ id: neighbor, weight: edgeWeight, depth: depth + 1 });
                }
            }
        }
    }

    getTransitiveClosure(): Graph<Uint8Array> {
        const closure = new Graph(new Matrix(
            Uint8Array,
            this.adjacencyMatrix.width,
            this.adjacencyMatrix.height
        ));

        // Копирование существующих ребер
        for (let i = 0; i < this.adjacencyMatrix.width; i++) {
            closure.addArc(i, i, 1);

            for (let j = 0; j < this.adjacencyMatrix.height; j++) {
                if (this.hasArc(i, j)) {
                    closure.addArc(i, j, 1);
                }
            }
        }

        for (let k = 0; k < this.adjacencyMatrix.width; k++) {
            for (let i = 0; i < this.adjacencyMatrix.width; i++) {
                for (let j = 0; j < this.adjacencyMatrix.height; j++) {
                    if (closure.hasArc(i, k) && closure.hasArc(k, j)) {
                        closure.addArc(i, j, 1);
                    }
                }
            }
        }

        return closure;
    }
}

// Тест 1: Создание графа и базовые операции
function testBasicOperations() {
    console.log("✓ Тест 1: Базовые операции");

    const matrix = new Matrix(Float64Array, 3, 3);
    const graph = new Graph(matrix);

    // Проверка zero и one
    assert.strictEqual(graph.zero, 0);
    assert.strictEqual(graph.one, 1);

    // Добавление ребер
    graph.addEdge(0, 1, 5);
    graph.addEdge(1, 2, 3);

    assert.strictEqual(graph.hasEdge(0, 1), true);
    assert.strictEqual(graph.hasEdge(0, 2), false);
    assert.strictEqual(graph.hasArc(0, 1), true);
    assert.strictEqual(graph.hasArc(1, 0), true);

    // Удаление ребра
    graph.removeEdge(0, 1);
    assert.strictEqual(graph.hasEdge(0, 1), false);
    assert.strictEqual(graph.hasArc(0, 1), false);
    assert.strictEqual(graph.hasArc(1, 0), false);

    console.log("  ✅ Все проверки пройдены");
}

// Тест 2: Дуги (ориентированные ребра)
function testArcs() {
    console.log("✓ Тест 2: Дуги");

    const matrix = new Matrix(Float64Array, 3, 3);
    const graph = new Graph(matrix);

    graph.addArc(0, 1, 5);
    graph.addArc(1, 2, 3);

    assert.strictEqual(graph.hasArc(0, 1), true);
    assert.strictEqual(graph.hasArc(1, 0), false); // Arc is directed
    assert.strictEqual(graph.hasArc(1, 2), true);
    assert.strictEqual(graph.hasArc(2, 1), false);
    assert.strictEqual(graph.hasArc(0, 2), false);

    // Удаление дуги
    graph.removeArc(0, 1);
    assert.strictEqual(graph.hasArc(0, 1), false);

    console.log("  ✅ Все проверки пройдены");
}

// Тест 3: Обход графа (BFS)
function testTraversal() {
    console.log("✓ Тест 3: Обход графа");

    const matrix = new Matrix(Float64Array, 4, 4);
    const graph = new Graph(matrix);

    // Создаем граф: 0->1, 0->2, 1->3
    graph.addArc(0, 1, 1);
    graph.addArc(0, 2, 2);
    graph.addArc(1, 3, 3);

    const visited: number[] = [];
    const depths: number[] = [];
    const weights: (number | undefined)[] = [];

    graph.traverse(0, (node) => {
        visited.push(node.id);
        depths.push(node.depth);
        weights.push(node.weight);
    });

    // Проверяем порядок обхода (BFS)
    assert.deepStrictEqual(visited, [0, 1, 2, 3]);
    assert.deepStrictEqual(depths, [0, 1, 1, 2]);
    assert.strictEqual(weights[0], undefined);
    assert.strictEqual(weights[1], 1);
    assert.strictEqual(weights[2], 2);
    assert.strictEqual(weights[3], 3);

    console.log("  ✅ Все проверки пройдены");
}

// Тест 4: Транзитивное замыкание
function testTransitiveClosure() {
    console.log("✓ Тест 4: Транзитивное замыкание");

    // Граф: 0->1, 1->2
    const matrix = new Matrix(Float64Array, 3, 3);
    const graph = new Graph(matrix);
    graph.addArc(0, 1, 1);
    graph.addArc(1, 2, 1);

    const closure = graph.getTransitiveClosure();

    // Проверяем, что closure - это Graph<Uint8Array>
    assert.ok(closure instanceof Graph);
    assert.ok(closure.adjacencyMatrix.buffer instanceof Uint8Array);

    // Проверяем ребра в транзитивном замыкании
    assert.strictEqual(closure.hasArc(0, 0), true); // петля
    assert.strictEqual(closure.hasArc(0, 1), true);
    assert.strictEqual(closure.hasArc(0, 2), true); // транзитивное
    assert.strictEqual(closure.hasArc(1, 1), true);
    assert.strictEqual(closure.hasArc(1, 2), true);
    assert.strictEqual(closure.hasArc(2, 2), true);
    assert.strictEqual(closure.hasArc(2, 0), false);
    assert.strictEqual(closure.hasArc(2, 1), false);

    console.log("  ✅ Все проверки пройдены");
}

// Тест 5: Граф с циклом
function testGraphWithCycle() {
    console.log("✓ Тест 5: Граф с циклом");

    const matrix = new Matrix(Float64Array, 3, 3);
    const graph = new Graph(matrix);
    graph.addArc(0, 1, 1);
    graph.addArc(1, 0, 1);
    graph.addArc(1, 2, 1);

    const closure = graph.getTransitiveClosure();

    // Из 0 можно достичь 0, 1, 2
    assert.strictEqual(closure.hasArc(0, 0), true);
    assert.strictEqual(closure.hasArc(0, 1), true);
    assert.strictEqual(closure.hasArc(0, 2), true);

    // Из 1 можно достичь 0, 1, 2
    assert.strictEqual(closure.hasArc(1, 0), true);
    assert.strictEqual(closure.hasArc(1, 1), true);
    assert.strictEqual(closure.hasArc(1, 2), true);

    // Из 2 можно достичь только 2 (нет исходящих ребер)
    assert.strictEqual(closure.hasArc(2, 0), false);
    assert.strictEqual(closure.hasArc(2, 1), false);
    assert.strictEqual(closure.hasArc(2, 2), true);

    console.log("  ✅ Все проверки пройдены");
}

// Тест 6: Работа с BigInt
function testBigInt() {
    console.log("✓ Тест 6: Работа с BigInt");

    const matrix = new Matrix(BigUint64Array, 2, 2);
    const graph = new Graph(matrix);

    assert.strictEqual(graph.zero, 0n);
    assert.strictEqual(graph.one, 1n);

    graph.addEdge(0, 1, BigInt(42));

    assert.strictEqual(graph.hasEdge(0, 1), true);
    assert.strictEqual(graph.adjacencyMatrix.get(0, 1), 42n);
    assert.strictEqual(graph.adjacencyMatrix.get(1, 0), 42n);

    graph.removeEdge(0, 1);
    assert.strictEqual(graph.hasEdge(0, 1), false);
    assert.strictEqual(graph.adjacencyMatrix.get(0, 1), 0n);
    assert.strictEqual(graph.adjacencyMatrix.get(1, 0), 0n);

    console.log("  ✅ Все проверки пройдены");
}

// Тест 7: Проверка ошибки при неквадратной матрице
function testSquareMatrixValidation() {
    console.log("✓ Тест 7: Проверка квадратной матрицы");

    const matrix = new Matrix(Float64Array, 2, 3);

    assert.throws(
        () => new Graph(matrix),
        /Adjacency matrix must be square/
    );

    console.log("  ✅ Все проверки пройдены");
}

// Тест 8: Пустой граф
function testEmptyGraph() {
    console.log("✓ Тест 8: Пустой граф");

    const matrix = new Matrix(Float64Array, 3, 3);
    const graph = new Graph(matrix);

    const closure = graph.getTransitiveClosure();

    // В пустом графе должны быть только петли
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (i === j) {
                assert.strictEqual(closure.hasArc(i, j), true);
            } else {
                assert.strictEqual(closure.hasArc(i, j), false);
            }
        }
    }

    console.log("  ✅ Все проверки пройдены");
}

// Запуск всех тестов
function runAllTests() {
    console.log("🧪 ЗАПУСК ТЕСТОВ\n");

    try {
        testBasicOperations();
        testArcs();
        testTraversal();
        testTransitiveClosure();
        testGraphWithCycle();
        testBigInt();
        testSquareMatrixValidation();
        testEmptyGraph();

        console.log("\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!");

    } catch (error) {
        console.error("\n❌ ОШИБКА В ТЕСТЕ:", error);
        throw error;
    }
}

runAllTests();