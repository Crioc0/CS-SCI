import { Serializer } from "./src/serializer";
import { SerializerWithPointers } from "./src/serializerWithPointer";

const buffer = Serializer.encode(["hello", "мир", "", "122"]);
buffer.set(0, '12345')
console.log(Serializer.decode(buffer))
const bufferWithPointer = SerializerWithPointers.encode(["hello", "мир", "", "122"])
bufferWithPointer.set(0,"1215215121")

for (let str of bufferWithPointer) {
    console.log(str)
}
console.log("=== Итерация ===");
for (let str of buffer) {
    console.log(str); 
}
console.log(buffer.at(0));   // "hello"
console.log(buffer.at(1));   // "мир"
console.log(buffer.at(2));   // ""
console.log(buffer.at(-1));  // "" (последний элемент)
console.log(buffer.at(-2));  // "мир"
console.log(buffer.at(-3));  // "hello"
console.log(buffer.at(10));  // undefined

console.log(buffer.length);  // 3

const decoded = Serializer.decode(buffer);
console.log(decoded); // ["hello", "мир", ""]


