import { deferred } from "./vendor/https/deno.land/std/async/deferred.ts";
export class MuxExecutor {
    constructor(connection){
        this.connection = connection;
        this.queue = [];
    }
    queue;
    exec(command, ...args) {
        const d = deferred();
        this.queue.push({
            command,
            args,
            d
        });
        if (this.queue.length === 1) {
            this.dequeue();
        }
        return d;
    }
    close() {
        this.connection.close();
    }
    dequeue() {
        const [e] = this.queue;
        if (!e) return;
        this.connection.sendCommand(e.command, e.args).then(e.d.resolve).catch(e.d.reject).finally(()=>{
            this.queue.shift();
            this.dequeue();
        });
    }
    connection;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMjkuMC9leGVjdXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbm5lY3Rpb24gfSBmcm9tIFwiLi9jb25uZWN0aW9uLnRzXCI7XG5pbXBvcnQge1xuICBEZWZlcnJlZCxcbiAgZGVmZXJyZWQsXG59IGZyb20gXCIuL3ZlbmRvci9odHRwcy9kZW5vLmxhbmQvc3RkL2FzeW5jL2RlZmVycmVkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJlZGlzUmVwbHksIFJlZGlzVmFsdWUgfSBmcm9tIFwiLi9wcm90b2NvbC9tb2QudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kRXhlY3V0b3Ige1xuICByZWFkb25seSBjb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuICBleGVjKFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxSZWRpc1JlcGx5PjtcblxuICAvKipcbiAgICogQ2xvc2VzIGEgcmVkaXMgY29ubmVjdGlvbi5cbiAgICovXG4gIGNsb3NlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBNdXhFeGVjdXRvciBpbXBsZW1lbnRzIENvbW1hbmRFeGVjdXRvciB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHt9XG5cbiAgcHJpdmF0ZSBxdWV1ZToge1xuICAgIGNvbW1hbmQ6IHN0cmluZztcbiAgICBhcmdzOiBSZWRpc1ZhbHVlW107XG4gICAgZDogRGVmZXJyZWQ8UmVkaXNSZXBseT47XG4gIH1bXSA9IFtdO1xuXG4gIGV4ZWMoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIC4uLmFyZ3M6IFJlZGlzVmFsdWVbXVxuICApOiBQcm9taXNlPFJlZGlzUmVwbHk+IHtcbiAgICBjb25zdCBkID0gZGVmZXJyZWQ8UmVkaXNSZXBseT4oKTtcbiAgICB0aGlzLnF1ZXVlLnB1c2goeyBjb21tYW5kLCBhcmdzLCBkIH0pO1xuICAgIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5kZXF1ZXVlKCk7XG4gICAgfVxuICAgIHJldHVybiBkO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb25uZWN0aW9uLmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIGRlcXVldWUoKTogdm9pZCB7XG4gICAgY29uc3QgW2VdID0gdGhpcy5xdWV1ZTtcbiAgICBpZiAoIWUpIHJldHVybjtcbiAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZENvbW1hbmQoZS5jb21tYW5kLCBlLmFyZ3MpXG4gICAgICAudGhlbihlLmQucmVzb2x2ZSlcbiAgICAgIC5jYXRjaChlLmQucmVqZWN0KVxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIHRoaXMuZGVxdWV1ZSgpO1xuICAgICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUVFLFFBQVEsUUFDSCxpREFBaUQ7QUFnQnhELE9BQU8sTUFBTTtJQUNYLFlBQXFCLFdBQXdCOzBCQUF4QjthQUViLFFBSUYsRUFBRTtJQU5zQztJQUV0QyxNQUlDO0lBRVQsS0FDRSxPQUFlLEVBQ2YsR0FBRyxJQUFrQixFQUNBO1FBQ3JCLE1BQU0sSUFBSTtRQUNWLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQUU7WUFBUztZQUFNO1FBQUU7UUFDbkMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxHQUFHO1lBQzNCLElBQUksQ0FBQyxPQUFPO1FBQ2QsQ0FBQztRQUNELE9BQU87SUFDVDtJQUVBLFFBQWM7UUFDWixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUs7SUFDdkI7SUFFUSxVQUFnQjtRQUN0QixNQUFNLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLO1FBQ3RCLElBQUksQ0FBQyxHQUFHO1FBQ1IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQzFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQ2hCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQ2hCLE9BQU8sQ0FBQyxJQUFNO1lBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO1lBQ2hCLElBQUksQ0FBQyxPQUFPO1FBQ2Q7SUFDSjtJQWxDcUI7QUFtQ3ZCLENBQUMifQ==