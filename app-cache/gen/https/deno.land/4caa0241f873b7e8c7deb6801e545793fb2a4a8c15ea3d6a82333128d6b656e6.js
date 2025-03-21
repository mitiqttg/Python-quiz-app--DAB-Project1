// Ported from Go
// https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(byte) {
    return new TypeError(`Invalid byte '${String.fromCharCode(byte)}'`);
}
function errLength() {
    return new RangeError("Odd length hex string");
}
/** Converts a hex character into its value. */ function fromHexChar(byte) {
    // '0' <= byte && byte <= '9'
    if (48 <= byte && byte <= 57) return byte - 48;
    // 'a' <= byte && byte <= 'f'
    if (97 <= byte && byte <= 102) return byte - 97 + 10;
    // 'A' <= byte && byte <= 'F'
    if (65 <= byte && byte <= 70) return byte - 65 + 10;
    throw errInvalidByte(byte);
}
/** Encodes `src` into `src.length * 2` bytes. */ export function encode(src) {
    const dst = new Uint8Array(src.length * 2);
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
/**
 * Decodes `src` into `src.length / 2` bytes.
 * If the input is malformed, an error will be thrown.
 */ export function decode(src) {
    const dst = new Uint8Array(src.length / 2);
    for(let i = 0; i < dst.length; i++){
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = a << 4 | b;
    }
    if (src.length % 2 == 1) {
        // Check for invalid char before reporting bad length,
        // since the invalid char (if present) is an earlier problem.
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL2VuY29kaW5nL2hleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBHb1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby9ibG9iL2dvMS4xMi41L3NyYy9lbmNvZGluZy9oZXgvaGV4LmdvXG4vLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgQlNELXN0eWxlXG4vLyBsaWNlbnNlIHRoYXQgY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5jb25zdCBoZXhUYWJsZSA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIjAxMjM0NTY3ODlhYmNkZWZcIik7XG5cbmZ1bmN0aW9uIGVyckludmFsaWRCeXRlKGJ5dGU6IG51bWJlcikge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcihgSW52YWxpZCBieXRlICcke1N0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSl9J2ApO1xufVxuXG5mdW5jdGlvbiBlcnJMZW5ndGgoKSB7XG4gIHJldHVybiBuZXcgUmFuZ2VFcnJvcihcIk9kZCBsZW5ndGggaGV4IHN0cmluZ1wiKTtcbn1cblxuLyoqIENvbnZlcnRzIGEgaGV4IGNoYXJhY3RlciBpbnRvIGl0cyB2YWx1ZS4gKi9cbmZ1bmN0aW9uIGZyb21IZXhDaGFyKGJ5dGU6IG51bWJlcik6IG51bWJlciB7XG4gIC8vICcwJyA8PSBieXRlICYmIGJ5dGUgPD0gJzknXG4gIGlmICg0OCA8PSBieXRlICYmIGJ5dGUgPD0gNTcpIHJldHVybiBieXRlIC0gNDg7XG4gIC8vICdhJyA8PSBieXRlICYmIGJ5dGUgPD0gJ2YnXG4gIGlmICg5NyA8PSBieXRlICYmIGJ5dGUgPD0gMTAyKSByZXR1cm4gYnl0ZSAtIDk3ICsgMTA7XG4gIC8vICdBJyA8PSBieXRlICYmIGJ5dGUgPD0gJ0YnXG4gIGlmICg2NSA8PSBieXRlICYmIGJ5dGUgPD0gNzApIHJldHVybiBieXRlIC0gNjUgKyAxMDtcblxuICB0aHJvdyBlcnJJbnZhbGlkQnl0ZShieXRlKTtcbn1cblxuLyoqIEVuY29kZXMgYHNyY2AgaW50byBgc3JjLmxlbmd0aCAqIDJgIGJ5dGVzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShzcmM6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoc3JjLmxlbmd0aCAqIDIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHYgPSBzcmNbaV07XG4gICAgZHN0W2kgKiAyXSA9IGhleFRhYmxlW3YgPj4gNF07XG4gICAgZHN0W2kgKiAyICsgMV0gPSBoZXhUYWJsZVt2ICYgMHgwZl07XG4gIH1cbiAgcmV0dXJuIGRzdDtcbn1cblxuLyoqXG4gKiBEZWNvZGVzIGBzcmNgIGludG8gYHNyYy5sZW5ndGggLyAyYCBieXRlcy5cbiAqIElmIHRoZSBpbnB1dCBpcyBtYWxmb3JtZWQsIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKHNyYzogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShzcmMubGVuZ3RoIC8gMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYSA9IGZyb21IZXhDaGFyKHNyY1tpICogMl0pO1xuICAgIGNvbnN0IGIgPSBmcm9tSGV4Q2hhcihzcmNbaSAqIDIgKyAxXSk7XG4gICAgZHN0W2ldID0gKGEgPDwgNCkgfCBiO1xuICB9XG5cbiAgaWYgKHNyYy5sZW5ndGggJSAyID09IDEpIHtcbiAgICAvLyBDaGVjayBmb3IgaW52YWxpZCBjaGFyIGJlZm9yZSByZXBvcnRpbmcgYmFkIGxlbmd0aCxcbiAgICAvLyBzaW5jZSB0aGUgaW52YWxpZCBjaGFyIChpZiBwcmVzZW50KSBpcyBhbiBlYXJsaWVyIHByb2JsZW0uXG4gICAgZnJvbUhleENoYXIoc3JjW2RzdC5sZW5ndGggKiAyXSk7XG4gICAgdGhyb3cgZXJyTGVuZ3RoKCk7XG4gIH1cblxuICByZXR1cm4gZHN0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGlCQUFpQjtBQUNqQixxRUFBcUU7QUFDckUsc0RBQXNEO0FBQ3RELHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFDakQsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxNQUFNLFdBQVcsSUFBSSxjQUFjLE1BQU0sQ0FBQztBQUUxQyxTQUFTLGVBQWUsSUFBWSxFQUFFO0lBQ3BDLE9BQU8sSUFBSSxVQUFVLENBQUMsY0FBYyxFQUFFLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BFO0FBRUEsU0FBUyxZQUFZO0lBQ25CLE9BQU8sSUFBSSxXQUFXO0FBQ3hCO0FBRUEsNkNBQTZDLEdBQzdDLFNBQVMsWUFBWSxJQUFZLEVBQVU7SUFDekMsNkJBQTZCO0lBQzdCLElBQUksTUFBTSxRQUFRLFFBQVEsSUFBSSxPQUFPLE9BQU87SUFDNUMsNkJBQTZCO0lBQzdCLElBQUksTUFBTSxRQUFRLFFBQVEsS0FBSyxPQUFPLE9BQU8sS0FBSztJQUNsRCw2QkFBNkI7SUFDN0IsSUFBSSxNQUFNLFFBQVEsUUFBUSxJQUFJLE9BQU8sT0FBTyxLQUFLO0lBRWpELE1BQU0sZUFBZSxNQUFNO0FBQzdCO0FBRUEsK0NBQStDLEdBQy9DLE9BQU8sU0FBUyxPQUFPLEdBQWUsRUFBYztJQUNsRCxNQUFNLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxHQUFHO0lBQ3hDLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxJQUFLO1FBQ25DLE1BQU0sSUFBSSxHQUFHLENBQUMsRUFBRTtRQUNoQixHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRTtRQUM3QixHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxLQUFLO0lBQ3JDO0lBQ0EsT0FBTztBQUNULENBQUM7QUFFRDs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFlLEVBQWM7SUFDbEQsTUFBTSxNQUFNLElBQUksV0FBVyxJQUFJLE1BQU0sR0FBRztJQUN4QyxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztRQUNuQyxNQUFNLElBQUksWUFBWSxHQUFHLENBQUMsSUFBSSxFQUFFO1FBQ2hDLE1BQU0sSUFBSSxZQUFZLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRTtRQUNwQyxHQUFHLENBQUMsRUFBRSxHQUFHLEFBQUMsS0FBSyxJQUFLO0lBQ3RCO0lBRUEsSUFBSSxJQUFJLE1BQU0sR0FBRyxLQUFLLEdBQUc7UUFDdkIsc0RBQXNEO1FBQ3RELDZEQUE2RDtRQUM3RCxZQUFZLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxFQUFFO1FBQy9CLE1BQU0sWUFBWTtJQUNwQixDQUFDO0lBRUQsT0FBTztBQUNULENBQUMifQ==