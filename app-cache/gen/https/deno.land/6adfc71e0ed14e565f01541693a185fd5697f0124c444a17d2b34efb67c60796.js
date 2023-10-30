// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
import { fromFileUrl } from "../path.ts";
import { Buffer } from "../buffer.ts";
import { Readable as NodeReadable } from "../stream.ts";
class ReadStream extends NodeReadable {
    path;
    constructor(path, opts){
        path = path instanceof URL ? fromFileUrl(path) : path;
        const hasBadOptions = opts && (opts.fd || opts.start || opts.end || opts.fs);
        if (hasBadOptions) {
            notImplemented();
        }
        const file = Deno.openSync(path, {
            read: true
        });
        const buffer = new Uint8Array(16 * 1024);
        super({
            autoDestroy: true,
            emitClose: true,
            objectMode: false,
            read: async function(_size) {
                try {
                    const n = await file.read(buffer);
                    this.push(n ? Buffer.from(buffer.slice(0, n)) : null);
                } catch (err) {
                    this.destroy(err);
                }
            },
            destroy: (err, cb)=>{
                try {
                    file.close();
                // deno-lint-ignore no-empty
                } catch  {}
                cb(err);
            }
        });
        this.path = path;
    }
}
export function createReadStream(path, options) {
    return new ReadStream(path, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvX2ZzL19mc19zdHJlYW1zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBub3RJbXBsZW1lbnRlZCB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgudHNcIjtcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuLi9idWZmZXIudHNcIjtcbmltcG9ydCB7IFJlYWRhYmxlIGFzIE5vZGVSZWFkYWJsZSB9IGZyb20gXCIuLi9zdHJlYW0udHNcIjtcblxudHlwZSBSZWFkU3RyZWFtT3B0aW9ucyA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG5jbGFzcyBSZWFkU3RyZWFtIGV4dGVuZHMgTm9kZVJlYWRhYmxlIHtcbiAgcHVibGljIHBhdGg6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcgfCBVUkwsIG9wdHM/OiBSZWFkU3RyZWFtT3B0aW9ucykge1xuICAgIHBhdGggPSBwYXRoIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aCkgOiBwYXRoO1xuICAgIGNvbnN0IGhhc0JhZE9wdGlvbnMgPSBvcHRzICYmIChcbiAgICAgIG9wdHMuZmQgfHwgb3B0cy5zdGFydCB8fCBvcHRzLmVuZCB8fCBvcHRzLmZzXG4gICAgKTtcbiAgICBpZiAoaGFzQmFkT3B0aW9ucykge1xuICAgICAgbm90SW1wbGVtZW50ZWQoKTtcbiAgICB9XG4gICAgY29uc3QgZmlsZSA9IERlbm8ub3BlblN5bmMocGF0aCwgeyByZWFkOiB0cnVlIH0pO1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDE2ICogMTAyNCk7XG4gICAgc3VwZXIoe1xuICAgICAgYXV0b0Rlc3Ryb3k6IHRydWUsXG4gICAgICBlbWl0Q2xvc2U6IHRydWUsXG4gICAgICBvYmplY3RNb2RlOiBmYWxzZSxcbiAgICAgIHJlYWQ6IGFzeW5jIGZ1bmN0aW9uIChfc2l6ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG4gPSBhd2FpdCBmaWxlLnJlYWQoYnVmZmVyKTtcbiAgICAgICAgICB0aGlzLnB1c2gobiA/IEJ1ZmZlci5mcm9tKGJ1ZmZlci5zbGljZSgwLCBuKSkgOiBudWxsKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgdGhpcy5kZXN0cm95KGVyciBhcyBFcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkZXN0cm95OiAoZXJyLCBjYikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZpbGUuY2xvc2UoKTtcbiAgICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWVtcHR5XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgY2IoZXJyKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVhZFN0cmVhbShcbiAgcGF0aDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogUmVhZFN0cmVhbU9wdGlvbnMsXG4pOiBSZWFkU3RyZWFtIHtcbiAgcmV0dXJuIG5ldyBSZWFkU3RyZWFtKHBhdGgsIG9wdGlvbnMpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLGNBQWMsUUFBUSxlQUFlO0FBQzlDLFNBQVMsV0FBVyxRQUFRLGFBQWE7QUFDekMsU0FBUyxNQUFNLFFBQVEsZUFBZTtBQUN0QyxTQUFTLFlBQVksWUFBWSxRQUFRLGVBQWU7QUFJeEQsTUFBTSxtQkFBbUI7SUFDaEIsS0FBYTtJQUVwQixZQUFZLElBQWtCLEVBQUUsSUFBd0IsQ0FBRTtRQUN4RCxPQUFPLGdCQUFnQixNQUFNLFlBQVksUUFBUSxJQUFJO1FBQ3JELE1BQU0sZ0JBQWdCLFFBQVEsQ0FDNUIsS0FBSyxFQUFFLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLEFBQzlDO1FBQ0EsSUFBSSxlQUFlO1lBQ2pCO1FBQ0YsQ0FBQztRQUNELE1BQU0sT0FBTyxLQUFLLFFBQVEsQ0FBQyxNQUFNO1lBQUUsTUFBTSxJQUFJO1FBQUM7UUFDOUMsTUFBTSxTQUFTLElBQUksV0FBVyxLQUFLO1FBQ25DLEtBQUssQ0FBQztZQUNKLGFBQWEsSUFBSTtZQUNqQixXQUFXLElBQUk7WUFDZixZQUFZLEtBQUs7WUFDakIsTUFBTSxlQUFnQixLQUFLLEVBQUU7Z0JBQzNCLElBQUk7b0JBQ0YsTUFBTSxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUM7b0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxHQUFHLE1BQU0sSUFBSTtnQkFDdEQsRUFBRSxPQUFPLEtBQUs7b0JBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDZjtZQUNGO1lBQ0EsU0FBUyxDQUFDLEtBQUssS0FBTztnQkFDcEIsSUFBSTtvQkFDRixLQUFLLEtBQUs7Z0JBQ1YsNEJBQTRCO2dCQUM5QixFQUFFLE9BQU0sQ0FBQztnQkFDVCxHQUFHO1lBQ0w7UUFDRjtRQUNBLElBQUksQ0FBQyxJQUFJLEdBQUc7SUFDZDtBQUNGO0FBRUEsT0FBTyxTQUFTLGlCQUNkLElBQWtCLEVBQ2xCLE9BQTJCLEVBQ2Y7SUFDWixPQUFPLElBQUksV0FBVyxNQUFNO0FBQzlCLENBQUMifQ==