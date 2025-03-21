import { EOFError, ErrorReplyError, InvalidStateError } from "../errors.ts";
import { decoder, encoder } from "./_util.ts";
const IntegerReplyCode = ":".charCodeAt(0);
const BulkReplyCode = "$".charCodeAt(0);
const SimpleStringCode = "+".charCodeAt(0);
const ArrayReplyCode = "*".charCodeAt(0);
const ErrorReplyCode = "-".charCodeAt(0);
export async function readReply(reader) {
    const res = await reader.peek(1);
    if (res == null) {
        throw new EOFError();
    }
    const code = res[0];
    if (code === ErrorReplyCode) {
        await tryReadErrorReply(reader);
    }
    switch(code){
        case IntegerReplyCode:
            return IntegerReply.decode(reader);
        case SimpleStringCode:
            return SimpleStringReply.decode(reader);
        case BulkReplyCode:
            return BulkReply.decode(reader);
        case ArrayReplyCode:
            return ArrayReply.decode(reader);
        default:
            throw new InvalidStateError(`unknown code: '${String.fromCharCode(code)}' (${code})`);
    }
}
class BaseReply {
    constructor(code){
        this.code = code;
    }
    buffer() {
        throw createDecodeError(this.code, "buffer");
    }
    string() {
        throw createDecodeError(this.code, "string");
    }
    bulk() {
        throw createDecodeError(this.code, "bulk");
    }
    integer() {
        throw createDecodeError(this.code, "integer");
    }
    array() {
        throw createDecodeError(this.code, "array");
    }
    code;
}
class SimpleStringReply extends BaseReply {
    static async decode(reader) {
        const body = await readSimpleStringReplyBody(reader);
        return new SimpleStringReply(body);
    }
    #body;
    constructor(body){
        super(SimpleStringCode);
        this.#body = body;
    }
    bulk() {
        return this.string();
    }
    buffer() {
        return this.#body;
    }
    string() {
        return decoder.decode(this.#body);
    }
    value() {
        return this.string();
    }
}
class BulkReply extends BaseReply {
    static async decode(reader) {
        const body = await readBulkReplyBody(reader);
        return new BulkReply(body);
    }
    #body;
    constructor(body){
        super(BulkReplyCode);
        this.#body = body;
    }
    bulk() {
        return this.#body ? decoder.decode(this.#body) : null;
    }
    buffer() {
        return this.#body ?? new Uint8Array();
    }
    string() {
        return decoder.decode(this.#body ?? new Uint8Array());
    }
    value() {
        return this.bulk();
    }
}
class IntegerReply extends BaseReply {
    static async decode(reader) {
        const body = await readIntegerReplyBody(reader);
        return new IntegerReply(body);
    }
    #body;
    constructor(body){
        super(IntegerReplyCode);
        this.#body = body;
    }
    integer() {
        return parseInt(decoder.decode(this.#body));
    }
    string() {
        return this.integer().toString();
    }
    value() {
        return this.integer();
    }
}
class ArrayReply extends BaseReply {
    static async decode(reader) {
        const body = await readArrayReplyBody(reader, false);
        return new ArrayReply(body);
    }
    #body;
    constructor(body){
        super(ArrayReplyCode);
        this.#body = body;
    }
    array() {
        return this.#body;
    }
    value() {
        return this.array();
    }
}
async function readIntegerReplyBody(reader) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    return line.subarray(1, line.length);
}
async function readBulkReplyBody(reader) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    if (line[0] !== BulkReplyCode) {
        tryParseErrorReply(line);
    }
    const size = parseSize(line);
    if (size < 0) {
        // nil bulk reply
        return null;
    }
    const dest = new Uint8Array(size + 2);
    await reader.readFull(dest);
    return dest.subarray(0, dest.length - 2); // Strip CR and LF
}
async function readSimpleStringReplyBody(reader) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    if (line[0] !== SimpleStringCode) {
        tryParseErrorReply(line);
    }
    return line.subarray(1, line.length);
}
export async function readArrayReplyBody(reader, binaryMode = false) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    const argCount = parseSize(line);
    if (argCount === -1) {
        // `-1` indicates a null array
        return null;
    }
    const simpleStringReplyMethod = binaryMode ? "buffer" : "string";
    const bulkReplyMethod = binaryMode ? "buffer" : "bulk";
    const array = [];
    for(let i = 0; i < argCount; i++){
        const res = await reader.peek(1);
        if (res === null) {
            throw new EOFError();
        }
        const code = res[0];
        switch(code){
            case SimpleStringCode:
                {
                    const reply = await SimpleStringReply.decode(reader);
                    array.push(reply[simpleStringReplyMethod]());
                    break;
                }
            case BulkReplyCode:
                {
                    const reply = await BulkReply.decode(reader);
                    array.push(reply[bulkReplyMethod]());
                    break;
                }
            case IntegerReplyCode:
                {
                    const reply = await IntegerReply.decode(reader);
                    array.push(reply.integer());
                    break;
                }
            case ArrayReplyCode:
                {
                    const reply = await ArrayReply.decode(reader);
                    array.push(reply.value());
                    break;
                }
        }
    }
    return array;
}
export const okReply = new SimpleStringReply(encoder.encode("OK"));
function tryParseErrorReply(line) {
    const code = line[0];
    if (code === ErrorReplyCode) {
        throw new ErrorReplyError(decoder.decode(line));
    }
    throw new Error(`invalid line: ${line}`);
}
async function tryReadErrorReply(reader) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    tryParseErrorReply(line);
}
async function readLine(reader) {
    const result = await reader.readLine();
    if (result == null) {
        throw new InvalidStateError();
    }
    const { line  } = result;
    return line;
}
function parseSize(line) {
    const sizeStr = line.subarray(1, line.length);
    const size = parseInt(decoder.decode(sizeStr));
    return size;
}
function createDecodeError(code, expectedType) {
    return new InvalidStateError(`cannot decode '${String.fromCharCode(code)}' type as \`${expectedType}\` value`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMjkuMC9wcm90b2NvbC9yZXBseS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZSZWFkZXIgfSBmcm9tIFwiLi4vdmVuZG9yL2h0dHBzL2Rlbm8ubGFuZC9zdGQvaW8vYnVmX3JlYWRlci50c1wiO1xuaW1wb3J0IHR5cGUgKiBhcyB0eXBlcyBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgRU9GRXJyb3IsIEVycm9yUmVwbHlFcnJvciwgSW52YWxpZFN0YXRlRXJyb3IgfSBmcm9tIFwiLi4vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBkZWNvZGVyLCBlbmNvZGVyIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuY29uc3QgSW50ZWdlclJlcGx5Q29kZSA9IFwiOlwiLmNoYXJDb2RlQXQoMCk7XG5jb25zdCBCdWxrUmVwbHlDb2RlID0gXCIkXCIuY2hhckNvZGVBdCgwKTtcbmNvbnN0IFNpbXBsZVN0cmluZ0NvZGUgPSBcIitcIi5jaGFyQ29kZUF0KDApO1xuY29uc3QgQXJyYXlSZXBseUNvZGUgPSBcIipcIi5jaGFyQ29kZUF0KDApO1xuY29uc3QgRXJyb3JSZXBseUNvZGUgPSBcIi1cIi5jaGFyQ29kZUF0KDApO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFJlcGx5KHJlYWRlcjogQnVmUmVhZGVyKTogUHJvbWlzZTx0eXBlcy5SZWRpc1JlcGx5PiB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IHJlYWRlci5wZWVrKDEpO1xuICBpZiAocmVzID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRU9GRXJyb3IoKTtcbiAgfVxuXG4gIGNvbnN0IGNvZGUgPSByZXNbMF07XG4gIGlmIChjb2RlID09PSBFcnJvclJlcGx5Q29kZSkge1xuICAgIGF3YWl0IHRyeVJlYWRFcnJvclJlcGx5KHJlYWRlcik7XG4gIH1cblxuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIEludGVnZXJSZXBseUNvZGU6XG4gICAgICByZXR1cm4gSW50ZWdlclJlcGx5LmRlY29kZShyZWFkZXIpO1xuICAgIGNhc2UgU2ltcGxlU3RyaW5nQ29kZTpcbiAgICAgIHJldHVybiBTaW1wbGVTdHJpbmdSZXBseS5kZWNvZGUocmVhZGVyKTtcbiAgICBjYXNlIEJ1bGtSZXBseUNvZGU6XG4gICAgICByZXR1cm4gQnVsa1JlcGx5LmRlY29kZShyZWFkZXIpO1xuICAgIGNhc2UgQXJyYXlSZXBseUNvZGU6XG4gICAgICByZXR1cm4gQXJyYXlSZXBseS5kZWNvZGUocmVhZGVyKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKFxuICAgICAgICBgdW5rbm93biBjb2RlOiAnJHtTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpfScgKCR7Y29kZX0pYCxcbiAgICAgICk7XG4gIH1cbn1cblxuYWJzdHJhY3QgY2xhc3MgQmFzZVJlcGx5IGltcGxlbWVudHMgdHlwZXMuUmVkaXNSZXBseSB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGNvZGU6IG51bWJlcikge31cblxuICBidWZmZXIoKTogVWludDhBcnJheSB7XG4gICAgdGhyb3cgY3JlYXRlRGVjb2RlRXJyb3IodGhpcy5jb2RlLCBcImJ1ZmZlclwiKTtcbiAgfVxuXG4gIHN0cmluZygpOiBzdHJpbmcge1xuICAgIHRocm93IGNyZWF0ZURlY29kZUVycm9yKHRoaXMuY29kZSwgXCJzdHJpbmdcIik7XG4gIH1cblxuICBidWxrKCk6IHR5cGVzLkJ1bGsge1xuICAgIHRocm93IGNyZWF0ZURlY29kZUVycm9yKHRoaXMuY29kZSwgXCJidWxrXCIpO1xuICB9XG5cbiAgaW50ZWdlcigpOiB0eXBlcy5JbnRlZ2VyIHtcbiAgICB0aHJvdyBjcmVhdGVEZWNvZGVFcnJvcih0aGlzLmNvZGUsIFwiaW50ZWdlclwiKTtcbiAgfVxuXG4gIGFycmF5KCk6IHR5cGVzLkNvbmRpdGlvbmFsQXJyYXkgfCB0eXBlcy5CdWxrTmlsIHtcbiAgICB0aHJvdyBjcmVhdGVEZWNvZGVFcnJvcih0aGlzLmNvZGUsIFwiYXJyYXlcIik7XG4gIH1cblxuICBhYnN0cmFjdCB2YWx1ZSgpOiB0eXBlcy5SYXc7XG59XG5cbmNsYXNzIFNpbXBsZVN0cmluZ1JlcGx5IGV4dGVuZHMgQmFzZVJlcGx5IHtcbiAgc3RhdGljIGFzeW5jIGRlY29kZShyZWFkZXI6IEJ1ZlJlYWRlcik6IFByb21pc2U8dHlwZXMuUmVkaXNSZXBseT4ge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkU2ltcGxlU3RyaW5nUmVwbHlCb2R5KHJlYWRlcik7XG4gICAgcmV0dXJuIG5ldyBTaW1wbGVTdHJpbmdSZXBseShib2R5KTtcbiAgfVxuXG4gIHJlYWRvbmx5ICNib2R5OiBVaW50OEFycmF5O1xuICBjb25zdHJ1Y3Rvcihib2R5OiBVaW50OEFycmF5KSB7XG4gICAgc3VwZXIoU2ltcGxlU3RyaW5nQ29kZSk7XG4gICAgdGhpcy4jYm9keSA9IGJvZHk7XG4gIH1cblxuICBvdmVycmlkZSBidWxrKCkge1xuICAgIHJldHVybiB0aGlzLnN0cmluZygpO1xuICB9XG5cbiAgb3ZlcnJpZGUgYnVmZmVyKCkge1xuICAgIHJldHVybiB0aGlzLiNib2R5O1xuICB9XG5cbiAgb3ZlcnJpZGUgc3RyaW5nKCkge1xuICAgIHJldHVybiBkZWNvZGVyLmRlY29kZSh0aGlzLiNib2R5KTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnN0cmluZygpO1xuICB9XG59XG5cbmNsYXNzIEJ1bGtSZXBseSBleHRlbmRzIEJhc2VSZXBseSB7XG4gIHN0YXRpYyBhc3luYyBkZWNvZGUocmVhZGVyOiBCdWZSZWFkZXIpOiBQcm9taXNlPHR5cGVzLlJlZGlzUmVwbHk+IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJ1bGtSZXBseUJvZHkocmVhZGVyKTtcbiAgICByZXR1cm4gbmV3IEJ1bGtSZXBseShib2R5KTtcbiAgfVxuXG4gIHJlYWRvbmx5ICNib2R5OiBVaW50OEFycmF5IHwgbnVsbDtcbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihib2R5OiBVaW50OEFycmF5IHwgbnVsbCkge1xuICAgIHN1cGVyKEJ1bGtSZXBseUNvZGUpO1xuICAgIHRoaXMuI2JvZHkgPSBib2R5O1xuICB9XG5cbiAgb3ZlcnJpZGUgYnVsaygpIHtcbiAgICByZXR1cm4gdGhpcy4jYm9keSA/IGRlY29kZXIuZGVjb2RlKHRoaXMuI2JvZHkpIDogbnVsbDtcbiAgfVxuXG4gIG92ZXJyaWRlIGJ1ZmZlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYm9keSA/PyBuZXcgVWludDhBcnJheSgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgc3RyaW5nKCkge1xuICAgIHJldHVybiBkZWNvZGVyLmRlY29kZSh0aGlzLiNib2R5ID8/IG5ldyBVaW50OEFycmF5KCkpO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuYnVsaygpO1xuICB9XG59XG5cbmNsYXNzIEludGVnZXJSZXBseSBleHRlbmRzIEJhc2VSZXBseSB7XG4gIHN0YXRpYyBhc3luYyBkZWNvZGUocmVhZGVyOiBCdWZSZWFkZXIpOiBQcm9taXNlPHR5cGVzLlJlZGlzUmVwbHk+IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEludGVnZXJSZXBseUJvZHkocmVhZGVyKTtcbiAgICByZXR1cm4gbmV3IEludGVnZXJSZXBseShib2R5KTtcbiAgfVxuXG4gIHJlYWRvbmx5ICNib2R5OiBVaW50OEFycmF5O1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKGJvZHk6IFVpbnQ4QXJyYXkpIHtcbiAgICBzdXBlcihJbnRlZ2VyUmVwbHlDb2RlKTtcbiAgICB0aGlzLiNib2R5ID0gYm9keTtcbiAgfVxuXG4gIG92ZXJyaWRlIGludGVnZXIoKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KGRlY29kZXIuZGVjb2RlKHRoaXMuI2JvZHkpKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHN0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnRlZ2VyKCkudG9TdHJpbmcoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLmludGVnZXIoKTtcbiAgfVxufVxuXG5jbGFzcyBBcnJheVJlcGx5IGV4dGVuZHMgQmFzZVJlcGx5IHtcbiAgc3RhdGljIGFzeW5jIGRlY29kZShyZWFkZXI6IEJ1ZlJlYWRlcik6IFByb21pc2U8dHlwZXMuUmVkaXNSZXBseT4ge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQXJyYXlSZXBseUJvZHkocmVhZGVyLCBmYWxzZSk7XG4gICAgcmV0dXJuIG5ldyBBcnJheVJlcGx5KGJvZHkpO1xuICB9XG5cbiAgcmVhZG9ubHkgI2JvZHk6IHR5cGVzLkNvbmRpdGlvbmFsQXJyYXkgfCB0eXBlcy5CdWxrTmlsO1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKGJvZHk6IHR5cGVzLkNvbmRpdGlvbmFsQXJyYXkgfCB0eXBlcy5CdWxrTmlsKSB7XG4gICAgc3VwZXIoQXJyYXlSZXBseUNvZGUpO1xuICAgIHRoaXMuI2JvZHkgPSBib2R5O1xuICB9XG5cbiAgb3ZlcnJpZGUgYXJyYXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2JvZHk7XG4gIH1cblxuICBvdmVycmlkZSB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5hcnJheSgpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRJbnRlZ2VyUmVwbHlCb2R5KHJlYWRlcjogQnVmUmVhZGVyKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGxpbmUgPSBhd2FpdCByZWFkTGluZShyZWFkZXIpO1xuICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cblxuICByZXR1cm4gbGluZS5zdWJhcnJheSgxLCBsaW5lLmxlbmd0aCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRCdWxrUmVwbHlCb2R5KFxuICByZWFkZXI6IEJ1ZlJlYWRlcixcbik6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgY29uc3QgbGluZSA9IGF3YWl0IHJlYWRMaW5lKHJlYWRlcik7XG4gIGlmIChsaW5lID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgSW52YWxpZFN0YXRlRXJyb3IoKTtcbiAgfVxuXG4gIGlmIChsaW5lWzBdICE9PSBCdWxrUmVwbHlDb2RlKSB7XG4gICAgdHJ5UGFyc2VFcnJvclJlcGx5KGxpbmUpO1xuICB9XG5cbiAgY29uc3Qgc2l6ZSA9IHBhcnNlU2l6ZShsaW5lKTtcbiAgaWYgKHNpemUgPCAwKSB7XG4gICAgLy8gbmlsIGJ1bGsgcmVwbHlcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGRlc3QgPSBuZXcgVWludDhBcnJheShzaXplICsgMik7XG4gIGF3YWl0IHJlYWRlci5yZWFkRnVsbChkZXN0KTtcbiAgcmV0dXJuIGRlc3Quc3ViYXJyYXkoMCwgZGVzdC5sZW5ndGggLSAyKTsgLy8gU3RyaXAgQ1IgYW5kIExGXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRTaW1wbGVTdHJpbmdSZXBseUJvZHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGxpbmUgPSBhd2FpdCByZWFkTGluZShyZWFkZXIpO1xuICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cblxuICBpZiAobGluZVswXSAhPT0gU2ltcGxlU3RyaW5nQ29kZSkge1xuICAgIHRyeVBhcnNlRXJyb3JSZXBseShsaW5lKTtcbiAgfVxuICByZXR1cm4gbGluZS5zdWJhcnJheSgxLCBsaW5lLmxlbmd0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQXJyYXlSZXBseUJvZHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuICBiaW5hcnlNb2RlPzogZmFsc2UsXG4pOiBQcm9taXNlPHR5cGVzLkNvbmRpdGlvbmFsQXJyYXkgfCB0eXBlcy5CdWxrTmlsPjtcbmV4cG9ydCBmdW5jdGlvbiByZWFkQXJyYXlSZXBseUJvZHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuICBiaW5hcnlNb2RlOiB0cnVlLFxuKTogUHJvbWlzZTxBcnJheTx0eXBlcy5Db25kaXRpb25hbEFycmF5WzBdIHwgVWludDhBcnJheT4gfCB0eXBlcy5CdWxrTmlsPjtcbmV4cG9ydCBmdW5jdGlvbiByZWFkQXJyYXlSZXBseUJvZHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuICBiaW5hcnlNb2RlOiBib29sZWFuLFxuKTogUHJvbWlzZTxBcnJheTx0eXBlcy5Db25kaXRpb25hbEFycmF5WzBdIHwgVWludDhBcnJheT4gfCB0eXBlcy5CdWxrTmlsPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQXJyYXlSZXBseUJvZHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuICBiaW5hcnlNb2RlID0gZmFsc2UsXG4pOiBQcm9taXNlPEFycmF5PHR5cGVzLkNvbmRpdGlvbmFsQXJyYXlbMF0gfCBVaW50OEFycmF5PiB8IHR5cGVzLkJ1bGtOaWw+IHtcbiAgY29uc3QgbGluZSA9IGF3YWl0IHJlYWRMaW5lKHJlYWRlcik7XG4gIGlmIChsaW5lID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgSW52YWxpZFN0YXRlRXJyb3IoKTtcbiAgfVxuXG4gIGNvbnN0IGFyZ0NvdW50ID0gcGFyc2VTaXplKGxpbmUpO1xuICBpZiAoYXJnQ291bnQgPT09IC0xKSB7XG4gICAgLy8gYC0xYCBpbmRpY2F0ZXMgYSBudWxsIGFycmF5XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBzaW1wbGVTdHJpbmdSZXBseU1ldGhvZCA9IGJpbmFyeU1vZGVcbiAgICA/IFwiYnVmZmVyXCIgYXMgY29uc3RcbiAgICA6IFwic3RyaW5nXCIgYXMgY29uc3Q7XG4gIGNvbnN0IGJ1bGtSZXBseU1ldGhvZCA9IGJpbmFyeU1vZGUgPyBcImJ1ZmZlclwiIGFzIGNvbnN0IDogXCJidWxrXCIgYXMgY29uc3Q7XG4gIGNvbnN0IGFycmF5OiBBcnJheTx0eXBlcy5Db25kaXRpb25hbEFycmF5WzBdIHwgVWludDhBcnJheT4gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcmVhZGVyLnBlZWsoMSk7XG4gICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVPRkVycm9yKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29kZSA9IHJlc1swXTtcbiAgICBzd2l0Y2ggKGNvZGUpIHtcbiAgICAgIGNhc2UgU2ltcGxlU3RyaW5nQ29kZToge1xuICAgICAgICBjb25zdCByZXBseSA9IGF3YWl0IFNpbXBsZVN0cmluZ1JlcGx5LmRlY29kZShyZWFkZXIpO1xuICAgICAgICBhcnJheS5wdXNoKHJlcGx5W3NpbXBsZVN0cmluZ1JlcGx5TWV0aG9kXSgpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEJ1bGtSZXBseUNvZGU6IHtcbiAgICAgICAgY29uc3QgcmVwbHkgPSBhd2FpdCBCdWxrUmVwbHkuZGVjb2RlKHJlYWRlcik7XG4gICAgICAgIGFycmF5LnB1c2gocmVwbHlbYnVsa1JlcGx5TWV0aG9kXSgpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEludGVnZXJSZXBseUNvZGU6IHtcbiAgICAgICAgY29uc3QgcmVwbHkgPSBhd2FpdCBJbnRlZ2VyUmVwbHkuZGVjb2RlKHJlYWRlcik7XG4gICAgICAgIGFycmF5LnB1c2gocmVwbHkuaW50ZWdlcigpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEFycmF5UmVwbHlDb2RlOiB7XG4gICAgICAgIGNvbnN0IHJlcGx5ID0gYXdhaXQgQXJyYXlSZXBseS5kZWNvZGUocmVhZGVyKTtcbiAgICAgICAgYXJyYXkucHVzaChyZXBseS52YWx1ZSgpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuZXhwb3J0IGNvbnN0IG9rUmVwbHkgPSBuZXcgU2ltcGxlU3RyaW5nUmVwbHkoZW5jb2Rlci5lbmNvZGUoXCJPS1wiKSk7XG5cbmZ1bmN0aW9uIHRyeVBhcnNlRXJyb3JSZXBseShsaW5lOiBVaW50OEFycmF5KTogbmV2ZXIge1xuICBjb25zdCBjb2RlID0gbGluZVswXTtcbiAgaWYgKGNvZGUgPT09IEVycm9yUmVwbHlDb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yUmVwbHlFcnJvcihkZWNvZGVyLmRlY29kZShsaW5lKSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGxpbmU6ICR7bGluZX1gKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5UmVhZEVycm9yUmVwbHkocmVhZGVyOiBCdWZSZWFkZXIpOiBQcm9taXNlPG5ldmVyPiB7XG4gIGNvbnN0IGxpbmUgPSBhd2FpdCByZWFkTGluZShyZWFkZXIpO1xuICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cbiAgdHJ5UGFyc2VFcnJvclJlcGx5KGxpbmUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTGluZShyZWFkZXI6IEJ1ZlJlYWRlcik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZWFkZXIucmVhZExpbmUoKTtcbiAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cblxuICBjb25zdCB7IGxpbmUgfSA9IHJlc3VsdDtcbiAgcmV0dXJuIGxpbmU7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU2l6ZShsaW5lOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgY29uc3Qgc2l6ZVN0ciA9IGxpbmUuc3ViYXJyYXkoMSwgbGluZS5sZW5ndGgpO1xuICBjb25zdCBzaXplID0gcGFyc2VJbnQoZGVjb2Rlci5kZWNvZGUoc2l6ZVN0cikpO1xuICByZXR1cm4gc2l6ZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGVjb2RlRXJyb3IoY29kZTogbnVtYmVyLCBleHBlY3RlZFR5cGU6IHN0cmluZyk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBJbnZhbGlkU3RhdGVFcnJvcihcbiAgICBgY2Fubm90IGRlY29kZSAnJHtcbiAgICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSlcbiAgICB9JyB0eXBlIGFzIFxcYCR7ZXhwZWN0ZWRUeXBlfVxcYCB2YWx1ZWAsXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsU0FBUyxRQUFRLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixRQUFRLGVBQWU7QUFDNUUsU0FBUyxPQUFPLEVBQUUsT0FBTyxRQUFRLGFBQWE7QUFFOUMsTUFBTSxtQkFBbUIsSUFBSSxVQUFVLENBQUM7QUFDeEMsTUFBTSxnQkFBZ0IsSUFBSSxVQUFVLENBQUM7QUFDckMsTUFBTSxtQkFBbUIsSUFBSSxVQUFVLENBQUM7QUFDeEMsTUFBTSxpQkFBaUIsSUFBSSxVQUFVLENBQUM7QUFDdEMsTUFBTSxpQkFBaUIsSUFBSSxVQUFVLENBQUM7QUFFdEMsT0FBTyxlQUFlLFVBQVUsTUFBaUIsRUFBNkI7SUFDNUUsTUFBTSxNQUFNLE1BQU0sT0FBTyxJQUFJLENBQUM7SUFDOUIsSUFBSSxPQUFPLElBQUksRUFBRTtRQUNmLE1BQU0sSUFBSSxXQUFXO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEVBQUU7SUFDbkIsSUFBSSxTQUFTLGdCQUFnQjtRQUMzQixNQUFNLGtCQUFrQjtJQUMxQixDQUFDO0lBRUQsT0FBUTtRQUNOLEtBQUs7WUFDSCxPQUFPLGFBQWEsTUFBTSxDQUFDO1FBQzdCLEtBQUs7WUFDSCxPQUFPLGtCQUFrQixNQUFNLENBQUM7UUFDbEMsS0FBSztZQUNILE9BQU8sVUFBVSxNQUFNLENBQUM7UUFDMUIsS0FBSztZQUNILE9BQU8sV0FBVyxNQUFNLENBQUM7UUFDM0I7WUFDRSxNQUFNLElBQUksa0JBQ1IsQ0FBQyxlQUFlLEVBQUUs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