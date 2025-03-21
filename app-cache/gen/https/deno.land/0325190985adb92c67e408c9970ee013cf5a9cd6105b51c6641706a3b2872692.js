// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
export function close(fd, callback) {
    setTimeout(()=>{
        let error = null;
        try {
            Deno.close(fd);
        } catch (err) {
            error = err instanceof Error ? err : new Error("[non-error thrown]");
        }
        callback(error);
    }, 0);
}
export function closeSync(fd) {
    Deno.close(fd);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvX2ZzL19mc19jbG9zZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHR5cGUgeyBDYWxsYmFja1dpdGhFcnJvciB9IGZyb20gXCIuL19mc19jb21tb24udHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlKGZkOiBudW1iZXIsIGNhbGxiYWNrOiBDYWxsYmFja1dpdGhFcnJvcik6IHZvaWQge1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBEZW5vLmNsb3NlKGZkKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGVycm9yID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIgOiBuZXcgRXJyb3IoXCJbbm9uLWVycm9yIHRocm93bl1cIik7XG4gICAgfVxuICAgIGNhbGxiYWNrKGVycm9yKTtcbiAgfSwgMCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVN5bmMoZmQ6IG51bWJlcik6IHZvaWQge1xuICBEZW5vLmNsb3NlKGZkKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFHMUUsT0FBTyxTQUFTLE1BQU0sRUFBVSxFQUFFLFFBQTJCLEVBQVE7SUFDbkUsV0FBVyxJQUFNO1FBQ2YsSUFBSSxRQUFRLElBQUk7UUFDaEIsSUFBSTtZQUNGLEtBQUssS0FBSyxDQUFDO1FBQ2IsRUFBRSxPQUFPLEtBQUs7WUFDWixRQUFRLGVBQWUsUUFBUSxNQUFNLElBQUksTUFBTSxxQkFBcUI7UUFDdEU7UUFDQSxTQUFTO0lBQ1gsR0FBRztBQUNMLENBQUM7QUFFRCxPQUFPLFNBQVMsVUFBVSxFQUFVLEVBQVE7SUFDMUMsS0FBSyxLQUFLLENBQUM7QUFDYixDQUFDIn0=