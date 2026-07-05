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
        // TODO реализовать удаление
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
            // TODO сделать увеличение размера
            const comparison = this.#comparator(key, current.key)
            if (comparison === 0) {
                current.value = value
                return this
            }
            if (comparison < 0) {
                const leftIndex = this.#getLeftChildIndex(currentIndex)
                // this.#ensureCapacity(leftIndex);

                if (this.#array[leftIndex] === null) {
                    this.#array[leftIndex] = new TreeNode(key, value)
                    this.#size++
                    return this
                }

                currentIndex = leftIndex
                current = this.#array[leftIndex]
            } else if (comparison > 0) {
                const rightIndex = this.#getRightChildIndex(currentIndex)
                // this.#ensureCapacity(rightIndex);
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

}
