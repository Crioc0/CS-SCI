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
