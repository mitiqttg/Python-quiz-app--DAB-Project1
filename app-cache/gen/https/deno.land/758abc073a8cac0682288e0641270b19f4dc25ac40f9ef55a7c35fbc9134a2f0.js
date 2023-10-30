// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { emitRecursiveRmdirWarning, getValidatedPath, validateRmdirOptions, validateRmOptions, validateRmOptionsSync } from "../internal/fs/utils.mjs";
import { toNamespacedPath } from "../path.ts";
import { denoErrorToNodeError, ERR_FS_RMDIR_ENOTDIR } from "../internal/errors.ts";
export function rmdir(path, optionsOrCallback, maybeCallback) {
    path = toNamespacedPath(getValidatedPath(path));
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    const options = typeof optionsOrCallback === "object" ? optionsOrCallback : undefined;
    if (!callback) throw new Error("No callback function supplied");
    if (options?.recursive) {
        emitRecursiveRmdirWarning();
        validateRmOptions(path, {
            ...options,
            force: false
        }, true, (err, options)=>{
            if (err === false) {
                return callback(new ERR_FS_RMDIR_ENOTDIR(path.toString()));
            }
            if (err) {
                return callback(err);
            }
            Deno.remove(path, {
                recursive: options?.recursive
            }).then((_)=>callback(), callback);
        });
    } else {
        validateRmdirOptions(options);
        Deno.remove(path, {
            recursive: options?.recursive
        }).then((_)=>callback(), (err)=>{
            callback(err instanceof Error ? denoErrorToNodeError(err, {
                syscall: "rmdir"
            }) : err);
        });
    }
}
export function rmdirSync(path, options) {
    path = getValidatedPath(path);
    if (options?.recursive) {
        emitRecursiveRmdirWarning();
        options = validateRmOptionsSync(path, {
            ...options,
            force: false
        }, true);
        if (options === false) {
            throw new ERR_FS_RMDIR_ENOTDIR(path.toString());
        }
    } else {
        validateRmdirOptions(options);
    }
    try {
        Deno.removeSync(toNamespacedPath(path), {
            recursive: options?.recursive
        });
    } catch (err) {
        throw err instanceof Error ? denoErrorToNodeError(err, {
            syscall: "rmdir"
        }) : err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvX2ZzL19mc19ybWRpci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHtcbiAgZW1pdFJlY3Vyc2l2ZVJtZGlyV2FybmluZyxcbiAgZ2V0VmFsaWRhdGVkUGF0aCxcbiAgdmFsaWRhdGVSbWRpck9wdGlvbnMsXG4gIHZhbGlkYXRlUm1PcHRpb25zLFxuICB2YWxpZGF0ZVJtT3B0aW9uc1N5bmMsXG59IGZyb20gXCIuLi9pbnRlcm5hbC9mcy91dGlscy5tanNcIjtcbmltcG9ydCB7IHRvTmFtZXNwYWNlZFBhdGggfSBmcm9tIFwiLi4vcGF0aC50c1wiO1xuaW1wb3J0IHtcbiAgZGVub0Vycm9yVG9Ob2RlRXJyb3IsXG4gIEVSUl9GU19STURJUl9FTk9URElSLFxufSBmcm9tIFwiLi4vaW50ZXJuYWwvZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi4vYnVmZmVyLnRzXCI7XG5cbnR5cGUgcm1kaXJPcHRpb25zID0ge1xuICBtYXhSZXRyaWVzPzogbnVtYmVyO1xuICByZWN1cnNpdmU/OiBib29sZWFuO1xuICByZXRyeURlbGF5PzogbnVtYmVyO1xufTtcblxudHlwZSBybWRpckNhbGxiYWNrID0gKGVycj86IEVycm9yKSA9PiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gcm1kaXIocGF0aDogc3RyaW5nIHwgVVJMLCBjYWxsYmFjazogcm1kaXJDYWxsYmFjayk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gcm1kaXIoXG4gIHBhdGg6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9uczogcm1kaXJPcHRpb25zLFxuICBjYWxsYmFjazogcm1kaXJDYWxsYmFjayxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gcm1kaXIoXG4gIHBhdGg6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9uc09yQ2FsbGJhY2s6IHJtZGlyT3B0aW9ucyB8IHJtZGlyQ2FsbGJhY2ssXG4gIG1heWJlQ2FsbGJhY2s/OiBybWRpckNhbGxiYWNrLFxuKSB7XG4gIHBhdGggPSB0b05hbWVzcGFjZWRQYXRoKGdldFZhbGlkYXRlZFBhdGgocGF0aCkgYXMgc3RyaW5nKTtcblxuICBjb25zdCBjYWxsYmFjayA9IHR5cGVvZiBvcHRpb25zT3JDYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBvcHRpb25zT3JDYWxsYmFja1xuICAgIDogbWF5YmVDYWxsYmFjaztcbiAgY29uc3Qgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb25zT3JDYWxsYmFjayA9PT0gXCJvYmplY3RcIlxuICAgID8gb3B0aW9uc09yQ2FsbGJhY2tcbiAgICA6IHVuZGVmaW5lZDtcblxuICBpZiAoIWNhbGxiYWNrKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBjYWxsYmFjayBmdW5jdGlvbiBzdXBwbGllZFwiKTtcblxuICBpZiAob3B0aW9ucz8ucmVjdXJzaXZlKSB7XG4gICAgZW1pdFJlY3Vyc2l2ZVJtZGlyV2FybmluZygpO1xuICAgIHZhbGlkYXRlUm1PcHRpb25zKFxuICAgICAgcGF0aCxcbiAgICAgIHsgLi4ub3B0aW9ucywgZm9yY2U6IGZhbHNlIH0sXG4gICAgICB0cnVlLFxuICAgICAgKGVycjogRXJyb3IgfCBudWxsIHwgZmFsc2UsIG9wdGlvbnM6IHJtZGlyT3B0aW9ucykgPT4ge1xuICAgICAgICBpZiAoZXJyID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRVJSX0ZTX1JNRElSX0VOT1RESVIocGF0aC50b1N0cmluZygpKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgRGVuby5yZW1vdmUocGF0aCwgeyByZWN1cnNpdmU6IG9wdGlvbnM/LnJlY3Vyc2l2ZSB9KVxuICAgICAgICAgIC50aGVuKChfKSA9PiBjYWxsYmFjaygpLCBjYWxsYmFjayk7XG4gICAgICB9LFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgdmFsaWRhdGVSbWRpck9wdGlvbnMob3B0aW9ucyk7XG4gICAgRGVuby5yZW1vdmUocGF0aCwgeyByZWN1cnNpdmU6IG9wdGlvbnM/LnJlY3Vyc2l2ZSB9KVxuICAgICAgLnRoZW4oKF8pID0+IGNhbGxiYWNrKCksIChlcnI6IHVua25vd24pID0+IHtcbiAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgZXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgID8gZGVub0Vycm9yVG9Ob2RlRXJyb3IoZXJyLCB7IHN5c2NhbGw6IFwicm1kaXJcIiB9KVxuICAgICAgICAgICAgOiBlcnIsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcm1kaXJTeW5jKHBhdGg6IHN0cmluZyB8IEJ1ZmZlciB8IFVSTCwgb3B0aW9ucz86IHJtZGlyT3B0aW9ucykge1xuICBwYXRoID0gZ2V0VmFsaWRhdGVkUGF0aChwYXRoKTtcbiAgaWYgKG9wdGlvbnM/LnJlY3Vyc2l2ZSkge1xuICAgIGVtaXRSZWN1cnNpdmVSbWRpcldhcm5pbmcoKTtcbiAgICBvcHRpb25zID0gdmFsaWRhdGVSbU9wdGlvbnNTeW5jKHBhdGgsIHsgLi4ub3B0aW9ucywgZm9yY2U6IGZhbHNlIH0sIHRydWUpO1xuICAgIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEVSUl9GU19STURJUl9FTk9URElSKHBhdGgudG9TdHJpbmcoKSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhbGlkYXRlUm1kaXJPcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBEZW5vLnJlbW92ZVN5bmModG9OYW1lc3BhY2VkUGF0aChwYXRoIGFzIHN0cmluZyksIHtcbiAgICAgIHJlY3Vyc2l2ZTogb3B0aW9ucz8ucmVjdXJzaXZlLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnI6IHVua25vd24pIHtcbiAgICB0aHJvdyAoZXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgID8gZGVub0Vycm9yVG9Ob2RlRXJyb3IoZXJyLCB7IHN5c2NhbGw6IFwicm1kaXJcIiB9KVxuICAgICAgOiBlcnIpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQ0UseUJBQXlCLEVBQ3pCLGdCQUFnQixFQUNoQixvQkFBb0IsRUFDcEIsaUJBQWlCLEVBQ2pCLHFCQUFxQixRQUNoQiwyQkFBMkI7QUFDbEMsU0FBUyxnQkFBZ0IsUUFBUSxhQUFhO0FBQzlDLFNBQ0Usb0JBQW9CLEVBQ3BCLG9CQUFvQixRQUNmLHdCQUF3QjtBQWlCL0IsT0FBTyxTQUFTLE1BQ2QsSUFBa0IsRUFDbEIsaUJBQStDLEVBQy9DLGFBQTZCLEVBQzdCO0lBQ0EsT0FBTyxpQkFBaUIsaUJBQWlCO0lBRXpDLE1BQU0sV0FBVyxPQUFPLHNCQUFzQixhQUMxQyxvQkFDQSxhQUFhO0lBQ2pCLE1BQU0sVUFBVSxPQUFPLHNCQUFzQixXQUN6QyxvQkFDQSxTQUFTO0lBRWIsSUFBSSxDQUFDLFVBQVUsTUFBTSxJQUFJLE1BQU0saUNBQWlDO0lBRWhFLElBQUksU0FBUyxXQUFXO1FBQ3RCO1FBQ0Esa0JBQ0UsTUFDQTtZQUFFLEdBQUcsT0FBTztZQUFFLE9BQU8sS0FBSztRQUFDLEdBQzNCLElBQUksRUFDSixDQUFDLEtBQTJCLFVBQTBCO1lBQ3BELElBQUksUUFBUSxLQUFLLEVBQUU7Z0JBQ2pCLE9BQU8sU0FBUyxJQUFJLHFCQUFxQixLQUFLLFFBQVE7WUFDeEQsQ0FBQztZQUNELElBQUksS0FBSztnQkFDUCxPQUFPLFNBQVM7WUFDbEIsQ0FBQztZQUVELEtBQUssTUFBTSxDQUFDLE1BQU07Z0JBQUUsV0FBVyxTQUFTO1lBQVUsR0FDL0MsSUFBSSxDQUFDLENBQUMsSUFBTSxZQUFZO1FBQzdCO0lBRUosT0FBTztRQUNMLHFCQUFxQjtRQUNyQixLQUFLLE1BQU0sQ0FBQyxNQUFNO1lBQUUsV0FBVyxTQUFTO1FBQVUsR0FDL0MsSUFBSSxDQUFDLENBQUMsSUFBTSxZQUFZLENBQUMsTUFBaUI7WUFDekMsU0FDRSxlQUFlLFFBQ1gscUJBQXFCLEtBQUs7Z0JBQUUsU0FBUztZQUFRLEtBQzdDLEdBQUc7UUFFWDtJQUNKLENBQUM7QUFDSCxDQUFDO0FBRUQsT0FBTyxTQUFTLFVBQVUsSUFBMkIsRUFBRSxPQUFzQixFQUFFO0lBQzdFLE9BQU8saUJBQWlCO0lBQ3hCLElBQUksU0FBUyxXQUFXO1FBQ3RCO1FBQ0EsVUFBVSxzQkFBc0IsTUFBTTtZQUFFLEdBQUcsT0FBTztZQUFFLE9BQU8sS0FBSztRQUFDLEdBQUcsSUFBSTtRQUN4RSxJQUFJLFlBQVksS0FBSyxFQUFFO1lBQ3JCLE1BQU0sSUFBSSxxQkFBcUIsS0FBSyxRQUFRLElBQUk7UUFDbEQsQ0FBQztJQUNILE9BQU87UUFDTCxxQkFBcUI7SUFDdkIsQ0FBQztJQUVELElBQUk7UUFDRixLQUFLLFVBQVUsQ0FBQyxpQkFBaUIsT0FBaUI7WUFDaEQsV0FBVyxTQUFTO1FBQ3RCO0lBQ0YsRUFBRSxPQUFPLEtBQWM7UUFDckIsTUFBTyxlQUFlLFFBQ2xCLHFCQUFxQixLQUFLO1lBQUUsU0FBUztRQUFRLEtBQzdDLEdBQUcsQ0FBRTtJQUNYO0FBQ0YsQ0FBQyJ9