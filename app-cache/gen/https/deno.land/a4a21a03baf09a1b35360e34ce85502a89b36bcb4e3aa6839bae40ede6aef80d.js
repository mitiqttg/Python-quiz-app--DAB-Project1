// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/*
 * Adapted to deno from:
 *
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.9.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */ const HEX_CHARS = "0123456789abcdef".split("");
const EXTRA = [
    -2147483648,
    8388608,
    32768,
    128
];
const SHIFT = [
    24,
    16,
    8,
    0
];
const K = [
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2
];
const blocks = [];
export class Sha256 {
    #block;
    #blocks;
    #bytes;
    #finalized;
    #first;
    #h0;
    #h1;
    #h2;
    #h3;
    #h4;
    #h5;
    #h6;
    #h7;
    #hashed;
    #hBytes;
    #is224;
    #lastByteIndex = 0;
    #start;
    constructor(is224 = false, sharedMemory = false){
        this.init(is224, sharedMemory);
    }
    init(is224, sharedMemory) {
        if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.#blocks = blocks;
        } else {
            this.#blocks = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ];
        }
        if (is224) {
            this.#h0 = 0xc1059ed8;
            this.#h1 = 0x367cd507;
            this.#h2 = 0x3070dd17;
            this.#h3 = 0xf70e5939;
            this.#h4 = 0xffc00b31;
            this.#h5 = 0x68581511;
            this.#h6 = 0x64f98fa7;
            this.#h7 = 0xbefa4fa4;
        } else {
            // 256
            this.#h0 = 0x6a09e667;
            this.#h1 = 0xbb67ae85;
            this.#h2 = 0x3c6ef372;
            this.#h3 = 0xa54ff53a;
            this.#h4 = 0x510e527f;
            this.#h5 = 0x9b05688c;
            this.#h6 = 0x1f83d9ab;
            this.#h7 = 0x5be0cd19;
        }
        this.#block = this.#start = this.#bytes = this.#hBytes = 0;
        this.#finalized = this.#hashed = false;
        this.#first = true;
        this.#is224 = is224;
    }
    /** Update hash
   *
   * @param message The message you want to hash.
   */ update(message) {
        if (this.#finalized) {
            return this;
        }
        let msg;
        if (message instanceof ArrayBuffer) {
            msg = new Uint8Array(message);
        } else {
            msg = message;
        }
        let index = 0;
        const length = msg.length;
        const blocks = this.#blocks;
        while(index < length){
            let i;
            if (this.#hashed) {
                this.#hashed = false;
                blocks[0] = this.#block;
                blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }
            if (typeof msg !== "string") {
                for(i = this.#start; index < length && i < 64; ++index){
                    blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                }
            } else {
                for(i = this.#start; index < length && i < 64; ++index){
                    let code = msg.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[i++ & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    } else {
                        code = 0x10000 + ((code & 0x3ff) << 10 | msg.charCodeAt(++index) & 0x3ff);
                        blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    }
                }
            }
            this.#lastByteIndex = i;
            this.#bytes += i - this.#start;
            if (i >= 64) {
                this.#block = blocks[16];
                this.#start = i - 64;
                this.hash();
                this.#hashed = true;
            } else {
                this.#start = i;
            }
        }
        if (this.#bytes > 4294967295) {
            this.#hBytes += this.#bytes / 4294967296 << 0;
            this.#bytes = this.#bytes % 4294967296;
        }
        return this;
    }
    finalize() {
        if (this.#finalized) {
            return;
        }
        this.#finalized = true;
        const blocks = this.#blocks;
        const i = this.#lastByteIndex;
        blocks[16] = this.#block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.#block = blocks[16];
        if (i >= 56) {
            if (!this.#hashed) {
                this.hash();
            }
            blocks[0] = this.#block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.#hBytes << 3 | this.#bytes >>> 29;
        blocks[15] = this.#bytes << 3;
        this.hash();
    }
    hash() {
        let a = this.#h0;
        let b = this.#h1;
        let c = this.#h2;
        let d = this.#h3;
        let e = this.#h4;
        let f = this.#h5;
        let g = this.#h6;
        let h = this.#h7;
        const blocks = this.#blocks;
        let s0;
        let s1;
        let maj;
        let t1;
        let t2;
        let ch;
        let ab;
        let da;
        let cd;
        let bc;
        for(let j = 16; j < 64; ++j){
            // rightrotate
            t1 = blocks[j - 15];
            s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
            t1 = blocks[j - 2];
            s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
            blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }
        bc = b & c;
        for(let j = 0; j < 64; j += 4){
            if (this.#first) {
                if (this.#is224) {
                    ab = 300032;
                    t1 = blocks[0] - 1413257819;
                    h = t1 - 150054599 << 0;
                    d = t1 + 24177077 << 0;
                } else {
                    ab = 704751109;
                    t1 = blocks[0] - 210244248;
                    h = t1 - 1521486534 << 0;
                    d = t1 + 143694565 << 0;
                }
                this.#first = false;
            } else {
                s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
                s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
                ab = a & b;
                maj = ab ^ a & c ^ bc;
                ch = e & f ^ ~e & g;
                t1 = h + s1 + ch + K[j] + blocks[j];
                t2 = s0 + maj;
                h = d + t1 << 0;
                d = t1 + t2 << 0;
            }
            s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
            s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
            da = d & a;
            maj = da ^ d & b ^ ab;
            ch = h & e ^ ~h & f;
            t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
            s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
            cd = c & d;
            maj = cd ^ c & a ^ da;
            ch = g & h ^ ~g & e;
            t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
            s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
            bc = b & c;
            maj = bc ^ b & d ^ cd;
            ch = f & g ^ ~f & h;
            t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
        }
        this.#h0 = this.#h0 + a << 0;
        this.#h1 = this.#h1 + b << 0;
        this.#h2 = this.#h2 + c << 0;
        this.#h3 = this.#h3 + d << 0;
        this.#h4 = this.#h4 + e << 0;
        this.#h5 = this.#h5 + f << 0;
        this.#h6 = this.#h6 + g << 0;
        this.#h7 = this.#h7 + h << 0;
    }
    /** Return hash in hex string. */ hex() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        let hex = HEX_CHARS[h0 >> 28 & 0x0f] + HEX_CHARS[h0 >> 24 & 0x0f] + HEX_CHARS[h0 >> 20 & 0x0f] + HEX_CHARS[h0 >> 16 & 0x0f] + HEX_CHARS[h0 >> 12 & 0x0f] + HEX_CHARS[h0 >> 8 & 0x0f] + HEX_CHARS[h0 >> 4 & 0x0f] + HEX_CHARS[h0 & 0x0f] + HEX_CHARS[h1 >> 28 & 0x0f] + HEX_CHARS[h1 >> 24 & 0x0f] + HEX_CHARS[h1 >> 20 & 0x0f] + HEX_CHARS[h1 >> 16 & 0x0f] + HEX_CHARS[h1 >> 12 & 0x0f] + HEX_CHARS[h1 >> 8 & 0x0f] + HEX_CHARS[h1 >> 4 & 0x0f] + HEX_CHARS[h1 & 0x0f] + HEX_CHARS[h2 >> 28 & 0x0f] + HEX_CHARS[h2 >> 24 & 0x0f] + HEX_CHARS[h2 >> 20 & 0x0f] + HEX_CHARS[h2 >> 16 & 0x0f] + HEX_CHARS[h2 >> 12 & 0x0f] + HEX_CHARS[h2 >> 8 & 0x0f] + HEX_CHARS[h2 >> 4 & 0x0f] + HEX_CHARS[h2 & 0x0f] + HEX_CHARS[h3 >> 28 & 0x0f] + HEX_CHARS[h3 >> 24 & 0x0f] + HEX_CHARS[h3 >> 20 & 0x0f] + HEX_CHARS[h3 >> 16 & 0x0f] + HEX_CHARS[h3 >> 12 & 0x0f] + HEX_CHARS[h3 >> 8 & 0x0f] + HEX_CHARS[h3 >> 4 & 0x0f] + HEX_CHARS[h3 & 0x0f] + HEX_CHARS[h4 >> 28 & 0x0f] + HEX_CHARS[h4 >> 24 & 0x0f] + HEX_CHARS[h4 >> 20 & 0x0f] + HEX_CHARS[h4 >> 16 & 0x0f] + HEX_CHARS[h4 >> 12 & 0x0f] + HEX_CHARS[h4 >> 8 & 0x0f] + HEX_CHARS[h4 >> 4 & 0x0f] + HEX_CHARS[h4 & 0x0f] + HEX_CHARS[h5 >> 28 & 0x0f] + HEX_CHARS[h5 >> 24 & 0x0f] + HEX_CHARS[h5 >> 20 & 0x0f] + HEX_CHARS[h5 >> 16 & 0x0f] + HEX_CHARS[h5 >> 12 & 0x0f] + HEX_CHARS[h5 >> 8 & 0x0f] + HEX_CHARS[h5 >> 4 & 0x0f] + HEX_CHARS[h5 & 0x0f] + HEX_CHARS[h6 >> 28 & 0x0f] + HEX_CHARS[h6 >> 24 & 0x0f] + HEX_CHARS[h6 >> 20 & 0x0f] + HEX_CHARS[h6 >> 16 & 0x0f] + HEX_CHARS[h6 >> 12 & 0x0f] + HEX_CHARS[h6 >> 8 & 0x0f] + HEX_CHARS[h6 >> 4 & 0x0f] + HEX_CHARS[h6 & 0x0f];
        if (!this.#is224) {
            hex += HEX_CHARS[h7 >> 28 & 0x0f] + HEX_CHARS[h7 >> 24 & 0x0f] + HEX_CHARS[h7 >> 20 & 0x0f] + HEX_CHARS[h7 >> 16 & 0x0f] + HEX_CHARS[h7 >> 12 & 0x0f] + HEX_CHARS[h7 >> 8 & 0x0f] + HEX_CHARS[h7 >> 4 & 0x0f] + HEX_CHARS[h7 & 0x0f];
        }
        return hex;
    }
    /** Return hash in hex string. */ toString() {
        return this.hex();
    }
    /** Return hash in integer array. */ digest() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        const arr = [
            h0 >> 24 & 0xff,
            h0 >> 16 & 0xff,
            h0 >> 8 & 0xff,
            h0 & 0xff,
            h1 >> 24 & 0xff,
            h1 >> 16 & 0xff,
            h1 >> 8 & 0xff,
            h1 & 0xff,
            h2 >> 24 & 0xff,
            h2 >> 16 & 0xff,
            h2 >> 8 & 0xff,
            h2 & 0xff,
            h3 >> 24 & 0xff,
            h3 >> 16 & 0xff,
            h3 >> 8 & 0xff,
            h3 & 0xff,
            h4 >> 24 & 0xff,
            h4 >> 16 & 0xff,
            h4 >> 8 & 0xff,
            h4 & 0xff,
            h5 >> 24 & 0xff,
            h5 >> 16 & 0xff,
            h5 >> 8 & 0xff,
            h5 & 0xff,
            h6 >> 24 & 0xff,
            h6 >> 16 & 0xff,
            h6 >> 8 & 0xff,
            h6 & 0xff
        ];
        if (!this.#is224) {
            arr.push(h7 >> 24 & 0xff, h7 >> 16 & 0xff, h7 >> 8 & 0xff, h7 & 0xff);
        }
        return arr;
    }
    /** Return hash in integer array. */ array() {
        return this.digest();
    }
    /** Return hash in ArrayBuffer. */ arrayBuffer() {
        this.finalize();
        const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
        const dataView = new DataView(buffer);
        dataView.setUint32(0, this.#h0);
        dataView.setUint32(4, this.#h1);
        dataView.setUint32(8, this.#h2);
        dataView.setUint32(12, this.#h3);
        dataView.setUint32(16, this.#h4);
        dataView.setUint32(20, this.#h5);
        dataView.setUint32(24, this.#h6);
        if (!this.#is224) {
            dataView.setUint32(28, this.#h7);
        }
        return buffer;
    }
}
export class HmacSha256 extends Sha256 {
    #inner;
    #is224;
    #oKeyPad;
    #sharedMemory;
    constructor(secretKey, is224 = false, sharedMemory = false){
        super(is224, sharedMemory);
        let key;
        if (typeof secretKey === "string") {
            const bytes = [];
            const length = secretKey.length;
            let index = 0;
            for(let i = 0; i < length; ++i){
                let code = secretKey.charCodeAt(i);
                if (code < 0x80) {
                    bytes[index++] = code;
                } else if (code < 0x800) {
                    bytes[index++] = 0xc0 | code >> 6;
                    bytes[index++] = 0x80 | code & 0x3f;
                } else if (code < 0xd800 || code >= 0xe000) {
                    bytes[index++] = 0xe0 | code >> 12;
                    bytes[index++] = 0x80 | code >> 6 & 0x3f;
                    bytes[index++] = 0x80 | code & 0x3f;
                } else {
                    code = 0x10000 + ((code & 0x3ff) << 10 | secretKey.charCodeAt(++i) & 0x3ff);
                    bytes[index++] = 0xf0 | code >> 18;
                    bytes[index++] = 0x80 | code >> 12 & 0x3f;
                    bytes[index++] = 0x80 | code >> 6 & 0x3f;
                    bytes[index++] = 0x80 | code & 0x3f;
                }
            }
            key = bytes;
        } else {
            if (secretKey instanceof ArrayBuffer) {
                key = new Uint8Array(secretKey);
            } else {
                key = secretKey;
            }
        }
        if (key.length > 64) {
            key = new Sha256(is224, true).update(key).array();
        }
        const oKeyPad = [];
        const iKeyPad = [];
        for(let i = 0; i < 64; ++i){
            const b = key[i] || 0;
            oKeyPad[i] = 0x5c ^ b;
            iKeyPad[i] = 0x36 ^ b;
        }
        this.update(iKeyPad);
        this.#oKeyPad = oKeyPad;
        this.#inner = true;
        this.#is224 = is224;
        this.#sharedMemory = sharedMemory;
    }
    finalize() {
        super.finalize();
        if (this.#inner) {
            this.#inner = false;
            const innerHash = this.array();
            super.init(this.#is224, this.#sharedMemory);
            this.update(this.#oKeyPad);
            this.update(innerHash);
            super.finalize();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL2hhc2gvc2hhMjU2LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qXG4gKiBBZGFwdGVkIHRvIGRlbm8gZnJvbTpcbiAqXG4gKiBbanMtc2hhMjU2XXtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZW1uMTc4L2pzLXNoYTI1Nn1cbiAqXG4gKiBAdmVyc2lvbiAwLjkuMFxuICogQGF1dGhvciBDaGVuLCBZaS1DeXVhbiBbZW1uMTc4QGdtYWlsLmNvbV1cbiAqIEBjb3B5cmlnaHQgQ2hlbiwgWWktQ3l1YW4gMjAxNC0yMDE3XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG5leHBvcnQgdHlwZSBNZXNzYWdlID0gc3RyaW5nIHwgbnVtYmVyW10gfCBBcnJheUJ1ZmZlcjtcblxuY29uc3QgSEVYX0NIQVJTID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCIuc3BsaXQoXCJcIik7XG5jb25zdCBFWFRSQSA9IFstMjE0NzQ4MzY0OCwgODM4ODYwOCwgMzI3NjgsIDEyOF0gYXMgY29uc3Q7XG5jb25zdCBTSElGVCA9IFsyNCwgMTYsIDgsIDBdIGFzIGNvbnN0O1xuY29uc3QgSyA9IFtcbiAgMHg0MjhhMmY5OCxcbiAgMHg3MTM3NDQ5MSxcbiAgMHhiNWMwZmJjZixcbiAgMHhlOWI1ZGJhNSxcbiAgMHgzOTU2YzI1YixcbiAgMHg1OWYxMTFmMSxcbiAgMHg5MjNmODJhNCxcbiAgMHhhYjFjNWVkNSxcbiAgMHhkODA3YWE5OCxcbiAgMHgxMjgzNWIwMSxcbiAgMHgyNDMxODViZSxcbiAgMHg1NTBjN2RjMyxcbiAgMHg3MmJlNWQ3NCxcbiAgMHg4MGRlYjFmZSxcbiAgMHg5YmRjMDZhNyxcbiAgMHhjMTliZjE3NCxcbiAgMHhlNDliNjljMSxcbiAgMHhlZmJlNDc4NixcbiAgMHgwZmMxOWRjNixcbiAgMHgyNDBjYTFjYyxcbiAgMHgyZGU5MmM2ZixcbiAgMHg0YTc0ODRhYSxcbiAgMHg1Y2IwYTlkYyxcbiAgMHg3NmY5ODhkYSxcbiAgMHg5ODNlNTE1MixcbiAgMHhhODMxYzY2ZCxcbiAgMHhiMDAzMjdjOCxcbiAgMHhiZjU5N2ZjNyxcbiAgMHhjNmUwMGJmMyxcbiAgMHhkNWE3OTE0NyxcbiAgMHgwNmNhNjM1MSxcbiAgMHgxNDI5Mjk2NyxcbiAgMHgyN2I3MGE4NSxcbiAgMHgyZTFiMjEzOCxcbiAgMHg0ZDJjNmRmYyxcbiAgMHg1MzM4MGQxMyxcbiAgMHg2NTBhNzM1NCxcbiAgMHg3NjZhMGFiYixcbiAgMHg4MWMyYzkyZSxcbiAgMHg5MjcyMmM4NSxcbiAgMHhhMmJmZThhMSxcbiAgMHhhODFhNjY0YixcbiAgMHhjMjRiOGI3MCxcbiAgMHhjNzZjNTFhMyxcbiAgMHhkMTkyZTgxOSxcbiAgMHhkNjk5MDYyNCxcbiAgMHhmNDBlMzU4NSxcbiAgMHgxMDZhYTA3MCxcbiAgMHgxOWE0YzExNixcbiAgMHgxZTM3NmMwOCxcbiAgMHgyNzQ4Nzc0YyxcbiAgMHgzNGIwYmNiNSxcbiAgMHgzOTFjMGNiMyxcbiAgMHg0ZWQ4YWE0YSxcbiAgMHg1YjljY2E0ZixcbiAgMHg2ODJlNmZmMyxcbiAgMHg3NDhmODJlZSxcbiAgMHg3OGE1NjM2ZixcbiAgMHg4NGM4NzgxNCxcbiAgMHg4Y2M3MDIwOCxcbiAgMHg5MGJlZmZmYSxcbiAgMHhhNDUwNmNlYixcbiAgMHhiZWY5YTNmNyxcbiAgMHhjNjcxNzhmMixcbl0gYXMgY29uc3Q7XG5cbmNvbnN0IGJsb2NrczogbnVtYmVyW10gPSBbXTtcblxuZXhwb3J0IGNsYXNzIFNoYTI1NiB7XG4gICNibG9jayE6IG51bWJlcjtcbiAgI2Jsb2NrcyE6IG51bWJlcltdO1xuICAjYnl0ZXMhOiBudW1iZXI7XG4gICNmaW5hbGl6ZWQhOiBib29sZWFuO1xuICAjZmlyc3QhOiBib29sZWFuO1xuICAjaDAhOiBudW1iZXI7XG4gICNoMSE6IG51bWJlcjtcbiAgI2gyITogbnVtYmVyO1xuICAjaDMhOiBudW1iZXI7XG4gICNoNCE6IG51bWJlcjtcbiAgI2g1ITogbnVtYmVyO1xuICAjaDYhOiBudW1iZXI7XG4gICNoNyE6IG51bWJlcjtcbiAgI2hhc2hlZCE6IGJvb2xlYW47XG4gICNoQnl0ZXMhOiBudW1iZXI7XG4gICNpczIyNCE6IGJvb2xlYW47XG4gICNsYXN0Qnl0ZUluZGV4ID0gMDtcbiAgI3N0YXJ0ITogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGlzMjI0ID0gZmFsc2UsIHNoYXJlZE1lbW9yeSA9IGZhbHNlKSB7XG4gICAgdGhpcy5pbml0KGlzMjI0LCBzaGFyZWRNZW1vcnkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGluaXQoaXMyMjQ6IGJvb2xlYW4sIHNoYXJlZE1lbW9yeTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChzaGFyZWRNZW1vcnkpIHtcbiAgICAgIGJsb2Nrc1swXSA9IGJsb2Nrc1sxNl0gPSBibG9ja3NbMV0gPSBibG9ja3NbMl0gPSBibG9ja3NbM10gPSBibG9ja3NbNF0gPVxuICAgICAgICBibG9ja3NbNV0gPSBibG9ja3NbNl0gPSBibG9ja3NbN10gPSBibG9ja3NbOF0gPSBibG9ja3NbOV0gPSBibG9ja3NbMTBdID1cbiAgICAgICAgICBibG9ja3NbMTFdID0gYmxvY2tzWzEyXSA9IGJsb2Nrc1sxM10gPSBibG9ja3NbMTRdID0gYmxvY2tzWzE1XSA9IDA7XG4gICAgICB0aGlzLiNibG9ja3MgPSBibG9ja3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2Jsb2NrcyA9IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTtcbiAgICB9XG5cbiAgICBpZiAoaXMyMjQpIHtcbiAgICAgIHRoaXMuI2gwID0gMHhjMTA1OWVkODtcbiAgICAgIHRoaXMuI2gxID0gMHgzNjdjZDUwNztcbiAgICAgIHRoaXMuI2gyID0gMHgzMDcwZGQxNztcbiAgICAgIHRoaXMuI2gzID0gMHhmNzBlNTkzOTtcbiAgICAgIHRoaXMuI2g0ID0gMHhmZmMwMGIzMTtcbiAgICAgIHRoaXMuI2g1ID0gMHg2ODU4MTUxMTtcbiAgICAgIHRoaXMuI2g2ID0gMHg2NGY5OGZhNztcbiAgICAgIHRoaXMuI2g3ID0gMHhiZWZhNGZhNDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gMjU2XG4gICAgICB0aGlzLiNoMCA9IDB4NmEwOWU2Njc7XG4gICAgICB0aGlzLiNoMSA9IDB4YmI2N2FlODU7XG4gICAgICB0aGlzLiNoMiA9IDB4M2M2ZWYzNzI7XG4gICAgICB0aGlzLiNoMyA9IDB4YTU0ZmY1M2E7XG4gICAgICB0aGlzLiNoNCA9IDB4NTEwZTUyN2Y7XG4gICAgICB0aGlzLiNoNSA9IDB4OWIwNTY4OGM7XG4gICAgICB0aGlzLiNoNiA9IDB4MWY4M2Q5YWI7XG4gICAgICB0aGlzLiNoNyA9IDB4NWJlMGNkMTk7XG4gICAgfVxuXG4gICAgdGhpcy4jYmxvY2sgPSB0aGlzLiNzdGFydCA9IHRoaXMuI2J5dGVzID0gdGhpcy4jaEJ5dGVzID0gMDtcbiAgICB0aGlzLiNmaW5hbGl6ZWQgPSB0aGlzLiNoYXNoZWQgPSBmYWxzZTtcbiAgICB0aGlzLiNmaXJzdCA9IHRydWU7XG4gICAgdGhpcy4jaXMyMjQgPSBpczIyNDtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgaGFzaFxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSB5b3Ugd2FudCB0byBoYXNoLlxuICAgKi9cbiAgdXBkYXRlKG1lc3NhZ2U6IE1lc3NhZ2UpOiB0aGlzIHtcbiAgICBpZiAodGhpcy4jZmluYWxpemVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBsZXQgbXNnOiBzdHJpbmcgfCBudW1iZXJbXSB8IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgbXNnID0gbmV3IFVpbnQ4QXJyYXkobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1zZyA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICBjb25zdCBsZW5ndGggPSBtc2cubGVuZ3RoO1xuICAgIGNvbnN0IGJsb2NrcyA9IHRoaXMuI2Jsb2NrcztcblxuICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGk6IG51bWJlcjtcbiAgICAgIGlmICh0aGlzLiNoYXNoZWQpIHtcbiAgICAgICAgdGhpcy4jaGFzaGVkID0gZmFsc2U7XG4gICAgICAgIGJsb2Nrc1swXSA9IHRoaXMuI2Jsb2NrO1xuICAgICAgICBibG9ja3NbMTZdID0gYmxvY2tzWzFdID0gYmxvY2tzWzJdID0gYmxvY2tzWzNdID0gYmxvY2tzWzRdID0gYmxvY2tzWzVdID1cbiAgICAgICAgICBibG9ja3NbNl0gPSBibG9ja3NbN10gPSBibG9ja3NbOF0gPSBibG9ja3NbOV0gPSBibG9ja3NbMTBdID1cbiAgICAgICAgICAgIGJsb2Nrc1sxMV0gPSBibG9ja3NbMTJdID0gYmxvY2tzWzEzXSA9IGJsb2Nrc1sxNF0gPSBibG9ja3NbMTVdID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBtc2cgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZm9yIChpID0gdGhpcy4jc3RhcnQ7IGluZGV4IDwgbGVuZ3RoICYmIGkgPCA2NDsgKytpbmRleCkge1xuICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9IG1zZ1tpbmRleF0gPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IHRoaXMuI3N0YXJ0OyBpbmRleCA8IGxlbmd0aCAmJiBpIDwgNjQ7ICsraW5kZXgpIHtcbiAgICAgICAgICBsZXQgY29kZSA9IG1zZy5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICBpZiAoY29kZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9IGNvZGUgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHg4MDApIHtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweGMwIHwgKGNvZGUgPj4gNikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoY29kZSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweGQ4MDAgfHwgY29kZSA+PSAweGUwMDApIHtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweGUwIHwgKGNvZGUgPj4gMTIpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKChjb2RlID4+IDYpICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoY29kZSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZSA9IDB4MTAwMDAgK1xuICAgICAgICAgICAgICAoKChjb2RlICYgMHgzZmYpIDw8IDEwKSB8IChtc2cuY2hhckNvZGVBdCgrK2luZGV4KSAmIDB4M2ZmKSk7XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHhmMCB8IChjb2RlID4+IDE4KSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8ICgoY29kZSA+PiAxMikgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8ICgoY29kZSA+PiA2KSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKGNvZGUgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuI2xhc3RCeXRlSW5kZXggPSBpO1xuICAgICAgdGhpcy4jYnl0ZXMgKz0gaSAtIHRoaXMuI3N0YXJ0O1xuICAgICAgaWYgKGkgPj0gNjQpIHtcbiAgICAgICAgdGhpcy4jYmxvY2sgPSBibG9ja3NbMTZdO1xuICAgICAgICB0aGlzLiNzdGFydCA9IGkgLSA2NDtcbiAgICAgICAgdGhpcy5oYXNoKCk7XG4gICAgICAgIHRoaXMuI2hhc2hlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiNzdGFydCA9IGk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLiNieXRlcyA+IDQyOTQ5NjcyOTUpIHtcbiAgICAgIHRoaXMuI2hCeXRlcyArPSAodGhpcy4jYnl0ZXMgLyA0Mjk0OTY3Mjk2KSA8PCAwO1xuICAgICAgdGhpcy4jYnl0ZXMgPSB0aGlzLiNieXRlcyAlIDQyOTQ5NjcyOTY7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHJvdGVjdGVkIGZpbmFsaXplKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLiNmaW5hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy4jZmluYWxpemVkID0gdHJ1ZTtcbiAgICBjb25zdCBibG9ja3MgPSB0aGlzLiNibG9ja3M7XG4gICAgY29uc3QgaSA9IHRoaXMuI2xhc3RCeXRlSW5kZXg7XG4gICAgYmxvY2tzWzE2XSA9IHRoaXMuI2Jsb2NrO1xuICAgIGJsb2Nrc1tpID4+IDJdIHw9IEVYVFJBW2kgJiAzXTtcbiAgICB0aGlzLiNibG9jayA9IGJsb2Nrc1sxNl07XG4gICAgaWYgKGkgPj0gNTYpIHtcbiAgICAgIGlmICghdGhpcy4jaGFzaGVkKSB7XG4gICAgICAgIHRoaXMuaGFzaCgpO1xuICAgICAgfVxuICAgICAgYmxvY2tzWzBdID0gdGhpcy4jYmxvY2s7XG4gICAgICBibG9ja3NbMTZdID0gYmxvY2tzWzFdID0gYmxvY2tzWzJdID0gYmxvY2tzWzNdID0gYmxvY2tzWzRdID0gYmxvY2tzWzVdID1cbiAgICAgICAgYmxvY2tzWzZdID0gYmxvY2tzWzddID0gYmxvY2tzWzhdID0gYmxvY2tzWzldID0gYmxvY2tzWzEwXSA9XG4gICAgICAgICAgYmxvY2tzWzExXSA9IGJsb2Nrc1sxMl0gPSBibG9ja3NbMTNdID0gYmxvY2tzWzE0XSA9IGJsb2Nrc1sxNV0gPSAwO1xuICAgIH1cbiAgICBibG9ja3NbMTRdID0gKHRoaXMuI2hCeXRlcyA8PCAzKSB8ICh0aGlzLiNieXRlcyA+Pj4gMjkpO1xuICAgIGJsb2Nrc1sxNV0gPSB0aGlzLiNieXRlcyA8PCAzO1xuICAgIHRoaXMuaGFzaCgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGhhc2goKTogdm9pZCB7XG4gICAgbGV0IGEgPSB0aGlzLiNoMDtcbiAgICBsZXQgYiA9IHRoaXMuI2gxO1xuICAgIGxldCBjID0gdGhpcy4jaDI7XG4gICAgbGV0IGQgPSB0aGlzLiNoMztcbiAgICBsZXQgZSA9IHRoaXMuI2g0O1xuICAgIGxldCBmID0gdGhpcy4jaDU7XG4gICAgbGV0IGcgPSB0aGlzLiNoNjtcbiAgICBsZXQgaCA9IHRoaXMuI2g3O1xuICAgIGNvbnN0IGJsb2NrcyA9IHRoaXMuI2Jsb2NrcztcbiAgICBsZXQgczA6IG51bWJlcjtcbiAgICBsZXQgczE6IG51bWJlcjtcbiAgICBsZXQgbWFqOiBudW1iZXI7XG4gICAgbGV0IHQxOiBudW1iZXI7XG4gICAgbGV0IHQyOiBudW1iZXI7XG4gICAgbGV0IGNoOiBudW1iZXI7XG4gICAgbGV0IGFiOiBudW1iZXI7XG4gICAgbGV0IGRhOiBudW1iZXI7XG4gICAgbGV0IGNkOiBudW1iZXI7XG4gICAgbGV0IGJjOiBudW1iZXI7XG5cbiAgICBmb3IgKGxldCBqID0gMTY7IGogPCA2NDsgKytqKSB7XG4gICAgICAvLyByaWdodHJvdGF0ZVxuICAgICAgdDEgPSBibG9ja3NbaiAtIDE1XTtcbiAgICAgIHMwID0gKCh0MSA+Pj4gNykgfCAodDEgPDwgMjUpKSBeICgodDEgPj4+IDE4KSB8ICh0MSA8PCAxNCkpIF4gKHQxID4+PiAzKTtcbiAgICAgIHQxID0gYmxvY2tzW2ogLSAyXTtcbiAgICAgIHMxID0gKCh0MSA+Pj4gMTcpIHwgKHQxIDw8IDE1KSkgXiAoKHQxID4+PiAxOSkgfCAodDEgPDwgMTMpKSBeXG4gICAgICAgICh0MSA+Pj4gMTApO1xuICAgICAgYmxvY2tzW2pdID0gKGJsb2Nrc1tqIC0gMTZdICsgczAgKyBibG9ja3NbaiAtIDddICsgczEpIDw8IDA7XG4gICAgfVxuXG4gICAgYmMgPSBiICYgYztcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDY0OyBqICs9IDQpIHtcbiAgICAgIGlmICh0aGlzLiNmaXJzdCkge1xuICAgICAgICBpZiAodGhpcy4jaXMyMjQpIHtcbiAgICAgICAgICBhYiA9IDMwMDAzMjtcbiAgICAgICAgICB0MSA9IGJsb2Nrc1swXSAtIDE0MTMyNTc4MTk7XG4gICAgICAgICAgaCA9ICh0MSAtIDE1MDA1NDU5OSkgPDwgMDtcbiAgICAgICAgICBkID0gKHQxICsgMjQxNzcwNzcpIDw8IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWIgPSA3MDQ3NTExMDk7XG4gICAgICAgICAgdDEgPSBibG9ja3NbMF0gLSAyMTAyNDQyNDg7XG4gICAgICAgICAgaCA9ICh0MSAtIDE1MjE0ODY1MzQpIDw8IDA7XG4gICAgICAgICAgZCA9ICh0MSArIDE0MzY5NDU2NSkgPDwgMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNmaXJzdCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczAgPSAoKGEgPj4+IDIpIHwgKGEgPDwgMzApKSBeXG4gICAgICAgICAgKChhID4+PiAxMykgfCAoYSA8PCAxOSkpIF5cbiAgICAgICAgICAoKGEgPj4+IDIyKSB8IChhIDw8IDEwKSk7XG4gICAgICAgIHMxID0gKChlID4+PiA2KSB8IChlIDw8IDI2KSkgXlxuICAgICAgICAgICgoZSA+Pj4gMTEpIHwgKGUgPDwgMjEpKSBeXG4gICAgICAgICAgKChlID4+PiAyNSkgfCAoZSA8PCA3KSk7XG4gICAgICAgIGFiID0gYSAmIGI7XG4gICAgICAgIG1haiA9IGFiIF4gKGEgJiBjKSBeIGJjO1xuICAgICAgICBjaCA9IChlICYgZikgXiAofmUgJiBnKTtcbiAgICAgICAgdDEgPSBoICsgczEgKyBjaCArIEtbal0gKyBibG9ja3Nbal07XG4gICAgICAgIHQyID0gczAgKyBtYWo7XG4gICAgICAgIGggPSAoZCArIHQxKSA8PCAwO1xuICAgICAgICBkID0gKHQxICsgdDIpIDw8IDA7XG4gICAgICB9XG4gICAgICBzMCA9ICgoZCA+Pj4gMikgfCAoZCA8PCAzMCkpIF5cbiAgICAgICAgKChkID4+PiAxMykgfCAoZCA8PCAxOSkpIF5cbiAgICAgICAgKChkID4+PiAyMikgfCAoZCA8PCAxMCkpO1xuICAgICAgczEgPSAoKGggPj4+IDYpIHwgKGggPDwgMjYpKSBeXG4gICAgICAgICgoaCA+Pj4gMTEpIHwgKGggPDwgMjEpKSBeXG4gICAgICAgICgoaCA+Pj4gMjUpIHwgKGggPDwgNykpO1xuICAgICAgZGEgPSBkICYgYTtcbiAgICAgIG1haiA9IGRhIF4gKGQgJiBiKSBeIGFiO1xuICAgICAgY2ggPSAoaCAmIGUpIF4gKH5oICYgZik7XG4gICAgICB0MSA9IGcgKyBzMSArIGNoICsgS1tqICsgMV0gKyBibG9ja3NbaiArIDFdO1xuICAgICAgdDIgPSBzMCArIG1hajtcbiAgICAgIGcgPSAoYyArIHQxKSA8PCAwO1xuICAgICAgYyA9ICh0MSArIHQyKSA8PCAwO1xuICAgICAgczAgPSAoKGMgPj4+IDIpIHwgKGMgPDwgMzApKSBeXG4gICAgICAgICgoYyA+Pj4gMTMpIHwgKGMgPDwgMTkpKSBeXG4gICAgICAgICgoYyA+Pj4gMjIpIHwgKGMgPDwgMTApKTtcbiAgICAgIHMxID0gKChnID4+PiA2KSB8IChnIDw8IDI2KSkgXlxuICAgICAgICAoKGcgPj4+IDExKSB8IChnIDw8IDIxKSkgXlxuICAgICAgICAoKGcgPj4+IDI1KSB8IChnIDw8IDcpKTtcbiAgICAgIGNkID0gYyAmIGQ7XG4gICAgICBtYWogPSBjZCBeIChjICYgYSkgXiBkYTtcbiAgICAgIGNoID0gKGcgJiBoKSBeICh+ZyAmIGUpO1xuICAgICAgdDEgPSBmICsgczEgKyBjaCArIEtbaiArIDJdICsgYmxvY2tzW2ogKyAyXTtcbiAgICAgIHQyID0gczAgKyBtYWo7XG4gICAgICBmID0gKGIgKyB0MSkgPDwgMDtcbiAgICAgIGIgPSAodDEgKyB0MikgPDwgMDtcbiAgICAgIHMwID0gKChiID4+PiAyKSB8IChiIDw8IDMwKSkgXlxuICAgICAgICAoKGIgPj4+IDEzKSB8IChiIDw8IDE5KSkgXlxuICAgICAgICAoKGIgPj4+IDIyKSB8IChiIDw8IDEwKSk7XG4gICAgICBzMSA9ICgoZiA+Pj4gNikgfCAoZiA8PCAyNikpIF5cbiAgICAgICAgKChmID4+PiAxMSkgfCAoZiA8PCAyMSkpIF5cbiAgICAgICAgKChmID4+PiAyNSkgfCAoZiA8PCA3KSk7XG4gICAgICBiYyA9IGIgJiBjO1xuICAgICAgbWFqID0gYmMgXiAoYiAmIGQpIF4gY2Q7XG4gICAgICBjaCA9IChmICYgZykgXiAofmYgJiBoKTtcbiAgICAgIHQxID0gZSArIHMxICsgY2ggKyBLW2ogKyAzXSArIGJsb2Nrc1tqICsgM107XG4gICAgICB0MiA9IHMwICsgbWFqO1xuICAgICAgZSA9IChhICsgdDEpIDw8IDA7XG4gICAgICBhID0gKHQxICsgdDIpIDw8IDA7XG4gICAgfVxuXG4gICAgdGhpcy4jaDAgPSAodGhpcy4jaDAgKyBhKSA8PCAwO1xuICAgIHRoaXMuI2gxID0gKHRoaXMuI2gxICsgYikgPDwgMDtcbiAgICB0aGlzLiNoMiA9ICh0aGlzLiNoMiArIGMpIDw8IDA7XG4gICAgdGhpcy4jaDMgPSAodGhpcy4jaDMgKyBkKSA8PCAwO1xuICAgIHRoaXMuI2g0ID0gKHRoaXMuI2g0ICsgZSkgPDwgMDtcbiAgICB0aGlzLiNoNSA9ICh0aGlzLiNoNSArIGYpIDw8IDA7XG4gICAgdGhpcy4jaDYgPSAodGhpcy4jaDYgKyBnKSA8PCAwO1xuICAgIHRoaXMuI2g3ID0gKHRoaXMuI2g3ICsgaCkgPDwgMDtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gaGFzaCBpbiBoZXggc3RyaW5nLiAqL1xuICBoZXgoKTogc3RyaW5nIHtcbiAgICB0aGlzLmZpbmFsaXplKCk7XG5cbiAgICBjb25zdCBoMCA9IHRoaXMuI2gwO1xuICAgIGNvbnN0IGgxID0gdGhpcy4jaDE7XG4gICAgY29uc3QgaDIgPSB0aGlzLiNoMjtcbiAgICBjb25zdCBoMyA9IHRoaXMuI2gzO1xuICAgIGNvbnN0IGg0ID0gdGhpcy4jaDQ7XG4gICAgY29uc3QgaDUgPSB0aGlzLiNoNTtcbiAgICBjb25zdCBoNiA9IHRoaXMuI2g2O1xuICAgIGNvbnN0IGg3ID0gdGhpcy4jaDc7XG5cbiAgICBsZXQgaGV4ID0gSEVYX0NIQVJTWyhoMCA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgwID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMCA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgwID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgwID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2gwICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2gxICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2gyICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2gzICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2g0ICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNSA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg1ID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDUgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNSA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg1ID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDUgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg1ID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2g1ICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNiA+PiAyOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg2ID4+IDI0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDYgPj4gMjApICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNiA+PiAxNikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg2ID4+IDEyKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDYgPj4gOCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg2ID4+IDQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTW2g2ICYgMHgwZl07XG4gICAgaWYgKCF0aGlzLiNpczIyNCkge1xuICAgICAgaGV4ICs9IEhFWF9DSEFSU1soaDcgPj4gMjgpICYgMHgwZl0gK1xuICAgICAgICBIRVhfQ0hBUlNbKGg3ID4+IDI0KSAmIDB4MGZdICtcbiAgICAgICAgSEVYX0NIQVJTWyhoNyA+PiAyMCkgJiAweDBmXSArXG4gICAgICAgIEhFWF9DSEFSU1soaDcgPj4gMTYpICYgMHgwZl0gK1xuICAgICAgICBIRVhfQ0hBUlNbKGg3ID4+IDEyKSAmIDB4MGZdICtcbiAgICAgICAgSEVYX0NIQVJTWyhoNyA+PiA4KSAmIDB4MGZdICtcbiAgICAgICAgSEVYX0NIQVJTWyhoNyA+PiA0KSAmIDB4MGZdICtcbiAgICAgICAgSEVYX0NIQVJTW2g3ICYgMHgwZl07XG4gICAgfVxuICAgIHJldHVybiBoZXg7XG4gIH1cblxuICAvKiogUmV0dXJuIGhhc2ggaW4gaGV4IHN0cmluZy4gKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5oZXgoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gaGFzaCBpbiBpbnRlZ2VyIGFycmF5LiAqL1xuICBkaWdlc3QoKTogbnVtYmVyW10ge1xuICAgIHRoaXMuZmluYWxpemUoKTtcblxuICAgIGNvbnN0IGgwID0gdGhpcy4jaDA7XG4gICAgY29uc3QgaDEgPSB0aGlzLiNoMTtcbiAgICBjb25zdCBoMiA9IHRoaXMuI2gyO1xuICAgIGNvbnN0IGgzID0gdGhpcy4jaDM7XG4gICAgY29uc3QgaDQgPSB0aGlzLiNoNDtcbiAgICBjb25zdCBoNSA9IHRoaXMuI2g1O1xuICAgIGNvbnN0IGg2ID0gdGhpcy4jaDY7XG4gICAgY29uc3QgaDcgPSB0aGlzLiNoNztcblxuICAgIGNvbnN0IGFyciA9IFtcbiAgICAgIChoMCA+PiAyNCkgJiAweGZmLFxuICAgICAgKGgwID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDAgPj4gOCkgJiAweGZmLFxuICAgICAgaDAgJiAweGZmLFxuICAgICAgKGgxID4+IDI0KSAmIDB4ZmYsXG4gICAgICAoaDEgPj4gMTYpICYgMHhmZixcbiAgICAgIChoMSA+PiA4KSAmIDB4ZmYsXG4gICAgICBoMSAmIDB4ZmYsXG4gICAgICAoaDIgPj4gMjQpICYgMHhmZixcbiAgICAgIChoMiA+PiAxNikgJiAweGZmLFxuICAgICAgKGgyID4+IDgpICYgMHhmZixcbiAgICAgIGgyICYgMHhmZixcbiAgICAgIChoMyA+PiAyNCkgJiAweGZmLFxuICAgICAgKGgzID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDMgPj4gOCkgJiAweGZmLFxuICAgICAgaDMgJiAweGZmLFxuICAgICAgKGg0ID4+IDI0KSAmIDB4ZmYsXG4gICAgICAoaDQgPj4gMTYpICYgMHhmZixcbiAgICAgIChoNCA+PiA4KSAmIDB4ZmYsXG4gICAgICBoNCAmIDB4ZmYsXG4gICAgICAoaDUgPj4gMjQpICYgMHhmZixcbiAgICAgIChoNSA+PiAxNikgJiAweGZmLFxuICAgICAgKGg1ID4+IDgpICYgMHhmZixcbiAgICAgIGg1ICYgMHhmZixcbiAgICAgIChoNiA+PiAyNCkgJiAweGZmLFxuICAgICAgKGg2ID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDYgPj4gOCkgJiAweGZmLFxuICAgICAgaDYgJiAweGZmLFxuICAgIF07XG4gICAgaWYgKCF0aGlzLiNpczIyNCkge1xuICAgICAgYXJyLnB1c2goXG4gICAgICAgIChoNyA+PiAyNCkgJiAweGZmLFxuICAgICAgICAoaDcgPj4gMTYpICYgMHhmZixcbiAgICAgICAgKGg3ID4+IDgpICYgMHhmZixcbiAgICAgICAgaDcgJiAweGZmLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gaGFzaCBpbiBpbnRlZ2VyIGFycmF5LiAqL1xuICBhcnJheSgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuZGlnZXN0KCk7XG4gIH1cblxuICAvKiogUmV0dXJuIGhhc2ggaW4gQXJyYXlCdWZmZXIuICovXG4gIGFycmF5QnVmZmVyKCk6IEFycmF5QnVmZmVyIHtcbiAgICB0aGlzLmZpbmFsaXplKCk7XG5cbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIodGhpcy4jaXMyMjQgPyAyOCA6IDMyKTtcbiAgICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigwLCB0aGlzLiNoMCk7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDQsIHRoaXMuI2gxKTtcbiAgICBkYXRhVmlldy5zZXRVaW50MzIoOCwgdGhpcy4jaDIpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigxMiwgdGhpcy4jaDMpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigxNiwgdGhpcy4jaDQpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigyMCwgdGhpcy4jaDUpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigyNCwgdGhpcy4jaDYpO1xuICAgIGlmICghdGhpcy4jaXMyMjQpIHtcbiAgICAgIGRhdGFWaWV3LnNldFVpbnQzMigyOCwgdGhpcy4jaDcpO1xuICAgIH1cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBIbWFjU2hhMjU2IGV4dGVuZHMgU2hhMjU2IHtcbiAgI2lubmVyOiBib29sZWFuO1xuICAjaXMyMjQ6IGJvb2xlYW47XG4gICNvS2V5UGFkOiBudW1iZXJbXTtcbiAgI3NoYXJlZE1lbW9yeTogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihzZWNyZXRLZXk6IE1lc3NhZ2UsIGlzMjI0ID0gZmFsc2UsIHNoYXJlZE1lbW9yeSA9IGZhbHNlKSB7XG4gICAgc3VwZXIoaXMyMjQsIHNoYXJlZE1lbW9yeSk7XG5cbiAgICBsZXQga2V5OiBudW1iZXJbXSB8IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBzZWNyZXRLZXkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnN0IGJ5dGVzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgY29uc3QgbGVuZ3RoID0gc2VjcmV0S2V5Lmxlbmd0aDtcbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgIGxldCBjb2RlID0gc2VjcmV0S2V5LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChjb2RlIDwgMHg4MCkge1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gY29kZTtcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHg4MDApIHtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4YzAgfCAoY29kZSA+PiA2KTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoY29kZSAmIDB4M2YpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweGQ4MDAgfHwgY29kZSA+PSAweGUwMDApIHtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ZTAgfCAoY29kZSA+PiAxMik7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKChjb2RlID4+IDYpICYgMHgzZik7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKGNvZGUgJiAweDNmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb2RlID0gMHgxMDAwMCArXG4gICAgICAgICAgICAoKChjb2RlICYgMHgzZmYpIDw8IDEwKSB8IChzZWNyZXRLZXkuY2hhckNvZGVBdCgrK2kpICYgMHgzZmYpKTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ZjAgfCAoY29kZSA+PiAxOCk7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKChjb2RlID4+IDEyKSAmIDB4M2YpO1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHg4MCB8ICgoY29kZSA+PiA2KSAmIDB4M2YpO1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHg4MCB8IChjb2RlICYgMHgzZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGtleSA9IGJ5dGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc2VjcmV0S2V5IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAga2V5ID0gbmV3IFVpbnQ4QXJyYXkoc2VjcmV0S2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleSA9IHNlY3JldEtleTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoa2V5Lmxlbmd0aCA+IDY0KSB7XG4gICAgICBrZXkgPSBuZXcgU2hhMjU2KGlzMjI0LCB0cnVlKS51cGRhdGUoa2V5KS5hcnJheSgpO1xuICAgIH1cblxuICAgIGNvbnN0IG9LZXlQYWQ6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgaUtleVBhZDogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY0OyArK2kpIHtcbiAgICAgIGNvbnN0IGIgPSBrZXlbaV0gfHwgMDtcbiAgICAgIG9LZXlQYWRbaV0gPSAweDVjIF4gYjtcbiAgICAgIGlLZXlQYWRbaV0gPSAweDM2IF4gYjtcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZShpS2V5UGFkKTtcbiAgICB0aGlzLiNvS2V5UGFkID0gb0tleVBhZDtcbiAgICB0aGlzLiNpbm5lciA9IHRydWU7XG4gICAgdGhpcy4jaXMyMjQgPSBpczIyNDtcbiAgICB0aGlzLiNzaGFyZWRNZW1vcnkgPSBzaGFyZWRNZW1vcnk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgZmluYWxpemUoKTogdm9pZCB7XG4gICAgc3VwZXIuZmluYWxpemUoKTtcbiAgICBpZiAodGhpcy4jaW5uZXIpIHtcbiAgICAgIHRoaXMuI2lubmVyID0gZmFsc2U7XG4gICAgICBjb25zdCBpbm5lckhhc2ggPSB0aGlzLmFycmF5KCk7XG4gICAgICBzdXBlci5pbml0KHRoaXMuI2lzMjI0LCB0aGlzLiNzaGFyZWRNZW1vcnkpO1xuICAgICAgdGhpcy51cGRhdGUodGhpcy4jb0tleVBhZCk7XG4gICAgICB0aGlzLnVwZGF0ZShpbm5lckhhc2gpO1xuICAgICAgc3VwZXIuZmluYWxpemUoKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Q0FTQyxHQUlELE1BQU0sWUFBWSxtQkFBbUIsS0FBSyxDQUFDO0FBQzNDLE1BQU0sUUFBUTtJQUFDLENBQUM7SUFBWTtJQUFTO0lBQU87Q0FBSTtBQUNoRCxNQUFNLFFBQVE7SUFBQztJQUFJO0lBQUk7SUFBRztDQUFFO0FBQzVCLE1BQU0sSUFBSTtJQUNSO0lB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QyxFQUFFLEdBQUcsS0FBTTtRQUM3QixJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsQUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBTTtRQUM3QixJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsQUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBTTtJQUMvQjtJQUVBLCtCQUErQixHQUMvQixNQUFjO1FBQ1osSUFBSSxDQUFDLFFBQVE7UUFFYixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtRQUVuQixJQUFJLE1BQU0sU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDcEMsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtBQUssR0FDM0IsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtBQUssR0FDM0IsU0FBUyxDQUFDLEtBQUssS0FBSyxHQUNwQixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLElBQUssS0FBSyxHQUMzQixTQUFTLENBQUMsQUFBQyxNQUFNLElBQUssS0FBSyxHQUMzQixTQUFTLENBQUMsS0FBSyxLQUFLLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sSUFBSyxLQUFLLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sSUFBSyxLQUFLLEdBQzNCLFNBQVMsQ0FBQyxLQUFLLEtBQUssR0FDcEIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtBQUssR0FDM0IsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtBQUssR0FDM0IsU0FBUyxDQUFDLEtBQUssS0FBSyxHQUNwQixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLEtBQU0sS0FBSyxHQUM1QixTQUFTLENBQUMsQUFBQyxNQUFNLElBQUssS0FBSyxHQUMzQixTQUFTLENBQUMsQUFBQyxNQUFNLElBQUssS0FBSyxHQUMzQixTQUFTLENBQUMsS0FBSyxLQUFLLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sSUFBSyxLQUFLLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLE1BQU0sSUFBSyxLQUFLLEdBQzNCLFNBQVMsQ0FBQyxLQUFLLEtBQUssR0FDcEIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtBQUssR0FDM0IsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtBQUssR0FDM0IsU0FBUyxDQUFDLEtBQUssS0FBSztRQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFO1lBQ2hCLE9BQU8sU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDakMsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxLQUFNLEtBQUssR0FDNUIsU0FBUyxDQUFDLEFBQUMsTUFBTSxJQUFLLEtB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