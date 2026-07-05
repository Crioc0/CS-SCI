interface Options<T, K extends keyof T> {
    getter : (item: T)=>T[K]

}

function indexOf<T>(
    arr: T[],
    value: T extends object ? any : T,
    options?: T extends object ? Options<T, any> : undefined
): number {
    const getter = options?.getter || ((item: T) => item as any)

    let left = 0
    let right = arr.length - 1
    let result = -1

    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2)
        const currentValue = getter(arr[mid])

        if (currentValue === value) {
            result = mid
            right = mid - 1
        } else if (value < currentValue) {
            right = mid - 1
        } else {
            left = mid + 1
        }
    }
    return result
}

function lastIndexOf<T>(
    arr: T[],
    value: T extends object ? any : T,
    options?: T extends object ? Options<T, any> : undefined
): number {
    const getter = options?.getter || ((item: T) => item as any)
    let left = 0
    let right = arr.length - 1
    let result = -1
    while (left <= right) {
        const mid = left + Math.floor((right - left)/2)
        const currentValue = getter(arr[mid])
        if (currentValue === value) {
            result = mid
            left =mid + 1
        } else if(value < currentValue) {
            right = mid -1
        } else {
            left = mid + 1
        }
    }
    return result
}

const ages = [12, 42, 42, 42, 56];

const users = [
    { age: 12, name: 'Bob' },
    { age: 42, name: 'Ben' },
    { age: 42, name: 'Jack' },
    { age: 42, name: 'Sam' },
    { age: 56, name: 'Bill' }
];

// Поиск по массиву чисел
indexOf(ages, 56);     // 1
console.log(indexOf(ages, 56))
console.log(lastIndexOf(ages, 42)); // 3

// Поиск по массиву объектов (по полю age)
console.log(indexOf(users, 42, {getter: (item) => item.age}));     // 1
console.log(lastIndexOf(users, 42, {getter:(item) => item.age})); // 3

// Не найдено
indexOf(ages, 100);     // -1
lastIndexOf(ages, 100); // -1