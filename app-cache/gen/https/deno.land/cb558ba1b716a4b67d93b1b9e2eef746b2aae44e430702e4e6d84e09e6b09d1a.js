// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assert } from "../_util/asserts.ts";
import { copy } from "../bytes/copy.ts";
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const MAX_CONSECUTIVE_EMPTY_READS = 100;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
export class BufferFullError extends Error {
    name;
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
        this.name = "BufferFullError";
    }
    partial;
}
export class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
export class BufReader {
    #buf;
    #rd;
    #r = 0;
    #w = 0;
    #eof = false;
    // private lastByte: number;
    // private lastCharSize: number;
    /** return new BufReader unless r is BufReader */ static create(r, size = DEFAULT_BUF_SIZE) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = DEFAULT_BUF_SIZE){
        if (size < MIN_BUF_SIZE) {
            size = MIN_BUF_SIZE;
        }
        this.#reset(new Uint8Array(size), rd);
    }
    /** Returns the size of the underlying buffer in bytes. */ size() {
        return this.#buf.byteLength;
    }
    buffered() {
        return this.#w - this.#r;
    }
    // Reads a new chunk into the buffer.
    #fill = async ()=>{
        // Slide existing data to beginning.
        if (this.#r > 0) {
            this.#buf.copyWithin(0, this.#r, this.#w);
            this.#w -= this.#r;
            this.#r = 0;
        }
        if (this.#w >= this.#buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        // Read new data: try a limited number of times.
        for(let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--){
            const rr = await this.#rd.read(this.#buf.subarray(this.#w));
            if (rr === null) {
                this.#eof = true;
                return;
            }
            assert(rr >= 0, "negative read");
            this.#w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
    };
    /** Discards any buffered data, resets all state, and switches
   * the buffered reader to read from r.
   */ reset(r) {
        this.#reset(this.#buf, r);
    }
    #reset = (buf, rd)=>{
        this.#buf = buf;
        this.#rd = rd;
        this.#eof = false;
    // this.lastByte = -1;
    // this.lastCharSize = -1;
    };
    /** reads data into p.
   * It returns the number of bytes read into p.
   * The bytes are taken from at most one Read on the underlying Reader,
   * hence n may be less than len(p).
   * To read exactly len(p) bytes, use io.ReadFull(b, p).
   */ async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.#r === this.#w) {
            if (p.byteLength >= this.#buf.byteLength) {
                // Large read, empty buffer.
                // Read directly into p to avoid copy.
                const rr = await this.#rd.read(p);
                const nread = rr ?? 0;
                assert(nread >= 0, "negative read");
                // if (rr.nread > 0) {
                //   this.lastByte = p[rr.nread - 1];
                //   this.lastCharSize = -1;
                // }
                return rr;
            }
            // One read.
            // Do not use this.fill, which will loop.
            this.#r = 0;
            this.#w = 0;
            rr = await this.#rd.read(this.#buf);
            if (rr === 0 || rr === null) return rr;
            assert(rr >= 0, "negative read");
            this.#w += rr;
        }
        // copy as much as we can
        const copied = copy(this.#buf.subarray(this.#r, this.#w), p, 0);
        this.#r += copied;
        // this.lastByte = this.buf[this.r - 1];
        // this.lastCharSize = -1;
        return copied;
    }
    /** reads exactly `p.length` bytes into `p`.
   *
   * If successful, `p` is returned.
   *
   * If the end of the underlying stream has been reached, and there are no more
   * bytes available in the buffer, `readFull()` returns `null` instead.
   *
   * An error is thrown if some bytes could be read, but not enough to fill `p`
   * entirely before the underlying stream reported an error or EOF. Any error
   * thrown will have a `partial` property that indicates the slice of the
   * buffer that has been successfully filled with data.
   *
   * Ported from https://golang.org/pkg/io/#ReadFull
   */ async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = p.subarray(0, bytesRead);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return p;
    }
    /** Returns the next byte [0, 255] or `null`. */ async readByte() {
        while(this.#r === this.#w){
            if (this.#eof) return null;
            await this.#fill(); // buffer is empty.
        }
        const c = this.#buf[this.#r];
        this.#r++;
        // this.lastByte = c;
        return c;
    }
    /** readString() reads until the first occurrence of delim in the input,
   * returning a string containing the data up to and including the delimiter.
   * If ReadString encounters an error before finding a delimiter,
   * it returns the data read before the error and the error itself
   * (often `null`).
   * ReadString returns err != nil if and only if the returned data does not end
   * in delim.
   * For simple uses, a Scanner may be more convenient.
   */ async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    /** `readLine()` is a low-level line-reading primitive. Most callers should
   * use `readString('\n')` instead or use a Scanner.
   *
   * `readLine()` tries to return a single line, not including the end-of-line
   * bytes. If the line was too long for the buffer then `more` is set and the
   * beginning of the line is returned. The rest of the line will be returned
   * from future calls. `more` will be false when returning the last fragment
   * of the line. The returned buffer is only valid until the next call to
   * `readLine()`.
   *
   * The text returned from ReadLine does not include the line end ("\r\n" or
   * "\n").
   *
   * When the end of the underlying stream is reached, the final bytes in the
   * stream are returned. No indication or error is given if the input ends
   * without a final line end. When there are no more trailing bytes to read,
   * `readLine()` returns `null`.
   *
   * Calling `unreadByte()` after `readLine()` will always unread the last byte
   * read (possibly a character belonging to the line end) even if that byte is
   * not part of the line returned by `readLine()`.
   */ async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            let partial;
            if (err instanceof PartialReadError) {
                partial = err.partial;
                assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            // Don't throw if `readSlice()` failed with `BufferFullError`, instead we
            // just return whatever is available and set the `more` flag.
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            partial = err.partial;
            // Handle the case where "\r\n" straddles the buffer.
            if (!this.#eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                // Put the '\r' back on buf and drop it from line.
                // Let the next call to ReadLine check for "\r\n".
                assert(this.#r > 0, "bufio: tried to rewind past start of buffer");
                this.#r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.#eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    /** `readSlice()` reads until the first occurrence of `delim` in the input,
   * returning a slice pointing at the bytes in the buffer. The bytes stop
   * being valid at the next read.
   *
   * If `readSlice()` encounters an error before finding a delimiter, or the
   * buffer fills without finding a delimiter, it throws an error with a
   * `partial` property that contains the entire buffer.
   *
   * If `readSlice()` encounters the end of the underlying stream and there are
   * any bytes left in the buffer, the rest of the buffer is returned. In other
   * words, EOF is always treated as a delimiter. Once the buffer is empty,
   * it returns `null`.
   *
   * Because the data returned from `readSlice()` will be overwritten by the
   * next I/O operation, most clients should use `readString()` instead.
   */ async readSlice(delim) {
        let s = 0; // search start index
        let slice;
        while(true){
            // Search buffer.
            let i = this.#buf.subarray(this.#r + s, this.#w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.#buf.subarray(this.#r, this.#r + i + 1);
                this.#r += i + 1;
                break;
            }
            // EOF?
            if (this.#eof) {
                if (this.#r === this.#w) {
                    return null;
                }
                slice = this.#buf.subarray(this.#r, this.#w);
                this.#r = this.#w;
                break;
            }
            // Buffer full?
            if (this.buffered() >= this.#buf.byteLength) {
                this.#r = this.#w;
                // #4521 The internal buffer should not be reused across reads because it causes corruption of data.
                const oldbuf = this.#buf;
                const newbuf = this.#buf.slice(0);
                this.#buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.#w - this.#r; // do not rescan area we scanned before
            // Buffer is not full.
            try {
                await this.#fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = slice;
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = slice;
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        // Handle last byte, if any.
        // const i = slice.byteLength - 1;
        // if (i >= 0) {
        //   this.lastByte = slice[i];
        //   this.lastCharSize = -1
        // }
        return slice;
    }
    /** `peek()` returns the next `n` bytes without advancing the reader. The
   * bytes stop being valid at the next read call.
   *
   * When the end of the underlying stream is reached, but there are unread
   * bytes left in the buffer, those bytes are returned. If there are no bytes
   * left in the buffer, it returns `null`.
   *
   * If an error is encountered before `n` bytes are available, `peek()` throws
   * an error with the `partial` property set to a slice of the buffer that
   * contains the bytes that were available before the error occurred.
   */ async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.#w - this.#r;
        while(avail < n && avail < this.#buf.byteLength && !this.#eof){
            try {
                await this.#fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = this.#buf.subarray(this.#r, this.#w);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = this.#buf.subarray(this.#r, this.#w);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
            avail = this.#w - this.#r;
        }
        if (avail === 0 && this.#eof) {
            return null;
        } else if (avail < n && this.#eof) {
            return this.#buf.subarray(this.#r, this.#r + avail);
        } else if (avail < n) {
            throw new BufferFullError(this.#buf.subarray(this.#r, this.#w));
        }
        return this.#buf.subarray(this.#r, this.#r + n);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE2OC4wL2lvL2J1Zl9yZWFkZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydHMudHNcIjtcbmltcG9ydCB7IGNvcHkgfSBmcm9tIFwiLi4vYnl0ZXMvY29weS50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIgfSBmcm9tIFwiLi90eXBlcy5kLnRzXCI7XG5cbmNvbnN0IERFRkFVTFRfQlVGX1NJWkUgPSA0MDk2O1xuY29uc3QgTUlOX0JVRl9TSVpFID0gMTY7XG5jb25zdCBNQVhfQ09OU0VDVVRJVkVfRU1QVFlfUkVBRFMgPSAxMDA7XG5jb25zdCBDUiA9IFwiXFxyXCIuY2hhckNvZGVBdCgwKTtcbmNvbnN0IExGID0gXCJcXG5cIi5jaGFyQ29kZUF0KDApO1xuXG5leHBvcnQgY2xhc3MgQnVmZmVyRnVsbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBvdmVycmlkZSBuYW1lID0gXCJCdWZmZXJGdWxsRXJyb3JcIjtcbiAgY29uc3RydWN0b3IocHVibGljIHBhcnRpYWw6IFVpbnQ4QXJyYXkpIHtcbiAgICBzdXBlcihcIkJ1ZmZlciBmdWxsXCIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWFsUmVhZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBvdmVycmlkZSBuYW1lID0gXCJQYXJ0aWFsUmVhZEVycm9yXCI7XG4gIHBhcnRpYWw/OiBVaW50OEFycmF5O1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVuY291bnRlcmVkIFVuZXhwZWN0ZWRFb2YsIGRhdGEgb25seSBwYXJ0aWFsbHkgcmVhZFwiKTtcbiAgfVxufVxuXG4vKiogUmVzdWx0IHR5cGUgcmV0dXJuZWQgYnkgb2YgQnVmUmVhZGVyLnJlYWRMaW5lKCkuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRMaW5lUmVzdWx0IHtcbiAgbGluZTogVWludDhBcnJheTtcbiAgbW9yZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEJ1ZlJlYWRlciBpbXBsZW1lbnRzIFJlYWRlciB7XG4gICNidWYhOiBVaW50OEFycmF5O1xuICAjcmQhOiBSZWFkZXI7IC8vIFJlYWRlciBwcm92aWRlZCBieSBjYWxsZXIuXG4gICNyID0gMDsgLy8gYnVmIHJlYWQgcG9zaXRpb24uXG4gICN3ID0gMDsgLy8gYnVmIHdyaXRlIHBvc2l0aW9uLlxuICAjZW9mID0gZmFsc2U7XG4gIC8vIHByaXZhdGUgbGFzdEJ5dGU6IG51bWJlcjtcbiAgLy8gcHJpdmF0ZSBsYXN0Q2hhclNpemU6IG51bWJlcjtcblxuICAvKiogcmV0dXJuIG5ldyBCdWZSZWFkZXIgdW5sZXNzIHIgaXMgQnVmUmVhZGVyICovXG4gIHN0YXRpYyBjcmVhdGUocjogUmVhZGVyLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKTogQnVmUmVhZGVyIHtcbiAgICByZXR1cm4gciBpbnN0YW5jZW9mIEJ1ZlJlYWRlciA/IHIgOiBuZXcgQnVmUmVhZGVyKHIsIHNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocmQ6IFJlYWRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSkge1xuICAgIGlmIChzaXplIDwgTUlOX0JVRl9TSVpFKSB7XG4gICAgICBzaXplID0gTUlOX0JVRl9TSVpFO1xuICAgIH1cbiAgICB0aGlzLiNyZXNldChuZXcgVWludDhBcnJheShzaXplKSwgcmQpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHNpemUgb2YgdGhlIHVuZGVybHlpbmcgYnVmZmVyIGluIGJ5dGVzLiAqL1xuICBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5ieXRlTGVuZ3RoO1xuICB9XG5cbiAgYnVmZmVyZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4jdyAtIHRoaXMuI3I7XG4gIH1cblxuICAvLyBSZWFkcyBhIG5ldyBjaHVuayBpbnRvIHRoZSBidWZmZXIuXG4gICNmaWxsID0gYXN5bmMgKCkgPT4ge1xuICAgIC8vIFNsaWRlIGV4aXN0aW5nIGRhdGEgdG8gYmVnaW5uaW5nLlxuICAgIGlmICh0aGlzLiNyID4gMCkge1xuICAgICAgdGhpcy4jYnVmLmNvcHlXaXRoaW4oMCwgdGhpcy4jciwgdGhpcy4jdyk7XG4gICAgICB0aGlzLiN3IC09IHRoaXMuI3I7XG4gICAgICB0aGlzLiNyID0gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy4jdyA+PSB0aGlzLiNidWYuYnl0ZUxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJidWZpbzogdHJpZWQgdG8gZmlsbCBmdWxsIGJ1ZmZlclwiKTtcbiAgICB9XG5cbiAgICAvLyBSZWFkIG5ldyBkYXRhOiB0cnkgYSBsaW1pdGVkIG51bWJlciBvZiB0aW1lcy5cbiAgICBmb3IgKGxldCBpID0gTUFYX0NPTlNFQ1VUSVZFX0VNUFRZX1JFQURTOyBpID4gMDsgaS0tKSB7XG4gICAgICBjb25zdCByciA9IGF3YWl0IHRoaXMuI3JkLnJlYWQodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI3cpKTtcbiAgICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLiNlb2YgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhc3NlcnQocnIgPj0gMCwgXCJuZWdhdGl2ZSByZWFkXCIpO1xuICAgICAgdGhpcy4jdyArPSBycjtcbiAgICAgIGlmIChyciA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBObyBwcm9ncmVzcyBhZnRlciAke01BWF9DT05TRUNVVElWRV9FTVBUWV9SRUFEU30gcmVhZCgpIGNhbGxzYCxcbiAgICApO1xuICB9O1xuXG4gIC8qKiBEaXNjYXJkcyBhbnkgYnVmZmVyZWQgZGF0YSwgcmVzZXRzIGFsbCBzdGF0ZSwgYW5kIHN3aXRjaGVzXG4gICAqIHRoZSBidWZmZXJlZCByZWFkZXIgdG8gcmVhZCBmcm9tIHIuXG4gICAqL1xuICByZXNldChyOiBSZWFkZXIpIHtcbiAgICB0aGlzLiNyZXNldCh0aGlzLiNidWYsIHIpO1xuICB9XG5cbiAgI3Jlc2V0ID0gKGJ1ZjogVWludDhBcnJheSwgcmQ6IFJlYWRlcikgPT4ge1xuICAgIHRoaXMuI2J1ZiA9IGJ1ZjtcbiAgICB0aGlzLiNyZCA9IHJkO1xuICAgIHRoaXMuI2VvZiA9IGZhbHNlO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSAtMTtcbiAgICAvLyB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xO1xuICB9O1xuXG4gIC8qKiByZWFkcyBkYXRhIGludG8gcC5cbiAgICogSXQgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQgaW50byBwLlxuICAgKiBUaGUgYnl0ZXMgYXJlIHRha2VuIGZyb20gYXQgbW9zdCBvbmUgUmVhZCBvbiB0aGUgdW5kZXJseWluZyBSZWFkZXIsXG4gICAqIGhlbmNlIG4gbWF5IGJlIGxlc3MgdGhhbiBsZW4ocCkuXG4gICAqIFRvIHJlYWQgZXhhY3RseSBsZW4ocCkgYnl0ZXMsIHVzZSBpby5SZWFkRnVsbChiLCBwKS5cbiAgICovXG4gIGFzeW5jIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGxldCBycjogbnVtYmVyIHwgbnVsbCA9IHAuYnl0ZUxlbmd0aDtcbiAgICBpZiAocC5ieXRlTGVuZ3RoID09PSAwKSByZXR1cm4gcnI7XG5cbiAgICBpZiAodGhpcy4jciA9PT0gdGhpcy4jdykge1xuICAgICAgaWYgKHAuYnl0ZUxlbmd0aCA+PSB0aGlzLiNidWYuYnl0ZUxlbmd0aCkge1xuICAgICAgICAvLyBMYXJnZSByZWFkLCBlbXB0eSBidWZmZXIuXG4gICAgICAgIC8vIFJlYWQgZGlyZWN0bHkgaW50byBwIHRvIGF2b2lkIGNvcHkuXG4gICAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy4jcmQucmVhZChwKTtcbiAgICAgICAgY29uc3QgbnJlYWQgPSByciA/PyAwO1xuICAgICAgICBhc3NlcnQobnJlYWQgPj0gMCwgXCJuZWdhdGl2ZSByZWFkXCIpO1xuICAgICAgICAvLyBpZiAocnIubnJlYWQgPiAwKSB7XG4gICAgICAgIC8vICAgdGhpcy5sYXN0Qnl0ZSA9IHBbcnIubnJlYWQgLSAxXTtcbiAgICAgICAgLy8gICB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xO1xuICAgICAgICAvLyB9XG4gICAgICAgIHJldHVybiBycjtcbiAgICAgIH1cblxuICAgICAgLy8gT25lIHJlYWQuXG4gICAgICAvLyBEbyBub3QgdXNlIHRoaXMuZmlsbCwgd2hpY2ggd2lsbCBsb29wLlxuICAgICAgdGhpcy4jciA9IDA7XG4gICAgICB0aGlzLiN3ID0gMDtcbiAgICAgIHJyID0gYXdhaXQgdGhpcy4jcmQucmVhZCh0aGlzLiNidWYpO1xuICAgICAgaWYgKHJyID09PSAwIHx8IHJyID09PSBudWxsKSByZXR1cm4gcnI7XG4gICAgICBhc3NlcnQocnIgPj0gMCwgXCJuZWdhdGl2ZSByZWFkXCIpO1xuICAgICAgdGhpcy4jdyArPSBycjtcbiAgICB9XG5cbiAgICAvLyBjb3B5IGFzIG11Y2ggYXMgd2UgY2FuXG4gICAgY29uc3QgY29waWVkID0gY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jciwgdGhpcy4jdyksIHAsIDApO1xuICAgIHRoaXMuI3IgKz0gY29waWVkO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSB0aGlzLmJ1Zlt0aGlzLnIgLSAxXTtcbiAgICAvLyB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xO1xuICAgIHJldHVybiBjb3BpZWQ7XG4gIH1cblxuICAvKiogcmVhZHMgZXhhY3RseSBgcC5sZW5ndGhgIGJ5dGVzIGludG8gYHBgLlxuICAgKlxuICAgKiBJZiBzdWNjZXNzZnVsLCBgcGAgaXMgcmV0dXJuZWQuXG4gICAqXG4gICAqIElmIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGhhcyBiZWVuIHJlYWNoZWQsIGFuZCB0aGVyZSBhcmUgbm8gbW9yZVxuICAgKiBieXRlcyBhdmFpbGFibGUgaW4gdGhlIGJ1ZmZlciwgYHJlYWRGdWxsKClgIHJldHVybnMgYG51bGxgIGluc3RlYWQuXG4gICAqXG4gICAqIEFuIGVycm9yIGlzIHRocm93biBpZiBzb21lIGJ5dGVzIGNvdWxkIGJlIHJlYWQsIGJ1dCBub3QgZW5vdWdoIHRvIGZpbGwgYHBgXG4gICAqIGVudGlyZWx5IGJlZm9yZSB0aGUgdW5kZXJseWluZyBzdHJlYW0gcmVwb3J0ZWQgYW4gZXJyb3Igb3IgRU9GLiBBbnkgZXJyb3JcbiAgICogdGhyb3duIHdpbGwgaGF2ZSBhIGBwYXJ0aWFsYCBwcm9wZXJ0eSB0aGF0IGluZGljYXRlcyB0aGUgc2xpY2Ugb2YgdGhlXG4gICAqIGJ1ZmZlciB0aGF0IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBmaWxsZWQgd2l0aCBkYXRhLlxuICAgKlxuICAgKiBQb3J0ZWQgZnJvbSBodHRwczovL2dvbGFuZy5vcmcvcGtnL2lvLyNSZWFkRnVsbFxuICAgKi9cbiAgYXN5bmMgcmVhZEZ1bGwocDogVWludDhBcnJheSk6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgICBsZXQgYnl0ZXNSZWFkID0gMDtcbiAgICB3aGlsZSAoYnl0ZXNSZWFkIDwgcC5sZW5ndGgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy5yZWFkKHAuc3ViYXJyYXkoYnl0ZXNSZWFkKSk7XG4gICAgICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgICAgIGlmIChieXRlc1JlYWQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGFydGlhbFJlYWRFcnJvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBieXRlc1JlYWQgKz0gcnI7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFBhcnRpYWxSZWFkRXJyb3IpIHtcbiAgICAgICAgICBlcnIucGFydGlhbCA9IHAuc3ViYXJyYXkoMCwgYnl0ZXNSZWFkKTtcbiAgICAgICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgIGNvbnN0IGUgPSBuZXcgUGFydGlhbFJlYWRFcnJvcigpO1xuICAgICAgICAgIGUucGFydGlhbCA9IHAuc3ViYXJyYXkoMCwgYnl0ZXNSZWFkKTtcbiAgICAgICAgICBlLnN0YWNrID0gZXJyLnN0YWNrO1xuICAgICAgICAgIGUubWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgICAgICAgIGUuY2F1c2UgPSBlcnIuY2F1c2U7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgbmV4dCBieXRlIFswLCAyNTVdIG9yIGBudWxsYC4gKi9cbiAgYXN5bmMgcmVhZEJ5dGUoKTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgd2hpbGUgKHRoaXMuI3IgPT09IHRoaXMuI3cpIHtcbiAgICAgIGlmICh0aGlzLiNlb2YpIHJldHVybiBudWxsO1xuICAgICAgYXdhaXQgdGhpcy4jZmlsbCgpOyAvLyBidWZmZXIgaXMgZW1wdHkuXG4gICAgfVxuICAgIGNvbnN0IGMgPSB0aGlzLiNidWZbdGhpcy4jcl07XG4gICAgdGhpcy4jcisrO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSBjO1xuICAgIHJldHVybiBjO1xuICB9XG5cbiAgLyoqIHJlYWRTdHJpbmcoKSByZWFkcyB1bnRpbCB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBkZWxpbSBpbiB0aGUgaW5wdXQsXG4gICAqIHJldHVybmluZyBhIHN0cmluZyBjb250YWluaW5nIHRoZSBkYXRhIHVwIHRvIGFuZCBpbmNsdWRpbmcgdGhlIGRlbGltaXRlci5cbiAgICogSWYgUmVhZFN0cmluZyBlbmNvdW50ZXJzIGFuIGVycm9yIGJlZm9yZSBmaW5kaW5nIGEgZGVsaW1pdGVyLFxuICAgKiBpdCByZXR1cm5zIHRoZSBkYXRhIHJlYWQgYmVmb3JlIHRoZSBlcnJvciBhbmQgdGhlIGVycm9yIGl0c2VsZlxuICAgKiAob2Z0ZW4gYG51bGxgKS5cbiAgICogUmVhZFN0cmluZyByZXR1cm5zIGVyciAhPSBuaWwgaWYgYW5kIG9ubHkgaWYgdGhlIHJldHVybmVkIGRhdGEgZG9lcyBub3QgZW5kXG4gICAqIGluIGRlbGltLlxuICAgKiBGb3Igc2ltcGxlIHVzZXMsIGEgU2Nhbm5lciBtYXkgYmUgbW9yZSBjb252ZW5pZW50LlxuICAgKi9cbiAgYXN5bmMgcmVhZFN0cmluZyhkZWxpbTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgaWYgKGRlbGltLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGVsaW1pdGVyIHNob3VsZCBiZSBhIHNpbmdsZSBjaGFyYWN0ZXJcIik7XG4gICAgfVxuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMucmVhZFNsaWNlKGRlbGltLmNoYXJDb2RlQXQoMCkpO1xuICAgIGlmIChidWZmZXIgPT09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYnVmZmVyKTtcbiAgfVxuXG4gIC8qKiBgcmVhZExpbmUoKWAgaXMgYSBsb3ctbGV2ZWwgbGluZS1yZWFkaW5nIHByaW1pdGl2ZS4gTW9zdCBjYWxsZXJzIHNob3VsZFxuICAgKiB1c2UgYHJlYWRTdHJpbmcoJ1xcbicpYCBpbnN0ZWFkIG9yIHVzZSBhIFNjYW5uZXIuXG4gICAqXG4gICAqIGByZWFkTGluZSgpYCB0cmllcyB0byByZXR1cm4gYSBzaW5nbGUgbGluZSwgbm90IGluY2x1ZGluZyB0aGUgZW5kLW9mLWxpbmVcbiAgICogYnl0ZXMuIElmIHRoZSBsaW5lIHdhcyB0b28gbG9uZyBmb3IgdGhlIGJ1ZmZlciB0aGVuIGBtb3JlYCBpcyBzZXQgYW5kIHRoZVxuICAgKiBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgaXMgcmV0dXJuZWQuIFRoZSByZXN0IG9mIHRoZSBsaW5lIHdpbGwgYmUgcmV0dXJuZWRcbiAgICogZnJvbSBmdXR1cmUgY2FsbHMuIGBtb3JlYCB3aWxsIGJlIGZhbHNlIHdoZW4gcmV0dXJuaW5nIHRoZSBsYXN0IGZyYWdtZW50XG4gICAqIG9mIHRoZSBsaW5lLiBUaGUgcmV0dXJuZWQgYnVmZmVyIGlzIG9ubHkgdmFsaWQgdW50aWwgdGhlIG5leHQgY2FsbCB0b1xuICAgKiBgcmVhZExpbmUoKWAuXG4gICAqXG4gICAqIFRoZSB0ZXh0IHJldHVybmVkIGZyb20gUmVhZExpbmUgZG9lcyBub3QgaW5jbHVkZSB0aGUgbGluZSBlbmQgKFwiXFxyXFxuXCIgb3JcbiAgICogXCJcXG5cIikuXG4gICAqXG4gICAqIFdoZW4gdGhlIGVuZCBvZiB0aGUgdW5kZXJseWluZyBzdHJlYW0gaXMgcmVhY2hlZCwgdGhlIGZpbmFsIGJ5dGVzIGluIHRoZVxuICAgKiBzdHJlYW0gYXJlIHJldHVybmVkLiBObyBpbmRpY2F0aW9uIG9yIGVycm9yIGlzIGdpdmVuIGlmIHRoZSBpbnB1dCBlbmRzXG4gICAqIHdpdGhvdXQgYSBmaW5hbCBsaW5lIGVuZC4gV2hlbiB0aGVyZSBhcmUgbm8gbW9yZSB0cmFpbGluZyBieXRlcyB0byByZWFkLFxuICAgKiBgcmVhZExpbmUoKWAgcmV0dXJucyBgbnVsbGAuXG4gICAqXG4gICAqIENhbGxpbmcgYHVucmVhZEJ5dGUoKWAgYWZ0ZXIgYHJlYWRMaW5lKClgIHdpbGwgYWx3YXlzIHVucmVhZCB0aGUgbGFzdCBieXRlXG4gICAqIHJlYWQgKHBvc3NpYmx5IGEgY2hhcmFjdGVyIGJlbG9uZ2luZyB0byB0aGUgbGluZSBlbmQpIGV2ZW4gaWYgdGhhdCBieXRlIGlzXG4gICAqIG5vdCBwYXJ0IG9mIHRoZSBsaW5lIHJldHVybmVkIGJ5IGByZWFkTGluZSgpYC5cbiAgICovXG4gIGFzeW5jIHJlYWRMaW5lKCk6IFByb21pc2U8UmVhZExpbmVSZXN1bHQgfCBudWxsPiB7XG4gICAgbGV0IGxpbmU6IFVpbnQ4QXJyYXkgfCBudWxsID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICBsaW5lID0gYXdhaXQgdGhpcy5yZWFkU2xpY2UoTEYpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbGV0IHBhcnRpYWw7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgUGFydGlhbFJlYWRFcnJvcikge1xuICAgICAgICBwYXJ0aWFsID0gZXJyLnBhcnRpYWw7XG4gICAgICAgIGFzc2VydChcbiAgICAgICAgICBwYXJ0aWFsIGluc3RhbmNlb2YgVWludDhBcnJheSxcbiAgICAgICAgICBcImJ1ZmlvOiBjYXVnaHQgZXJyb3IgZnJvbSBgcmVhZFNsaWNlKClgIHdpdGhvdXQgYHBhcnRpYWxgIHByb3BlcnR5XCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvbid0IHRocm93IGlmIGByZWFkU2xpY2UoKWAgZmFpbGVkIHdpdGggYEJ1ZmZlckZ1bGxFcnJvcmAsIGluc3RlYWQgd2VcbiAgICAgIC8vIGp1c3QgcmV0dXJuIHdoYXRldmVyIGlzIGF2YWlsYWJsZSBhbmQgc2V0IHRoZSBgbW9yZWAgZmxhZy5cbiAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEJ1ZmZlckZ1bGxFcnJvcikpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICBwYXJ0aWFsID0gZXJyLnBhcnRpYWw7XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgY2FzZSB3aGVyZSBcIlxcclxcblwiIHN0cmFkZGxlcyB0aGUgYnVmZmVyLlxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy4jZW9mICYmIHBhcnRpYWwgJiZcbiAgICAgICAgcGFydGlhbC5ieXRlTGVuZ3RoID4gMCAmJlxuICAgICAgICBwYXJ0aWFsW3BhcnRpYWwuYnl0ZUxlbmd0aCAtIDFdID09PSBDUlxuICAgICAgKSB7XG4gICAgICAgIC8vIFB1dCB0aGUgJ1xccicgYmFjayBvbiBidWYgYW5kIGRyb3AgaXQgZnJvbSBsaW5lLlxuICAgICAgICAvLyBMZXQgdGhlIG5leHQgY2FsbCB0byBSZWFkTGluZSBjaGVjayBmb3IgXCJcXHJcXG5cIi5cbiAgICAgICAgYXNzZXJ0KHRoaXMuI3IgPiAwLCBcImJ1ZmlvOiB0cmllZCB0byByZXdpbmQgcGFzdCBzdGFydCBvZiBidWZmZXJcIik7XG4gICAgICAgIHRoaXMuI3ItLTtcbiAgICAgICAgcGFydGlhbCA9IHBhcnRpYWwuc3ViYXJyYXkoMCwgcGFydGlhbC5ieXRlTGVuZ3RoIC0gMSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXJ0aWFsKSB7XG4gICAgICAgIHJldHVybiB7IGxpbmU6IHBhcnRpYWwsIG1vcmU6ICF0aGlzLiNlb2YgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGluZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuYnl0ZUxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgbGluZSwgbW9yZTogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBpZiAobGluZVtsaW5lLmJ5dGVMZW5ndGggLSAxXSA9PSBMRikge1xuICAgICAgbGV0IGRyb3AgPSAxO1xuICAgICAgaWYgKGxpbmUuYnl0ZUxlbmd0aCA+IDEgJiYgbGluZVtsaW5lLmJ5dGVMZW5ndGggLSAyXSA9PT0gQ1IpIHtcbiAgICAgICAgZHJvcCA9IDI7XG4gICAgICB9XG4gICAgICBsaW5lID0gbGluZS5zdWJhcnJheSgwLCBsaW5lLmJ5dGVMZW5ndGggLSBkcm9wKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgbGluZSwgbW9yZTogZmFsc2UgfTtcbiAgfVxuXG4gIC8qKiBgcmVhZFNsaWNlKClgIHJlYWRzIHVudGlsIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGBkZWxpbWAgaW4gdGhlIGlucHV0LFxuICAgKiByZXR1cm5pbmcgYSBzbGljZSBwb2ludGluZyBhdCB0aGUgYnl0ZXMgaW4gdGhlIGJ1ZmZlci4gVGhlIGJ5dGVzIHN0b3BcbiAgICogYmVpbmcgdmFsaWQgYXQgdGhlIG5leHQgcmVhZC5cbiAgICpcbiAgICogSWYgYHJlYWRTbGljZSgpYCBlbmNvdW50ZXJzIGFuIGVycm9yIGJlZm9yZSBmaW5kaW5nIGEgZGVsaW1pdGVyLCBvciB0aGVcbiAgICogYnVmZmVyIGZpbGxzIHdpdGhvdXQgZmluZGluZyBhIGRlbGltaXRlciwgaXQgdGhyb3dzIGFuIGVycm9yIHdpdGggYVxuICAgKiBgcGFydGlhbGAgcHJvcGVydHkgdGhhdCBjb250YWlucyB0aGUgZW50aXJlIGJ1ZmZlci5cbiAgICpcbiAgICogSWYgYHJlYWRTbGljZSgpYCBlbmNvdW50ZXJzIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGFuZCB0aGVyZSBhcmVcbiAgICogYW55IGJ5dGVzIGxlZnQgaW4gdGhlIGJ1ZmZlciwgdGhlIHJlc3Qgb2YgdGhlIGJ1ZmZlciBpcyByZXR1cm5lZC4gSW4gb3RoZXJcbiAgICogd29yZHMsIEVPRiBpcyBhbHdheXMgdHJlYXRlZCBhcyBhIGRlbGltaXRlci4gT25jZSB0aGUgYnVmZmVyIGlzIGVtcHR5LFxuICAgKiBpdCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogQmVjYXVzZSB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIGByZWFkU2xpY2UoKWAgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGVcbiAgICogbmV4dCBJL08gb3BlcmF0aW9uLCBtb3N0IGNsaWVudHMgc2hvdWxkIHVzZSBgcmVhZFN0cmluZygpYCBpbnN0ZWFkLlxuICAgKi9cbiAgYXN5bmMgcmVhZFNsaWNlKGRlbGltOiBudW1iZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgbGV0IHMgPSAwOyAvLyBzZWFyY2ggc3RhcnQgaW5kZXhcbiAgICBsZXQgc2xpY2U6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gU2VhcmNoIGJ1ZmZlci5cbiAgICAgIGxldCBpID0gdGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI3IgKyBzLCB0aGlzLiN3KS5pbmRleE9mKGRlbGltKTtcbiAgICAgIGlmIChpID49IDApIHtcbiAgICAgICAgaSArPSBzO1xuICAgICAgICBzbGljZSA9IHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNyLCB0aGlzLiNyICsgaSArIDEpO1xuICAgICAgICB0aGlzLiNyICs9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gRU9GP1xuICAgICAgaWYgKHRoaXMuI2VvZikge1xuICAgICAgICBpZiAodGhpcy4jciA9PT0gdGhpcy4jdykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHNsaWNlID0gdGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI3IsIHRoaXMuI3cpO1xuICAgICAgICB0aGlzLiNyID0gdGhpcy4jdztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1ZmZlciBmdWxsP1xuICAgICAgaWYgKHRoaXMuYnVmZmVyZWQoKSA+PSB0aGlzLiNidWYuYnl0ZUxlbmd0aCkge1xuICAgICAgICB0aGlzLiNyID0gdGhpcy4jdztcbiAgICAgICAgLy8gIzQ1MjEgVGhlIGludGVybmFsIGJ1ZmZlciBzaG91bGQgbm90IGJlIHJldXNlZCBhY3Jvc3MgcmVhZHMgYmVjYXVzZSBpdCBjYXVzZXMgY29ycnVwdGlvbiBvZiBkYXRhLlxuICAgICAgICBjb25zdCBvbGRidWYgPSB0aGlzLiNidWY7XG4gICAgICAgIGNvbnN0IG5ld2J1ZiA9IHRoaXMuI2J1Zi5zbGljZSgwKTtcbiAgICAgICAgdGhpcy4jYnVmID0gbmV3YnVmO1xuICAgICAgICB0aHJvdyBuZXcgQnVmZmVyRnVsbEVycm9yKG9sZGJ1Zik7XG4gICAgICB9XG5cbiAgICAgIHMgPSB0aGlzLiN3IC0gdGhpcy4jcjsgLy8gZG8gbm90IHJlc2NhbiBhcmVhIHdlIHNjYW5uZWQgYmVmb3JlXG5cbiAgICAgIC8vIEJ1ZmZlciBpcyBub3QgZnVsbC5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuI2ZpbGwoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgUGFydGlhbFJlYWRFcnJvcikge1xuICAgICAgICAgIGVyci5wYXJ0aWFsID0gc2xpY2U7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICBjb25zdCBlID0gbmV3IFBhcnRpYWxSZWFkRXJyb3IoKTtcbiAgICAgICAgICBlLnBhcnRpYWwgPSBzbGljZTtcbiAgICAgICAgICBlLnN0YWNrID0gZXJyLnN0YWNrO1xuICAgICAgICAgIGUubWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgICAgICAgIGUuY2F1c2UgPSBlcnIuY2F1c2U7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgbGFzdCBieXRlLCBpZiBhbnkuXG4gICAgLy8gY29uc3QgaSA9IHNsaWNlLmJ5dGVMZW5ndGggLSAxO1xuICAgIC8vIGlmIChpID49IDApIHtcbiAgICAvLyAgIHRoaXMubGFzdEJ5dGUgPSBzbGljZVtpXTtcbiAgICAvLyAgIHRoaXMubGFzdENoYXJTaXplID0gLTFcbiAgICAvLyB9XG5cbiAgICByZXR1cm4gc2xpY2U7XG4gIH1cblxuICAvKiogYHBlZWsoKWAgcmV0dXJucyB0aGUgbmV4dCBgbmAgYnl0ZXMgd2l0aG91dCBhZHZhbmNpbmcgdGhlIHJlYWRlci4gVGhlXG4gICAqIGJ5dGVzIHN0b3AgYmVpbmcgdmFsaWQgYXQgdGhlIG5leHQgcmVhZCBjYWxsLlxuICAgKlxuICAgKiBXaGVuIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGlzIHJlYWNoZWQsIGJ1dCB0aGVyZSBhcmUgdW5yZWFkXG4gICAqIGJ5dGVzIGxlZnQgaW4gdGhlIGJ1ZmZlciwgdGhvc2UgYnl0ZXMgYXJlIHJldHVybmVkLiBJZiB0aGVyZSBhcmUgbm8gYnl0ZXNcbiAgICogbGVmdCBpbiB0aGUgYnVmZmVyLCBpdCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogSWYgYW4gZXJyb3IgaXMgZW5jb3VudGVyZWQgYmVmb3JlIGBuYCBieXRlcyBhcmUgYXZhaWxhYmxlLCBgcGVlaygpYCB0aHJvd3NcbiAgICogYW4gZXJyb3Igd2l0aCB0aGUgYHBhcnRpYWxgIHByb3BlcnR5IHNldCB0byBhIHNsaWNlIG9mIHRoZSBidWZmZXIgdGhhdFxuICAgKiBjb250YWlucyB0aGUgYnl0ZXMgdGhhdCB3ZXJlIGF2YWlsYWJsZSBiZWZvcmUgdGhlIGVycm9yIG9jY3VycmVkLlxuICAgKi9cbiAgYXN5bmMgcGVlayhuOiBudW1iZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgaWYgKG4gPCAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcIm5lZ2F0aXZlIGNvdW50XCIpO1xuICAgIH1cblxuICAgIGxldCBhdmFpbCA9IHRoaXMuI3cgLSB0aGlzLiNyO1xuICAgIHdoaWxlIChhdmFpbCA8IG4gJiYgYXZhaWwgPCB0aGlzLiNidWYuYnl0ZUxlbmd0aCAmJiAhdGhpcy4jZW9mKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLiNmaWxsKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFBhcnRpYWxSZWFkRXJyb3IpIHtcbiAgICAgICAgICBlcnIucGFydGlhbCA9IHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNyLCB0aGlzLiN3KTtcbiAgICAgICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgIGNvbnN0IGUgPSBuZXcgUGFydGlhbFJlYWRFcnJvcigpO1xuICAgICAgICAgIGUucGFydGlhbCA9IHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNyLCB0aGlzLiN3KTtcbiAgICAgICAgICBlLnN0YWNrID0gZXJyLnN0YWNrO1xuICAgICAgICAgIGUubWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgICAgICAgIGUuY2F1c2UgPSBlcnIuY2F1c2U7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIGF2YWlsID0gdGhpcy4jdyAtIHRoaXMuI3I7XG4gICAgfVxuXG4gICAgaWYgKGF2YWlsID09PSAwICYmIHRoaXMuI2VvZikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChhdmFpbCA8IG4gJiYgdGhpcy4jZW9mKSB7XG4gICAgICByZXR1cm4gdGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI3IsIHRoaXMuI3IgKyBhdmFpbCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbCA8IG4pIHtcbiAgICAgIHRocm93IG5ldyBCdWZmZXJGdWxsRXJyb3IodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI3IsIHRoaXMuI3cpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI3IsIHRoaXMuI3IgKyBuKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLE1BQU0sUUFBUSxzQkFBc0I7QUFDN0MsU0FBUyxJQUFJLFFBQVEsbUJBQW1CO0FBR3hDLE1BQU0sbUJBQW1CO0FBQ3pCLE1BQU0sZUFBZTtBQUNyQixNQUFNLDhCQUE4QjtBQUNwQyxNQUFNLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDM0IsTUFBTSxLQUFLLEtBQUssVUFBVSxDQUFDO0FBRTNCLE9BQU8sTUFBTSx3QkFBd0I7SUFDMUIsS0FBeUI7SUFDbEMsWUFBbUIsUUFBcUI7UUFDdEMsS0FBSyxDQUFDO3VCQURXO2FBRFYsT0FBTztJQUdoQjtJQUZtQjtBQUdyQixDQUFDO0FBRUQsT0FBTyxNQUFNLHlCQUF5QjtJQUMzQixPQUFPLG1CQUFtQjtJQUNuQyxRQUFxQjtJQUNyQixhQUFjO1FBQ1osS0FBSyxDQUFDO0lBQ1I7QUFDRixDQUFDO0FBUUQsT0FBTyxNQUFNO0lBQ1gsQ0FBQyxHQUFHLENBQWM7SUFDbEIsQ0FBQyxFQUFFLENBQVU7SUFDYixDQUFDLENBQUMsR0FBRyxFQUFFO0lBQ1AsQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUNQLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNiLDRCQUE0QjtJQUM1QixnQ0FBZ0M7SUFFaEMsK0NBQStDLEdBQy9DLE9BQU8sT0FBTyxDQUFTLEVBQUUsT0FBZSxnQkFBZ0IsRUFBYTtRQUNuRSxPQUFPLGFBQWEsWUFBWSxJQUFJLElBQUksVUFBVSxHQUFHLEtBQUs7SUFDNUQ7SUFFQSxZQUFZLEVBQVUsRUFBRSxPQUFlLGdCQUFnQixDQUFFO1FBQ3ZELElBQUksT0FBTyxjQUFjO1lBQ3ZCLE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksV0FBVyxPQUFPO0lBQ3BDO0lBRUEsd0RBQXdELEdBQ3hELE9BQWU7UUFDYixPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVO0lBQzdCO0lBRUEsV0FBbUI7UUFDakIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQjtJQUVBLHFDQUFxQztJQUNyQyxDQUFDLElBQUksR0FBRyxVQUFZO1FBQ2xCLG9DQUFvQztRQUNwQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO1lBQ2YsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztRQUNaLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFO1lBQ25DLE1BQU0sTUFBTSxvQ0FBb0M7UUFDbEQsQ0FBQztRQUVELGdEQUFnRDtRQUNoRCxJQUFLLElBQUksSUFBSSw2QkFBNkIsSUFBSSxHQUFHLElBQUs7WUFDcEQsTUFBTSxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxPQUFPLElBQUksRUFBRTtnQkFDZixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSTtnQkFDaEI7WUFDRixDQUFDO1lBQ0QsT0FBTyxNQUFNLEdBQUc7WUFDaEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ1gsSUFBSSxLQUFLLEdBQUc7Z0JBQ1Y7WUFDRixDQUFDO1FBQ0g7UUFFQSxNQUFNLElBQUksTUFDUixDQUFDLGtCQUFrQixFQUFFLDRCQUE0QixhQUFhLENBQUMsRUFDL0Q7SUFDSixFQUFFO0lBRUY7O0dBRUMsR0FDRCxNQUFNLENBQVMsRUFBRTtRQUNmLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDekI7SUFFQSxDQUFDLEtBQUssR0FBRyxDQUFDLEtBQWlCLEtBQWU7UUFDeEMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHO1FBQ1osSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUs7SUFDakIsc0JBQXNCO0lBQ3RCLDBCQUEwQjtJQUM1QixFQUFFO0lBRUY7Ozs7O0dBS0MsR0FDRCxNQUFNLEtBQUssQ0FBYSxFQUEwQjtRQUNoRCxJQUFJLEtBQW9CLEVBQUUsVUFBVTtRQUNwQyxJQUFJLEVBQUUsVUFBVSxLQUFLLEdBQUcsT0FBTztRQUUvQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkIsSUFBSSxFQUFFLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFO2dCQUN4Qyw0QkFBNEI7Z0JBQzVCLHNDQUFzQztnQkFDdEMsTUFBTSxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDL0IsTUFBTSxRQUFRLE1BQU07Z0JBQ3BCLE9BQU8sU0FBUyxHQUFHO2dCQUNuQixzQkFBc0I7Z0JBQ3RCLHFDQUFxQztnQkFDckMsNEJBQTRCO2dCQUM1QixJQUFJO2dCQUNKLE9BQU87WUFDVCxDQUFDO1lBRUQsWUFBWTtZQUNaLHlDQUF5QztZQUN6QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDVixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDVixLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHO1lBQ2xDLElBQUksT0FBTyxLQUFLLE9BQU8sSUFBSSxFQUFFLE9BQU87WUFDcEMsT0FBTyxNQUFNLEdBQUc7WUFDaEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQ2IsQ0FBQztRQUVELHlCQUF5QjtRQUN6QixNQUFNLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztRQUM3RCxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDWCx3Q0FBd0M7UUFDeEMsMEJBQTBCO1FBQzFCLE9BQU87SUFDVDtJQUVBOzs7Ozs7Ozs7Ozs7O0dBYUMsR0FDRCxNQUFNLFNBQVMsQ0FBYSxFQUE4QjtRQUN4RCxJQUFJLFlBQVk7UUFDaEIsTUFBTyxZQUFZLEVBQUUsTUFBTSxDQUFFO1lBQzNCLElBQUk7Z0JBQ0YsTUFBTSxLQUFLLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQztnQkFDdEMsSUFBSSxPQUFPLElBQUksRUFBRTtvQkFDZixJQUFJLGNBQWMsR0FBRzt3QkFDbkIsT0FBTyxJQUFJO29CQUNiLE9BQU87d0JBQ0wsTUFBTSxJQUFJLG1CQUFtQjtvQkFDL0IsQ0FBQztnQkFDSCxDQUFDO2dCQUNELGFBQWE7WUFDZixFQUFFLE9BQU8sS0FBSztnQkFDWixJQUFJLGVBQWUsa0JBQWtCO29CQUNuQyxJQUFJLE9BQU8sR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHO2dCQUM5QixPQUFPLElBQUksZUFBZSxPQUFPO29CQUMvQixNQUFNLElBQUksSUFBSTtvQkFDZCxFQUFFLE9BQU8sR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHO29CQUMxQixFQUFFLEtBQUssR0FBRyxJQUFJLEtBQUs7b0JBQ25CLEVBQUUsT0FBTyxHQUFHLElBQUksT0FBTztvQkFDdkIsRUFBRSxLQUFLLEdBQUcsSUFBSSxLQUFLO29CQUNuQixNQUFNLElBQUk7Z0JBQ1osQ0FBQztnQkFDRCxNQUFNLElBQUk7WUFDWjtRQUNGO1FBQ0EsT0FBTztJQUNUO0lBRUEsOENBQThDLEdBQzlDLE1BQU0sV0FBbUM7UUFDdkMsTUFBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFFO1lBQzFCLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLE9BQU8sSUFBSTtZQUMxQixNQUFNLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxtQkFBbUI7UUFDekM7UUFDQSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ1AscUJBQXFCO1FBQ3JCLE9BQU87SUFDVDtJQUVBOzs7Ozs7OztHQVFDLEdBQ0QsTUFBTSxXQUFXLEtBQWEsRUFBMEI7UUFDdEQsSUFBSSxNQUFNLE1BQU0sS0FBSyxHQUFHO1lBQ3RCLE1BQU0sSUFBSSxNQUFNLDBDQUEwQztRQUM1RCxDQUFDO1FBQ0QsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLFVBQVUsQ0FBQztRQUNyRCxJQUFJLFdBQVcsSUFBSSxFQUFFLE9BQU8sSUFBSTtRQUNoQyxPQUFPLElBQUksY0FBYyxNQUFNLENBQUM7SUFDbEM7SUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUJDLEdBQ0QsTUFBTSxXQUEyQztRQUMvQyxJQUFJLE9BQTBCLElBQUk7UUFFbEMsSUFBSTtZQUNGLE9BQU8sTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzlCLEVBQUUsT0FBTyxLQUFLO1lBQ1osSUFBSTtZQUNKLElBQUksZUFBZSxrQkFBa0I7Z0JBQ25DLFVBQVUsSUFBSSxPQUFPO2dCQUNyQixPQUNFLG1CQUFtQixZQUNuQjtZQUVKLENBQUM7WUFFRCx5RUFBeUU7WUFDekUsNkRBQTZEO1lBQzdELElBQUksQ0FBQyxDQUFDLGVBQWUsZUFBZSxHQUFHO2dCQUNyQyxNQUFNLElBQUk7WUFDWixDQUFDO1lBRUQsVUFBVSxJQUFJLE9BQU87WUFFckIscURBQXFEO1lBQ3JELElBQ0UsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FDZCxRQUFRLFVBQVUsR0FBRyxLQUNyQixPQUFPLENBQUMsUUFBUSxVQUFVLEdBQUcsRUFBRSxLQUFLLElBQ3BDO2dCQUNBLGtEQUFrRDtnQkFDbEQsa0RBQWtEO2dCQUNsRCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO2dCQUNwQixJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNQLFVBQVUsUUFBUSxRQUFRLENBQUMsR0FBRyxRQUFRLFVBQVUsR0FBRztZQUNyRCxDQUFDO1lBRUQsSUFBSSxTQUFTO2dCQUNYLE9BQU87b0JBQUUsTUFBTTtvQkFBUyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRztnQkFBQztZQUMzQyxDQUFDO1FBQ0g7UUFFQSxJQUFJLFNBQVMsSUFBSSxFQUFFO1lBQ2pCLE9BQU8sSUFBSTtRQUNiLENBQUM7UUFFRCxJQUFJLEtBQUssVUFBVSxLQUFLLEdBQUc7WUFDekIsT0FBTztnQkFBRTtnQkFBTSxNQUFNLEtBQUs7WUFBQztRQUM3QixDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsS0FBSyxVQUFVLEdBQUcsRUFBRSxJQUFJLElBQUk7WUFDbkMsSUFBSSxPQUFPO1lBQ1gsSUFBSSxLQUFLLFVBQVUsR0FBRyxLQUFLLElBQUksQ0FBQyxLQUFLLFVBQVUsR0FBRyxFQUFFLEtBQUssSUFBSTtnQkFDM0QsT0FBTztZQUNULENBQUM7WUFDRCxPQUFPLEtBQUssUUFBUSxDQUFDLEdBQUcsS0FBSyxVQUFVLEdBQUc7UUFDNUMsQ0FBQztRQUNELE9BQU87WUFBRTtZQUFNLE1BQU0sS0FBSztRQUFDO0lBQzdCO0lBRUE7Ozs7Ozs7Ozs7Ozs7OztHQWVDLEdBQ0QsTUFBTSxVQUFVLEtBQWEsRUFBOEI7UUFDekQsSUFBSSxJQUFJLEdBQUcscUJBQXFCO1FBQ2hDLElBQUk7UUFFSixNQUFPLElBQUksQ0FBRTtZQUNYLGlCQUFpQjtZQUNqQixJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDO1lBQ3pELElBQUksS0FBSyxHQUFHO2dCQUNWLEtBQUs7Z0JBQ0wsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSTtnQkFDbEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUk7Z0JBQ2YsS0FBTTtZQUNSLENBQUM7WUFFRCxPQUFPO1lBQ1AsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2IsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUN2QixPQUFPLElBQUk7Z0JBQ2IsQ0FBQztnQkFDRCxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixLQUFNO1lBQ1IsQ0FBQztZQUVELGVBQWU7WUFDZixJQUFJLElBQUksQ0FBQyxRQUFRLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLG9HQUFvRztnQkFDcEcsTUFBTSxTQUFTLElBQUksQ0FBQyxDQUFDLEdBQUc7Z0JBQ3hCLE1BQU0sU0FBUyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO2dCQUMvQixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUc7Z0JBQ1osTUFBTSxJQUFJLGdCQUFnQixRQUFRO1lBQ3BDLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsdUNBQXVDO1lBRTlELHNCQUFzQjtZQUN0QixJQUFJO2dCQUNGLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSTtZQUNsQixFQUFFLE9BQU8sS0FBSztnQkFDWixJQUFJLGVBQWUsa0JBQWtCO29CQUNuQyxJQUFJLE9BQU8sR0FBRztnQkFDaEIsT0FBTyxJQUFJLGVBQWUsT0FBTztvQkFDL0IsTUFBTSxJQUFJLElBQUk7b0JBQ2QsRUFBRSxPQUFPLEdBQUc7b0JBQ1osRUFBRSxLQUFLLEdBQUcsSUFBSSxLQUFLO29CQUNuQixFQUFFLE9BQU8sR0FBRyxJQUFJLE9BQU87b0JBQ3ZCLEVBQUUsS0FBSyxHQUFHLElBQUksS0FBSztvQkFDbkIsTUFBTSxJQUFJO2dCQUNaLENBQUM7Z0JBQ0QsTUFBTSxJQUFJO1lBQ1o7UUFDRjtRQUVBLDRCQUE0QjtRQUM1QixrQ0FBa0M7UUFDbEMsZ0JBQWdCO1FBQ2hCLDhCQUE4QjtRQUM5QiwyQkFBMkI7UUFDM0IsSUFBSTtRQUVKLE9BQU87SUFDVDtJQUVBOzs7Ozs7Ozs7O0dBVUMsR0FDRCxNQUFNLEtBQUssQ0FBUyxFQUE4QjtRQUNoRCxJQUFJLElBQUksR0FBRztZQUNULE1BQU0sTUFBTSxrQkFBa0I7UUFDaEMsQ0FBQztRQUVELElBQUksUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUU7WUFDOUQsSUFBSTtnQkFDRixNQUFNLElBQUksQ0FBQyxDQUFDLElBQUk7WUFDbEIsRUFBRSxPQUFPLEtBQUs7Z0JBQ1osSUFBSSxlQUFlLGtCQUFrQjtvQkFDbkMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLGVBQWUsT0FBTztvQkFDL0IsTUFBTSxJQUFJLElBQUk7b0JBQ2QsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDL0MsRUFBRSxLQUFLLEdBQUcsSUFBSSxLQUFLO29CQUNuQixFQUFFLE9BQU8sR0FBRyxJQUFJLE9BQU87b0JBQ3ZCLEVBQUUsS0FBSyxHQUFHLElBQUksS0FBSztvQkFDbkIsTUFBTSxJQUFJO2dCQUNaLENBQUM7Z0JBQ0QsTUFBTSxJQUFJO1lBQ1o7WUFDQSxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNCO1FBRUEsSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFO1lBQzVCLE9BQU8sSUFBSTtRQUNiLE9BQU8sSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO1FBQy9DLE9BQU8sSUFBSSxRQUFRLEdBQUc7WUFDcEIsTUFBTSxJQUFJLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7UUFDbEUsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0lBQy9DO0FBQ0YsQ0FBQyJ9