import * as assert from "node:assert";

interface Comparator<T> {
    (a: T, b: T): number;
}

function heapSort<T>(arr: T[], comparator:Comparator<T>){
    const n = arr.length;

    for (let i = Math.floor(n/2)-1; i>=0; i--) {
        heapify(arr,n,i,comparator);
    }

    for (let i = n-1; i>=0; i--) {
        [arr[0], arr[i]] = [arr[i],arr[0]]
        heapify(arr,i,0, comparator)
    }
    return arr

}

function heapify<T>(arr: T[], n:number,i:number, comparator:Comparator<T>){
    let largest = i
    const left = i *2 +1
    const right = i *2 +2
    if(left < n && comparator(arr[left], arr[largest])>0) {
        largest = left
    }

    if(right < n && comparator(arr[right], arr[largest])>0) {
        largest = right
    }
    if(largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        heapify(arr, n, largest, comparator)
    }
}

const numbers = [5, 3, 8, 4, 2, 7, 1, 6];
const numberComparator: Comparator<number> = (a, b) => a - b;

console.log(heapSort([...numbers], numberComparator))