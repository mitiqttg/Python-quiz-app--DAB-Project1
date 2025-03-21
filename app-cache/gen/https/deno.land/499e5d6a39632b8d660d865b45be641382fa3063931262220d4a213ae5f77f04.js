// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible. Do not rely on good formatting of values
// for AssertionError messages in browsers.
import { bgGreen, bgRed, bold, gray, green, red, stripColor, white } from "../fmt/colors.ts";
import { diff, diffstr, DiffType } from "./_diff.ts";
const CAN_NOT_DISPLAY = "[Cannot display]";
export class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky
 * @param v Value to be formatted
 */ export function _format(v) {
    // deno-lint-ignore no-explicit-any
    const { Deno  } = globalThis;
    return typeof Deno?.inspect === "function" ? Deno.inspect(v, {
        depth: Infinity,
        sorted: true,
        trailingComma: true,
        compact: false,
        iterableLimit: Infinity
    }) : `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}
/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */ function createColor(diffType, { background =false  } = {}) {
    switch(diffType){
        case DiffType.added:
            return (s)=>background ? bgGreen(white(s)) : green(bold(s));
        case DiffType.removed:
            return (s)=>background ? bgRed(white(s)) : red(bold(s));
        default:
            return white;
    }
}
/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */ function createSign(diffType) {
    switch(diffType){
        case DiffType.added:
            return "+   ";
        case DiffType.removed:
            return "-   ";
        default:
            return "    ";
    }
}
function buildMessage(diffResult, { stringDiff =false  } = {}) {
    const messages = [], diffMessages = [];
    messages.push("");
    messages.push("");
    messages.push(`    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`);
    messages.push("");
    messages.push("");
    diffResult.forEach((result)=>{
        const c = createColor(result.type);
        const line = result.details?.map((detail)=>detail.type !== DiffType.common ? createColor(detail.type, {
                background: true
            })(detail.value) : detail.value).join("") ?? result.value;
        diffMessages.push(c(`${createSign(result.type)}${line}`));
    });
    messages.push(...stringDiff ? [
        diffMessages.join("")
    ] : diffMessages);
    messages.push("");
    return messages;
}
function isKeyedCollection(x) {
    return [
        Symbol.iterator,
        "size"
    ].every((k)=>k in x);
}
/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 */ export function equal(c, d) {
    const seen = new Map();
    return function compare(a, b) {
        // Have to render RegExp & Date for string comparison
        // unless it's mistreated as object
        if (a && b && (a instanceof RegExp && b instanceof RegExp || a instanceof URL && b instanceof URL)) {
            return String(a) === String(b);
        }
        if (a instanceof Date && b instanceof Date) {
            const aTime = a.getTime();
            const bTime = b.getTime();
            // Check for NaN equality manually since NaN is not
            // equal to itself.
            if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
                return true;
            }
            return aTime === bTime;
        }
        if (typeof a === "number" && typeof b === "number") {
            return Number.isNaN(a) && Number.isNaN(b) || a === b;
        }
        if (Object.is(a, b)) {
            return true;
        }
        if (a && typeof a === "object" && b && typeof b === "object") {
            if (a && b && !constructorsEqual(a, b)) {
                return false;
            }
            if (a instanceof WeakMap || b instanceof WeakMap) {
                if (!(a instanceof WeakMap && b instanceof WeakMap)) return false;
                throw new TypeError("cannot compare WeakMap instances");
            }
            if (a instanceof WeakSet || b instanceof WeakSet) {
                if (!(a instanceof WeakSet && b instanceof WeakSet)) return false;
                throw new TypeError("cannot compare WeakSet instances");
            }
            if (seen.get(a) === b) {
                return true;
            }
            if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
                return false;
            }
            if (isKeyedCollection(a) && isKeyedCollection(b)) {
                if (a.size !== b.size) {
                    return false;
                }
                let unmatchedEntries = a.size;
                for (const [aKey, aValue] of a.entries()){
                    for (const [bKey, bValue] of b.entries()){
                        /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */ if (aKey === aValue && bKey === bValue && compare(aKey, bKey) || compare(aKey, bKey) && compare(aValue, bValue)) {
                            unmatchedEntries--;
                        }
                    }
                }
                return unmatchedEntries === 0;
            }
            const merged = {
                ...a,
                ...b
            };
            for (const key of [
                ...Object.getOwnPropertyNames(merged),
                ...Object.getOwnPropertySymbols(merged)
            ]){
                if (!compare(a && a[key], b && b[key])) {
                    return false;
                }
                if (key in a && !(key in b) || key in b && !(key in a)) {
                    return false;
                }
            }
            seen.set(a, b);
            if (a instanceof WeakRef || b instanceof WeakRef) {
                if (!(a instanceof WeakRef && b instanceof WeakRef)) return false;
                return compare(a.deref(), b.deref());
            }
            return true;
        }
        return false;
    }(c, d);
}
// deno-lint-ignore ban-types
function constructorsEqual(a, b) {
    return a.constructor === b.constructor || a.constructor === Object && !b.constructor || !a.constructor && b.constructor === Object;
}
/** Make an assertion, error will be thrown if `expr` does not have truthy value. */ export function assert(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
export function assertEquals(actual, expected, msg) {
    if (equal(actual, expected)) {
        return;
    }
    let message = "";
    const actualString = _format(actual);
    const expectedString = _format(expected);
    try {
        const stringDiff = typeof actual === "string" && typeof expected === "string";
        const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
        const diffMsg = buildMessage(diffResult, {
            stringDiff
        }).join("\n");
        message = `Values are not equal:\n${diffMsg}`;
    } catch  {
        message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
    }
    if (msg) {
        message = msg;
    }
    throw new AssertionError(message);
}
export function assertNotEquals(actual, expected, msg) {
    if (!equal(actual, expected)) {
        return;
    }
    let actualString;
    let expectedString;
    try {
        actualString = String(actual);
    } catch  {
        actualString = "[Cannot display]";
    }
    try {
        expectedString = String(expected);
    } catch  {
        expectedString = "[Cannot display]";
    }
    if (!msg) {
        msg = `actual: ${actualString} expected not to be: ${expectedString}`;
    }
    throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` and `expected` are strictly equal. If
 * not then throw.
 *
 * ```ts
 * import { assertStrictEquals } from "./asserts.ts";
 *
 * assertStrictEquals(1, 2)
 * ```
 */ export function assertStrictEquals(actual, expected, msg) {
    if (actual === expected) {
        return;
    }
    let message;
    if (msg) {
        message = msg;
    } else {
        const actualString = _format(actual);
        const expectedString = _format(expected);
        if (actualString === expectedString) {
            const withOffset = actualString.split("\n").map((l)=>`    ${l}`).join("\n");
            message = `Values have the same structure but are not reference-equal:\n\n${red(withOffset)}\n`;
        } else {
            try {
                const stringDiff = typeof actual === "string" && typeof expected === "string";
                const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
                const diffMsg = buildMessage(diffResult, {
                    stringDiff
                }).join("\n");
                message = `Values are not strictly equal:\n${diffMsg}`;
            } catch  {
                message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
            }
        }
    }
    throw new AssertionError(message);
}
export function assertNotStrictEquals(actual, expected, msg) {
    if (actual !== expected) {
        return;
    }
    throw new AssertionError(msg ?? `Expected "actual" to be strictly unequal to: ${_format(actual)}\n`);
}
/**
 * Make an assertion that `actual` and `expected` are almost equal numbers through
 * a given tolerance. It can be used to take into account IEEE-754 double-precision
 * floating-point representation limitations.
 * If the values are not almost equal then throw.
 *
 * ```ts
 * import { assertAlmostEquals, assertThrows } from "./asserts.ts";
 *
 * assertAlmostEquals(0.1, 0.2);
 *
 * // Using a custom tolerance value
 * assertAlmostEquals(0.1 + 0.2, 0.3, 1e-16);
 * assertThrows(() => assertAlmostEquals(0.1 + 0.2, 0.3, 1e-17));
 * ```
 */ export function assertAlmostEquals(actual, expected, tolerance = 1e-7, msg) {
    if (actual === expected) {
        return;
    }
    const delta = Math.abs(expected - actual);
    if (delta <= tolerance) {
        return;
    }
    const f = (n)=>Number.isInteger(n) ? n : n.toExponential();
    throw new AssertionError(msg ?? `actual: "${f(actual)}" expected to be close to "${f(expected)}": \
delta "${f(delta)}" is greater than "${f(tolerance)}"`);
}
/**
 * Make an assertion that `obj` is an instance of `type`.
 * If not then throw.
 */ export function assertInstanceOf(actual, expectedType, msg = "") {
    if (!msg) {
        const expectedTypeStr = expectedType.name;
        let actualTypeStr = "";
        if (actual === null) {
            actualTypeStr = "null";
        } else if (actual === undefined) {
            actualTypeStr = "undefined";
        } else if (typeof actual === "object") {
            actualTypeStr = actual.constructor?.name ?? "Object";
        } else {
            actualTypeStr = typeof actual;
        }
        if (expectedTypeStr == actualTypeStr) {
            msg = `Expected object to be an instance of "${expectedTypeStr}".`;
        } else if (actualTypeStr == "function") {
            msg = `Expected object to be an instance of "${expectedTypeStr}" but was not an instanced object.`;
        } else {
            msg = `Expected object to be an instance of "${expectedTypeStr}" but was "${actualTypeStr}".`;
        }
    }
    assert(actual instanceof expectedType, msg);
}
/**
 * Make an assertion that actual is not null or undefined.
 * If not then throw.
 */ export function assertExists(actual, msg) {
    if (actual === undefined || actual === null) {
        if (!msg) {
            msg = `actual: "${actual}" expected to not be null or undefined`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that actual includes expected. If not
 * then throw.
 */ export function assertStringIncludes(actual, expected, msg) {
    if (!actual.includes(expected)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to contain: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
export function assertArrayIncludes(actual, expected, msg) {
    const missing = [];
    for(let i = 0; i < expected.length; i++){
        let found = false;
        for(let j = 0; j < actual.length; j++){
            if (equal(expected[i], actual[j])) {
                found = true;
                break;
            }
        }
        if (!found) {
            missing.push(expected[i]);
        }
    }
    if (missing.length === 0) {
        return;
    }
    if (!msg) {
        msg = `actual: "${_format(actual)}" expected to include: "${_format(expected)}"\nmissing: ${_format(missing)}`;
    }
    throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then throw.
 */ export function assertMatch(actual, expected, msg) {
    if (!expected.test(actual)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to match: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that `actual` not match RegExp `expected`. If match
 * then throw.
 */ export function assertNotMatch(actual, expected, msg) {
    if (expected.test(actual)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to not match: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that `actual` object is a subset of `expected` object, deeply.
 * If not, then throw.
 */ export function assertObjectMatch(// deno-lint-ignore no-explicit-any
actual, expected) {
    function filter(a, b) {
        const seen = new WeakMap();
        return fn(a, b);
        function fn(a, b) {
            // Prevent infinite loop with circular references with same filter
            if (seen.has(a) && seen.get(a) === b) {
                return a;
            }
            seen.set(a, b);
            // Filter keys and symbols which are present in both actual and expected
            const filtered = {};
            const entries = [
                ...Object.getOwnPropertyNames(a),
                ...Object.getOwnPropertySymbols(a)
            ].filter((key)=>key in b).map((key)=>[
                    key,
                    a[key]
                ]);
            for (const [key, value] of entries){
                // On array references, build a filtered array and filter nested objects inside
                if (Array.isArray(value)) {
                    const subset = b[key];
                    if (Array.isArray(subset)) {
                        filtered[key] = fn({
                            ...value
                        }, {
                            ...subset
                        });
                        continue;
                    }
                } else if (value instanceof RegExp) {
                    filtered[key] = value;
                    continue;
                } else if (typeof value === "object") {
                    const subset = b[key];
                    if (typeof subset === "object" && subset) {
                        // When both operands are maps, build a filtered map with common keys and filter nested objects inside
                        if (value instanceof Map && subset instanceof Map) {
                            filtered[key] = new Map([
                                ...value
                            ].filter(([k])=>subset.has(k)).map(([k, v])=>[
                                    k,
                                    typeof v === "object" ? fn(v, subset.get(k)) : v
                                ]));
                            continue;
                        }
                        // When both operands are set, build a filtered set with common values
                        if (value instanceof Set && subset instanceof Set) {
                            filtered[key] = new Set([
                                ...value
                            ].filter((v)=>subset.has(v)));
                            continue;
                        }
                        filtered[key] = fn(value, subset);
                        continue;
                    }
                }
                filtered[key] = value;
            }
            return filtered;
        }
    }
    return assertEquals(// get the intersection of "actual" and "expected"
    // side effect: all the instances' constructor field is "Object" now.
    filter(actual, expected), // set (nested) instances' constructor field to be "Object" without changing expected value.
    // see https://github.com/denoland/deno_std/pull/1419
    filter(expected, expected));
}
/**
 * Forcefully throws a failed assertion
 */ export function fail(msg) {
    assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}
/**
 * Make an assertion that `error` is an `Error`.
 * If not then an error will be thrown.
 * An error class and a string that should be included in the
 * error message can also be asserted.
 */ export function assertIsError(error, // deno-lint-ignore no-explicit-any
ErrorClass, msgIncludes, msg) {
    if (error instanceof Error === false) {
        throw new AssertionError(`Expected "error" to be an Error object.`);
    }
    if (ErrorClass && !(error instanceof ErrorClass)) {
        msg = `Expected error to be instance of "${ErrorClass.name}", but was "${typeof error === "object" ? error?.constructor?.name : "[not an object]"}"${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
    if (msgIncludes && (!(error instanceof Error) || !stripColor(error.message).includes(stripColor(msgIncludes)))) {
        msg = `Expected error message to include "${msgIncludes}", but got "${error instanceof Error ? error.message : "[not an Error]"}"${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
}
export function assertThrows(fn, errorClassOrCallback, msgIncludesOrMsg, msg) {
    // deno-lint-ignore no-explicit-any
    let ErrorClass = undefined;
    let msgIncludes = undefined;
    let errorCallback;
    if (errorClassOrCallback == null || errorClassOrCallback.prototype instanceof Error || errorClassOrCallback.prototype === Error.prototype) {
        // deno-lint-ignore no-explicit-any
        ErrorClass = errorClassOrCallback;
        msgIncludes = msgIncludesOrMsg;
        errorCallback = null;
    } else {
        errorCallback = errorClassOrCallback;
        msg = msgIncludesOrMsg;
    }
    let doesThrow = false;
    try {
        fn();
    } catch (error) {
        if (error instanceof Error === false) {
            throw new AssertionError("A non-Error object was thrown.");
        }
        assertIsError(error, ErrorClass, msgIncludes, msg);
        if (typeof errorCallback == "function") {
            errorCallback(error);
        }
        doesThrow = true;
    }
    if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
}
export async function assertRejects(fn, errorClassOrCallback, msgIncludesOrMsg, msg) {
    // deno-lint-ignore no-explicit-any
    let ErrorClass = undefined;
    let msgIncludes = undefined;
    let errorCallback;
    if (errorClassOrCallback == null || errorClassOrCallback.prototype instanceof Error || errorClassOrCallback.prototype === Error.prototype) {
        // deno-lint-ignore no-explicit-any
        ErrorClass = errorClassOrCallback;
        msgIncludes = msgIncludesOrMsg;
        errorCallback = null;
    } else {
        errorCallback = errorClassOrCallback;
        msg = msgIncludesOrMsg;
    }
    let doesThrow = false;
    try {
        await fn();
    } catch (error) {
        if (error instanceof Error === false) {
            throw new AssertionError("A non-Error object was thrown or rejected.");
        }
        assertIsError(error, ErrorClass, msgIncludes, msg);
        if (typeof errorCallback == "function") {
            errorCallback(error);
        }
        doesThrow = true;
    }
    if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
}
/** Use this to stub out methods that will throw when invoked. */ export function unimplemented(msg) {
    throw new AssertionError(msg || "unimplemented");
}
/** Use this to assert unreachable code. */ export function unreachable() {
    throw new AssertionError("unreachable");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL3Rlc3RpbmcvYXNzZXJ0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLiBEbyBub3QgcmVseSBvbiBnb29kIGZvcm1hdHRpbmcgb2YgdmFsdWVzXG4vLyBmb3IgQXNzZXJ0aW9uRXJyb3IgbWVzc2FnZXMgaW4gYnJvd3NlcnMuXG5cbmltcG9ydCB7XG4gIGJnR3JlZW4sXG4gIGJnUmVkLFxuICBib2xkLFxuICBncmF5LFxuICBncmVlbixcbiAgcmVkLFxuICBzdHJpcENvbG9yLFxuICB3aGl0ZSxcbn0gZnJvbSBcIi4uL2ZtdC9jb2xvcnMudHNcIjtcbmltcG9ydCB7IGRpZmYsIERpZmZSZXN1bHQsIGRpZmZzdHIsIERpZmZUeXBlIH0gZnJvbSBcIi4vX2RpZmYudHNcIjtcblxuY29uc3QgQ0FOX05PVF9ESVNQTEFZID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG5cbmV4cG9ydCBjbGFzcyBBc3NlcnRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgb3ZlcnJpZGUgbmFtZSA9IFwiQXNzZXJ0aW9uRXJyb3JcIjtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgaW5wdXQgaW50byBhIHN0cmluZy4gT2JqZWN0cywgU2V0cyBhbmQgTWFwcyBhcmUgc29ydGVkIHNvIGFzIHRvXG4gKiBtYWtlIHRlc3RzIGxlc3MgZmxha3lcbiAqIEBwYXJhbSB2IFZhbHVlIHRvIGJlIGZvcm1hdHRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gX2Zvcm1hdCh2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbiAgcmV0dXJuIHR5cGVvZiBEZW5vPy5pbnNwZWN0ID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IERlbm8uaW5zcGVjdCh2LCB7XG4gICAgICBkZXB0aDogSW5maW5pdHksXG4gICAgICBzb3J0ZWQ6IHRydWUsXG4gICAgICB0cmFpbGluZ0NvbW1hOiB0cnVlLFxuICAgICAgY29tcGFjdDogZmFsc2UsXG4gICAgICBpdGVyYWJsZUxpbWl0OiBJbmZpbml0eSxcbiAgICB9KVxuICAgIDogYFwiJHtTdHJpbmcodikucmVwbGFjZSgvKD89W1wiXFxcXF0pL2csIFwiXFxcXFwiKX1cImA7XG59XG5cbi8qKlxuICogQ29sb3JzIHRoZSBvdXRwdXQgb2YgYXNzZXJ0aW9uIGRpZmZzXG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVDb2xvcihcbiAgZGlmZlR5cGU6IERpZmZUeXBlLFxuICB7IGJhY2tncm91bmQgPSBmYWxzZSB9ID0ge30sXG4pOiAoczogc3RyaW5nKSA9PiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBEaWZmVHlwZS5hZGRlZDpcbiAgICAgIHJldHVybiAoczogc3RyaW5nKTogc3RyaW5nID0+XG4gICAgICAgIGJhY2tncm91bmQgPyBiZ0dyZWVuKHdoaXRlKHMpKSA6IGdyZWVuKGJvbGQocykpO1xuICAgIGNhc2UgRGlmZlR5cGUucmVtb3ZlZDpcbiAgICAgIHJldHVybiAoczogc3RyaW5nKTogc3RyaW5nID0+IGJhY2tncm91bmQgPyBiZ1JlZCh3aGl0ZShzKSkgOiByZWQoYm9sZChzKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB3aGl0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFByZWZpeGVzIGArYCBvciBgLWAgaW4gZGlmZiBvdXRwdXRcbiAqIEBwYXJhbSBkaWZmVHlwZSBEaWZmZXJlbmNlIHR5cGUsIGVpdGhlciBhZGRlZCBvciByZW1vdmVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNpZ24oZGlmZlR5cGU6IERpZmZUeXBlKTogc3RyaW5nIHtcbiAgc3dpdGNoIChkaWZmVHlwZSkge1xuICAgIGNhc2UgRGlmZlR5cGUuYWRkZWQ6XG4gICAgICByZXR1cm4gXCIrICAgXCI7XG4gICAgY2FzZSBEaWZmVHlwZS5yZW1vdmVkOlxuICAgICAgcmV0dXJuIFwiLSAgIFwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCIgICAgXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKFxuICBkaWZmUmVzdWx0OiBSZWFkb25seUFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj4sXG4gIHsgc3RyaW5nRGlmZiA9IGZhbHNlIH0gPSB7fSxcbik6IHN0cmluZ1tdIHtcbiAgY29uc3QgbWVzc2FnZXM6IHN0cmluZ1tdID0gW10sIGRpZmZNZXNzYWdlczogc3RyaW5nW10gPSBbXTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcbiAgICBgICAgICR7Z3JheShib2xkKFwiW0RpZmZdXCIpKX0gJHtyZWQoYm9sZChcIkFjdHVhbFwiKSl9IC8gJHtcbiAgICAgIGdyZWVuKGJvbGQoXCJFeHBlY3RlZFwiKSlcbiAgICB9YCxcbiAgKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgZGlmZlJlc3VsdC5mb3JFYWNoKChyZXN1bHQ6IERpZmZSZXN1bHQ8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGMgPSBjcmVhdGVDb2xvcihyZXN1bHQudHlwZSk7XG4gICAgY29uc3QgbGluZSA9IHJlc3VsdC5kZXRhaWxzPy5tYXAoKGRldGFpbCkgPT5cbiAgICAgIGRldGFpbC50eXBlICE9PSBEaWZmVHlwZS5jb21tb25cbiAgICAgICAgPyBjcmVhdGVDb2xvcihkZXRhaWwudHlwZSwgeyBiYWNrZ3JvdW5kOiB0cnVlIH0pKGRldGFpbC52YWx1ZSlcbiAgICAgICAgOiBkZXRhaWwudmFsdWVcbiAgICApLmpvaW4oXCJcIikgPz8gcmVzdWx0LnZhbHVlO1xuICAgIGRpZmZNZXNzYWdlcy5wdXNoKGMoYCR7Y3JlYXRlU2lnbihyZXN1bHQudHlwZSl9JHtsaW5lfWApKTtcbiAgfSk7XG4gIG1lc3NhZ2VzLnB1c2goLi4uKHN0cmluZ0RpZmYgPyBbZGlmZk1lc3NhZ2VzLmpvaW4oXCJcIildIDogZGlmZk1lc3NhZ2VzKSk7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG5cbiAgcmV0dXJuIG1lc3NhZ2VzO1xufVxuXG5mdW5jdGlvbiBpc0tleWVkQ29sbGVjdGlvbih4OiB1bmtub3duKTogeCBpcyBTZXQ8dW5rbm93bj4ge1xuICByZXR1cm4gW1N5bWJvbC5pdGVyYXRvciwgXCJzaXplXCJdLmV2ZXJ5KChrKSA9PiBrIGluICh4IGFzIFNldDx1bmtub3duPikpO1xufVxuXG4vKipcbiAqIERlZXAgZXF1YWxpdHkgY29tcGFyaXNvbiB1c2VkIGluIGFzc2VydGlvbnNcbiAqIEBwYXJhbSBjIGFjdHVhbCB2YWx1ZVxuICogQHBhcmFtIGQgZXhwZWN0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsKGM6IHVua25vd24sIGQ6IHVua25vd24pOiBib29sZWFuIHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBNYXAoKTtcbiAgcmV0dXJuIChmdW5jdGlvbiBjb21wYXJlKGE6IHVua25vd24sIGI6IHVua25vd24pOiBib29sZWFuIHtcbiAgICAvLyBIYXZlIHRvIHJlbmRlciBSZWdFeHAgJiBEYXRlIGZvciBzdHJpbmcgY29tcGFyaXNvblxuICAgIC8vIHVubGVzcyBpdCdzIG1pc3RyZWF0ZWQgYXMgb2JqZWN0XG4gICAgaWYgKFxuICAgICAgYSAmJlxuICAgICAgYiAmJlxuICAgICAgKChhIGluc3RhbmNlb2YgUmVnRXhwICYmIGIgaW5zdGFuY2VvZiBSZWdFeHApIHx8XG4gICAgICAgIChhIGluc3RhbmNlb2YgVVJMICYmIGIgaW5zdGFuY2VvZiBVUkwpKVxuICAgICkge1xuICAgICAgcmV0dXJuIFN0cmluZyhhKSA9PT0gU3RyaW5nKGIpO1xuICAgIH1cbiAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIGNvbnN0IGFUaW1lID0gYS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBiVGltZSA9IGIuZ2V0VGltZSgpO1xuICAgICAgLy8gQ2hlY2sgZm9yIE5hTiBlcXVhbGl0eSBtYW51YWxseSBzaW5jZSBOYU4gaXMgbm90XG4gICAgICAvLyBlcXVhbCB0byBpdHNlbGYuXG4gICAgICBpZiAoTnVtYmVyLmlzTmFOKGFUaW1lKSAmJiBOdW1iZXIuaXNOYU4oYlRpbWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFUaW1lID09PSBiVGltZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBiID09PSBcIm51bWJlclwiKSB7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKGEpICYmIE51bWJlci5pc05hTihiKSB8fCBhID09PSBiO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmlzKGEsIGIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGEgJiYgdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiYgYiAmJiB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKGEgJiYgYiAmJiAhY29uc3RydWN0b3JzRXF1YWwoYSwgYikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGEgaW5zdGFuY2VvZiBXZWFrTWFwIHx8IGIgaW5zdGFuY2VvZiBXZWFrTWFwKSB7XG4gICAgICAgIGlmICghKGEgaW5zdGFuY2VvZiBXZWFrTWFwICYmIGIgaW5zdGFuY2VvZiBXZWFrTWFwKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2Fubm90IGNvbXBhcmUgV2Vha01hcCBpbnN0YW5jZXNcIik7XG4gICAgICB9XG4gICAgICBpZiAoYSBpbnN0YW5jZW9mIFdlYWtTZXQgfHwgYiBpbnN0YW5jZW9mIFdlYWtTZXQpIHtcbiAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIFdlYWtTZXQgJiYgYiBpbnN0YW5jZW9mIFdlYWtTZXQpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgY29tcGFyZSBXZWFrU2V0IGluc3RhbmNlc1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWVuLmdldChhKSA9PT0gYikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChPYmplY3Qua2V5cyhhIHx8IHt9KS5sZW5ndGggIT09IE9iamVjdC5rZXlzKGIgfHwge30pLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoaXNLZXllZENvbGxlY3Rpb24oYSkgJiYgaXNLZXllZENvbGxlY3Rpb24oYikpIHtcbiAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHVubWF0Y2hlZEVudHJpZXMgPSBhLnNpemU7XG5cbiAgICAgICAgZm9yIChjb25zdCBbYUtleSwgYVZhbHVlXSBvZiBhLmVudHJpZXMoKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgW2JLZXksIGJWYWx1ZV0gb2YgYi5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIC8qIEdpdmVuIHRoYXQgTWFwIGtleXMgY2FuIGJlIHJlZmVyZW5jZXMsIHdlIG5lZWRcbiAgICAgICAgICAgICAqIHRvIGVuc3VyZSB0aGF0IHRoZXkgYXJlIGFsc28gZGVlcGx5IGVxdWFsICovXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChhS2V5ID09PSBhVmFsdWUgJiYgYktleSA9PT0gYlZhbHVlICYmIGNvbXBhcmUoYUtleSwgYktleSkpIHx8XG4gICAgICAgICAgICAgIChjb21wYXJlKGFLZXksIGJLZXkpICYmIGNvbXBhcmUoYVZhbHVlLCBiVmFsdWUpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHVubWF0Y2hlZEVudHJpZXMtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5tYXRjaGVkRW50cmllcyA9PT0gMDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lcmdlZCA9IHsgLi4uYSwgLi4uYiB9O1xuICAgICAgZm9yIChcbiAgICAgICAgY29uc3Qga2V5IG9mIFtcbiAgICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtZXJnZWQpLFxuICAgICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobWVyZ2VkKSxcbiAgICAgICAgXVxuICAgICAgKSB7XG4gICAgICAgIHR5cGUgS2V5ID0ga2V5b2YgdHlwZW9mIG1lcmdlZDtcbiAgICAgICAgaWYgKCFjb21wYXJlKGEgJiYgYVtrZXkgYXMgS2V5XSwgYiAmJiBiW2tleSBhcyBLZXldKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKChrZXkgaW4gYSkgJiYgKCEoa2V5IGluIGIpKSkgfHwgKChrZXkgaW4gYikgJiYgKCEoa2V5IGluIGEpKSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNlZW4uc2V0KGEsIGIpO1xuICAgICAgaWYgKGEgaW5zdGFuY2VvZiBXZWFrUmVmIHx8IGIgaW5zdGFuY2VvZiBXZWFrUmVmKSB7XG4gICAgICAgIGlmICghKGEgaW5zdGFuY2VvZiBXZWFrUmVmICYmIGIgaW5zdGFuY2VvZiBXZWFrUmVmKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gY29tcGFyZShhLmRlcmVmKCksIGIuZGVyZWYoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KShjLCBkKTtcbn1cblxuLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbmZ1bmN0aW9uIGNvbnN0cnVjdG9yc0VxdWFsKGE6IG9iamVjdCwgYjogb2JqZWN0KSB7XG4gIHJldHVybiBhLmNvbnN0cnVjdG9yID09PSBiLmNvbnN0cnVjdG9yIHx8XG4gICAgYS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0ICYmICFiLmNvbnN0cnVjdG9yIHx8XG4gICAgIWEuY29uc3RydWN0b3IgJiYgYi5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0O1xufVxuXG4vKiogTWFrZSBhbiBhc3NlcnRpb24sIGVycm9yIHdpbGwgYmUgdGhyb3duIGlmIGBleHByYCBkb2VzIG5vdCBoYXZlIHRydXRoeSB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnQoZXhwcjogdW5rbm93biwgbXNnID0gXCJcIik6IGFzc2VydHMgZXhwciB7XG4gIGlmICghZXhwcikge1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgZXF1YWwsIGRlZXBseS4gSWYgbm90XG4gKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICogRm9yIGV4YW1wbGU6XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIi4vYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEVxdWFsczxudW1iZXI+KDEsIDIpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHM8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnPzogc3RyaW5nKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoZXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBfZm9ybWF0KGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gX2Zvcm1hdChleHBlY3RlZCk7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RyaW5nRGlmZiA9ICh0eXBlb2YgYWN0dWFsID09PSBcInN0cmluZ1wiKSAmJlxuICAgICAgKHR5cGVvZiBleHBlY3RlZCA9PT0gXCJzdHJpbmdcIik7XG4gICAgY29uc3QgZGlmZlJlc3VsdCA9IHN0cmluZ0RpZmZcbiAgICAgID8gZGlmZnN0cihhY3R1YWwgYXMgc3RyaW5nLCBleHBlY3RlZCBhcyBzdHJpbmcpXG4gICAgICA6IGRpZmYoYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLCBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSk7XG4gICAgY29uc3QgZGlmZk1zZyA9IGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0LCB7IHN0cmluZ0RpZmYgfSkuam9pbihcIlxcblwiKTtcbiAgICBtZXNzYWdlID0gYFZhbHVlcyBhcmUgbm90IGVxdWFsOlxcbiR7ZGlmZk1zZ31gO1xuICB9IGNhdGNoIHtcbiAgICBtZXNzYWdlID0gYFxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgfVxuICBpZiAobXNnKSB7XG4gICAgbWVzc2FnZSA9IG1zZztcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IGVxdWFsLCBkZWVwbHkuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnROb3RFcXVhbHMgfSBmcm9tIFwiLi9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0Tm90RXF1YWxzPG51bWJlcj4oMSwgMilcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFsczxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmICghZXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGFjdHVhbFN0cmluZzogc3RyaW5nO1xuICBsZXQgZXhwZWN0ZWRTdHJpbmc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICBhY3R1YWxTdHJpbmcgPSBTdHJpbmcoYWN0dWFsKTtcbiAgfSBjYXRjaCB7XG4gICAgYWN0dWFsU3RyaW5nID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG4gIH1cbiAgdHJ5IHtcbiAgICBleHBlY3RlZFN0cmluZyA9IFN0cmluZyhleHBlY3RlZCk7XG4gIH0gY2F0Y2gge1xuICAgIGV4cGVjdGVkU3RyaW5nID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG4gIH1cbiAgaWYgKCFtc2cpIHtcbiAgICBtc2cgPSBgYWN0dWFsOiAke2FjdHVhbFN0cmluZ30gZXhwZWN0ZWQgbm90IHRvIGJlOiAke2V4cGVjdGVkU3RyaW5nfWA7XG4gIH1cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgc3RyaWN0bHkgZXF1YWwuIElmXG4gKiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0U3RyaWN0RXF1YWxzIH0gZnJvbSBcIi4vYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydFN0cmljdEVxdWFscygxLCAyKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHM8VD4oXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBtZXNzYWdlOiBzdHJpbmc7XG5cbiAgaWYgKG1zZykge1xuICAgIG1lc3NhZ2UgPSBtc2c7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgYWN0dWFsU3RyaW5nID0gX2Zvcm1hdChhY3R1YWwpO1xuICAgIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gX2Zvcm1hdChleHBlY3RlZCk7XG5cbiAgICBpZiAoYWN0dWFsU3RyaW5nID09PSBleHBlY3RlZFN0cmluZykge1xuICAgICAgY29uc3Qgd2l0aE9mZnNldCA9IGFjdHVhbFN0cmluZ1xuICAgICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgICAgLm1hcCgobCkgPT4gYCAgICAke2x9YClcbiAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICBtZXNzYWdlID1cbiAgICAgICAgYFZhbHVlcyBoYXZlIHRoZSBzYW1lIHN0cnVjdHVyZSBidXQgYXJlIG5vdCByZWZlcmVuY2UtZXF1YWw6XFxuXFxuJHtcbiAgICAgICAgICByZWQod2l0aE9mZnNldClcbiAgICAgICAgfVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmluZ0RpZmYgPSAodHlwZW9mIGFjdHVhbCA9PT0gXCJzdHJpbmdcIikgJiZcbiAgICAgICAgICAodHlwZW9mIGV4cGVjdGVkID09PSBcInN0cmluZ1wiKTtcbiAgICAgICAgY29uc3QgZGlmZlJlc3VsdCA9IHN0cmluZ0RpZmZcbiAgICAgICAgICA/IGRpZmZzdHIoYWN0dWFsIGFzIHN0cmluZywgZXhwZWN0ZWQgYXMgc3RyaW5nKVxuICAgICAgICAgIDogZGlmZihhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpKTtcbiAgICAgICAgY29uc3QgZGlmZk1zZyA9IGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0LCB7IHN0cmluZ0RpZmYgfSkuam9pbihcIlxcblwiKTtcbiAgICAgICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBzdHJpY3RseSBlcXVhbDpcXG4ke2RpZmZNc2d9YDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBtZXNzYWdlID0gYFxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IHN0cmljdGx5IGVxdWFsLlxuICogSWYgdGhlIHZhbHVlcyBhcmUgc3RyaWN0bHkgZXF1YWwgdGhlbiB0aHJvdy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIH0gZnJvbSBcIi4vYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygxLCAxKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgIG1zZyA/PyBgRXhwZWN0ZWQgXCJhY3R1YWxcIiB0byBiZSBzdHJpY3RseSB1bmVxdWFsIHRvOiAke19mb3JtYXQoYWN0dWFsKX1cXG5gLFxuICApO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGFsbW9zdCBlcXVhbCBudW1iZXJzIHRocm91Z2hcbiAqIGEgZ2l2ZW4gdG9sZXJhbmNlLiBJdCBjYW4gYmUgdXNlZCB0byB0YWtlIGludG8gYWNjb3VudCBJRUVFLTc1NCBkb3VibGUtcHJlY2lzaW9uXG4gKiBmbG9hdGluZy1wb2ludCByZXByZXNlbnRhdGlvbiBsaW1pdGF0aW9ucy5cbiAqIElmIHRoZSB2YWx1ZXMgYXJlIG5vdCBhbG1vc3QgZXF1YWwgdGhlbiB0aHJvdy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0QWxtb3N0RXF1YWxzLCBhc3NlcnRUaHJvd3MgfSBmcm9tIFwiLi9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0QWxtb3N0RXF1YWxzKDAuMSwgMC4yKTtcbiAqXG4gKiAvLyBVc2luZyBhIGN1c3RvbSB0b2xlcmFuY2UgdmFsdWVcbiAqIGFzc2VydEFsbW9zdEVxdWFscygwLjEgKyAwLjIsIDAuMywgMWUtMTYpO1xuICogYXNzZXJ0VGhyb3dzKCgpID0+IGFzc2VydEFsbW9zdEVxdWFscygwLjEgKyAwLjIsIDAuMywgMWUtMTcpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QWxtb3N0RXF1YWxzKFxuICBhY3R1YWw6IG51bWJlcixcbiAgZXhwZWN0ZWQ6IG51bWJlcixcbiAgdG9sZXJhbmNlID0gMWUtNyxcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGRlbHRhID0gTWF0aC5hYnMoZXhwZWN0ZWQgLSBhY3R1YWwpO1xuICBpZiAoZGVsdGEgPD0gdG9sZXJhbmNlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGYgPSAobjogbnVtYmVyKSA9PiBOdW1iZXIuaXNJbnRlZ2VyKG4pID8gbiA6IG4udG9FeHBvbmVudGlhbCgpO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgbXNnID8/XG4gICAgICBgYWN0dWFsOiBcIiR7ZihhY3R1YWwpfVwiIGV4cGVjdGVkIHRvIGJlIGNsb3NlIHRvIFwiJHtmKGV4cGVjdGVkKX1cIjogXFxcbmRlbHRhIFwiJHtmKGRlbHRhKX1cIiBpcyBncmVhdGVyIHRoYW4gXCIke2YodG9sZXJhbmNlKX1cImAsXG4gICk7XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG50eXBlIEFueUNvbnN0cnVjdG9yID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55O1xudHlwZSBHZXRDb25zdHJ1Y3RvclR5cGU8VCBleHRlbmRzIEFueUNvbnN0cnVjdG9yPiA9IFQgZXh0ZW5kcyAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxubmV3ICguLi5hcmdzOiBhbnkpID0+IGluZmVyIEMgPyBDXG4gIDogbmV2ZXI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBhbiBpbnN0YW5jZSBvZiBgdHlwZWAuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEluc3RhbmNlT2Y8VCBleHRlbmRzIEFueUNvbnN0cnVjdG9yPihcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZFR5cGU6IFQsXG4gIG1zZyA9IFwiXCIsXG4pOiBhc3NlcnRzIGFjdHVhbCBpcyBHZXRDb25zdHJ1Y3RvclR5cGU8VD4ge1xuICBpZiAoIW1zZykge1xuICAgIGNvbnN0IGV4cGVjdGVkVHlwZVN0ciA9IGV4cGVjdGVkVHlwZS5uYW1lO1xuXG4gICAgbGV0IGFjdHVhbFR5cGVTdHIgPSBcIlwiO1xuICAgIGlmIChhY3R1YWwgPT09IG51bGwpIHtcbiAgICAgIGFjdHVhbFR5cGVTdHIgPSBcIm51bGxcIjtcbiAgICB9IGVsc2UgaWYgKGFjdHVhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhY3R1YWxUeXBlU3RyID0gXCJ1bmRlZmluZWRcIjtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIGFjdHVhbFR5cGVTdHIgPSBhY3R1YWwuY29uc3RydWN0b3I/Lm5hbWUgPz8gXCJPYmplY3RcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgYWN0dWFsVHlwZVN0ciA9IHR5cGVvZiBhY3R1YWw7XG4gICAgfVxuXG4gICAgaWYgKGV4cGVjdGVkVHlwZVN0ciA9PSBhY3R1YWxUeXBlU3RyKSB7XG4gICAgICBtc2cgPSBgRXhwZWN0ZWQgb2JqZWN0IHRvIGJlIGFuIGluc3RhbmNlIG9mIFwiJHtleHBlY3RlZFR5cGVTdHJ9XCIuYDtcbiAgICB9IGVsc2UgaWYgKGFjdHVhbFR5cGVTdHIgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgRXhwZWN0ZWQgb2JqZWN0IHRvIGJlIGFuIGluc3RhbmNlIG9mIFwiJHtleHBlY3RlZFR5cGVTdHJ9XCIgYnV0IHdhcyBub3QgYW4gaW5zdGFuY2VkIG9iamVjdC5gO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgRXhwZWN0ZWQgb2JqZWN0IHRvIGJlIGFuIGluc3RhbmNlIG9mIFwiJHtleHBlY3RlZFR5cGVTdHJ9XCIgYnV0IHdhcyBcIiR7YWN0dWFsVHlwZVN0cn1cIi5gO1xuICAgIH1cbiAgfVxuICBhc3NlcnQoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWRUeXBlLCBtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXhpc3RzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgYWN0dWFsIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgaWYgKGFjdHVhbCA9PT0gdW5kZWZpbmVkIHx8IGFjdHVhbCA9PT0gbnVsbCkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZGA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBhY3R1YWwgaW5jbHVkZXMgZXhwZWN0ZWQuIElmIG5vdFxuICogdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmluZ0luY2x1ZGVzKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmICghYWN0dWFsLmluY2x1ZGVzKGV4cGVjdGVkKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIGNvbnRhaW46IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBpbmNsdWRlcyB0aGUgYGV4cGVjdGVkYCB2YWx1ZXMuXG4gKiBJZiBub3QgdGhlbiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0QXJyYXlJbmNsdWRlcyB9IGZyb20gXCIuL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRBcnJheUluY2x1ZGVzPG51bWJlcj4oWzEsIDJdLCBbMl0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXMoXG4gIGFjdHVhbDogQXJyYXlMaWtlPHVua25vd24+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXM8VD4oXG4gIGFjdHVhbDogQXJyYXlMaWtlPFQ+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPFQ+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXMoXG4gIGFjdHVhbDogQXJyYXlMaWtlPHVua25vd24+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgbWlzc2luZzogdW5rbm93bltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFjdHVhbC5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGVxdWFsKGV4cGVjdGVkW2ldLCBhY3R1YWxbal0pKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIG1pc3NpbmcucHVzaChleHBlY3RlZFtpXSk7XG4gICAgfVxuICB9XG4gIGlmIChtaXNzaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIW1zZykge1xuICAgIG1zZyA9IGBhY3R1YWw6IFwiJHtfZm9ybWF0KGFjdHVhbCl9XCIgZXhwZWN0ZWQgdG8gaW5jbHVkZTogXCIke1xuICAgICAgX2Zvcm1hdChleHBlY3RlZClcbiAgICB9XCJcXG5taXNzaW5nOiAke19mb3JtYXQobWlzc2luZyl9YDtcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBub3RcbiAqIHRoZW4gdGhyb3cuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoIWV4cGVjdGVkLnRlc3QoYWN0dWFsKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG1hdGNoOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbm90IG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBtYXRjaFxuICogdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdE1hdGNoKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IFJlZ0V4cCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChleHBlY3RlZC50ZXN0KGFjdHVhbCkpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID0gYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBub3QgbWF0Y2g6IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBvYmplY3QgaXMgYSBzdWJzZXQgb2YgYGV4cGVjdGVkYCBvYmplY3QsIGRlZXBseS5cbiAqIElmIG5vdCwgdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE9iamVjdE1hdGNoKFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBhY3R1YWw6IFJlY29yZDxQcm9wZXJ0eUtleSwgYW55PixcbiAgZXhwZWN0ZWQ6IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4sXG4pOiB2b2lkIHtcbiAgdHlwZSBsb29zZSA9IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj47XG5cbiAgZnVuY3Rpb24gZmlsdGVyKGE6IGxvb3NlLCBiOiBsb29zZSkge1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgV2Vha01hcCgpO1xuICAgIHJldHVybiBmbihhLCBiKTtcblxuICAgIGZ1bmN0aW9uIGZuKGE6IGxvb3NlLCBiOiBsb29zZSk6IGxvb3NlIHtcbiAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCB3aXRoIGNpcmN1bGFyIHJlZmVyZW5jZXMgd2l0aCBzYW1lIGZpbHRlclxuICAgICAgaWYgKChzZWVuLmhhcyhhKSkgJiYgKHNlZW4uZ2V0KGEpID09PSBiKSkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICAgIH1cbiAgICAgIHNlZW4uc2V0KGEsIGIpO1xuICAgICAgLy8gRmlsdGVyIGtleXMgYW5kIHN5bWJvbHMgd2hpY2ggYXJlIHByZXNlbnQgaW4gYm90aCBhY3R1YWwgYW5kIGV4cGVjdGVkXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IHt9IGFzIGxvb3NlO1xuICAgICAgY29uc3QgZW50cmllcyA9IFtcbiAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYSksXG4gICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoYSksXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoKGtleSkgPT4ga2V5IGluIGIpXG4gICAgICAgIC5tYXAoKGtleSkgPT4gW2tleSwgYVtrZXkgYXMgc3RyaW5nXV0pIGFzIEFycmF5PFtzdHJpbmcsIHVua25vd25dPjtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGVudHJpZXMpIHtcbiAgICAgICAgLy8gT24gYXJyYXkgcmVmZXJlbmNlcywgYnVpbGQgYSBmaWx0ZXJlZCBhcnJheSBhbmQgZmlsdGVyIG5lc3RlZCBvYmplY3RzIGluc2lkZVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBzdWJzZXQgPSAoYiBhcyBsb29zZSlba2V5XTtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdWJzZXQpKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFtrZXldID0gZm4oeyAuLi52YWx1ZSB9LCB7IC4uLnN1YnNldCB9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSAvLyBPbiByZWdleHAgcmVmZXJlbmNlcywga2VlcCB2YWx1ZSBhcyBpdCB0byBhdm9pZCBsb29zaW5nIHBhdHRlcm4gYW5kIGZsYWdzXG4gICAgICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgZmlsdGVyZWRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIE9uIG5lc3RlZCBvYmplY3RzIHJlZmVyZW5jZXMsIGJ1aWxkIGEgZmlsdGVyZWQgb2JqZWN0IHJlY3Vyc2l2ZWx5XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgIGNvbnN0IHN1YnNldCA9IChiIGFzIGxvb3NlKVtrZXldO1xuICAgICAgICAgIGlmICgodHlwZW9mIHN1YnNldCA9PT0gXCJvYmplY3RcIikgJiYgKHN1YnNldCkpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gYm90aCBvcGVyYW5kcyBhcmUgbWFwcywgYnVpbGQgYSBmaWx0ZXJlZCBtYXAgd2l0aCBjb21tb24ga2V5cyBhbmQgZmlsdGVyIG5lc3RlZCBvYmplY3RzIGluc2lkZVxuICAgICAgICAgICAgaWYgKCh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkgJiYgKHN1YnNldCBpbnN0YW5jZW9mIE1hcCkpIHtcbiAgICAgICAgICAgICAgZmlsdGVyZWRba2V5XSA9IG5ldyBNYXAoXG4gICAgICAgICAgICAgICAgWy4uLnZhbHVlXS5maWx0ZXIoKFtrXSkgPT4gc3Vic2V0LmhhcyhrKSkubWFwKChcbiAgICAgICAgICAgICAgICAgIFtrLCB2XSxcbiAgICAgICAgICAgICAgICApID0+IFtrLCB0eXBlb2YgdiA9PT0gXCJvYmplY3RcIiA/IGZuKHYsIHN1YnNldC5nZXQoaykpIDogdl0pLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFdoZW4gYm90aCBvcGVyYW5kcyBhcmUgc2V0LCBidWlsZCBhIGZpbHRlcmVkIHNldCB3aXRoIGNvbW1vbiB2YWx1ZXNcbiAgICAgICAgICAgIGlmICgodmFsdWUgaW5zdGFuY2VvZiBTZXQpICYmIChzdWJzZXQgaW5zdGFuY2VvZiBTZXQpKSB7XG4gICAgICAgICAgICAgIGZpbHRlcmVkW2tleV0gPSBuZXcgU2V0KFsuLi52YWx1ZV0uZmlsdGVyKCh2KSA9PiBzdWJzZXQuaGFzKHYpKSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsdGVyZWRba2V5XSA9IGZuKHZhbHVlIGFzIGxvb3NlLCBzdWJzZXQgYXMgbG9vc2UpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbHRlcmVkW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFzc2VydEVxdWFscyhcbiAgICAvLyBnZXQgdGhlIGludGVyc2VjdGlvbiBvZiBcImFjdHVhbFwiIGFuZCBcImV4cGVjdGVkXCJcbiAgICAvLyBzaWRlIGVmZmVjdDogYWxsIHRoZSBpbnN0YW5jZXMnIGNvbnN0cnVjdG9yIGZpZWxkIGlzIFwiT2JqZWN0XCIgbm93LlxuICAgIGZpbHRlcihhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAvLyBzZXQgKG5lc3RlZCkgaW5zdGFuY2VzJyBjb25zdHJ1Y3RvciBmaWVsZCB0byBiZSBcIk9iamVjdFwiIHdpdGhvdXQgY2hhbmdpbmcgZXhwZWN0ZWQgdmFsdWUuXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vX3N0ZC9wdWxsLzE0MTlcbiAgICBmaWx0ZXIoZXhwZWN0ZWQsIGV4cGVjdGVkKSxcbiAgKTtcbn1cblxuLyoqXG4gKiBGb3JjZWZ1bGx5IHRocm93cyBhIGZhaWxlZCBhc3NlcnRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZhaWwobXNnPzogc3RyaW5nKTogbmV2ZXIge1xuICBhc3NlcnQoZmFsc2UsIGBGYWlsZWQgYXNzZXJ0aW9uJHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YCk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgZXJyb3JgIGlzIGFuIGBFcnJvcmAuXG4gKiBJZiBub3QgdGhlbiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqIEFuIGVycm9yIGNsYXNzIGFuZCBhIHN0cmluZyB0aGF0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGVcbiAqIGVycm9yIG1lc3NhZ2UgY2FuIGFsc28gYmUgYXNzZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRJc0Vycm9yPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgZXJyb3I6IHVua25vd24sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIEVycm9yQ2xhc3M/OiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFLFxuICBtc2dJbmNsdWRlcz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogYXNzZXJ0cyBlcnJvciBpcyBFIHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKGBFeHBlY3RlZCBcImVycm9yXCIgdG8gYmUgYW4gRXJyb3Igb2JqZWN0LmApO1xuICB9XG4gIGlmIChFcnJvckNsYXNzICYmICEoZXJyb3IgaW5zdGFuY2VvZiBFcnJvckNsYXNzKSkge1xuICAgIG1zZyA9IGBFeHBlY3RlZCBlcnJvciB0byBiZSBpbnN0YW5jZSBvZiBcIiR7RXJyb3JDbGFzcy5uYW1lfVwiLCBidXQgd2FzIFwiJHtcbiAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiA/IGVycm9yPy5jb25zdHJ1Y3Rvcj8ubmFtZSA6IFwiW25vdCBhbiBvYmplY3RdXCJcbiAgICB9XCIke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG4gIGlmIChcbiAgICBtc2dJbmNsdWRlcyAmJiAoIShlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB8fFxuICAgICAgIXN0cmlwQ29sb3IoZXJyb3IubWVzc2FnZSkuaW5jbHVkZXMoc3RyaXBDb2xvcihtc2dJbmNsdWRlcykpKVxuICApIHtcbiAgICBtc2cgPSBgRXhwZWN0ZWQgZXJyb3IgbWVzc2FnZSB0byBpbmNsdWRlIFwiJHttc2dJbmNsdWRlc31cIiwgYnV0IGdvdCBcIiR7XG4gICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiW25vdCBhbiBFcnJvcl1cIlxuICAgIH1cIiR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWA7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuICBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdFxuICogdGhyb3dzLiBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlXG4gKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLiBPciB5b3UgY2FuIHBhc3MgYVxuICogY2FsbGJhY2sgd2hpY2ggd2lsbCBiZSBwYXNzZWQgdGhlIGVycm9yLCB1c3VhbGx5IHRvIGFwcGx5IHNvbWUgY3VzdG9tXG4gKiBhc3NlcnRpb25zIG9uIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgZm46ICgpID0+IHVua25vd24sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIEVycm9yQ2xhc3M/OiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFLFxuICBtc2dJbmNsdWRlcz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRUaHJvd3MoXG4gIGZuOiAoKSA9PiB1bmtub3duLFxuICBlcnJvckNhbGxiYWNrOiAoZTogRXJyb3IpID0+IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgZm46ICgpID0+IHVua25vd24sXG4gIGVycm9yQ2xhc3NPckNhbGxiYWNrPzpcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHwgKG5ldyAoLi4uYXJnczogYW55W10pID0+IEUpXG4gICAgfCAoKGU6IEVycm9yKSA9PiB1bmtub3duKSxcbiAgbXNnSW5jbHVkZXNPck1zZz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGxldCBFcnJvckNsYXNzOiAobmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gRSkgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGxldCBtc2dJbmNsdWRlczogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgZXJyb3JDYWxsYmFjaztcbiAgaWYgKFxuICAgIGVycm9yQ2xhc3NPckNhbGxiYWNrID09IG51bGwgfHxcbiAgICBlcnJvckNsYXNzT3JDYWxsYmFjay5wcm90b3R5cGUgaW5zdGFuY2VvZiBFcnJvciB8fFxuICAgIGVycm9yQ2xhc3NPckNhbGxiYWNrLnByb3RvdHlwZSA9PT0gRXJyb3IucHJvdG90eXBlXG4gICkge1xuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgRXJyb3JDbGFzcyA9IGVycm9yQ2xhc3NPckNhbGxiYWNrIGFzIG5ldyAoLi4uYXJnczogYW55W10pID0+IEU7XG4gICAgbXNnSW5jbHVkZXMgPSBtc2dJbmNsdWRlc09yTXNnO1xuICAgIGVycm9yQ2FsbGJhY2sgPSBudWxsO1xuICB9IGVsc2Uge1xuICAgIGVycm9yQ2FsbGJhY2sgPSBlcnJvckNsYXNzT3JDYWxsYmFjayBhcyAoZTogRXJyb3IpID0+IHVua25vd247XG4gICAgbXNnID0gbXNnSW5jbHVkZXNPck1zZztcbiAgfVxuICBsZXQgZG9lc1Rocm93ID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgZm4oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkEgbm9uLUVycm9yIG9iamVjdCB3YXMgdGhyb3duLlwiKTtcbiAgICB9XG4gICAgYXNzZXJ0SXNFcnJvcihcbiAgICAgIGVycm9yLFxuICAgICAgRXJyb3JDbGFzcyxcbiAgICAgIG1zZ0luY2x1ZGVzLFxuICAgICAgbXNnLFxuICAgICk7XG4gICAgaWYgKHR5cGVvZiBlcnJvckNhbGxiYWNrID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgZXJyb3JDYWxsYmFjayhlcnJvcik7XG4gICAgfVxuICAgIGRvZXNUaHJvdyA9IHRydWU7XG4gIH1cbiAgaWYgKCFkb2VzVGhyb3cpIHtcbiAgICBtc2cgPSBgRXhwZWN0ZWQgZnVuY3Rpb24gdG8gdGhyb3cke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGEgcHJvbWlzZSwgZXhwZWN0aW5nIGl0IHRvIHRocm93IG9yIHJlamVjdC5cbiAqIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0IHRocm93cy4gQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlXG4gKiBpbmNsdWRlZCBpbiB0aGUgZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC4gT3IgeW91IGNhbiBwYXNzIGFcbiAqIGNhbGxiYWNrIHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRoZSBlcnJvciwgdXN1YWxseSB0byBhcHBseSBzb21lIGN1c3RvbVxuICogYXNzZXJ0aW9ucyBvbiBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFJlamVjdHM8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBmbjogKCkgPT4gUHJvbWlzZTx1bmtub3duPixcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgRXJyb3JDbGFzcz86IG5ldyAoLi4uYXJnczogYW55W10pID0+IEUsXG4gIG1zZ0luY2x1ZGVzPzogc3RyaW5nLFxuICBtc2c/OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+O1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFJlamVjdHMoXG4gIGZuOiAoKSA9PiBQcm9taXNlPHVua25vd24+LFxuICBlcnJvckNhbGxiYWNrOiAoZTogRXJyb3IpID0+IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD47XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNzZXJ0UmVqZWN0czxFIGV4dGVuZHMgRXJyb3IgPSBFcnJvcj4oXG4gIGZuOiAoKSA9PiBQcm9taXNlPHVua25vd24+LFxuICBlcnJvckNsYXNzT3JDYWxsYmFjaz86XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB8IChuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFKVxuICAgIHwgKChlOiBFcnJvcikgPT4gdW5rbm93biksXG4gIG1zZ0luY2x1ZGVzT3JNc2c/OiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBsZXQgRXJyb3JDbGFzczogKG5ldyAoLi4uYXJnczogYW55W10pID0+IEUpIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgbXNnSW5jbHVkZXM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IGVycm9yQ2FsbGJhY2s7XG4gIGlmIChcbiAgICBlcnJvckNsYXNzT3JDYWxsYmFjayA9PSBudWxsIHx8XG4gICAgZXJyb3JDbGFzc09yQ2FsbGJhY2sucHJvdG90eXBlIGluc3RhbmNlb2YgRXJyb3IgfHxcbiAgICBlcnJvckNsYXNzT3JDYWxsYmFjay5wcm90b3R5cGUgPT09IEVycm9yLnByb3RvdHlwZVxuICApIHtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIEVycm9yQ2xhc3MgPSBlcnJvckNsYXNzT3JDYWxsYmFjayBhcyBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFO1xuICAgIG1zZ0luY2x1ZGVzID0gbXNnSW5jbHVkZXNPck1zZztcbiAgICBlcnJvckNhbGxiYWNrID0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBlcnJvckNhbGxiYWNrID0gZXJyb3JDbGFzc09yQ2FsbGJhY2sgYXMgKGU6IEVycm9yKSA9PiB1bmtub3duO1xuICAgIG1zZyA9IG1zZ0luY2x1ZGVzT3JNc2c7XG4gIH1cbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICB0cnkge1xuICAgIGF3YWl0IGZuKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJBIG5vbi1FcnJvciBvYmplY3Qgd2FzIHRocm93biBvciByZWplY3RlZC5cIik7XG4gICAgfVxuICAgIGFzc2VydElzRXJyb3IoXG4gICAgICBlcnJvcixcbiAgICAgIEVycm9yQ2xhc3MsXG4gICAgICBtc2dJbmNsdWRlcyxcbiAgICAgIG1zZyxcbiAgICApO1xuICAgIGlmICh0eXBlb2YgZXJyb3JDYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3IpO1xuICAgIH1cbiAgICBkb2VzVGhyb3cgPSB0cnVlO1xuICB9XG4gIGlmICghZG9lc1Rocm93KSB7XG4gICAgbXNnID0gYEV4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKiogVXNlIHRoaXMgdG8gc3R1YiBvdXQgbWV0aG9kcyB0aGF0IHdpbGwgdGhyb3cgd2hlbiBpbnZva2VkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuaW1wbGVtZW50ZWQobXNnPzogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnIHx8IFwidW5pbXBsZW1lbnRlZFwiKTtcbn1cblxuLyoqIFVzZSB0aGlzIHRvIGFzc2VydCB1bnJlYWNoYWJsZSBjb2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucmVhY2hhYmxlKCk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFwidW5yZWFjaGFibGVcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLDhFQUE4RTtBQUM5RSwyQ0FBMkM7QUFFM0MsU0FDRSxPQUFPLEVBQ1AsS0FBSyxFQUNMLElBQUksRUFDSixJQUFJLEVBQ0osS0FBSyxFQUNMLEdBQUcsRUFDSCxVQUFVLEVBQ1YsS0FBSyxRQUNBLG1CQUFtQjtBQUMxQixTQUFTLElBQUksRUFBYyxPQUFPLEVBQUUsUUFBUSxRQUFRLGFBQWE7QUFFakUsTUFBTSxrQkFBa0I7QUFFeEIsT0FBTyxNQUFNLHVCQUF1QjtJQUN6QixP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