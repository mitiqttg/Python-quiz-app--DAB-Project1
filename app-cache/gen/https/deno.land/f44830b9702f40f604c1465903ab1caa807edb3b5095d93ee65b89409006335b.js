// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file
import { isAnyArrayBuffer, isArrayBufferView, isBigIntObject, isBooleanObject, isBoxedPrimitive, isDate, isFloat32Array, isFloat64Array, isMap, isNativeError, isNumberObject, isRegExp, isSet, isStringObject, isSymbolObject, isTypedArray } from "./types.ts";
import { Buffer } from "../../_buffer.mjs";
import { getOwnNonIndexProperties, ONLY_ENUMERABLE, SKIP_SYMBOLS } from "../../internal_binding/util.ts";
var valueType;
(function(valueType) {
    valueType[valueType["noIterator"] = 0] = "noIterator";
    valueType[valueType["isArray"] = 1] = "isArray";
    valueType[valueType["isSet"] = 2] = "isSet";
    valueType[valueType["isMap"] = 3] = "isMap";
})(valueType || (valueType = {}));
let memo;
export function isDeepStrictEqual(val1, val2) {
    return innerDeepEqual(val1, val2, true);
}
function isDeepEqual(val1, val2) {
    return innerDeepEqual(val1, val2, false);
}
function innerDeepEqual(val1, val2, strict, memos = memo) {
    // Basic case covered by Strict Equality Comparison
    if (val1 === val2) {
        if (val1 !== 0) return true;
        return strict ? Object.is(val1, val2) : true;
    }
    if (strict) {
        // Cases where the values are not objects
        // If both values are Not a Number NaN
        if (typeof val1 !== "object") {
            return typeof val1 === "number" && Number.isNaN(val1) && Number.isNaN(val2);
        }
        // If either value is null
        if (typeof val2 !== "object" || val1 === null || val2 === null) {
            return false;
        }
        // If the prototype are not the same
        if (Object.getPrototypeOf(val1) !== Object.getPrototypeOf(val2)) {
            return false;
        }
    } else {
        // Non strict case where values are either null or NaN
        if (val1 === null || typeof val1 !== "object") {
            if (val2 === null || typeof val2 !== "object") {
                return val1 == val2 || Number.isNaN(val1) && Number.isNaN(val2);
            }
            return false;
        }
        if (val2 === null || typeof val2 !== "object") {
            return false;
        }
    }
    const val1Tag = Object.prototype.toString.call(val1);
    const val2Tag = Object.prototype.toString.call(val2);
    // prototype must be Strictly Equal
    if (val1Tag !== val2Tag) {
        return false;
    }
    // handling when values are array
    if (Array.isArray(val1)) {
        // quick rejection cases
        if (!Array.isArray(val2) || val1.length !== val2.length) {
            return false;
        }
        const filter = strict ? ONLY_ENUMERABLE : ONLY_ENUMERABLE | SKIP_SYMBOLS;
        const keys1 = getOwnNonIndexProperties(val1, filter);
        const keys2 = getOwnNonIndexProperties(val2, filter);
        if (keys1.length !== keys2.length) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.isArray, keys1);
    } else if (val1Tag === "[object Object]") {
        return keyCheck(val1, val2, strict, memos, valueType.noIterator);
    } else if (val1 instanceof Date) {
        if (!(val2 instanceof Date) || val1.getTime() !== val2.getTime()) {
            return false;
        }
    } else if (val1 instanceof RegExp) {
        if (!(val2 instanceof RegExp) || !areSimilarRegExps(val1, val2)) {
            return false;
        }
    } else if (isNativeError(val1) || val1 instanceof Error) {
        // stack may or may not be same, hence it shouldn't be compared
        if (// How to handle the type errors here
        !isNativeError(val2) && !(val2 instanceof Error) || val1.message !== val2.message || val1.name !== val2.name) {
            return false;
        }
    } else if (isArrayBufferView(val1)) {
        const TypedArrayPrototypeGetSymbolToStringTag = (val)=>Object.getOwnPropertySymbols(val).map((item)=>item.toString()).toString();
        if (isTypedArray(val1) && isTypedArray(val2) && TypedArrayPrototypeGetSymbolToStringTag(val1) !== TypedArrayPrototypeGetSymbolToStringTag(val2)) {
            return false;
        }
        if (!strict && (isFloat32Array(val1) || isFloat64Array(val1))) {
            if (!areSimilarFloatArrays(val1, val2)) {
                return false;
            }
        } else if (!areSimilarTypedArrays(val1, val2)) {
            return false;
        }
        const filter = strict ? ONLY_ENUMERABLE : ONLY_ENUMERABLE | SKIP_SYMBOLS;
        const keysVal1 = getOwnNonIndexProperties(val1, filter);
        const keysVal2 = getOwnNonIndexProperties(val2, filter);
        if (keysVal1.length !== keysVal2.length) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.noIterator, keysVal1);
    } else if (isSet(val1)) {
        if (!isSet(val2) || val1.size !== val2.size) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.isSet);
    } else if (isMap(val1)) {
        if (!isMap(val2) || val1.size !== val2.size) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.isMap);
    } else if (isAnyArrayBuffer(val1)) {
        if (!isAnyArrayBuffer(val2) || !areEqualArrayBuffers(val1, val2)) {
            return false;
        }
    } else if (isBoxedPrimitive(val1)) {
        if (!isEqualBoxedPrimitive(val1, val2)) {
            return false;
        }
    } else if (Array.isArray(val2) || isArrayBufferView(val2) || isSet(val2) || isMap(val2) || isDate(val2) || isRegExp(val2) || isAnyArrayBuffer(val2) || isBoxedPrimitive(val2) || isNativeError(val2) || val2 instanceof Error) {
        return false;
    }
    return keyCheck(val1, val2, strict, memos, valueType.noIterator);
}
function keyCheck(val1, val2, strict, memos, iterationType, aKeys = []) {
    if (arguments.length === 5) {
        aKeys = Object.keys(val1);
        const bKeys = Object.keys(val2);
        // The pair must have the same number of owned properties.
        if (aKeys.length !== bKeys.length) {
            return false;
        }
    }
    // Cheap key test
    let i = 0;
    for(; i < aKeys.length; i++){
        if (!val2.propertyIsEnumerable(aKeys[i])) {
            return false;
        }
    }
    if (strict && arguments.length === 5) {
        const symbolKeysA = Object.getOwnPropertySymbols(val1);
        if (symbolKeysA.length !== 0) {
            let count = 0;
            for(i = 0; i < symbolKeysA.length; i++){
                const key = symbolKeysA[i];
                if (val1.propertyIsEnumerable(key)) {
                    if (!val2.propertyIsEnumerable(key)) {
                        return false;
                    }
                    // added toString here
                    aKeys.push(key.toString());
                    count++;
                } else if (val2.propertyIsEnumerable(key)) {
                    return false;
                }
            }
            const symbolKeysB = Object.getOwnPropertySymbols(val2);
            if (symbolKeysA.length !== symbolKeysB.length && getEnumerables(val2, symbolKeysB).length !== count) {
                return false;
            }
        } else {
            const symbolKeysB = Object.getOwnPropertySymbols(val2);
            if (symbolKeysB.length !== 0 && getEnumerables(val2, symbolKeysB).length !== 0) {
                return false;
            }
        }
    }
    if (aKeys.length === 0 && (iterationType === valueType.noIterator || iterationType === valueType.isArray && val1.length === 0 || val1.size === 0)) {
        return true;
    }
    if (memos === undefined) {
        memos = {
            val1: new Map(),
            val2: new Map(),
            position: 0
        };
    } else {
        const val2MemoA = memos.val1.get(val1);
        if (val2MemoA !== undefined) {
            const val2MemoB = memos.val2.get(val2);
            if (val2MemoB !== undefined) {
                return val2MemoA === val2MemoB;
            }
        }
        memos.position++;
    }
    memos.val1.set(val1, memos.position);
    memos.val2.set(val2, memos.position);
    const areEq = objEquiv(val1, val2, strict, aKeys, memos, iterationType);
    memos.val1.delete(val1);
    memos.val2.delete(val2);
    return areEq;
}
function areSimilarRegExps(a, b) {
    return a.source === b.source && a.flags === b.flags && a.lastIndex === b.lastIndex;
}
// TODO(standvpmnt): add type for arguments
function areSimilarFloatArrays(arr1, arr2) {
    if (arr1.byteLength !== arr2.byteLength) {
        return false;
    }
    for(let i = 0; i < arr1.byteLength; i++){
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}
// TODO(standvpmnt): add type for arguments
function areSimilarTypedArrays(arr1, arr2) {
    if (arr1.byteLength !== arr2.byteLength) {
        return false;
    }
    return Buffer.compare(new Uint8Array(arr1.buffer, arr1.byteOffset, arr1.byteLength), new Uint8Array(arr2.buffer, arr2.byteOffset, arr2.byteLength)) === 0;
}
// TODO(standvpmnt): add type for arguments
function areEqualArrayBuffers(buf1, buf2) {
    return buf1.byteLength === buf2.byteLength && Buffer.compare(new Uint8Array(buf1), new Uint8Array(buf2)) === 0;
}
// TODO(standvpmnt):  this check of getOwnPropertySymbols and getOwnPropertyNames
// length is sufficient to handle the current test case, however this will fail
// to catch a scenario wherein the getOwnPropertySymbols and getOwnPropertyNames
// length is the same(will be very contrived but a possible shortcoming
function isEqualBoxedPrimitive(a, b) {
    if (Object.getOwnPropertyNames(a).length !== Object.getOwnPropertyNames(b).length) {
        return false;
    }
    if (Object.getOwnPropertySymbols(a).length !== Object.getOwnPropertySymbols(b).length) {
        return false;
    }
    if (isNumberObject(a)) {
        return isNumberObject(b) && Object.is(Number.prototype.valueOf.call(a), Number.prototype.valueOf.call(b));
    }
    if (isStringObject(a)) {
        return isStringObject(b) && String.prototype.valueOf.call(a) === String.prototype.valueOf.call(b);
    }
    if (isBooleanObject(a)) {
        return isBooleanObject(b) && Boolean.prototype.valueOf.call(a) === Boolean.prototype.valueOf.call(b);
    }
    if (isBigIntObject(a)) {
        return isBigIntObject(b) && BigInt.prototype.valueOf.call(a) === BigInt.prototype.valueOf.call(b);
    }
    if (isSymbolObject(a)) {
        return isSymbolObject(b) && Symbol.prototype.valueOf.call(a) === Symbol.prototype.valueOf.call(b);
    }
    // assert.fail(`Unknown boxed type ${val1}`);
    // return false;
    throw Error(`Unknown boxed type`);
}
function getEnumerables(val, keys) {
    return keys.filter((key)=>val.propertyIsEnumerable(key));
}
function objEquiv(obj1, obj2, strict, keys, memos, iterationType) {
    let i = 0;
    if (iterationType === valueType.isSet) {
        if (!setEquiv(obj1, obj2, strict, memos)) {
            return false;
        }
    } else if (iterationType === valueType.isMap) {
        if (!mapEquiv(obj1, obj2, strict, memos)) {
            return false;
        }
    } else if (iterationType === valueType.isArray) {
        for(; i < obj1.length; i++){
            if (obj1.hasOwnProperty(i)) {
                if (!obj2.hasOwnProperty(i) || !innerDeepEqual(obj1[i], obj2[i], strict, memos)) {
                    return false;
                }
            } else if (obj2.hasOwnProperty(i)) {
                return false;
            } else {
                const keys1 = Object.keys(obj1);
                for(; i < keys1.length; i++){
                    const key = keys1[i];
                    if (!obj2.hasOwnProperty(key) || !innerDeepEqual(obj1[key], obj2[key], strict, memos)) {
                        return false;
                    }
                }
                if (keys1.length !== Object.keys(obj2).length) {
                    return false;
                }
                if (keys1.length !== Object.keys(obj2).length) {
                    return false;
                }
                return true;
            }
        }
    }
    // Expensive test
    for(i = 0; i < keys.length; i++){
        const key = keys[i];
        if (!innerDeepEqual(obj1[key], obj2[key], strict, memos)) {
            return false;
        }
    }
    return true;
}
function findLooseMatchingPrimitives(primitive) {
    switch(typeof primitive){
        case "undefined":
            return null;
        case "object":
            return undefined;
        case "symbol":
            return false;
        case "string":
            primitive = +primitive;
        case "number":
            if (Number.isNaN(primitive)) {
                return false;
            }
    }
    return true;
}
function setMightHaveLoosePrim(set1, set2, primitive) {
    const altValue = findLooseMatchingPrimitives(primitive);
    if (altValue != null) return altValue;
    return set2.has(altValue) && !set1.has(altValue);
}
function setHasEqualElement(set, val1, strict, memos) {
    for (const val2 of set){
        if (innerDeepEqual(val1, val2, strict, memos)) {
            set.delete(val2);
            return true;
        }
    }
    return false;
}
function setEquiv(set1, set2, strict, memos) {
    let set = null;
    for (const item of set1){
        if (typeof item === "object" && item !== null) {
            if (set === null) {
                // What is SafeSet from primordials?
                // set = new SafeSet();
                set = new Set();
            }
            set.add(item);
        } else if (!set2.has(item)) {
            if (strict) return false;
            if (!setMightHaveLoosePrim(set1, set2, item)) {
                return false;
            }
            if (set === null) {
                set = new Set();
            }
            set.add(item);
        }
    }
    if (set !== null) {
        for (const item of set2){
            if (typeof item === "object" && item !== null) {
                if (!setHasEqualElement(set, item, strict, memos)) return false;
            } else if (!strict && !set1.has(item) && !setHasEqualElement(set, item, strict, memos)) {
                return false;
            }
        }
        return set.size === 0;
    }
    return true;
}
// TODO(standvpmnt): add types for argument
function mapMightHaveLoosePrimitive(map1, map2, primitive, item, memos) {
    const altValue = findLooseMatchingPrimitives(primitive);
    if (altValue != null) {
        return altValue;
    }
    const curB = map2.get(altValue);
    if (curB === undefined && !map2.has(altValue) || !innerDeepEqual(item, curB, false, memo)) {
        return false;
    }
    return !map1.has(altValue) && innerDeepEqual(item, curB, false, memos);
}
function mapEquiv(map1, map2, strict, memos) {
    let set = null;
    for (const { 0: key , 1: item1  } of map1){
        if (typeof key === "object" && key !== null) {
            if (set === null) {
                set = new Set();
            }
            set.add(key);
        } else {
            const item2 = map2.get(key);
            if (item2 === undefined && !map2.has(key) || !innerDeepEqual(item1, item2, strict, memos)) {
                if (strict) return false;
                if (!mapMightHaveLoosePrimitive(map1, map2, key, item1, memos)) {
                    return false;
                }
                if (set === null) {
                    set = new Set();
                }
                set.add(key);
            }
        }
    }
    if (set !== null) {
        for (const { 0: key , 1: item  } of map2){
            if (typeof key === "object" && key !== null) {
                if (!mapHasEqualEntry(set, map1, key, item, strict, memos)) {
                    return false;
                }
            } else if (!strict && (!map1.has(key) || !innerDeepEqual(map1.get(key), item, false, memos)) && !mapHasEqualEntry(set, map1, key, item, false, memos)) {
                return false;
            }
        }
        return set.size === 0;
    }
    return true;
}
function mapHasEqualEntry(set, map, key1, item1, strict, memos) {
    for (const key2 of set){
        if (innerDeepEqual(key1, key2, strict, memos) && innerDeepEqual(item1, map.get(key2), strict, memos)) {
            set.delete(key2);
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvaW50ZXJuYWwvdXRpbC9jb21wYXJpc29ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IEpveWVudCBhbmQgTm9kZSBjb250cmlidXRvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGVcbmltcG9ydCB7XG4gIGlzQW55QXJyYXlCdWZmZXIsXG4gIGlzQXJyYXlCdWZmZXJWaWV3LFxuICBpc0JpZ0ludE9iamVjdCxcbiAgaXNCb29sZWFuT2JqZWN0LFxuICBpc0JveGVkUHJpbWl0aXZlLFxuICBpc0RhdGUsXG4gIGlzRmxvYXQzMkFycmF5LFxuICBpc0Zsb2F0NjRBcnJheSxcbiAgaXNNYXAsXG4gIGlzTmF0aXZlRXJyb3IsXG4gIGlzTnVtYmVyT2JqZWN0LFxuICBpc1JlZ0V4cCxcbiAgaXNTZXQsXG4gIGlzU3RyaW5nT2JqZWN0LFxuICBpc1N5bWJvbE9iamVjdCxcbiAgaXNUeXBlZEFycmF5LFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi4vLi4vX2J1ZmZlci5tanNcIjtcbmltcG9ydCB7XG4gIGdldE93bk5vbkluZGV4UHJvcGVydGllcyxcbiAgT05MWV9FTlVNRVJBQkxFLFxuICBTS0lQX1NZTUJPTFMsXG59IGZyb20gXCIuLi8uLi9pbnRlcm5hbF9iaW5kaW5nL3V0aWwudHNcIjtcblxuZW51bSB2YWx1ZVR5cGUge1xuICBub0l0ZXJhdG9yLFxuICBpc0FycmF5LFxuICBpc1NldCxcbiAgaXNNYXAsXG59XG5cbmludGVyZmFjZSBNZW1vIHtcbiAgdmFsMTogTWFwPHVua25vd24sIHVua25vd24+O1xuICB2YWwyOiBNYXA8dW5rbm93biwgdW5rbm93bj47XG4gIHBvc2l0aW9uOiBudW1iZXI7XG59XG5sZXQgbWVtbzogTWVtbztcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGVlcFN0cmljdEVxdWFsKHZhbDE6IHVua25vd24sIHZhbDI6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIGlubmVyRGVlcEVxdWFsKHZhbDEsIHZhbDIsIHRydWUpO1xufVxuZnVuY3Rpb24gaXNEZWVwRXF1YWwodmFsMTogdW5rbm93biwgdmFsMjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5uZXJEZWVwRXF1YWwodmFsMSwgdmFsMiwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBpbm5lckRlZXBFcXVhbChcbiAgdmFsMTogdW5rbm93bixcbiAgdmFsMjogdW5rbm93bixcbiAgc3RyaWN0OiBib29sZWFuLFxuICBtZW1vcyA9IG1lbW8sXG4pOiBib29sZWFuIHtcbiAgLy8gQmFzaWMgY2FzZSBjb3ZlcmVkIGJ5IFN0cmljdCBFcXVhbGl0eSBDb21wYXJpc29uXG4gIGlmICh2YWwxID09PSB2YWwyKSB7XG4gICAgaWYgKHZhbDEgIT09IDApIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBzdHJpY3QgPyBPYmplY3QuaXModmFsMSwgdmFsMikgOiB0cnVlO1xuICB9XG4gIGlmIChzdHJpY3QpIHtcbiAgICAvLyBDYXNlcyB3aGVyZSB0aGUgdmFsdWVzIGFyZSBub3Qgb2JqZWN0c1xuICAgIC8vIElmIGJvdGggdmFsdWVzIGFyZSBOb3QgYSBOdW1iZXIgTmFOXG4gICAgaWYgKHR5cGVvZiB2YWwxICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB0eXBlb2YgdmFsMSA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNOYU4odmFsMSkgJiYgTnVtYmVyLmlzTmFOKHZhbDIpXG4gICAgICApO1xuICAgIH1cbiAgICAvLyBJZiBlaXRoZXIgdmFsdWUgaXMgbnVsbFxuICAgIGlmICh0eXBlb2YgdmFsMiAhPT0gXCJvYmplY3RcIiB8fCB2YWwxID09PSBudWxsIHx8IHZhbDIgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIHByb3RvdHlwZSBhcmUgbm90IHRoZSBzYW1lXG4gICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWwxKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbDIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIE5vbiBzdHJpY3QgY2FzZSB3aGVyZSB2YWx1ZXMgYXJlIGVpdGhlciBudWxsIG9yIE5hTlxuICAgIGlmICh2YWwxID09PSBudWxsIHx8IHR5cGVvZiB2YWwxICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAodmFsMiA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsMiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gdmFsMSA9PSB2YWwyIHx8IChOdW1iZXIuaXNOYU4odmFsMSkgJiYgTnVtYmVyLmlzTmFOKHZhbDIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHZhbDIgPT09IG51bGwgfHwgdHlwZW9mIHZhbDIgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBjb25zdCB2YWwxVGFnID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbDEpO1xuICBjb25zdCB2YWwyVGFnID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbDIpO1xuXG4gIC8vIHByb3RvdHlwZSBtdXN0IGJlIFN0cmljdGx5IEVxdWFsXG4gIGlmIChcbiAgICB2YWwxVGFnICE9PSB2YWwyVGFnXG4gICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGhhbmRsaW5nIHdoZW4gdmFsdWVzIGFyZSBhcnJheVxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWwxKSkge1xuICAgIC8vIHF1aWNrIHJlamVjdGlvbiBjYXNlc1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWwyKSB8fCB2YWwxLmxlbmd0aCAhPT0gdmFsMi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgZmlsdGVyID0gc3RyaWN0ID8gT05MWV9FTlVNRVJBQkxFIDogT05MWV9FTlVNRVJBQkxFIHwgU0tJUF9TWU1CT0xTO1xuICAgIGNvbnN0IGtleXMxID0gZ2V0T3duTm9uSW5kZXhQcm9wZXJ0aWVzKHZhbDEsIGZpbHRlcik7XG4gICAgY29uc3Qga2V5czIgPSBnZXRPd25Ob25JbmRleFByb3BlcnRpZXModmFsMiwgZmlsdGVyKTtcbiAgICBpZiAoa2V5czEubGVuZ3RoICE9PSBrZXlzMi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGtleUNoZWNrKHZhbDEsIHZhbDIsIHN0cmljdCwgbWVtb3MsIHZhbHVlVHlwZS5pc0FycmF5LCBrZXlzMSk7XG4gIH0gZWxzZSBpZiAodmFsMVRhZyA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuICAgIHJldHVybiBrZXlDaGVjayhcbiAgICAgIHZhbDEgYXMgb2JqZWN0LFxuICAgICAgdmFsMiBhcyBvYmplY3QsXG4gICAgICBzdHJpY3QsXG4gICAgICBtZW1vcyxcbiAgICAgIHZhbHVlVHlwZS5ub0l0ZXJhdG9yLFxuICAgICk7XG4gIH0gZWxzZSBpZiAodmFsMSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICBpZiAoISh2YWwyIGluc3RhbmNlb2YgRGF0ZSkgfHwgdmFsMS5nZXRUaW1lKCkgIT09IHZhbDIuZ2V0VGltZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbDEgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICBpZiAoISh2YWwyIGluc3RhbmNlb2YgUmVnRXhwKSB8fCAhYXJlU2ltaWxhclJlZ0V4cHModmFsMSwgdmFsMikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNOYXRpdmVFcnJvcih2YWwxKSB8fCB2YWwxIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAvLyBzdGFjayBtYXkgb3IgbWF5IG5vdCBiZSBzYW1lLCBoZW5jZSBpdCBzaG91bGRuJ3QgYmUgY29tcGFyZWRcbiAgICBpZiAoXG4gICAgICAvLyBIb3cgdG8gaGFuZGxlIHRoZSB0eXBlIGVycm9ycyBoZXJlXG4gICAgICAoIWlzTmF0aXZlRXJyb3IodmFsMikgJiYgISh2YWwyIGluc3RhbmNlb2YgRXJyb3IpKSB8fFxuICAgICAgKHZhbDEgYXMgRXJyb3IpLm1lc3NhZ2UgIT09ICh2YWwyIGFzIEVycm9yKS5tZXNzYWdlIHx8XG4gICAgICAodmFsMSBhcyBFcnJvcikubmFtZSAhPT0gKHZhbDIgYXMgRXJyb3IpLm5hbWVcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNBcnJheUJ1ZmZlclZpZXcodmFsMSkpIHtcbiAgICBjb25zdCBUeXBlZEFycmF5UHJvdG90eXBlR2V0U3ltYm9sVG9TdHJpbmdUYWcgPSAodmFsOiBbXSkgPT5cbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHModmFsKVxuICAgICAgICAubWFwKChpdGVtKSA9PiBpdGVtLnRvU3RyaW5nKCkpXG4gICAgICAgIC50b1N0cmluZygpO1xuICAgIGlmIChcbiAgICAgIGlzVHlwZWRBcnJheSh2YWwxKSAmJlxuICAgICAgaXNUeXBlZEFycmF5KHZhbDIpICYmXG4gICAgICAoVHlwZWRBcnJheVByb3RvdHlwZUdldFN5bWJvbFRvU3RyaW5nVGFnKHZhbDEgYXMgW10pICE9PVxuICAgICAgICBUeXBlZEFycmF5UHJvdG90eXBlR2V0U3ltYm9sVG9TdHJpbmdUYWcodmFsMiBhcyBbXSkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFzdHJpY3QgJiYgKGlzRmxvYXQzMkFycmF5KHZhbDEpIHx8IGlzRmxvYXQ2NEFycmF5KHZhbDEpKSkge1xuICAgICAgaWYgKCFhcmVTaW1pbGFyRmxvYXRBcnJheXModmFsMSwgdmFsMikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWFyZVNpbWlsYXJUeXBlZEFycmF5cyh2YWwxLCB2YWwyKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBmaWx0ZXIgPSBzdHJpY3QgPyBPTkxZX0VOVU1FUkFCTEUgOiBPTkxZX0VOVU1FUkFCTEUgfCBTS0lQX1NZTUJPTFM7XG4gICAgY29uc3Qga2V5c1ZhbDEgPSBnZXRPd25Ob25JbmRleFByb3BlcnRpZXModmFsMSBhcyBvYmplY3QsIGZpbHRlcik7XG4gICAgY29uc3Qga2V5c1ZhbDIgPSBnZXRPd25Ob25JbmRleFByb3BlcnRpZXModmFsMiBhcyBvYmplY3QsIGZpbHRlcik7XG4gICAgaWYgKGtleXNWYWwxLmxlbmd0aCAhPT0ga2V5c1ZhbDIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBrZXlDaGVjayhcbiAgICAgIHZhbDEgYXMgb2JqZWN0LFxuICAgICAgdmFsMiBhcyBvYmplY3QsXG4gICAgICBzdHJpY3QsXG4gICAgICBtZW1vcyxcbiAgICAgIHZhbHVlVHlwZS5ub0l0ZXJhdG9yLFxuICAgICAga2V5c1ZhbDEsXG4gICAgKTtcbiAgfSBlbHNlIGlmIChpc1NldCh2YWwxKSkge1xuICAgIGlmIChcbiAgICAgICFpc1NldCh2YWwyKSB8fFxuICAgICAgKHZhbDEgYXMgU2V0PHVua25vd24+KS5zaXplICE9PSAodmFsMiBhcyBTZXQ8dW5rbm93bj4pLnNpemVcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGtleUNoZWNrKFxuICAgICAgdmFsMSBhcyBvYmplY3QsXG4gICAgICB2YWwyIGFzIG9iamVjdCxcbiAgICAgIHN0cmljdCxcbiAgICAgIG1lbW9zLFxuICAgICAgdmFsdWVUeXBlLmlzU2V0LFxuICAgICk7XG4gIH0gZWxzZSBpZiAoaXNNYXAodmFsMSkpIHtcbiAgICBpZiAoXG4gICAgICAhaXNNYXAodmFsMikgfHxcbiAgICAgICh2YWwxIGFzIFNldDx1bmtub3duPikuc2l6ZSAhPT0gKHZhbDIgYXMgU2V0PHVua25vd24+KS5zaXplXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBrZXlDaGVjayhcbiAgICAgIHZhbDEgYXMgb2JqZWN0LFxuICAgICAgdmFsMiBhcyBvYmplY3QsXG4gICAgICBzdHJpY3QsXG4gICAgICBtZW1vcyxcbiAgICAgIHZhbHVlVHlwZS5pc01hcCxcbiAgICApO1xuICB9IGVsc2UgaWYgKGlzQW55QXJyYXlCdWZmZXIodmFsMSkpIHtcbiAgICBpZiAoIWlzQW55QXJyYXlCdWZmZXIodmFsMikgfHwgIWFyZUVxdWFsQXJyYXlCdWZmZXJzKHZhbDEsIHZhbDIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzQm94ZWRQcmltaXRpdmUodmFsMSkpIHtcbiAgICBpZiAoIWlzRXF1YWxCb3hlZFByaW1pdGl2ZSh2YWwxLCB2YWwyKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChcbiAgICBBcnJheS5pc0FycmF5KHZhbDIpIHx8XG4gICAgaXNBcnJheUJ1ZmZlclZpZXcodmFsMikgfHxcbiAgICBpc1NldCh2YWwyKSB8fFxuICAgIGlzTWFwKHZhbDIpIHx8XG4gICAgaXNEYXRlKHZhbDIpIHx8XG4gICAgaXNSZWdFeHAodmFsMikgfHxcbiAgICBpc0FueUFycmF5QnVmZmVyKHZhbDIpIHx8XG4gICAgaXNCb3hlZFByaW1pdGl2ZSh2YWwyKSB8fFxuICAgIGlzTmF0aXZlRXJyb3IodmFsMikgfHxcbiAgICB2YWwyIGluc3RhbmNlb2YgRXJyb3JcbiAgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBrZXlDaGVjayhcbiAgICB2YWwxIGFzIG9iamVjdCxcbiAgICB2YWwyIGFzIG9iamVjdCxcbiAgICBzdHJpY3QsXG4gICAgbWVtb3MsXG4gICAgdmFsdWVUeXBlLm5vSXRlcmF0b3IsXG4gICk7XG59XG5cbmZ1bmN0aW9uIGtleUNoZWNrKFxuICB2YWwxOiBvYmplY3QsXG4gIHZhbDI6IG9iamVjdCxcbiAgc3RyaWN0OiBib29sZWFuLFxuICBtZW1vczogTWVtbyxcbiAgaXRlcmF0aW9uVHlwZTogdmFsdWVUeXBlLFxuICBhS2V5czogKHN0cmluZyB8IHN5bWJvbClbXSA9IFtdLFxuKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA1KSB7XG4gICAgYUtleXMgPSBPYmplY3Qua2V5cyh2YWwxKTtcbiAgICBjb25zdCBiS2V5cyA9IE9iamVjdC5rZXlzKHZhbDIpO1xuXG4gICAgLy8gVGhlIHBhaXIgbXVzdCBoYXZlIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzLlxuICAgIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWFwIGtleSB0ZXN0XG4gIGxldCBpID0gMDtcbiAgZm9yICg7IGkgPCBhS2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGlmICghdmFsMi5wcm9wZXJ0eUlzRW51bWVyYWJsZShhS2V5c1tpXSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoc3RyaWN0ICYmIGFyZ3VtZW50cy5sZW5ndGggPT09IDUpIHtcbiAgICBjb25zdCBzeW1ib2xLZXlzQSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHModmFsMSk7XG4gICAgaWYgKHN5bWJvbEtleXNBLmxlbmd0aCAhPT0gMCkge1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBzeW1ib2xLZXlzQS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrZXkgPSBzeW1ib2xLZXlzQVtpXTtcbiAgICAgICAgaWYgKHZhbDEucHJvcGVydHlJc0VudW1lcmFibGUoa2V5KSkge1xuICAgICAgICAgIGlmICghdmFsMi5wcm9wZXJ0eUlzRW51bWVyYWJsZShrZXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGFkZGVkIHRvU3RyaW5nIGhlcmVcbiAgICAgICAgICBhS2V5cy5wdXNoKGtleS50b1N0cmluZygpKTtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbDIucHJvcGVydHlJc0VudW1lcmFibGUoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3Qgc3ltYm9sS2V5c0IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHZhbDIpO1xuICAgICAgaWYgKFxuICAgICAgICBzeW1ib2xLZXlzQS5sZW5ndGggIT09IHN5bWJvbEtleXNCLmxlbmd0aCAmJlxuICAgICAgICBnZXRFbnVtZXJhYmxlcyh2YWwyLCBzeW1ib2xLZXlzQikubGVuZ3RoICE9PSBjb3VudFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3ltYm9sS2V5c0IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHZhbDIpO1xuICAgICAgaWYgKFxuICAgICAgICBzeW1ib2xLZXlzQi5sZW5ndGggIT09IDAgJiZcbiAgICAgICAgZ2V0RW51bWVyYWJsZXModmFsMiwgc3ltYm9sS2V5c0IpLmxlbmd0aCAhPT0gMFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKFxuICAgIGFLZXlzLmxlbmd0aCA9PT0gMCAmJlxuICAgIChpdGVyYXRpb25UeXBlID09PSB2YWx1ZVR5cGUubm9JdGVyYXRvciB8fFxuICAgICAgKGl0ZXJhdGlvblR5cGUgPT09IHZhbHVlVHlwZS5pc0FycmF5ICYmICh2YWwxIGFzIFtdKS5sZW5ndGggPT09IDApIHx8XG4gICAgICAodmFsMSBhcyBTZXQ8dW5rbm93bj4pLnNpemUgPT09IDApXG4gICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKG1lbW9zID09PSB1bmRlZmluZWQpIHtcbiAgICBtZW1vcyA9IHtcbiAgICAgIHZhbDE6IG5ldyBNYXAoKSxcbiAgICAgIHZhbDI6IG5ldyBNYXAoKSxcbiAgICAgIHBvc2l0aW9uOiAwLFxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdmFsMk1lbW9BID0gbWVtb3MudmFsMS5nZXQodmFsMSk7XG4gICAgaWYgKHZhbDJNZW1vQSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCB2YWwyTWVtb0IgPSBtZW1vcy52YWwyLmdldCh2YWwyKTtcbiAgICAgIGlmICh2YWwyTWVtb0IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsMk1lbW9BID09PSB2YWwyTWVtb0I7XG4gICAgICB9XG4gICAgfVxuICAgIG1lbW9zLnBvc2l0aW9uKys7XG4gIH1cblxuICBtZW1vcy52YWwxLnNldCh2YWwxLCBtZW1vcy5wb3NpdGlvbik7XG4gIG1lbW9zLnZhbDIuc2V0KHZhbDIsIG1lbW9zLnBvc2l0aW9uKTtcblxuICBjb25zdCBhcmVFcSA9IG9iakVxdWl2KHZhbDEsIHZhbDIsIHN0cmljdCwgYUtleXMsIG1lbW9zLCBpdGVyYXRpb25UeXBlKTtcblxuICBtZW1vcy52YWwxLmRlbGV0ZSh2YWwxKTtcbiAgbWVtb3MudmFsMi5kZWxldGUodmFsMik7XG5cbiAgcmV0dXJuIGFyZUVxO1xufVxuXG5mdW5jdGlvbiBhcmVTaW1pbGFyUmVnRXhwcyhhOiBSZWdFeHAsIGI6IFJlZ0V4cCkge1xuICByZXR1cm4gYS5zb3VyY2UgPT09IGIuc291cmNlICYmIGEuZmxhZ3MgPT09IGIuZmxhZ3MgJiZcbiAgICBhLmxhc3RJbmRleCA9PT0gYi5sYXN0SW5kZXg7XG59XG5cbi8vIFRPRE8oc3RhbmR2cG1udCk6IGFkZCB0eXBlIGZvciBhcmd1bWVudHNcbmZ1bmN0aW9uIGFyZVNpbWlsYXJGbG9hdEFycmF5cyhhcnIxOiBhbnksIGFycjI6IGFueSk6IGJvb2xlYW4ge1xuICBpZiAoYXJyMS5ieXRlTGVuZ3RoICE9PSBhcnIyLmJ5dGVMZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIxLmJ5dGVMZW5ndGg7IGkrKykge1xuICAgIGlmIChhcnIxW2ldICE9PSBhcnIyW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBUT0RPKHN0YW5kdnBtbnQpOiBhZGQgdHlwZSBmb3IgYXJndW1lbnRzXG5mdW5jdGlvbiBhcmVTaW1pbGFyVHlwZWRBcnJheXMoYXJyMTogYW55LCBhcnIyOiBhbnkpOiBib29sZWFuIHtcbiAgaWYgKGFycjEuYnl0ZUxlbmd0aCAhPT0gYXJyMi5ieXRlTGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoXG4gICAgQnVmZmVyLmNvbXBhcmUoXG4gICAgICBuZXcgVWludDhBcnJheShhcnIxLmJ1ZmZlciwgYXJyMS5ieXRlT2Zmc2V0LCBhcnIxLmJ5dGVMZW5ndGgpLFxuICAgICAgbmV3IFVpbnQ4QXJyYXkoYXJyMi5idWZmZXIsIGFycjIuYnl0ZU9mZnNldCwgYXJyMi5ieXRlTGVuZ3RoKSxcbiAgICApID09PSAwXG4gICk7XG59XG4vLyBUT0RPKHN0YW5kdnBtbnQpOiBhZGQgdHlwZSBmb3IgYXJndW1lbnRzXG5mdW5jdGlvbiBhcmVFcXVhbEFycmF5QnVmZmVycyhidWYxOiBhbnksIGJ1ZjI6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGJ1ZjEuYnl0ZUxlbmd0aCA9PT0gYnVmMi5ieXRlTGVuZ3RoICYmXG4gICAgQnVmZmVyLmNvbXBhcmUobmV3IFVpbnQ4QXJyYXkoYnVmMSksIG5ldyBVaW50OEFycmF5KGJ1ZjIpKSA9PT0gMFxuICApO1xufVxuXG4vLyBUT0RPKHN0YW5kdnBtbnQpOiAgdGhpcyBjaGVjayBvZiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgYW5kIGdldE93blByb3BlcnR5TmFtZXNcbi8vIGxlbmd0aCBpcyBzdWZmaWNpZW50IHRvIGhhbmRsZSB0aGUgY3VycmVudCB0ZXN0IGNhc2UsIGhvd2V2ZXIgdGhpcyB3aWxsIGZhaWxcbi8vIHRvIGNhdGNoIGEgc2NlbmFyaW8gd2hlcmVpbiB0aGUgZ2V0T3duUHJvcGVydHlTeW1ib2xzIGFuZCBnZXRPd25Qcm9wZXJ0eU5hbWVzXG4vLyBsZW5ndGggaXMgdGhlIHNhbWUod2lsbCBiZSB2ZXJ5IGNvbnRyaXZlZCBidXQgYSBwb3NzaWJsZSBzaG9ydGNvbWluZ1xuZnVuY3Rpb24gaXNFcXVhbEJveGVkUHJpbWl0aXZlKGE6IGFueSwgYjogYW55KTogYm9vbGVhbiB7XG4gIGlmIChcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhKS5sZW5ndGggIT09XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhiKS5sZW5ndGhcbiAgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGEpLmxlbmd0aCAhPT1cbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoYikubGVuZ3RoXG4gICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNOdW1iZXJPYmplY3QoYSkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgaXNOdW1iZXJPYmplY3QoYikgJiZcbiAgICAgIE9iamVjdC5pcyhcbiAgICAgICAgTnVtYmVyLnByb3RvdHlwZS52YWx1ZU9mLmNhbGwoYSksXG4gICAgICAgIE51bWJlci5wcm90b3R5cGUudmFsdWVPZi5jYWxsKGIpLFxuICAgICAgKVxuICAgICk7XG4gIH1cbiAgaWYgKGlzU3RyaW5nT2JqZWN0KGEpKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIGlzU3RyaW5nT2JqZWN0KGIpICYmXG4gICAgICAoU3RyaW5nLnByb3RvdHlwZS52YWx1ZU9mLmNhbGwoYSkgPT09IFN0cmluZy5wcm90b3R5cGUudmFsdWVPZi5jYWxsKGIpKVxuICAgICk7XG4gIH1cbiAgaWYgKGlzQm9vbGVhbk9iamVjdChhKSkge1xuICAgIHJldHVybiAoXG4gICAgICBpc0Jvb2xlYW5PYmplY3QoYikgJiZcbiAgICAgIChCb29sZWFuLnByb3RvdHlwZS52YWx1ZU9mLmNhbGwoYSkgPT09IEJvb2xlYW4ucHJvdG90eXBlLnZhbHVlT2YuY2FsbChiKSlcbiAgICApO1xuICB9XG4gIGlmIChpc0JpZ0ludE9iamVjdChhKSkge1xuICAgIHJldHVybiAoXG4gICAgICBpc0JpZ0ludE9iamVjdChiKSAmJlxuICAgICAgKEJpZ0ludC5wcm90b3R5cGUudmFsdWVPZi5jYWxsKGEpID09PSBCaWdJbnQucHJvdG90eXBlLnZhbHVlT2YuY2FsbChiKSlcbiAgICApO1xuICB9XG4gIGlmIChpc1N5bWJvbE9iamVjdChhKSkge1xuICAgIHJldHVybiAoXG4gICAgICBpc1N5bWJvbE9iamVjdChiKSAmJlxuICAgICAgKFN5bWJvbC5wcm90b3R5cGUudmFsdWVPZi5jYWxsKGEpID09PVxuICAgICAgICBTeW1ib2wucHJvdG90eXBlLnZhbHVlT2YuY2FsbChiKSlcbiAgICApO1xuICB9XG4gIC8vIGFzc2VydC5mYWlsKGBVbmtub3duIGJveGVkIHR5cGUgJHt2YWwxfWApO1xuICAvLyByZXR1cm4gZmFsc2U7XG4gIHRocm93IEVycm9yKGBVbmtub3duIGJveGVkIHR5cGVgKTtcbn1cblxuZnVuY3Rpb24gZ2V0RW51bWVyYWJsZXModmFsOiBhbnksIGtleXM6IGFueSkge1xuICByZXR1cm4ga2V5cy5maWx0ZXIoKGtleTogc3RyaW5nKSA9PiB2YWwucHJvcGVydHlJc0VudW1lcmFibGUoa2V5KSk7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KFxuICBvYmoxOiBhbnksXG4gIG9iajI6IGFueSxcbiAgc3RyaWN0OiBib29sZWFuLFxuICBrZXlzOiBhbnksXG4gIG1lbW9zOiBNZW1vLFxuICBpdGVyYXRpb25UeXBlOiB2YWx1ZVR5cGUsXG4pOiBib29sZWFuIHtcbiAgbGV0IGkgPSAwO1xuXG4gIGlmIChpdGVyYXRpb25UeXBlID09PSB2YWx1ZVR5cGUuaXNTZXQpIHtcbiAgICBpZiAoIXNldEVxdWl2KG9iajEsIG9iajIsIHN0cmljdCwgbWVtb3MpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2UgaWYgKGl0ZXJhdGlvblR5cGUgPT09IHZhbHVlVHlwZS5pc01hcCkge1xuICAgIGlmICghbWFwRXF1aXYob2JqMSwgb2JqMiwgc3RyaWN0LCBtZW1vcykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXRlcmF0aW9uVHlwZSA9PT0gdmFsdWVUeXBlLmlzQXJyYXkpIHtcbiAgICBmb3IgKDsgaSA8IG9iajEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChvYmoxLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhb2JqMi5oYXNPd25Qcm9wZXJ0eShpKSB8fFxuICAgICAgICAgICFpbm5lckRlZXBFcXVhbChvYmoxW2ldLCBvYmoyW2ldLCBzdHJpY3QsIG1lbW9zKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAob2JqMi5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBrZXlzMSA9IE9iamVjdC5rZXlzKG9iajEpO1xuICAgICAgICBmb3IgKDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5czFbaV07XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIW9iajIuaGFzT3duUHJvcGVydHkoa2V5KSB8fFxuICAgICAgICAgICAgIWlubmVyRGVlcEVxdWFsKG9iajFba2V5XSwgb2JqMltrZXldLCBzdHJpY3QsIG1lbW9zKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5czEubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhvYmoyKS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXMxLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMob2JqMikubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEV4cGVuc2l2ZSB0ZXN0XG4gIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcbiAgICBpZiAoIWlubmVyRGVlcEVxdWFsKG9iajFba2V5XSwgb2JqMltrZXldLCBzdHJpY3QsIG1lbW9zKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZmluZExvb3NlTWF0Y2hpbmdQcmltaXRpdmVzKFxuICBwcmltaXRpdmU6IHVua25vd24sXG4pOiBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gIHN3aXRjaCAodHlwZW9mIHByaW1pdGl2ZSkge1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY2FzZSBcInN5bWJvbFwiOlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgIHByaW1pdGl2ZSA9ICtwcmltaXRpdmU7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYgKE51bWJlci5pc05hTihwcmltaXRpdmUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2V0TWlnaHRIYXZlTG9vc2VQcmltKFxuICBzZXQxOiBTZXQ8dW5rbm93bj4sXG4gIHNldDI6IFNldDx1bmtub3duPixcbiAgcHJpbWl0aXZlOiBhbnksXG4pIHtcbiAgY29uc3QgYWx0VmFsdWUgPSBmaW5kTG9vc2VNYXRjaGluZ1ByaW1pdGl2ZXMocHJpbWl0aXZlKTtcbiAgaWYgKGFsdFZhbHVlICE9IG51bGwpIHJldHVybiBhbHRWYWx1ZTtcblxuICByZXR1cm4gc2V0Mi5oYXMoYWx0VmFsdWUpICYmICFzZXQxLmhhcyhhbHRWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHNldEhhc0VxdWFsRWxlbWVudChcbiAgc2V0OiBhbnksXG4gIHZhbDE6IGFueSxcbiAgc3RyaWN0OiBib29sZWFuLFxuICBtZW1vczogTWVtbyxcbik6IGJvb2xlYW4ge1xuICBmb3IgKGNvbnN0IHZhbDIgb2Ygc2V0KSB7XG4gICAgaWYgKGlubmVyRGVlcEVxdWFsKHZhbDEsIHZhbDIsIHN0cmljdCwgbWVtb3MpKSB7XG4gICAgICBzZXQuZGVsZXRlKHZhbDIpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzZXRFcXVpdihzZXQxOiBhbnksIHNldDI6IGFueSwgc3RyaWN0OiBib29sZWFuLCBtZW1vczogTWVtbyk6IGJvb2xlYW4ge1xuICBsZXQgc2V0ID0gbnVsbDtcbiAgZm9yIChjb25zdCBpdGVtIG9mIHNldDEpIHtcbiAgICBpZiAodHlwZW9mIGl0ZW0gPT09IFwib2JqZWN0XCIgJiYgaXRlbSAhPT0gbnVsbCkge1xuICAgICAgaWYgKHNldCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBXaGF0IGlzIFNhZmVTZXQgZnJvbSBwcmltb3JkaWFscz9cbiAgICAgICAgLy8gc2V0ID0gbmV3IFNhZmVTZXQoKTtcbiAgICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgfVxuICAgICAgc2V0LmFkZChpdGVtKTtcbiAgICB9IGVsc2UgaWYgKCFzZXQyLmhhcyhpdGVtKSkge1xuICAgICAgaWYgKHN0cmljdCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBpZiAoIXNldE1pZ2h0SGF2ZUxvb3NlUHJpbShzZXQxLCBzZXQyLCBpdGVtKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXQgPT09IG51bGwpIHtcbiAgICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgfVxuICAgICAgc2V0LmFkZChpdGVtKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc2V0ICE9PSBudWxsKSB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNldDIpIHtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJvYmplY3RcIiAmJiBpdGVtICE9PSBudWxsKSB7XG4gICAgICAgIGlmICghc2V0SGFzRXF1YWxFbGVtZW50KHNldCwgaXRlbSwgc3RyaWN0LCBtZW1vcykpIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFzdHJpY3QgJiZcbiAgICAgICAgIXNldDEuaGFzKGl0ZW0pICYmXG4gICAgICAgICFzZXRIYXNFcXVhbEVsZW1lbnQoc2V0LCBpdGVtLCBzdHJpY3QsIG1lbW9zKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNldC5zaXplID09PSAwO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIFRPRE8oc3RhbmR2cG1udCk6IGFkZCB0eXBlcyBmb3IgYXJndW1lbnRcbmZ1bmN0aW9uIG1hcE1pZ2h0SGF2ZUxvb3NlUHJpbWl0aXZlKFxuICBtYXAxOiBNYXA8dW5rbm93biwgdW5rbm93bj4sXG4gIG1hcDI6IE1hcDx1bmtub3duLCB1bmtub3duPixcbiAgcHJpbWl0aXZlOiBhbnksXG4gIGl0ZW06IGFueSxcbiAgbWVtb3M6IE1lbW8sXG4pOiBib29sZWFuIHtcbiAgY29uc3QgYWx0VmFsdWUgPSBmaW5kTG9vc2VNYXRjaGluZ1ByaW1pdGl2ZXMocHJpbWl0aXZlKTtcbiAgaWYgKGFsdFZhbHVlICE9IG51bGwpIHtcbiAgICByZXR1cm4gYWx0VmFsdWU7XG4gIH1cbiAgY29uc3QgY3VyQiA9IG1hcDIuZ2V0KGFsdFZhbHVlKTtcbiAgaWYgKFxuICAgIChjdXJCID09PSB1bmRlZmluZWQgJiYgIW1hcDIuaGFzKGFsdFZhbHVlKSkgfHxcbiAgICAhaW5uZXJEZWVwRXF1YWwoaXRlbSwgY3VyQiwgZmFsc2UsIG1lbW8pXG4gICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gIW1hcDEuaGFzKGFsdFZhbHVlKSAmJiBpbm5lckRlZXBFcXVhbChpdGVtLCBjdXJCLCBmYWxzZSwgbWVtb3MpO1xufVxuXG5mdW5jdGlvbiBtYXBFcXVpdihtYXAxOiBhbnksIG1hcDI6IGFueSwgc3RyaWN0OiBib29sZWFuLCBtZW1vczogTWVtbyk6IGJvb2xlYW4ge1xuICBsZXQgc2V0ID0gbnVsbDtcblxuICBmb3IgKGNvbnN0IHsgMDoga2V5LCAxOiBpdGVtMSB9IG9mIG1hcDEpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gXCJvYmplY3RcIiAmJiBrZXkgIT09IG51bGwpIHtcbiAgICAgIGlmIChzZXQgPT09IG51bGwpIHtcbiAgICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgfVxuICAgICAgc2V0LmFkZChrZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpdGVtMiA9IG1hcDIuZ2V0KGtleSk7XG4gICAgICBpZiAoXG4gICAgICAgIChcbiAgICAgICAgICAoaXRlbTIgPT09IHVuZGVmaW5lZCAmJiAhbWFwMi5oYXMoa2V5KSkgfHxcbiAgICAgICAgICAhaW5uZXJEZWVwRXF1YWwoaXRlbTEsIGl0ZW0yLCBzdHJpY3QsIG1lbW9zKVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgaWYgKHN0cmljdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIW1hcE1pZ2h0SGF2ZUxvb3NlUHJpbWl0aXZlKG1hcDEsIG1hcDIsIGtleSwgaXRlbTEsIG1lbW9zKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgICB9XG4gICAgICAgIHNldC5hZGQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoc2V0ICE9PSBudWxsKSB7XG4gICAgZm9yIChjb25zdCB7IDA6IGtleSwgMTogaXRlbSB9IG9mIG1hcDIpIHtcbiAgICAgIGlmICh0eXBlb2Yga2V5ID09PSBcIm9iamVjdFwiICYmIGtleSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoIW1hcEhhc0VxdWFsRW50cnkoc2V0LCBtYXAxLCBrZXksIGl0ZW0sIHN0cmljdCwgbWVtb3MpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhc3RyaWN0ICYmICghbWFwMS5oYXMoa2V5KSB8fFxuICAgICAgICAgICFpbm5lckRlZXBFcXVhbChtYXAxLmdldChrZXkpLCBpdGVtLCBmYWxzZSwgbWVtb3MpKSAmJlxuICAgICAgICAhbWFwSGFzRXF1YWxFbnRyeShzZXQsIG1hcDEsIGtleSwgaXRlbSwgZmFsc2UsIG1lbW9zKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNldC5zaXplID09PSAwO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG1hcEhhc0VxdWFsRW50cnkoXG4gIHNldDogYW55LFxuICBtYXA6IGFueSxcbiAga2V5MTogYW55LFxuICBpdGVtMTogYW55LFxuICBzdHJpY3Q6IGJvb2xlYW4sXG4gIG1lbW9zOiBNZW1vLFxuKTogYm9vbGVhbiB7XG4gIGZvciAoY29uc3Qga2V5MiBvZiBzZXQpIHtcbiAgICBpZiAoXG4gICAgICBpbm5lckRlZXBFcXVhbChrZXkxLCBrZXkyLCBzdHJpY3QsIG1lbW9zKSAmJlxuICAgICAgaW5uZXJEZWVwRXF1YWwoaXRlbTEsIG1hcC5nZXQoa2V5MiksIHN0cmljdCwgbWVtb3MpXG4gICAgKSB7XG4gICAgICBzZXQuZGVsZXRlKGtleTIpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsNEVBQTRFO0FBRTVFLHdCQUF3QjtBQUN4QixTQUNFLGdCQUFnQixFQUNoQixpQkFBaUIsRUFDakIsY0FBYyxFQUNkLGVBQWUsRUFDZixnQkFBZ0IsRUFDaEIsTUFBTSxFQUNOLGNBQWMsRUFDZCxjQUFjLEVBQ2QsS0FBSyxFQUNMLGFBQWEsRUFDYixjQUFjLEVBQ2QsUUFBUSxFQUNSLEtBQUssRUFDTCxjQUFjLEVBQ2QsY0FBYyxFQUNkLFlBQVksUUFDUCxhQUFhO0FBRXBCLFNBQVMsTUFBTSxRQUFRLG9CQUFvQjtBQUMzQyxTQUNFLHdCQUF3QixFQUN4QixlQUFlLEVBQ2YsWUFBWSxRQUNQLGlDQUFpQztJQUV4QztVQUFLLFNBQVM7SUFBVCxVQUFBLFVBQ0gsZ0JBQUEsS0FBQTtJQURHLFVBQUEsVUFFSCxhQUFBLEtBQUE7SUFGRyxVQUFBLFVBR0gsV0FBQSxLQUFBO0lBSEcsVUFBQSxVQUlILFdBQUEsS0FBQTtHQUpHLGNBQUE7QUFZTCxJQUFJO0FBRUosT0FBTyxTQUFTLGtCQUFrQixJQUFhLEVBQUUsSUFBYSxFQUFXO0lBQ3ZFLE9BQU8sZUFBZSxNQUFNLE1BQU0sSUFBSTtBQUN4QyxDQUFDO0FB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