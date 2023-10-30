// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { isWindows, osType } from "../../_util/os.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
const { join , normalize  } = path;
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
    "-",
    "\\",
    "]"
];
/** Convert a glob string to a regular expression.
 *
 * Tries to match bash glob expansion as closely as possible.
 *
 * Basic glob syntax:
 * - `*` - Matches everything without leaving the path segment.
 * - `?` - Matches any single character.
 * - `{foo,bar}` - Matches `foo` or `bar`.
 * - `[abcd]` - Matches `a`, `b`, `c` or `d`.
 * - `[a-d]` - Matches `a`, `b`, `c` or `d`.
 * - `[!abcd]` - Matches any single character besides `a`, `b`, `c` or `d`.
 * - `[[:<class>:]]` - Matches any character belonging to `<class>`.
 *     - `[[:alnum:]]` - Matches any digit or letter.
 *     - `[[:digit:]abc]` - Matches any digit, `a`, `b` or `c`.
 *     - See https://facelessuser.github.io/wcmatch/glob/#posix-character-classes
 *       for a complete list of supported character classes.
 * - `\` - Escapes the next character for an `os` other than `"windows"`.
 * - \` - Escapes the next character for `os` set to `"windows"`.
 * - `/` - Path separator.
 * - `\` - Additional path separator only for `os` set to `"windows"`.
 *
 * Extended syntax:
 * - Requires `{ extended: true }`.
 * - `?(foo|bar)` - Matches 0 or 1 instance of `{foo,bar}`.
 * - `@(foo|bar)` - Matches 1 instance of `{foo,bar}`. They behave the same.
 * - `*(foo|bar)` - Matches _n_ instances of `{foo,bar}`.
 * - `+(foo|bar)` - Matches _n > 0_ instances of `{foo,bar}`.
 * - `!(foo|bar)` - Matches anything other than `{foo,bar}`.
 * - See https://www.linuxjournal.com/content/bash-extended-globbing.
 *
 * Globstar syntax:
 * - Requires `{ globstar: true }`.
 * - `**` - Matches any number of any path segments.
 *     - Must comprise its entire path segment in the provided glob.
 * - See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
 *
 * Note the following properties:
 * - The generated `RegExp` is anchored at both start and end.
 * - Repeating and trailing separators are tolerated. Trailing separators in the
 *   provided glob have no meaning and are discarded.
 * - Absolute globs will only match absolute paths, etc.
 * - Empty globs will match nothing.
 * - Any special glob syntax must be contained to one path segment. For example,
 *   `?(foo|bar/baz)` is invalid. The separator will take precedence and the
 *   first segment ends with an unclosed group.
 * - If a path segment ends with unclosed groups or a dangling escape prefix, a
 *   parse error has occurred. Every character for that segment is taken
 *   literally in this event.
 *
 * Limitations:
 * - A negative group like `!(foo|bar)` will wrongly be converted to a negative
 *   look-ahead followed by a wildcard. This means that `!(foo).js` will wrongly
 *   fail to match `foobar.js`, even though `foobar` is not `foo`. Effectively,
 *   `!(foo|bar)` is treated like `!(@(foo|bar)*)`. This will work correctly if
 *   the group occurs not nested at the end of the segment. */ export function globToRegExp(glob, { extended =true , globstar: globstarOption = true , os =osType , caseInsensitive =false  } = {}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    // Remove trailing separators.
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    // Terminates correctly. Trust that `j` is incremented every iteration.
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        // Terminates with `i` at the non-inclusive end of the current segment.
        for(; i < glob.length && !seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] == escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] == "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] == "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] == "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] == ":") {
                    let k = i + 1;
                    let value = "";
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
                        value += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] == ":" && glob[k + 2] == "]") {
                        i = k + 2;
                        if (value == "alnum") segment += "\\dA-Za-z";
                        else if (value == "alpha") segment += "A-Za-z";
                        else if (value == "ascii") segment += "\x00-\x7F";
                        else if (value == "blank") segment += "\t ";
                        else if (value == "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value == "digit") segment += "\\d";
                        else if (value == "graph") segment += "\x21-\x7E";
                        else if (value == "lower") segment += "a-z";
                        else if (value == "print") segment += "\x20-\x7E";
                        else if (value == "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value == "space") segment += "\\s\v";
                        else if (value == "upper") segment += "A-Z";
                        else if (value == "word") segment += "\\w";
                        else if (value == "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] == "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] == "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "+" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "@" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "?") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] == "!" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] == "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "*") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += globstar;
                        endsWithSep = true;
                    } else {
                        segment += wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        // Check for unclosed groups or a dangling backslash.
        if (groupStack.length > 0 || inRange || inEscape) {
            // Parse failure. Take all characters from this segment literally.
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? sep : sepMaybe;
            endsWithSep = true;
        }
        // Terminates with `i` at the start of the next segment.
        while(seps.includes(glob[i]))i++;
        // Check that the next value of `j` is indeed higher than the current value.
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
/** Test whether the given string is a glob */ export function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|\?|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        // if an open bracket/brace/paren is escaped,
        // set the index to the next closing character
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(glob, { globstar =false  } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(globs, { extended =true , globstar =false  } = {}) {
    if (!globstar || globs.length == 0) {
        return join(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvcGF0aC9nbG9iLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IGlzV2luZG93cywgb3NUeXBlIH0gZnJvbSBcIi4uLy4uL191dGlsL29zLnRzXCI7XG5pbXBvcnQgeyBTRVAsIFNFUF9QQVRURVJOIH0gZnJvbSBcIi4vc2VwYXJhdG9yLnRzXCI7XG5pbXBvcnQgKiBhcyBfd2luMzIgZnJvbSBcIi4vd2luMzIudHNcIjtcbmltcG9ydCAqIGFzIF9wb3NpeCBmcm9tIFwiLi9wb3NpeC50c1wiO1xuaW1wb3J0IHR5cGUgeyBPU1R5cGUgfSBmcm9tIFwiLi4vLi4vX3V0aWwvb3MudHNcIjtcblxuY29uc3QgcGF0aCA9IGlzV2luZG93cyA/IF93aW4zMiA6IF9wb3NpeDtcbmNvbnN0IHsgam9pbiwgbm9ybWFsaXplIH0gPSBwYXRoO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdsb2JPcHRpb25zIHtcbiAgLyoqIEV4dGVuZGVkIGdsb2Igc3ludGF4LlxuICAgKiBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2Jhc2gtZXh0ZW5kZWQtZ2xvYmJpbmcuIERlZmF1bHRzXG4gICAqIHRvIHRydWUuICovXG4gIGV4dGVuZGVkPzogYm9vbGVhbjtcbiAgLyoqIEdsb2JzdGFyIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gICAqIElmIGZhbHNlLCBgKipgIGlzIHRyZWF0ZWQgbGlrZSBgKmAuIERlZmF1bHRzIHRvIHRydWUuICovXG4gIGdsb2JzdGFyPzogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgZ2xvYnN0YXIgc2hvdWxkIGJlIGNhc2UgaW5zZW5zaXRpdmUuICovXG4gIGNhc2VJbnNlbnNpdGl2ZT86IGJvb2xlYW47XG4gIC8qKiBPcGVyYXRpbmcgc3lzdGVtLiBEZWZhdWx0cyB0byB0aGUgbmF0aXZlIE9TLiAqL1xuICBvcz86IE9TVHlwZTtcbn1cblxuZXhwb3J0IHR5cGUgR2xvYlRvUmVnRXhwT3B0aW9ucyA9IEdsb2JPcHRpb25zO1xuXG5jb25zdCByZWdFeHBFc2NhcGVDaGFycyA9IFtcbiAgXCIhXCIsXG4gIFwiJFwiLFxuICBcIihcIixcbiAgXCIpXCIsXG4gIFwiKlwiLFxuICBcIitcIixcbiAgXCIuXCIsXG4gIFwiPVwiLFxuICBcIj9cIixcbiAgXCJbXCIsXG4gIFwiXFxcXFwiLFxuICBcIl5cIixcbiAgXCJ7XCIsXG4gIFwifFwiLFxuXTtcbmNvbnN0IHJhbmdlRXNjYXBlQ2hhcnMgPSBbXCItXCIsIFwiXFxcXFwiLCBcIl1cIl07XG5cbi8qKiBDb252ZXJ0IGEgZ2xvYiBzdHJpbmcgdG8gYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogVHJpZXMgdG8gbWF0Y2ggYmFzaCBnbG9iIGV4cGFuc2lvbiBhcyBjbG9zZWx5IGFzIHBvc3NpYmxlLlxuICpcbiAqIEJhc2ljIGdsb2Igc3ludGF4OlxuICogLSBgKmAgLSBNYXRjaGVzIGV2ZXJ5dGhpbmcgd2l0aG91dCBsZWF2aW5nIHRoZSBwYXRoIHNlZ21lbnQuXG4gKiAtIGA/YCAtIE1hdGNoZXMgYW55IHNpbmdsZSBjaGFyYWN0ZXIuXG4gKiAtIGB7Zm9vLGJhcn1gIC0gTWF0Y2hlcyBgZm9vYCBvciBgYmFyYC5cbiAqIC0gYFthYmNkXWAgLSBNYXRjaGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW2EtZF1gIC0gTWF0Y2hlcyBgYWAsIGBiYCwgYGNgIG9yIGBkYC5cbiAqIC0gYFshYWJjZF1gIC0gTWF0Y2hlcyBhbnkgc2luZ2xlIGNoYXJhY3RlciBiZXNpZGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW1s6PGNsYXNzPjpdXWAgLSBNYXRjaGVzIGFueSBjaGFyYWN0ZXIgYmVsb25naW5nIHRvIGA8Y2xhc3M+YC5cbiAqICAgICAtIGBbWzphbG51bTpdXWAgLSBNYXRjaGVzIGFueSBkaWdpdCBvciBsZXR0ZXIuXG4gKiAgICAgLSBgW1s6ZGlnaXQ6XWFiY11gIC0gTWF0Y2hlcyBhbnkgZGlnaXQsIGBhYCwgYGJgIG9yIGBjYC5cbiAqICAgICAtIFNlZSBodHRwczovL2ZhY2VsZXNzdXNlci5naXRodWIuaW8vd2NtYXRjaC9nbG9iLyNwb3NpeC1jaGFyYWN0ZXItY2xhc3Nlc1xuICogICAgICAgZm9yIGEgY29tcGxldGUgbGlzdCBvZiBzdXBwb3J0ZWQgY2hhcmFjdGVyIGNsYXNzZXMuXG4gKiAtIGBcXGAgLSBFc2NhcGVzIHRoZSBuZXh0IGNoYXJhY3RlciBmb3IgYW4gYG9zYCBvdGhlciB0aGFuIGBcIndpbmRvd3NcImAuXG4gKiAtIFxcYCAtIEVzY2FwZXMgdGhlIG5leHQgY2hhcmFjdGVyIGZvciBgb3NgIHNldCB0byBgXCJ3aW5kb3dzXCJgLlxuICogLSBgL2AgLSBQYXRoIHNlcGFyYXRvci5cbiAqIC0gYFxcYCAtIEFkZGl0aW9uYWwgcGF0aCBzZXBhcmF0b3Igb25seSBmb3IgYG9zYCBzZXQgdG8gYFwid2luZG93c1wiYC5cbiAqXG4gKiBFeHRlbmRlZCBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGV4dGVuZGVkOiB0cnVlIH1gLlxuICogLSBgPyhmb298YmFyKWAgLSBNYXRjaGVzIDAgb3IgMSBpbnN0YW5jZSBvZiBge2ZvbyxiYXJ9YC5cbiAqIC0gYEAoZm9vfGJhcilgIC0gTWF0Y2hlcyAxIGluc3RhbmNlIG9mIGB7Zm9vLGJhcn1gLiBUaGV5IGJlaGF2ZSB0aGUgc2FtZS5cbiAqIC0gYCooZm9vfGJhcilgIC0gTWF0Y2hlcyBfbl8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgKyhmb298YmFyKWAgLSBNYXRjaGVzIF9uID4gMF8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgIShmb298YmFyKWAgLSBNYXRjaGVzIGFueXRoaW5nIG90aGVyIHRoYW4gYHtmb28sYmFyfWAuXG4gKiAtIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvYmFzaC1leHRlbmRlZC1nbG9iYmluZy5cbiAqXG4gKiBHbG9ic3RhciBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGdsb2JzdGFyOiB0cnVlIH1gLlxuICogLSBgKipgIC0gTWF0Y2hlcyBhbnkgbnVtYmVyIG9mIGFueSBwYXRoIHNlZ21lbnRzLlxuICogICAgIC0gTXVzdCBjb21wcmlzZSBpdHMgZW50aXJlIHBhdGggc2VnbWVudCBpbiB0aGUgcHJvdmlkZWQgZ2xvYi5cbiAqIC0gU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gKlxuICogTm90ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKiAtIFRoZSBnZW5lcmF0ZWQgYFJlZ0V4cGAgaXMgYW5jaG9yZWQgYXQgYm90aCBzdGFydCBhbmQgZW5kLlxuICogLSBSZXBlYXRpbmcgYW5kIHRyYWlsaW5nIHNlcGFyYXRvcnMgYXJlIHRvbGVyYXRlZC4gVHJhaWxpbmcgc2VwYXJhdG9ycyBpbiB0aGVcbiAqICAgcHJvdmlkZWQgZ2xvYiBoYXZlIG5vIG1lYW5pbmcgYW5kIGFyZSBkaXNjYXJkZWQuXG4gKiAtIEFic29sdXRlIGdsb2JzIHdpbGwgb25seSBtYXRjaCBhYnNvbHV0ZSBwYXRocywgZXRjLlxuICogLSBFbXB0eSBnbG9icyB3aWxsIG1hdGNoIG5vdGhpbmcuXG4gKiAtIEFueSBzcGVjaWFsIGdsb2Igc3ludGF4IG11c3QgYmUgY29udGFpbmVkIHRvIG9uZSBwYXRoIHNlZ21lbnQuIEZvciBleGFtcGxlLFxuICogICBgPyhmb298YmFyL2JheilgIGlzIGludmFsaWQuIFRoZSBzZXBhcmF0b3Igd2lsbCB0YWtlIHByZWNlZGVuY2UgYW5kIHRoZVxuICogICBmaXJzdCBzZWdtZW50IGVuZHMgd2l0aCBhbiB1bmNsb3NlZCBncm91cC5cbiAqIC0gSWYgYSBwYXRoIHNlZ21lbnQgZW5kcyB3aXRoIHVuY2xvc2VkIGdyb3VwcyBvciBhIGRhbmdsaW5nIGVzY2FwZSBwcmVmaXgsIGFcbiAqICAgcGFyc2UgZXJyb3IgaGFzIG9jY3VycmVkLiBFdmVyeSBjaGFyYWN0ZXIgZm9yIHRoYXQgc2VnbWVudCBpcyB0YWtlblxuICogICBsaXRlcmFsbHkgaW4gdGhpcyBldmVudC5cbiAqXG4gKiBMaW1pdGF0aW9uczpcbiAqIC0gQSBuZWdhdGl2ZSBncm91cCBsaWtlIGAhKGZvb3xiYXIpYCB3aWxsIHdyb25nbHkgYmUgY29udmVydGVkIHRvIGEgbmVnYXRpdmVcbiAqICAgbG9vay1haGVhZCBmb2xsb3dlZCBieSBhIHdpbGRjYXJkLiBUaGlzIG1lYW5zIHRoYXQgYCEoZm9vKS5qc2Agd2lsbCB3cm9uZ2x5XG4gKiAgIGZhaWwgdG8gbWF0Y2ggYGZvb2Jhci5qc2AsIGV2ZW4gdGhvdWdoIGBmb29iYXJgIGlzIG5vdCBgZm9vYC4gRWZmZWN0aXZlbHksXG4gKiAgIGAhKGZvb3xiYXIpYCBpcyB0cmVhdGVkIGxpa2UgYCEoQChmb298YmFyKSopYC4gVGhpcyB3aWxsIHdvcmsgY29ycmVjdGx5IGlmXG4gKiAgIHRoZSBncm91cCBvY2N1cnMgbm90IG5lc3RlZCBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdsb2JUb1JlZ0V4cChcbiAgZ2xvYjogc3RyaW5nLFxuICB7XG4gICAgZXh0ZW5kZWQgPSB0cnVlLFxuICAgIGdsb2JzdGFyOiBnbG9ic3Rhck9wdGlvbiA9IHRydWUsXG4gICAgb3MgPSBvc1R5cGUsXG4gICAgY2FzZUluc2Vuc2l0aXZlID0gZmFsc2UsXG4gIH06IEdsb2JUb1JlZ0V4cE9wdGlvbnMgPSB7fSxcbik6IFJlZ0V4cCB7XG4gIGlmIChnbG9iID09IFwiXCIpIHtcbiAgICByZXR1cm4gLyg/ISkvO1xuICB9XG5cbiAgY29uc3Qgc2VwID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcIig/OlxcXFxcXFxcfC8pK1wiIDogXCIvK1wiO1xuICBjb25zdCBzZXBNYXliZSA9IG9zID09IFwid2luZG93c1wiID8gXCIoPzpcXFxcXFxcXHwvKSpcIiA6IFwiLypcIjtcbiAgY29uc3Qgc2VwcyA9IG9zID09IFwid2luZG93c1wiID8gW1wiXFxcXFwiLCBcIi9cIl0gOiBbXCIvXCJdO1xuICBjb25zdCBnbG9ic3RhciA9IG9zID09IFwid2luZG93c1wiXG4gICAgPyBcIig/OlteXFxcXFxcXFwvXSooPzpcXFxcXFxcXHwvfCQpKykqXCJcbiAgICA6IFwiKD86W14vXSooPzovfCQpKykqXCI7XG4gIGNvbnN0IHdpbGRjYXJkID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcIlteXFxcXFxcXFwvXSpcIiA6IFwiW14vXSpcIjtcbiAgY29uc3QgZXNjYXBlUHJlZml4ID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcImBcIiA6IFwiXFxcXFwiO1xuXG4gIC8vIFJlbW92ZSB0cmFpbGluZyBzZXBhcmF0b3JzLlxuICBsZXQgbmV3TGVuZ3RoID0gZ2xvYi5sZW5ndGg7XG4gIGZvciAoOyBuZXdMZW5ndGggPiAxICYmIHNlcHMuaW5jbHVkZXMoZ2xvYltuZXdMZW5ndGggLSAxXSk7IG5ld0xlbmd0aC0tKTtcbiAgZ2xvYiA9IGdsb2Iuc2xpY2UoMCwgbmV3TGVuZ3RoKTtcblxuICBsZXQgcmVnRXhwU3RyaW5nID0gXCJcIjtcblxuICAvLyBUZXJtaW5hdGVzIGNvcnJlY3RseS4gVHJ1c3QgdGhhdCBgamAgaXMgaW5jcmVtZW50ZWQgZXZlcnkgaXRlcmF0aW9uLlxuICBmb3IgKGxldCBqID0gMDsgaiA8IGdsb2IubGVuZ3RoOykge1xuICAgIGxldCBzZWdtZW50ID0gXCJcIjtcbiAgICBjb25zdCBncm91cFN0YWNrOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBpblJhbmdlID0gZmFsc2U7XG4gICAgbGV0IGluRXNjYXBlID0gZmFsc2U7XG4gICAgbGV0IGVuZHNXaXRoU2VwID0gZmFsc2U7XG4gICAgbGV0IGkgPSBqO1xuXG4gICAgLy8gVGVybWluYXRlcyB3aXRoIGBpYCBhdCB0aGUgbm9uLWluY2x1c2l2ZSBlbmQgb2YgdGhlIGN1cnJlbnQgc2VnbWVudC5cbiAgICBmb3IgKDsgaSA8IGdsb2IubGVuZ3RoICYmICFzZXBzLmluY2x1ZGVzKGdsb2JbaV0pOyBpKyspIHtcbiAgICAgIGlmIChpbkVzY2FwZSkge1xuICAgICAgICBpbkVzY2FwZSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBlc2NhcGVDaGFycyA9IGluUmFuZ2UgPyByYW5nZUVzY2FwZUNoYXJzIDogcmVnRXhwRXNjYXBlQ2hhcnM7XG4gICAgICAgIHNlZ21lbnQgKz0gZXNjYXBlQ2hhcnMuaW5jbHVkZXMoZ2xvYltpXSkgPyBgXFxcXCR7Z2xvYltpXX1gIDogZ2xvYltpXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IGVzY2FwZVByZWZpeCkge1xuICAgICAgICBpbkVzY2FwZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIltcIikge1xuICAgICAgICBpZiAoIWluUmFuZ2UpIHtcbiAgICAgICAgICBpblJhbmdlID0gdHJ1ZTtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiW1wiO1xuICAgICAgICAgIGlmIChnbG9iW2kgKyAxXSA9PSBcIiFcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIl5cIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09IFwiXlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBzZWdtZW50ICs9IFwiXFxcXF5cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZ2xvYltpICsgMV0gPT0gXCI6XCIpIHtcbiAgICAgICAgICBsZXQgayA9IGkgKyAxO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbayArIDFdICE9IG51bGwgJiYgZ2xvYltrICsgMV0gIT0gXCI6XCIpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IGdsb2JbayArIDFdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZ2xvYltrICsgMV0gPT0gXCI6XCIgJiYgZ2xvYltrICsgMl0gPT0gXCJdXCIpIHtcbiAgICAgICAgICAgIGkgPSBrICsgMjtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImFsbnVtXCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJhbHBoYVwiKSBzZWdtZW50ICs9IFwiQS1aYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImFzY2lpXCIpIHNlZ21lbnQgKz0gXCJcXHgwMC1cXHg3RlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJibGFua1wiKSBzZWdtZW50ICs9IFwiXFx0IFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJjbnRybFwiKSBzZWdtZW50ICs9IFwiXFx4MDAtXFx4MUZcXHg3RlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJkaWdpdFwiKSBzZWdtZW50ICs9IFwiXFxcXGRcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiZ3JhcGhcIikgc2VnbWVudCArPSBcIlxceDIxLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImxvd2VyXCIpIHNlZ21lbnQgKz0gXCJhLXpcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwicHJpbnRcIikgc2VnbWVudCArPSBcIlxceDIwLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInB1bmN0XCIpIHtcbiAgICAgICAgICAgICAgc2VnbWVudCArPSBcIiFcXFwiIyQlJicoKSorLFxcXFwtLi86Ozw9Pj9AW1xcXFxcXFxcXFxcXF1eX+KAmHt8fX5cIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJzcGFjZVwiKSBzZWdtZW50ICs9IFwiXFxcXHNcXHZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwidXBwZXJcIikgc2VnbWVudCArPSBcIkEtWlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ3b3JkXCIpIHNlZ21lbnQgKz0gXCJcXFxcd1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ4ZGlnaXRcIikgc2VnbWVudCArPSBcIlxcXFxkQS1GYS1mXCI7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJdXCIgJiYgaW5SYW5nZSkge1xuICAgICAgICBpblJhbmdlID0gZmFsc2U7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJdXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5SYW5nZSkge1xuICAgICAgICBpZiAoZ2xvYltpXSA9PSBcIlxcXFxcIikge1xuICAgICAgICAgIHNlZ21lbnQgKz0gYFxcXFxcXFxcYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50ICs9IGdsb2JbaV07XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PSBcIilcIiAmJiBncm91cFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdICE9IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIpXCI7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBncm91cFN0YWNrLnBvcCgpITtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCIhXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgIT0gXCJAXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PSBcInxcIiAmJiBncm91cFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdICE9IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIitcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIitcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiQFwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQFwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCI/XCIpIHtcbiAgICAgICAgaWYgKGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGdyb3VwU3RhY2sucHVzaChcIj9cIik7XG4gICAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIuXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiIVwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiIVwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/IVwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJ7XCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQlJBQ0VcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwifVwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wb3AoKTtcbiAgICAgICAgc2VnbWVudCArPSBcIilcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiLFwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgc2VnbWVudCArPSBcInxcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiKlwiKSB7XG4gICAgICAgIGlmIChleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBncm91cFN0YWNrLnB1c2goXCIqXCIpO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwcmV2Q2hhciA9IGdsb2JbaSAtIDFdO1xuICAgICAgICAgIGxldCBudW1TdGFycyA9IDE7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbaSArIDFdID09IFwiKlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBudW1TdGFycysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBuZXh0Q2hhciA9IGdsb2JbaSArIDFdO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGdsb2JzdGFyT3B0aW9uICYmIG51bVN0YXJzID09IDIgJiZcbiAgICAgICAgICAgIFsuLi5zZXBzLCB1bmRlZmluZWRdLmluY2x1ZGVzKHByZXZDaGFyKSAmJlxuICAgICAgICAgICAgWy4uLnNlcHMsIHVuZGVmaW5lZF0uaW5jbHVkZXMobmV4dENoYXIpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBzZWdtZW50ICs9IGdsb2JzdGFyO1xuICAgICAgICAgICAgZW5kc1dpdGhTZXAgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCArPSByZWdFeHBFc2NhcGVDaGFycy5pbmNsdWRlcyhnbG9iW2ldKSA/IGBcXFxcJHtnbG9iW2ldfWAgOiBnbG9iW2ldO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBncm91cHMgb3IgYSBkYW5nbGluZyBiYWNrc2xhc2guXG4gICAgaWYgKGdyb3VwU3RhY2subGVuZ3RoID4gMCB8fCBpblJhbmdlIHx8IGluRXNjYXBlKSB7XG4gICAgICAvLyBQYXJzZSBmYWlsdXJlLiBUYWtlIGFsbCBjaGFyYWN0ZXJzIGZyb20gdGhpcyBzZWdtZW50IGxpdGVyYWxseS5cbiAgICAgIHNlZ21lbnQgPSBcIlwiO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGdsb2Iuc2xpY2UoaiwgaSkpIHtcbiAgICAgICAgc2VnbWVudCArPSByZWdFeHBFc2NhcGVDaGFycy5pbmNsdWRlcyhjKSA/IGBcXFxcJHtjfWAgOiBjO1xuICAgICAgICBlbmRzV2l0aFNlcCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlZ0V4cFN0cmluZyArPSBzZWdtZW50O1xuICAgIGlmICghZW5kc1dpdGhTZXApIHtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBpIDwgZ2xvYi5sZW5ndGggPyBzZXAgOiBzZXBNYXliZTtcbiAgICAgIGVuZHNXaXRoU2VwID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUZXJtaW5hdGVzIHdpdGggYGlgIGF0IHRoZSBzdGFydCBvZiB0aGUgbmV4dCBzZWdtZW50LlxuICAgIHdoaWxlIChzZXBzLmluY2x1ZGVzKGdsb2JbaV0pKSBpKys7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoZSBuZXh0IHZhbHVlIG9mIGBqYCBpcyBpbmRlZWQgaGlnaGVyIHRoYW4gdGhlIGN1cnJlbnQgdmFsdWUuXG4gICAgaWYgKCEoaSA+IGopKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnRpb24gZmFpbHVyZTogaSA+IGogKHBvdGVudGlhbCBpbmZpbml0ZSBsb29wKVwiKTtcbiAgICB9XG4gICAgaiA9IGk7XG4gIH1cblxuICByZWdFeHBTdHJpbmcgPSBgXiR7cmVnRXhwU3RyaW5nfSRgO1xuICByZXR1cm4gbmV3IFJlZ0V4cChyZWdFeHBTdHJpbmcsIGNhc2VJbnNlbnNpdGl2ZSA/IFwiaVwiIDogXCJcIik7XG59XG5cbi8qKiBUZXN0IHdoZXRoZXIgdGhlIGdpdmVuIHN0cmluZyBpcyBhIGdsb2IgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0dsb2Ioc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgY2hhcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFwie1wiOiBcIn1cIiwgXCIoXCI6IFwiKVwiLCBcIltcIjogXCJdXCIgfTtcbiAgY29uc3QgcmVnZXggPVxuICAgIC9cXFxcKC4pfCheIXxcXCp8XFw/fFtcXF0uKyldXFw/fFxcW1teXFxcXFxcXV0rXFxdfFxce1teXFxcXH1dK1xcfXxcXChcXD9bOiE9XVteXFxcXCldK1xcKXxcXChbXnxdK1xcfFteXFxcXCldK1xcKSkvO1xuXG4gIGlmIChzdHIgPT09IFwiXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJlZ2V4LmV4ZWMoc3RyKSkpIHtcbiAgICBpZiAobWF0Y2hbMl0pIHJldHVybiB0cnVlO1xuICAgIGxldCBpZHggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblxuICAgIC8vIGlmIGFuIG9wZW4gYnJhY2tldC9icmFjZS9wYXJlbiBpcyBlc2NhcGVkLFxuICAgIC8vIHNldCB0aGUgaW5kZXggdG8gdGhlIG5leHQgY2xvc2luZyBjaGFyYWN0ZXJcbiAgICBjb25zdCBvcGVuID0gbWF0Y2hbMV07XG4gICAgY29uc3QgY2xvc2UgPSBvcGVuID8gY2hhcnNbb3Blbl0gOiBudWxsO1xuICAgIGlmIChvcGVuICYmIGNsb3NlKSB7XG4gICAgICBjb25zdCBuID0gc3RyLmluZGV4T2YoY2xvc2UsIGlkeCk7XG4gICAgICBpZiAobiAhPT0gLTEpIHtcbiAgICAgICAgaWR4ID0gbiArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RyID0gc3RyLnNsaWNlKGlkeCk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBMaWtlIG5vcm1hbGl6ZSgpLCBidXQgZG9lc24ndCBjb2xsYXBzZSBcIioqXFwvLi5cIiB3aGVuIGBnbG9ic3RhcmAgaXMgdHJ1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHbG9iKFxuICBnbG9iOiBzdHJpbmcsXG4gIHsgZ2xvYnN0YXIgPSBmYWxzZSB9OiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKGdsb2IubWF0Y2goL1xcMC9nKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgR2xvYiBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnM6IFwiJHtnbG9ifVwiYCk7XG4gIH1cbiAgaWYgKCFnbG9ic3Rhcikge1xuICAgIHJldHVybiBub3JtYWxpemUoZ2xvYik7XG4gIH1cbiAgY29uc3QgcyA9IFNFUF9QQVRURVJOLnNvdXJjZTtcbiAgY29uc3QgYmFkUGFyZW50UGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgYCg/PD0oJHtzfXxeKVxcXFwqXFxcXCoke3N9KVxcXFwuXFxcXC4oPz0ke3N9fCQpYCxcbiAgICBcImdcIixcbiAgKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZShnbG9iLnJlcGxhY2UoYmFkUGFyZW50UGF0dGVybiwgXCJcXDBcIikpLnJlcGxhY2UoL1xcMC9nLCBcIi4uXCIpO1xufVxuXG4vKiogTGlrZSBqb2luKCksIGJ1dCBkb2Vzbid0IGNvbGxhcHNlIFwiKipcXC8uLlwiIHdoZW4gYGdsb2JzdGFyYCBpcyB0cnVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5HbG9icyhcbiAgZ2xvYnM6IHN0cmluZ1tdLFxuICB7IGV4dGVuZGVkID0gdHJ1ZSwgZ2xvYnN0YXIgPSBmYWxzZSB9OiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKCFnbG9ic3RhciB8fCBnbG9icy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBqb2luKC4uLmdsb2JzKTtcbiAgfVxuICBpZiAoZ2xvYnMubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBnbG9iIG9mIGdsb2JzKSB7XG4gICAgY29uc3QgcGF0aCA9IGdsb2I7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFqb2luZWQpIGpvaW5lZCA9IHBhdGg7XG4gICAgICBlbHNlIGpvaW5lZCArPSBgJHtTRVB9JHtwYXRofWA7XG4gICAgfVxuICB9XG4gIGlmICgham9pbmVkKSByZXR1cm4gXCIuXCI7XG4gIHJldHVybiBub3JtYWxpemVHbG9iKGpvaW5lZCwgeyBleHRlbmRlZCwgZ2xvYnN0YXIgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQVMsU0FBUyxFQUFFLE1BQU0sUUFBUSxvQkFBb0I7QUFDdEQsU0FBUyxHQUFHLEVBQUUsV0FBVyxRQUFRLGlCQUFpQjtBQUNsRCxZQUFZLFlBQVksYUFBYTtBQUNyQyxZQUFZLFlBQVksYUFBYTtBQUdyQyxNQUFNLE9BQU8sWUFBWSxTQUFTLE1BQU07QUFDeEMsTUFBTSxFQUFFLEtBQUksRUFBRSxVQUFTLEVBQUUsR0FBRztBQW1CNUIsTUFBTSxvQkFBb0I7SUFDeEI7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtDQUNEO0FBQ0QsTUFBTSxtQkFBbUI7SUFBQztJQUFLO0lBQU07Q0FBSTtBQUV6Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzREQXNENEQsR0FDNUQsT0FBTyxTQUFTLGFBQ2QsSUFBWSxFQUNaLEVBQ0UsVUFBVyxJQUFJLENBQUEsRUFDZixVQUFVLGlCQUFpQixJQUFJLENBQUEsRUFDL0IsSUFBSyxPQUFNLEVBQ1gsaUJBQWtCLEtBQUssQ0FBQSxFQUNILEdBQUcsQ0FBQyxDQUFDLEVBQ25CO0lBQ1IsSUFBSSxRQUFRLElBQUk7UUFDZCxPQUFPO0lBQ1QsQ0FBQztJQUVELE1BQU0sTUFBTSxNQUFNLFlBQVksZ0JBQWdCLElBQUk7SUFDbEQsTUFBTSxXQUFXLE1BQU0sWUFBWSxnQkFBZ0IsSUFBSTtJQUN2RCxNQUFNLE9BQU8sTUFBTSxZQUFZO1FBQUM7UUFBTTtLQUFJLEdBQUc7UUFBQztLQUFJO0lBQ2xELE1BQU0sV0FBVyxNQUFNLFlBQ25CLGdDQUNBLG9CQUFvQjtJQUN4QixNQUFNLFdBQVcsTUFBTSxZQUFZLGNBQWMsT0FBTztJQUN4RCxNQUFNLGVBQWUsTUFBTSxZQUFZLE1BQU0s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