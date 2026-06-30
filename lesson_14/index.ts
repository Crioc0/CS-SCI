import * as assert from "node:assert";
import {runBinaryTreeHashTests, TreeMap} from "./BinaryTreeHashMap";
import {ArrayTreeMap} from "./FlatTreeHashMap";



const arrayTreeMap = new ArrayTreeMap(16);

arrayTreeMap.set(10, "A");
arrayTreeMap.set('fa', "B");
arrayTreeMap.set(15, "C");
arrayTreeMap.set(3, "D");
arrayTreeMap.set(7, "E");

console.log(arrayTreeMap.get('fa'));           // "E"
console.log(arrayTreeMap.entries());           // [3, 5, 7, 10, 15]
console.log(arrayTreeMap.getIndex(10));     // 0
console.log(arrayTreeMap.getIndex(7));      // 4// Стартовая емкость

// runBinaryTreeHashTests()