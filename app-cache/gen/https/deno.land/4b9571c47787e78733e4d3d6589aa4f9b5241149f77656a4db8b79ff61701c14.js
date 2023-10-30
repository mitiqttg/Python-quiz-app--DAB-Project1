import { sendCommand } from "./protocol/mod.ts";
import { exponentialBackoff } from "./backoff.ts";
import { ErrorReplyError, isRetriableError } from "./errors.ts";
import { BufReader } from "./vendor/https/deno.land/std/io/buf_reader.ts";
import { BufWriter } from "./vendor/https/deno.land/std/io/buf_writer.ts";
import { delay } from "./vendor/https/deno.land/std/async/delay.ts";
const kEmptyRedisArgs = [];
export class RedisConnection {
    name;
    closer;
    reader;
    writer;
    maxRetryCount;
    hostname;
    port;
    _isClosed;
    _isConnected;
    backoff;
    get isClosed() {
        return this._isClosed;
    }
    get isConnected() {
        return this._isConnected;
    }
    get isRetriable() {
        return this.maxRetryCount > 0;
    }
    constructor(hostname, port, options){
        this.options = options;
        this.name = null;
        this.maxRetryCount = 10;
        this._isClosed = false;
        this._isConnected = false;
        this.hostname = hostname;
        this.port = port;
        if (options.name) {
            this.name = options.name;
        }
        if (options.maxRetryCount != null) {
            this.maxRetryCount = options.maxRetryCount;
        }
        this.backoff = options.backoff ?? exponentialBackoff();
    }
    async authenticate(username, password) {
        try {
            password && username ? await this.sendCommand("AUTH", [
                username,
                password
            ]) : await this.sendCommand("AUTH", [
                password
            ]);
        } catch (error) {
            if (error instanceof ErrorReplyError) {
                throw new AuthenticationError("Authentication failed", {
                    cause: error
                });
            } else {
                throw error;
            }
        }
    }
    async selectDb(db = this.options.db) {
        if (!db) throw new Error("The database index is undefined.");
        await this.sendCommand("SELECT", [
            db
        ]);
    }
    async sendCommand(command, args) {
        try {
            const reply = await sendCommand(this.writer, this.reader, command, args ?? kEmptyRedisArgs);
            return reply;
        } catch (error) {
            if (!isRetriableError(error) || this.isManuallyClosedByUser()) {
                throw error;
            }
            for(let i = 0; i < this.maxRetryCount; i++){
                // Try to reconnect to the server and retry the command
                this.close();
                try {
                    await this.connect();
                    const reply = await sendCommand(this.writer, this.reader, command, args ?? kEmptyRedisArgs);
                    return reply;
                } catch  {
                    const backoff = this.backoff(i);
                    await delay(backoff);
                }
            }
            throw error;
        }
    }
    /**
   * Connect to Redis server
   */ async connect() {
        await this.#connect(0);
    }
    async #connect(retryCount) {
        try {
            const dialOpts = {
                hostname: this.hostname,
                port: parsePortLike(this.port)
            };
            const conn = this.options?.tls ? await Deno.connectTls(dialOpts) : await Deno.connect(dialOpts);
            this.closer = conn;
            this.reader = new BufReader(conn);
            this.writer = new BufWriter(conn);
            this._isClosed = false;
            this._isConnected = true;
            try {
                if (this.options.password != null) {
                    await this.authenticate(this.options.username, this.options.password);
                }
                if (this.options.db) {
                    await this.selectDb(this.options.db);
                }
            } catch (error) {
                this.close();
                throw error;
            }
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error.cause ?? error;
            }
            const backoff = this.backoff(retryCount);
            retryCount++;
            if (retryCount >= this.maxRetryCount) {
                throw error;
            }
            await delay(backoff);
            await this.#connect(retryCount);
        }
    }
    close() {
        this._isClosed = true;
        this._isConnected = false;
        try {
            this.closer.close();
        } catch (error) {
            if (!(error instanceof Deno.errors.BadResource)) throw error;
        }
    }
    async reconnect() {
        if (!this.reader.peek(1)) {
            throw new Error("Client is closed.");
        }
        try {
            await this.sendCommand("PING");
            this._isConnected = true;
        } catch (_error) {
            this.close();
            await this.connect();
            await this.sendCommand("PING");
        }
    }
    isManuallyClosedByUser() {
        return this._isClosed && !this._isConnected;
    }
    options;
}
class AuthenticationError extends Error {
}
function parsePortLike(port) {
    let parsedPort;
    if (typeof port === "string") {
        parsedPort = parseInt(port);
    } else if (typeof port === "number") {
        parsedPort = port;
    } else {
        parsedPort = 6379;
    }
    if (!Number.isSafeInteger(parsedPort)) {
        throw new Error("Port is invalid");
    }
    return parsedPort;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMjkuMC9jb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlbmRDb21tYW5kIH0gZnJvbSBcIi4vcHJvdG9jb2wvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJlZGlzUmVwbHksIFJlZGlzVmFsdWUgfSBmcm9tIFwiLi9wcm90b2NvbC9tb2QudHNcIjtcbmltcG9ydCB0eXBlIHsgQmFja29mZiB9IGZyb20gXCIuL2JhY2tvZmYudHNcIjtcbmltcG9ydCB7IGV4cG9uZW50aWFsQmFja29mZiB9IGZyb20gXCIuL2JhY2tvZmYudHNcIjtcbmltcG9ydCB7IEVycm9yUmVwbHlFcnJvciwgaXNSZXRyaWFibGVFcnJvciB9IGZyb20gXCIuL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgQnVmUmVhZGVyIH0gZnJvbSBcIi4vdmVuZG9yL2h0dHBzL2Rlbm8ubGFuZC9zdGQvaW8vYnVmX3JlYWRlci50c1wiO1xuaW1wb3J0IHsgQnVmV3JpdGVyIH0gZnJvbSBcIi4vdmVuZG9yL2h0dHBzL2Rlbm8ubGFuZC9zdGQvaW8vYnVmX3dyaXRlci50c1wiO1xuaW1wb3J0IHsgZGVsYXkgfSBmcm9tIFwiLi92ZW5kb3IvaHR0cHMvZGVuby5sYW5kL3N0ZC9hc3luYy9kZWxheS50c1wiO1xudHlwZSBDbG9zZXIgPSBEZW5vLkNsb3NlcjtcblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0aW9uIHtcbiAgY2xvc2VyOiBDbG9zZXI7XG4gIHJlYWRlcjogQnVmUmVhZGVyO1xuICB3cml0ZXI6IEJ1ZldyaXRlcjtcbiAgbWF4UmV0cnlDb3VudDogbnVtYmVyO1xuICBpc0Nsb3NlZDogYm9vbGVhbjtcbiAgaXNDb25uZWN0ZWQ6IGJvb2xlYW47XG4gIGlzUmV0cmlhYmxlOiBib29sZWFuO1xuICBjbG9zZSgpOiB2b2lkO1xuICBjb25uZWN0KCk6IFByb21pc2U8dm9pZD47XG4gIHJlY29ubmVjdCgpOiBQcm9taXNlPHZvaWQ+O1xuICBzZW5kQ29tbWFuZChjb21tYW5kOiBzdHJpbmcsIGFyZ3M/OiBBcnJheTxSZWRpc1ZhbHVlPik6IFByb21pc2U8UmVkaXNSZXBseT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVkaXNDb25uZWN0aW9uT3B0aW9ucyB7XG4gIHRscz86IGJvb2xlYW47XG4gIGRiPzogbnVtYmVyO1xuICBwYXNzd29yZD86IHN0cmluZztcbiAgdXNlcm5hbWU/OiBzdHJpbmc7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBAZGVmYXVsdCAxMFxuICAgKi9cbiAgbWF4UmV0cnlDb3VudD86IG51bWJlcjtcbiAgYmFja29mZj86IEJhY2tvZmY7XG59XG5cbmNvbnN0IGtFbXB0eVJlZGlzQXJnczogQXJyYXk8UmVkaXNWYWx1ZT4gPSBbXTtcblxuZXhwb3J0IGNsYXNzIFJlZGlzQ29ubmVjdGlvbiBpbXBsZW1lbnRzIENvbm5lY3Rpb24ge1xuICBuYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY2xvc2VyITogQ2xvc2VyO1xuICByZWFkZXIhOiBCdWZSZWFkZXI7XG4gIHdyaXRlciE6IEJ1ZldyaXRlcjtcbiAgbWF4UmV0cnlDb3VudCA9IDEwO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgaG9zdG5hbWU6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBwb3J0OiBudW1iZXIgfCBzdHJpbmc7XG4gIHByaXZhdGUgX2lzQ2xvc2VkID0gZmFsc2U7XG4gIHByaXZhdGUgX2lzQ29ubmVjdGVkID0gZmFsc2U7XG4gIHByaXZhdGUgYmFja29mZjogQmFja29mZjtcblxuICBnZXQgaXNDbG9zZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkO1xuICB9XG5cbiAgZ2V0IGlzQ29ubmVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc0Nvbm5lY3RlZDtcbiAgfVxuXG4gIGdldCBpc1JldHJpYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tYXhSZXRyeUNvdW50ID4gMDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGhvc3RuYW1lOiBzdHJpbmcsXG4gICAgcG9ydDogbnVtYmVyIHwgc3RyaW5nLFxuICAgIHByaXZhdGUgb3B0aW9uczogUmVkaXNDb25uZWN0aW9uT3B0aW9ucyxcbiAgKSB7XG4gICAgdGhpcy5ob3N0bmFtZSA9IGhvc3RuYW1lO1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gICAgaWYgKG9wdGlvbnMubmFtZSkge1xuICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5tYXhSZXRyeUNvdW50ICE9IG51bGwpIHtcbiAgICAgIHRoaXMubWF4UmV0cnlDb3VudCA9IG9wdGlvbnMubWF4UmV0cnlDb3VudDtcbiAgICB9XG4gICAgdGhpcy5iYWNrb2ZmID0gb3B0aW9ucy5iYWNrb2ZmID8/IGV4cG9uZW50aWFsQmFja29mZigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhdXRoZW50aWNhdGUoXG4gICAgdXNlcm5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgcGFzc3dvcmQgJiYgdXNlcm5hbWVcbiAgICAgICAgPyBhd2FpdCB0aGlzLnNlbmRDb21tYW5kKFwiQVVUSFwiLCBbdXNlcm5hbWUsIHBhc3N3b3JkXSlcbiAgICAgICAgOiBhd2FpdCB0aGlzLnNlbmRDb21tYW5kKFwiQVVUSFwiLCBbcGFzc3dvcmRdKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3JSZXBseUVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBBdXRoZW50aWNhdGlvbkVycm9yKFwiQXV0aGVudGljYXRpb24gZmFpbGVkXCIsIHtcbiAgICAgICAgICBjYXVzZTogZXJyb3IsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZWxlY3REYihcbiAgICBkYjogbnVtYmVyIHwgdW5kZWZpbmVkID0gdGhpcy5vcHRpb25zLmRiLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIWRiKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZGF0YWJhc2UgaW5kZXggaXMgdW5kZWZpbmVkLlwiKTtcbiAgICBhd2FpdCB0aGlzLnNlbmRDb21tYW5kKFwiU0VMRUNUXCIsIFtkYl0pO1xuICB9XG5cbiAgYXN5bmMgc2VuZENvbW1hbmQoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIGFyZ3M/OiBBcnJheTxSZWRpc1ZhbHVlPixcbiAgKTogUHJvbWlzZTxSZWRpc1JlcGx5PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcGx5ID0gYXdhaXQgc2VuZENvbW1hbmQoXG4gICAgICAgIHRoaXMud3JpdGVyLFxuICAgICAgICB0aGlzLnJlYWRlcixcbiAgICAgICAgY29tbWFuZCxcbiAgICAgICAgYXJncyA/PyBrRW1wdHlSZWRpc0FyZ3MsXG4gICAgICApO1xuICAgICAgcmV0dXJuIHJlcGx5O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoXG4gICAgICAgICFpc1JldHJpYWJsZUVycm9yKGVycm9yKSB8fFxuICAgICAgICB0aGlzLmlzTWFudWFsbHlDbG9zZWRCeVVzZXIoKVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubWF4UmV0cnlDb3VudDsgaSsrKSB7XG4gICAgICAgIC8vIFRyeSB0byByZWNvbm5lY3QgdG8gdGhlIHNlcnZlciBhbmQgcmV0cnkgdGhlIGNvbW1hbmRcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY29ubmVjdCgpO1xuXG4gICAgICAgICAgY29uc3QgcmVwbHkgPSBhd2FpdCBzZW5kQ29tbWFuZChcbiAgICAgICAgICAgIHRoaXMud3JpdGVyLFxuICAgICAgICAgICAgdGhpcy5yZWFkZXIsXG4gICAgICAgICAgICBjb21tYW5kLFxuICAgICAgICAgICAgYXJncyA/PyBrRW1wdHlSZWRpc0FyZ3MsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiByZXBseTtcbiAgICAgICAgfSBjYXRjaCB7IC8vIFRPRE86IHVzZSBgQWdncmVnYXRlRXJyb3JgP1xuICAgICAgICAgIGNvbnN0IGJhY2tvZmYgPSB0aGlzLmJhY2tvZmYoaSk7XG4gICAgICAgICAgYXdhaXQgZGVsYXkoYmFja29mZik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbm5lY3QgdG8gUmVkaXMgc2VydmVyXG4gICAqL1xuICBhc3luYyBjb25uZWN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI2Nvbm5lY3QoMCk7XG4gIH1cblxuICBhc3luYyAjY29ubmVjdChyZXRyeUNvdW50OiBudW1iZXIpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGlhbE9wdHM6IERlbm8uQ29ubmVjdE9wdGlvbnMgPSB7XG4gICAgICAgIGhvc3RuYW1lOiB0aGlzLmhvc3RuYW1lLFxuICAgICAgICBwb3J0OiBwYXJzZVBvcnRMaWtlKHRoaXMucG9ydCksXG4gICAgICB9O1xuICAgICAgY29uc3QgY29ubjogRGVuby5Db25uID0gdGhpcy5vcHRpb25zPy50bHNcbiAgICAgICAgPyBhd2FpdCBEZW5vLmNvbm5lY3RUbHMoZGlhbE9wdHMpXG4gICAgICAgIDogYXdhaXQgRGVuby5jb25uZWN0KGRpYWxPcHRzKTtcblxuICAgICAgdGhpcy5jbG9zZXIgPSBjb25uO1xuICAgICAgdGhpcy5yZWFkZXIgPSBuZXcgQnVmUmVhZGVyKGNvbm4pO1xuICAgICAgdGhpcy53cml0ZXIgPSBuZXcgQnVmV3JpdGVyKGNvbm4pO1xuICAgICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2lzQ29ubmVjdGVkID0gdHJ1ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXNzd29yZCAhPSBudWxsKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5hdXRoZW50aWNhdGUodGhpcy5vcHRpb25zLnVzZXJuYW1lLCB0aGlzLm9wdGlvbnMucGFzc3dvcmQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGIpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNlbGVjdERiKHRoaXMub3B0aW9ucy5kYik7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEF1dGhlbnRpY2F0aW9uRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgKGVycm9yLmNhdXNlID8/IGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmFja29mZiA9IHRoaXMuYmFja29mZihyZXRyeUNvdW50KTtcbiAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgIGlmIChyZXRyeUNvdW50ID49IHRoaXMubWF4UmV0cnlDb3VudCkge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGRlbGF5KGJhY2tvZmYpO1xuICAgICAgYXdhaXQgdGhpcy4jY29ubmVjdChyZXRyeUNvdW50KTtcbiAgICB9XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgdGhpcy5faXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5jbG9zZXIhLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQmFkUmVzb3VyY2UpKSB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZWNvbm5lY3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnJlYWRlci5wZWVrKDEpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGllbnQgaXMgY2xvc2VkLlwiKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZENvbW1hbmQoXCJQSU5HXCIpO1xuICAgICAgdGhpcy5faXNDb25uZWN0ZWQgPSB0cnVlO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikgeyAvLyBUT0RPOiBNYXliZSB3ZSBzaG91bGQgbG9nIHRoaXMgZXJyb3IuXG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICBhd2FpdCB0aGlzLmNvbm5lY3QoKTtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZENvbW1hbmQoXCJQSU5HXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNNYW51YWxseUNsb3NlZEJ5VXNlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faXNDbG9zZWQgJiYgIXRoaXMuX2lzQ29ubmVjdGVkO1xuICB9XG59XG5cbmNsYXNzIEF1dGhlbnRpY2F0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG5mdW5jdGlvbiBwYXJzZVBvcnRMaWtlKHBvcnQ6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCk6IG51bWJlciB7XG4gIGxldCBwYXJzZWRQb3J0OiBudW1iZXI7XG4gIGlmICh0eXBlb2YgcG9ydCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHBhcnNlZFBvcnQgPSBwYXJzZUludChwb3J0KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcG9ydCA9PT0gXCJudW1iZXJcIikge1xuICAgIHBhcnNlZFBvcnQgPSBwb3J0O1xuICB9IGVsc2Uge1xuICAgIHBhcnNlZFBvcnQgPSA2Mzc5O1xuICB9XG4gIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIocGFyc2VkUG9ydCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJQb3J0IGlzIGludmFsaWRcIik7XG4gIH1cbiAgcmV0dXJuIHBhcnNlZFBvcnQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxXQUFXLFFBQVEsb0JBQW9CO0FBR2hELFNBQVMsa0JBQWtCLFFBQVEsZUFBZTtBQUNsRCxTQUFTLGVBQWUsRUFBRSxnQkFBZ0IsUUFBUSxjQUFjO0FBQ2hFLFNBQVMsU0FBUyxRQUFRLGdEQUFnRDtBQUMxRSxTQUFTLFNBQVMsUUFBUSxnREFBZ0Q7QUFDMUUsU0FBUyxLQUFLLFFBQVEsOENBQThDO0FBOEJwRSxNQUFNLGtCQUFxQyxFQUFFO0FBRTdDLE9BQU8sTUFBTTtJQUNYLEtBQTJCO0lBQzNCLE9BQWdCO0lBQ2hCLE9BQW1CO0lBQ25CLE9BQW1CO0lBQ25CLGNBQW1CO0lBRUYsU0FBaUI7SUFDakIsS0FBc0I7SUFDL0IsVUFBa0I7SUFDbEIsYUFBcUI7SUFDckIsUUFBaUI7SUFFekIsSUFBSSxXQUFvQjtRQUN0QixPQUFPLElBQUksQ0FBQyxTQUFTO0lBQ3ZCO0lBRUEsSUFBSSxjQUF1QjtRQUN6QixPQUFPLElBQUksQ0FBQyxZQUFZO0lBQzFCO0lBRUEsSUFBSSxjQUF1QjtRQUN6QixPQUFPLElBQUksQ0FBQyxhQUFhLEdBQUc7SUFDOUI7SUFFQSxZQUNFLFFBQWdCLEVBQ2hCLElBQXFCLEVBQ2IsUUFDUjt1QkFEUTthQTNCVixPQUFzQixJQUFJO2FBSTFCLGdCQUFnQjthQUlSLFlBQVksS0FBSzthQUNqQixlQUFlLEtBQUs7UUFvQjFCLElBQUksQ0FBQyxRQUFRLEdBQUc7UUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRztRQUNaLElBQUksUUFBUSxJQUFJLEVBQUU7WUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLElBQUk7UUFDMUIsQ0FBQztRQUNELElBQUksUUFBUSxhQUFhLElBQUksSUFBSSxFQUFFO1lBQ2pDLElBQUksQ0FB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