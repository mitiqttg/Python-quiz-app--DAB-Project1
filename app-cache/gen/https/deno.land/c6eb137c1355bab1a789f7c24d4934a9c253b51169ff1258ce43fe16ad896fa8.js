import { okReply, sendCommands } from "./protocol/mod.ts";
import { create } from "./redis.ts";
import { deferred } from "./vendor/https/deno.land/std/async/deferred.ts";
export function createRedisPipeline(connection, tx = false) {
    const executor = new PipelineExecutor(connection, tx);
    function flush() {
        return executor.flush();
    }
    const client = create(executor);
    return Object.assign(client, {
        flush
    });
}
export class PipelineExecutor {
    commands;
    queue;
    constructor(connection, tx){
        this.connection = connection;
        this.tx = tx;
        this.commands = [];
        this.queue = [];
    }
    exec(command, ...args) {
        this.commands.push({
            command,
            args
        });
        return Promise.resolve(okReply);
    }
    close() {
        return this.connection.close();
    }
    flush() {
        if (this.tx) {
            this.commands.unshift({
                command: "MULTI",
                args: []
            });
            this.commands.push({
                command: "EXEC",
                args: []
            });
        }
        const d = deferred();
        this.queue.push({
            commands: [
                ...this.commands
            ],
            d
        });
        if (this.queue.length === 1) {
            this.dequeue();
        }
        this.commands = [];
        return d;
    }
    dequeue() {
        const [e] = this.queue;
        if (!e) return;
        sendCommands(this.connection.writer, this.connection.reader, e.commands).then(e.d.resolve).catch(e.d.reject).finally(()=>{
            this.queue.shift();
            this.dequeue();
        });
    }
    connection;
    tx;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMjkuMC9waXBlbGluZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbm5lY3Rpb24gfSBmcm9tIFwiLi9jb25uZWN0aW9uLnRzXCI7XG5pbXBvcnQgeyBDb21tYW5kRXhlY3V0b3IgfSBmcm9tIFwiLi9leGVjdXRvci50c1wiO1xuaW1wb3J0IHtcbiAgb2tSZXBseSxcbiAgUmF3T3JFcnJvcixcbiAgUmVkaXNSZXBseSxcbiAgUmVkaXNWYWx1ZSxcbiAgc2VuZENvbW1hbmRzLFxufSBmcm9tIFwiLi9wcm90b2NvbC9tb2QudHNcIjtcbmltcG9ydCB7IGNyZWF0ZSwgUmVkaXMgfSBmcm9tIFwiLi9yZWRpcy50c1wiO1xuaW1wb3J0IHtcbiAgRGVmZXJyZWQsXG4gIGRlZmVycmVkLFxufSBmcm9tIFwiLi92ZW5kb3IvaHR0cHMvZGVuby5sYW5kL3N0ZC9hc3luYy9kZWZlcnJlZC50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlZGlzUGlwZWxpbmUgZXh0ZW5kcyBSZWRpcyB7XG4gIGZsdXNoKCk6IFByb21pc2U8UmF3T3JFcnJvcltdPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlZGlzUGlwZWxpbmUoXG4gIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gIHR4ID0gZmFsc2UsXG4pOiBSZWRpc1BpcGVsaW5lIHtcbiAgY29uc3QgZXhlY3V0b3IgPSBuZXcgUGlwZWxpbmVFeGVjdXRvcihjb25uZWN0aW9uLCB0eCk7XG4gIGZ1bmN0aW9uIGZsdXNoKCk6IFByb21pc2U8UmF3T3JFcnJvcltdPiB7XG4gICAgcmV0dXJuIGV4ZWN1dG9yLmZsdXNoKCk7XG4gIH1cbiAgY29uc3QgY2xpZW50ID0gY3JlYXRlKGV4ZWN1dG9yKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oY2xpZW50LCB7IGZsdXNoIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgUGlwZWxpbmVFeGVjdXRvciBpbXBsZW1lbnRzIENvbW1hbmRFeGVjdXRvciB7XG4gIHByaXZhdGUgY29tbWFuZHM6IHtcbiAgICBjb21tYW5kOiBzdHJpbmc7XG4gICAgYXJnczogUmVkaXNWYWx1ZVtdO1xuICB9W10gPSBbXTtcbiAgcHJpdmF0ZSBxdWV1ZToge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBjb21tYW5kOiBzdHJpbmc7XG4gICAgICBhcmdzOiBSZWRpc1ZhbHVlW107XG4gICAgfVtdO1xuICAgIGQ6IERlZmVycmVkPFJhd09yRXJyb3JbXT47XG4gIH1bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlYWRvbmx5IGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gICAgcHJpdmF0ZSB0eDogYm9vbGVhbixcbiAgKSB7XG4gIH1cblxuICBleGVjKFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxSZWRpc1JlcGx5PiB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKHsgY29tbWFuZCwgYXJncyB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9rUmVwbHkpO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5jbG9zZSgpO1xuICB9XG5cbiAgZmx1c2goKTogUHJvbWlzZTxSYXdPckVycm9yW10+IHtcbiAgICBpZiAodGhpcy50eCkge1xuICAgICAgdGhpcy5jb21tYW5kcy51bnNoaWZ0KHsgY29tbWFuZDogXCJNVUxUSVwiLCBhcmdzOiBbXSB9KTtcbiAgICAgIHRoaXMuY29tbWFuZHMucHVzaCh7IGNvbW1hbmQ6IFwiRVhFQ1wiLCBhcmdzOiBbXSB9KTtcbiAgICB9XG4gICAgY29uc3QgZCA9IGRlZmVycmVkPFJhd09yRXJyb3JbXT4oKTtcbiAgICB0aGlzLnF1ZXVlLnB1c2goeyBjb21tYW5kczogWy4uLnRoaXMuY29tbWFuZHNdLCBkIH0pO1xuICAgIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5kZXF1ZXVlKCk7XG4gICAgfVxuICAgIHRoaXMuY29tbWFuZHMgPSBbXTtcbiAgICByZXR1cm4gZDtcbiAgfVxuXG4gIHByaXZhdGUgZGVxdWV1ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBbZV0gPSB0aGlzLnF1ZXVlO1xuICAgIGlmICghZSkgcmV0dXJuO1xuICAgIHNlbmRDb21tYW5kcyh0aGlzLmNvbm5lY3Rpb24ud3JpdGVyLCB0aGlzLmNvbm5lY3Rpb24ucmVhZGVyLCBlLmNvbW1hbmRzKVxuICAgICAgLnRoZW4oZS5kLnJlc29sdmUpXG4gICAgICAuY2F0Y2goZS5kLnJlamVjdClcbiAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLmRlcXVldWUoKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsU0FDRSxPQUFPLEVBSVAsWUFBWSxRQUNQLG9CQUFvQjtBQUMzQixTQUFTLE1BQU0sUUFBZSxhQUFhO0FBQzNDLFNBRUUsUUFBUSxRQUNILGlEQUFpRDtBQU14RCxPQUFPLFNBQVMsb0JBQ2QsVUFBc0IsRUFDdEIsS0FBSyxLQUFLLEVBQ0s7SUFDZixNQUFNLFdBQVcsSUFBSSxpQkFBaUIsWUFBWTtJQUNsRCxTQUFTLFFBQStCO1FBQ3RDLE9BQU8sU0FBUyxLQUFLO0lBQ3ZCO0lBQ0EsTUFBTSxTQUFTLE9BQU87SUFDdEIsT0FBTyxPQUFPLE1BQU0sQ0FBQyxRQUFRO1FBQUU7SUFBTTtBQUN2QyxDQUFDO0FBRUQsT0FBTyxNQUFNO0lBQ0gsU0FHQztJQUNELE1BTUM7SUFFVCxZQUNXLFlBQ0QsR0FDUjswQkFGUztrQkFDRDthQWRGLFdBR0YsRUFBRTthQUNBLFFBTUYsRUFBRTtJQU1SO0lBRUEsS0FDRSxPQUFlLEVBQ2YsR0FBRyxJQUFrQixFQUNBO1FBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQUU7WUFBUztRQUFLO1FBQ25DLE9BQU8sUUFBUSxPQUFPLENBQUM7SUFDekI7SUFFQSxRQUFjO1FBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUs7SUFDOUI7SUFFQSxRQUErQjtRQUM3QixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztnQkFBRSxTQUFTO2dCQUFTLE1BQU0sRUFBRTtZQUFDO1lBQ25ELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUFFLFNBQVM7Z0JBQVEsTUFBTSxFQUFFO1lBQUM7UUFDakQsQ0FBQztRQUNELE1BQU0sSUFBSTtRQUNWLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQUUsVUFBVTttQkFBSSxJQUFJLENBQUMsUUFBUTthQUFDO1lBQUU7UUFBRTtRQUNsRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLEdBQUc7WUFDM0IsSUFBSSxDQUFDLE9BQU87UUFDZCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFO1FBQ2xCLE9BQU87SUFDVDtJQUVRLFVBQWdCO1FBQ3RCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUs7UUFDdEIsSUFBSSxDQUFDLEdBQUc7UUFDUixhQUFhLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUNwRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUNoQixLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUNoQixPQUFPLENBQUMsSUFBTTtZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztZQUNoQixJQUFJLENBQUMsT0FBTztRQUNkO0lBQ0o7SUF6Q1c7SUFDRDtBQXlDWixDQUFDIn0=