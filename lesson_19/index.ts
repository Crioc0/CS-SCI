// interface TrieNode {
//     char: string;
//     isWord: boolean;
//     children: Map<string, number>;
// }
//
// class Trie {
//     #buffer : TrieNode[] = [{char: '', isWord: false, children: new Map()}]
//
//     addWord(word: string){
//         let cursor = 0
//         for (let char of word) {
//             const current = this.#buffer[cursor]
//             if (current.children.has(char)) {
//                 cursor = current.children.get(char)!
//             } else {
//                 const trieNode = {char: char, isWord: false, children: new Map()}
//                 const pointer = this.#buffer.push(trieNode) - 1
//                 current.children.set(char, pointer)
//                 cursor = pointer
//             }
//         }
//
//         this.#buffer[cursor].isWord = true;
//     }
//
//     go(char:string) {
//         return new TrieView(0, this.#buffer).go(char)
//     }
//     get buffer () {
//         return this.#buffer
//     }
// }
//
// class TrieView {
//     #buffer : TrieNode[]
//     #start: number
//
//     constructor(start: number, buffer: TrieNode[]) {
//         this.#start = start;
//         this.#buffer = buffer;
//     }
//
//     isWord() {
//         const s = this.#start
//         const buf = this.#buffer
//         return s === -1 || buf[s] === null ? false : buf[s].isWord
//     }
//
//     go(char: string) {
//         const s = this.#start
//         const buf = this.#buffer
//         console.log(buf[s])
//         return  s === -1 || buf[s] === null ? this : new TrieView(buf[s].children.get(char) ?? -1, buf)
//     }
//
// }
//
// const trie = new Trie();
//
// trie.addWord('мясо');
// trie.addWord('мясорубка');
// trie.addWord('мир');
//
// console.log(trie.buffer)
// console.log(trie.go('м').go('я').go('с').isWord())
import { deepEqual } from "node:assert";
class TrieNode {
    word = false;

    value: string[];
    children = new Map<string, TrieNode>();

    constructor(value: string[]) {
        this.value = value;
    }
}

class Trie {
    #root = new TrieNode([])
    addWord(word: Iterable<string>) {
        let cursor = this.#root;

        for (const char of word) {
            let child = cursor.children.get(char);

            if (!child) {
                child = new TrieNode(cursor.value.concat(char));
                cursor.children.set(char, child);
            }

            cursor = child;
        }

        cursor.word = true;
    }


    go(char:string) {
        return new TrieView([this.#root]).go(char)
    }

}

class TrieView {
    #startNodes: TrieNode[];

    constructor(startNodes: TrieNode[]) {
        this.#startNodes = startNodes;
    }

    get isCompleted() {
        return this.#startNodes.length === 0;
    }

    get words(): string[][] {
        if (this.isCompleted) {
            return [];
        }

        return this.#startNodes
            .filter(node => node.word)
            .map(node => node.value);
    }

    go(char: string) {
        if (this.isCompleted) {
            return this;
        }

        const startNodes = this.#startNodes.flatMap(node => {
            if (char === "*") {
                return [...node.children.values()];
            }

            const result: TrieNode[] = [];

            const exact = node.children.get(char);
            if (exact) {
                result.push(exact);
            }

            return result;
        });

        return new TrieView(startNodes);
    }

    collectWords(): string[][] {
        const result: string[][] = [];
        const queue = [...this.#startNodes];

        while (queue.length) {
            const node = queue.shift()!;

            if (node.word) {
                result.push(node.value);
            }

            queue.push(...node.children.values());
        }

        return result;
    }
}

function match(pattern: string, strings: string[], separator = ".") {
    const trie = new Trie();



    strings.forEach(str =>
        trie.addWord(str.split(separator))
    );

    const patternChunks = pattern.split(separator);
    if (patternChunks.length === 0) {
        return [];
    }
    const canExpandPattern = patternChunks.at(-1) === "**";

    if (canExpandPattern) {
        patternChunks.pop();
    }

    let cursor: TrieView = trie.go(patternChunks[0]);

    for (const chunk of patternChunks.slice(1)) {
        cursor = cursor.go(chunk);
    }

    const words = canExpandPattern
        ? cursor.collectWords()
        : cursor.words;

    return words.map(value => value.join(separator));
}

deepEqual(
    match("foo.*.bar.*.gar", [
        "foo.a.bar.b.gar",
        "foo.a.bar.b.gar.test",
        "foo.a.bar.b.gar.test.more",
        "foo.a.bar.b.other"
    ]),
    [
        "foo.a.bar.b.gar"
    ]
);

deepEqual(
    match("foo.*.bar.*.gar.**", [
        "foo.a.bar.b.gar",
        "foo.a.bar.b.gar.test",
        "foo.a.bar.b.gar.test.more",
        "foo.a.bar.b.other"
    ]),
    [
        "foo.a.bar.b.gar",
        "foo.a.bar.b.gar.test",
        "foo.a.bar.b.gar.test.more"
    ]
);


const trie = new Trie()

trie.addWord('test.*.baz'.split('.'))

console.log(trie.go('test').go('*').go('baz').words);

// console.log(trie.root.children)