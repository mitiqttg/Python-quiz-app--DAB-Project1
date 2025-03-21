import { InvalidStateError } from "./errors.ts";
import { readArrayReplyBody } from "./protocol/mod.ts";
import { decoder } from "./protocol/_util.ts";
class RedisSubscriptionImpl {
    get isConnected() {
        return this.executor.connection.isConnected;
    }
    get isClosed() {
        return this.executor.connection.isClosed;
    }
    channels;
    patterns;
    constructor(executor){
        this.executor = executor;
        this.channels = Object.create(null);
        this.patterns = Object.create(null);
    }
    async psubscribe(...patterns) {
        await this.executor.exec("PSUBSCRIBE", ...patterns);
        for (const pat of patterns){
            this.patterns[pat] = true;
        }
    }
    async punsubscribe(...patterns) {
        await this.executor.exec("PUNSUBSCRIBE", ...patterns);
        for (const pat of patterns){
            delete this.patterns[pat];
        }
    }
    async subscribe(...channels) {
        await this.executor.exec("SUBSCRIBE", ...channels);
        for (const chan of channels){
            this.channels[chan] = true;
        }
    }
    async unsubscribe(...channels) {
        await this.executor.exec("UNSUBSCRIBE", ...channels);
        for (const chan of channels){
            delete this.channels[chan];
        }
    }
    receive() {
        return this.#receive(false);
    }
    receiveBuffers() {
        return this.#receive(true);
    }
    async *#receive(binaryMode) {
        let forceReconnect = false;
        const connection = this.executor.connection;
        while(this.isConnected){
            try {
                let rep;
                try {
                    // TODO: `readArrayReplyBody` should not be called directly here
                    rep = await readArrayReplyBody(connection.reader, binaryMode);
                } catch (err) {
                    if (err instanceof Deno.errors.BadResource) {
                        // Connection already closed.
                        connection.close();
                        break;
                    }
                    throw err;
                }
                const event = rep[0] instanceof Uint8Array ? decoder.decode(rep[0]) : rep[0];
                if (event === "message" && rep.length === 3) {
                    if (rep[1] instanceof Uint8Array) {
                        const channel = decoder.decode(rep[1]);
                        const message = rep[2];
                        yield {
                            channel,
                            message
                        };
                    } else {
                        const channel = rep[1];
                        const message = rep[2];
                        yield {
                            channel,
                            message
                        };
                    }
                    const channel = rep[1] instanceof Uint8Array ? decoder.decode(rep[1]) : rep[1];
                    const message = rep[2];
                    yield {
                        channel,
                        message
                    };
                } else if (event === "pmessage" && rep.length === 4) {
                    const pattern = rep[1] instanceof Uint8Array ? decoder.decode(rep[1]) : rep[1];
                    const channel = rep[2] instanceof Uint8Array ? decoder.decode(rep[2]) : rep[2];
                    const message = rep[3];
                    yield {
                        pattern,
                        channel,
                        message
                    };
                }
            } catch (error) {
                if (error instanceof InvalidStateError || error instanceof Deno.errors.BadResource) {
                    forceReconnect = true;
                } else throw error;
            } finally{
                if (!this.isClosed && !this.isConnected || forceReconnect) {
                    await connection.reconnect();
                    forceReconnect = false;
                    if (Object.keys(this.channels).length > 0) {
                        await this.subscribe(...Object.keys(this.channels));
                    }
                    if (Object.keys(this.patterns).length > 0) {
                        await this.psubscribe(...Object.keys(this.patterns));
                    }
                }
            }
        }
    }
    close() {
        this.executor.connection.close();
    }
    executor;
}
export async function subscribe(executor, ...channels) {
    const sub = new RedisSubscriptionImpl(executor);
    await sub.subscribe(...channels);
    return sub;
}
export async function psubscribe(executor, ...patterns) {
    const sub = new RedisSubscriptionImpl(executor);
    await sub.psubscribe(...patterns);
    return sub;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMjkuMC9wdWJzdWIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDb21tYW5kRXhlY3V0b3IgfSBmcm9tIFwiLi9leGVjdXRvci50c1wiO1xuaW1wb3J0IHsgSW52YWxpZFN0YXRlRXJyb3IgfSBmcm9tIFwiLi9lcnJvcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgQmluYXJ5IH0gZnJvbSBcIi4vcHJvdG9jb2wvbW9kLnRzXCI7XG5pbXBvcnQgeyByZWFkQXJyYXlSZXBseUJvZHkgfSBmcm9tIFwiLi9wcm90b2NvbC9tb2QudHNcIjtcbmltcG9ydCB7IGRlY29kZXIgfSBmcm9tIFwiLi9wcm90b2NvbC9fdXRpbC50c1wiO1xuXG50eXBlIERlZmF1bHRNZXNzYWdlVHlwZSA9IHN0cmluZztcbnR5cGUgVmFsaWRNZXNzYWdlVHlwZSA9IHN0cmluZyB8IHN0cmluZ1tdO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlZGlzU3Vic2NyaXB0aW9uPFxuICBUTWVzc2FnZSBleHRlbmRzIFZhbGlkTWVzc2FnZVR5cGUgPSBEZWZhdWx0TWVzc2FnZVR5cGUsXG4+IHtcbiAgcmVhZG9ubHkgaXNDbG9zZWQ6IGJvb2xlYW47XG4gIHJlY2VpdmUoKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFJlZGlzUHViU3ViTWVzc2FnZTxUTWVzc2FnZT4+O1xuICByZWNlaXZlQnVmZmVycygpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8UmVkaXNQdWJTdWJNZXNzYWdlPEJpbmFyeT4+O1xuICBwc3Vic2NyaWJlKC4uLnBhdHRlcm5zOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD47XG4gIHN1YnNjcmliZSguLi5jaGFubmVsczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+O1xuICBwdW5zdWJzY3JpYmUoLi4ucGF0dGVybnM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPjtcbiAgdW5zdWJzY3JpYmUoLi4uY2hhbm5lbHM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPjtcbiAgY2xvc2UoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWRpc1B1YlN1Yk1lc3NhZ2U8VE1lc3NhZ2UgPSBEZWZhdWx0TWVzc2FnZVR5cGU+IHtcbiAgcGF0dGVybj86IHN0cmluZztcbiAgY2hhbm5lbDogc3RyaW5nO1xuICBtZXNzYWdlOiBUTWVzc2FnZTtcbn1cblxuY2xhc3MgUmVkaXNTdWJzY3JpcHRpb25JbXBsPFxuICBUTWVzc2FnZSBleHRlbmRzIFZhbGlkTWVzc2FnZVR5cGUgPSBEZWZhdWx0TWVzc2FnZVR5cGUsXG4+IGltcGxlbWVudHMgUmVkaXNTdWJzY3JpcHRpb248VE1lc3NhZ2U+IHtcbiAgZ2V0IGlzQ29ubmVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmV4ZWN1dG9yLmNvbm5lY3Rpb24uaXNDb25uZWN0ZWQ7XG4gIH1cblxuICBnZXQgaXNDbG9zZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY3V0b3IuY29ubmVjdGlvbi5pc0Nsb3NlZDtcbiAgfVxuXG4gIHByaXZhdGUgY2hhbm5lbHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBwcml2YXRlIHBhdHRlcm5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3IpIHt9XG5cbiAgYXN5bmMgcHN1YnNjcmliZSguLi5wYXR0ZXJuczogc3RyaW5nW10pIHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dG9yLmV4ZWMoXCJQU1VCU0NSSUJFXCIsIC4uLnBhdHRlcm5zKTtcbiAgICBmb3IgKGNvbnN0IHBhdCBvZiBwYXR0ZXJucykge1xuICAgICAgdGhpcy5wYXR0ZXJuc1twYXRdID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBwdW5zdWJzY3JpYmUoLi4ucGF0dGVybnM6IHN0cmluZ1tdKSB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRvci5leGVjKFwiUFVOU1VCU0NSSUJFXCIsIC4uLnBhdHRlcm5zKTtcbiAgICBmb3IgKGNvbnN0IHBhdCBvZiBwYXR0ZXJucykge1xuICAgICAgZGVsZXRlIHRoaXMucGF0dGVybnNbcGF0XTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzdWJzY3JpYmUoLi4uY2hhbm5lbHM6IHN0cmluZ1tdKSB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRvci5leGVjKFwiU1VCU0NSSUJFXCIsIC4uLmNoYW5uZWxzKTtcbiAgICBmb3IgKGNvbnN0IGNoYW4gb2YgY2hhbm5lbHMpIHtcbiAgICAgIHRoaXMuY2hhbm5lbHNbY2hhbl0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHVuc3Vic2NyaWJlKC4uLmNoYW5uZWxzOiBzdHJpbmdbXSkge1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0b3IuZXhlYyhcIlVOU1VCU0NSSUJFXCIsIC4uLmNoYW5uZWxzKTtcbiAgICBmb3IgKGNvbnN0IGNoYW4gb2YgY2hhbm5lbHMpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmNoYW5uZWxzW2NoYW5dO1xuICAgIH1cbiAgfVxuXG4gIHJlY2VpdmUoKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFJlZGlzUHViU3ViTWVzc2FnZTxUTWVzc2FnZT4+IHtcbiAgICByZXR1cm4gdGhpcy4jcmVjZWl2ZShmYWxzZSk7XG4gIH1cblxuICByZWNlaXZlQnVmZmVycygpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8UmVkaXNQdWJTdWJNZXNzYWdlPEJpbmFyeT4+IHtcbiAgICByZXR1cm4gdGhpcy4jcmVjZWl2ZSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jICojcmVjZWl2ZTxcbiAgICBUID0gVE1lc3NhZ2UsXG4gID4oXG4gICAgYmluYXJ5TW9kZTogYm9vbGVhbixcbiAgKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFxuICAgIFJlZGlzUHViU3ViTWVzc2FnZTxUPlxuICA+IHtcbiAgICBsZXQgZm9yY2VSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5leGVjdXRvci5jb25uZWN0aW9uO1xuICAgIHdoaWxlICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVwOiBbc3RyaW5nIHwgQmluYXJ5LCBzdHJpbmcgfCBCaW5hcnksIFRdIHwgW1xuICAgICAgICAgIHN0cmluZyB8IEJpbmFyeSxcbiAgICAgICAgICBzdHJpbmcgfCBCaW5hcnksXG4gICAgICAgICAgc3RyaW5nIHwgQmluYXJ5LFxuICAgICAgICAgIFQsXG4gICAgICAgIF07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVE9ETzogYHJlYWRBcnJheVJlcGx5Qm9keWAgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZGlyZWN0bHkgaGVyZVxuICAgICAgICAgIHJlcCA9IChhd2FpdCByZWFkQXJyYXlSZXBseUJvZHkoXG4gICAgICAgICAgICBjb25uZWN0aW9uLnJlYWRlcixcbiAgICAgICAgICAgIGJpbmFyeU1vZGUsXG4gICAgICAgICAgKSkgYXMgdHlwZW9mIHJlcDtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLkJhZFJlc291cmNlKSB7XG4gICAgICAgICAgICAvLyBDb25uZWN0aW9uIGFscmVhZHkgY2xvc2VkLlxuICAgICAgICAgICAgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV2ZW50ID0gcmVwWzBdIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICAgID8gZGVjb2Rlci5kZWNvZGUocmVwWzBdKVxuICAgICAgICAgIDogcmVwWzBdO1xuXG4gICAgICAgIGlmIChldmVudCA9PT0gXCJtZXNzYWdlXCIgJiYgcmVwLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgIGlmIChyZXBbMV0gaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgICAgICBjb25zdCBjaGFubmVsID0gZGVjb2Rlci5kZWNvZGUocmVwWzFdKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSByZXBbMl07XG4gICAgICAgICAgICB5aWVsZCB7IGNoYW5uZWwsIG1lc3NhZ2UgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY2hhbm5lbCA9IHJlcFsxXTtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSByZXBbMl07XG4gICAgICAgICAgICB5aWVsZCB7IGNoYW5uZWwsIG1lc3NhZ2UgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgY2hhbm5lbCA9IHJlcFsxXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgICAgID8gZGVjb2Rlci5kZWNvZGUocmVwWzFdKVxuICAgICAgICAgICAgOiByZXBbMV07XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHJlcFsyXTtcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBjaGFubmVsLFxuICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50ID09PSBcInBtZXNzYWdlXCIgJiYgcmVwLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSByZXBbMV0gaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgICAgICA/IGRlY29kZXIuZGVjb2RlKHJlcFsxXSlcbiAgICAgICAgICAgIDogcmVwWzFdO1xuICAgICAgICAgIGNvbnN0IGNoYW5uZWwgPSByZXBbMl0gaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgICAgICA/IGRlY29kZXIuZGVjb2RlKHJlcFsyXSlcbiAgICAgICAgICAgIDogcmVwWzJdO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSByZXBbM107XG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgcGF0dGVybixcbiAgICAgICAgICAgIGNoYW5uZWwsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEludmFsaWRTdGF0ZUVycm9yIHx8XG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5CYWRSZXNvdXJjZVxuICAgICAgICApIHtcbiAgICAgICAgICBmb3JjZVJlY29ubmVjdCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB0aHJvdyBlcnJvcjtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmICgoIXRoaXMuaXNDbG9zZWQgJiYgIXRoaXMuaXNDb25uZWN0ZWQpIHx8IGZvcmNlUmVjb25uZWN0KSB7XG4gICAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5yZWNvbm5lY3QoKTtcbiAgICAgICAgICBmb3JjZVJlY29ubmVjdCA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuY2hhbm5lbHMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3Vic2NyaWJlKC4uLk9iamVjdC5rZXlzKHRoaXMuY2hhbm5lbHMpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMucGF0dGVybnMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHN1YnNjcmliZSguLi5PYmplY3Qua2V5cyh0aGlzLnBhdHRlcm5zKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5leGVjdXRvci5jb25uZWN0aW9uLmNsb3NlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1YnNjcmliZTxcbiAgVE1lc3NhZ2UgZXh0ZW5kcyBWYWxpZE1lc3NhZ2VUeXBlID0gRGVmYXVsdE1lc3NhZ2VUeXBlLFxuPihcbiAgZXhlY3V0b3I6IENvbW1hbmRFeGVjdXRvcixcbiAgLi4uY2hhbm5lbHM6IHN0cmluZ1tdXG4pOiBQcm9taXNlPFJlZGlzU3Vic2NyaXB0aW9uPFRNZXNzYWdlPj4ge1xuICBjb25zdCBzdWIgPSBuZXcgUmVkaXNTdWJzY3JpcHRpb25JbXBsPFRNZXNzYWdlPihleGVjdXRvcik7XG4gIGF3YWl0IHN1Yi5zdWJzY3JpYmUoLi4uY2hhbm5lbHMpO1xuICByZXR1cm4gc3ViO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHN1YnNjcmliZTxcbiAgVE1lc3NhZ2UgZXh0ZW5kcyBWYWxpZE1lc3NhZ2VUeXBlID0gRGVmYXVsdE1lc3NhZ2VUeXBlLFxuPihcbiAgZXhlY3V0b3I6IENvbW1hbmRFeGVjdXRvcixcbiAgLi4ucGF0dGVybnM6IHN0cmluZ1tdXG4pOiBQcm9taXNlPFJlZGlzU3Vic2NyaXB0aW9uPFRNZXNzYWdlPj4ge1xuICBjb25zdCBzdWIgPSBuZXcgUmVkaXNTdWJzY3JpcHRpb25JbXBsPFRNZXNzYWdlPihleGVjdXRvcik7XG4gIGF3YWl0IHN1Yi5wc3Vic2NyaWJlKC4uLnBhdHRlcm5zKTtcbiAgcmV0dXJuIHN1Yjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLGlCQUFpQixRQUFRLGNBQWM7QUFFaEQsU0FBUyxrQkFBa0IsUUFBUSxvQkFBb0I7QUFDdkQsU0FBUyxPQUFPLFFBQVEsc0JBQXNCO0FBd0I5QyxNQUFNO0lBR0osSUFBSSxjQUF1QjtRQUN6QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFdBQVc7SUFDN0M7SUFFQSxJQUFJLFdBQW9CO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUTtJQUMxQztJQUVRLFNBQStCO0lBQy9CLFNBQStCO0lBRXZDLFlBQW9CLFNBQTJCO3dCQUEzQjthQUhaLFdBQVcsT0FBTyxNQUFNLENBQUMsSUFBSTthQUM3QixXQUFXLE9BQU8s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