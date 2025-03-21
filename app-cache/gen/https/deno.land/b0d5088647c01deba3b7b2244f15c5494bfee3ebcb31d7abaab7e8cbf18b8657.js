// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { deferred } from "./deferred.ts";
export function abortable(p, signal) {
    if (p instanceof Promise) {
        return abortablePromise(p, signal);
    } else {
        return abortableAsyncIterable(p, signal);
    }
}
/**
 * Make Promise abortable with the given signal.
 *
 * @example
 * ```typescript
 * import { abortablePromise } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 *
 * const request = fetch("https://example.com");
 *
 * const c = new AbortController();
 * setTimeout(() => c.abort(), 100);
 *
 * const p = abortablePromise(request, c.signal);
 *
 * // The below throws if the request didn't resolve in 100ms
 * await p;
 * ```
 */ export function abortablePromise(p, signal) {
    if (signal.aborted) {
        return Promise.reject(createAbortError(signal.reason));
    }
    const waiter = deferred();
    const abort = ()=>waiter.reject(createAbortError(signal.reason));
    signal.addEventListener("abort", abort, {
        once: true
    });
    return Promise.race([
        waiter,
        p.finally(()=>{
            signal.removeEventListener("abort", abort);
        })
    ]);
}
/**
 * Make AsyncIterable abortable with the given signal.
 *
 * @example
 * ```typescript
 * import { abortableAsyncIterable } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 * import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 *
 * const p = async function* () {
 *   yield "Hello";
 *   await delay(1000);
 *   yield "World";
 * };
 * const c = new AbortController();
 * setTimeout(() => c.abort(), 100);
 *
 * // Below throws `DOMException` after 100 ms
 * // and items become `["Hello"]`
 * const items: string[] = [];
 * for await (const item of abortableAsyncIterable(p(), c.signal)) {
 *   items.push(item);
 * }
 * ```
 */ export async function* abortableAsyncIterable(p, signal) {
    if (signal.aborted) {
        throw createAbortError(signal.reason);
    }
    const waiter = deferred();
    const abort = ()=>waiter.reject(createAbortError(signal.reason));
    signal.addEventListener("abort", abort, {
        once: true
    });
    const it = p[Symbol.asyncIterator]();
    while(true){
        const { done , value  } = await Promise.race([
            waiter,
            it.next()
        ]);
        if (done) {
            signal.removeEventListener("abort", abort);
            return;
        }
        yield value;
    }
}
// This `reason` comes from `AbortSignal` thus must be `any`.
// deno-lint-ignore no-explicit-any
function createAbortError(reason) {
    return new DOMException(reason ? `Aborted: ${reason}` : "Aborted", "AbortError");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3OC4wL2FzeW5jL2Fib3J0YWJsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZGVmZXJyZWQgfSBmcm9tIFwiLi9kZWZlcnJlZC50c1wiO1xuXG4vKipcbiAqIE1ha2UgUHJvbWlzZSBhYm9ydGFibGUgd2l0aCB0aGUgZ2l2ZW4gc2lnbmFsLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQgeyBhYm9ydGFibGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9hc3luYy9tb2QudHNcIjtcbiAqIGltcG9ydCB7IGRlbGF5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXN5bmMvbW9kLnRzXCI7XG4gKlxuICogY29uc3QgcCA9IGRlbGF5KDEwMDApO1xuICogY29uc3QgYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAqIHNldFRpbWVvdXQoKCkgPT4gYy5hYm9ydCgpLCAxMDApO1xuICpcbiAqIC8vIEJlbG93IHRocm93cyBgRE9NRXhjZXB0aW9uYCBhZnRlciAxMDAgbXNcbiAqIGF3YWl0IGFib3J0YWJsZShwLCBjLnNpZ25hbCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFib3J0YWJsZTxUPihwOiBQcm9taXNlPFQ+LCBzaWduYWw6IEFib3J0U2lnbmFsKTogUHJvbWlzZTxUPjtcbi8qKlxuICogTWFrZSBBc3luY0l0ZXJhYmxlIGFib3J0YWJsZSB3aXRoIHRoZSBnaXZlbiBzaWduYWwuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IGFib3J0YWJsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2FzeW5jL21vZC50c1wiO1xuICogaW1wb3J0IHsgZGVsYXkgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9hc3luYy9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCBwID0gYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAqICAgeWllbGQgXCJIZWxsb1wiO1xuICogICBhd2FpdCBkZWxheSgxMDAwKTtcbiAqICAgeWllbGQgXCJXb3JsZFwiO1xuICogfTtcbiAqIGNvbnN0IGMgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gKiBzZXRUaW1lb3V0KCgpID0+IGMuYWJvcnQoKSwgMTAwKTtcbiAqXG4gKiAvLyBCZWxvdyB0aHJvd3MgYERPTUV4Y2VwdGlvbmAgYWZ0ZXIgMTAwIG1zXG4gKiAvLyBhbmQgaXRlbXMgYmVjb21lIGBbXCJIZWxsb1wiXWBcbiAqIGNvbnN0IGl0ZW1zOiBzdHJpbmdbXSA9IFtdO1xuICogZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGFib3J0YWJsZShwKCksIGMuc2lnbmFsKSkge1xuICogICBpdGVtcy5wdXNoKGl0ZW0pO1xuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhYm9ydGFibGU8VD4oXG4gIHA6IEFzeW5jSXRlcmFibGU8VD4sXG4gIHNpZ25hbDogQWJvcnRTaWduYWwsXG4pOiBBc3luY0dlbmVyYXRvcjxUPjtcbmV4cG9ydCBmdW5jdGlvbiBhYm9ydGFibGU8VD4oXG4gIHA6IFByb21pc2U8VD4gfCBBc3luY0l0ZXJhYmxlPFQ+LFxuICBzaWduYWw6IEFib3J0U2lnbmFsLFxuKTogUHJvbWlzZTxUPiB8IEFzeW5jSXRlcmFibGU8VD4ge1xuICBpZiAocCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICByZXR1cm4gYWJvcnRhYmxlUHJvbWlzZShwLCBzaWduYWwpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBhYm9ydGFibGVBc3luY0l0ZXJhYmxlKHAsIHNpZ25hbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIFByb21pc2UgYWJvcnRhYmxlIHdpdGggdGhlIGdpdmVuIHNpZ25hbC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHsgYWJvcnRhYmxlUHJvbWlzZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2FzeW5jL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IHJlcXVlc3QgPSBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKlxuICogY29uc3QgYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAqIHNldFRpbWVvdXQoKCkgPT4gYy5hYm9ydCgpLCAxMDApO1xuICpcbiAqIGNvbnN0IHAgPSBhYm9ydGFibGVQcm9taXNlKHJlcXVlc3QsIGMuc2lnbmFsKTtcbiAqXG4gKiAvLyBUaGUgYmVsb3cgdGhyb3dzIGlmIHRoZSByZXF1ZXN0IGRpZG4ndCByZXNvbHZlIGluIDEwMG1zXG4gKiBhd2FpdCBwO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhYm9ydGFibGVQcm9taXNlPFQ+KFxuICBwOiBQcm9taXNlPFQ+LFxuICBzaWduYWw6IEFib3J0U2lnbmFsLFxuKTogUHJvbWlzZTxUPiB7XG4gIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjcmVhdGVBYm9ydEVycm9yKHNpZ25hbC5yZWFzb24pKTtcbiAgfVxuICBjb25zdCB3YWl0ZXIgPSBkZWZlcnJlZDxuZXZlcj4oKTtcbiAgY29uc3QgYWJvcnQgPSAoKSA9PiB3YWl0ZXIucmVqZWN0KGNyZWF0ZUFib3J0RXJyb3Ioc2lnbmFsLnJlYXNvbikpO1xuICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0LCB7IG9uY2U6IHRydWUgfSk7XG4gIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgIHdhaXRlcixcbiAgICBwLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgfSksXG4gIF0pO1xufVxuXG4vKipcbiAqIE1ha2UgQXN5bmNJdGVyYWJsZSBhYm9ydGFibGUgd2l0aCB0aGUgZ2l2ZW4gc2lnbmFsLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQgeyBhYm9ydGFibGVBc3luY0l0ZXJhYmxlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXN5bmMvbW9kLnRzXCI7XG4gKiBpbXBvcnQgeyBkZWxheSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2FzeW5jL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IHAgPSBhc3luYyBmdW5jdGlvbiogKCkge1xuICogICB5aWVsZCBcIkhlbGxvXCI7XG4gKiAgIGF3YWl0IGRlbGF5KDEwMDApO1xuICogICB5aWVsZCBcIldvcmxkXCI7XG4gKiB9O1xuICogY29uc3QgYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAqIHNldFRpbWVvdXQoKCkgPT4gYy5hYm9ydCgpLCAxMDApO1xuICpcbiAqIC8vIEJlbG93IHRocm93cyBgRE9NRXhjZXB0aW9uYCBhZnRlciAxMDAgbXNcbiAqIC8vIGFuZCBpdGVtcyBiZWNvbWUgYFtcIkhlbGxvXCJdYFxuICogY29uc3QgaXRlbXM6IHN0cmluZ1tdID0gW107XG4gKiBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgYWJvcnRhYmxlQXN5bmNJdGVyYWJsZShwKCksIGMuc2lnbmFsKSkge1xuICogICBpdGVtcy5wdXNoKGl0ZW0pO1xuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogYWJvcnRhYmxlQXN5bmNJdGVyYWJsZTxUPihcbiAgcDogQXN5bmNJdGVyYWJsZTxUPixcbiAgc2lnbmFsOiBBYm9ydFNpZ25hbCxcbik6IEFzeW5jR2VuZXJhdG9yPFQ+IHtcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgdGhyb3cgY3JlYXRlQWJvcnRFcnJvcihzaWduYWwucmVhc29uKTtcbiAgfVxuICBjb25zdCB3YWl0ZXIgPSBkZWZlcnJlZDxuZXZlcj4oKTtcbiAgY29uc3QgYWJvcnQgPSAoKSA9PiB3YWl0ZXIucmVqZWN0KGNyZWF0ZUFib3J0RXJyb3Ioc2lnbmFsLnJlYXNvbikpO1xuICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0LCB7IG9uY2U6IHRydWUgfSk7XG5cbiAgY29uc3QgaXQgPSBwW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IFByb21pc2UucmFjZShbd2FpdGVyLCBpdC5uZXh0KCldKTtcbiAgICBpZiAoZG9uZSkge1xuICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHlpZWxkIHZhbHVlO1xuICB9XG59XG5cbi8vIFRoaXMgYHJlYXNvbmAgY29tZXMgZnJvbSBgQWJvcnRTaWduYWxgIHRodXMgbXVzdCBiZSBgYW55YC5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBjcmVhdGVBYm9ydEVycm9yKHJlYXNvbj86IGFueSk6IERPTUV4Y2VwdGlvbiB7XG4gIHJldHVybiBuZXcgRE9NRXhjZXB0aW9uKFxuICAgIHJlYXNvbiA/IGBBYm9ydGVkOiAke3JlYXNvbn1gIDogXCJBYm9ydGVkXCIsXG4gICAgXCJBYm9ydEVycm9yXCIsXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMsUUFBUSxRQUFRLGdCQUFnQjtBQStDekMsT0FBTyxTQUFTLFVBQ2QsQ0FBZ0MsRUFDaEMsTUFBbUIsRUFDWTtJQUMvQixJQUFJLGFBQWEsU0FBUztRQUN4QixPQUFPLGlCQUFpQixHQUFHO0lBQzdCLE9BQU87UUFDTCxPQUFPLHVCQUF1QixHQUFHO0lBQ25DLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUJDLEdBQ0QsT0FBTyxTQUFTLGlCQUNkLENBQWEsRUFDYixNQUFtQixFQUNQO0lBQ1osSUFBSSxPQUFPLE9BQU8sRUFBRTtRQUNsQixPQUFPLFFBQVEsTUFBTSxDQUFDLGlCQUFpQixPQUFPLE1BQU07SUFDdEQsQ0FBQztJQUNELE1BQU0sU0FBUztJQUNmLE1BQU0sUUFBUSxJQUFNLE9BQU8sTUFBTSxDQUFDLGlCQUFpQixPQUFPLE1BQU07SUFDaEUsT0FBTyxnQkFBZ0IsQ0FBQyxTQUFTLE9BQU87UUFBRSxNQUFNLElBQUk7SUFBQztJQUNyRCxPQUFPLFFBQVEsSUFBSSxDQUFDO1FBQ2xCO1FBQ0EsRUFBRSxPQUFPLENBQUMsSUFBTTtZQUNkLE9BQU8sbUJBQW1CLENBQUMsU0FBUztRQUN0QztLQUNEO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUNELE9BQU8sZ0JBQWdCLHVCQUNyQixDQUFtQixFQUNuQixNQUFtQixFQUNBO0lBQ25CLElBQUksT0FBTyxPQUFPLEVBQUU7UUFDbEIsTUFBTSxpQkFBaUIsT0FBTyxNQUFNLEVBQUU7SUFDeEMsQ0FBQztJQUNELE1BQU0sU0FBUztJQUNmLE1BQU0sUUFBUSxJQUFNLE9BQU8sTUFBTSxDQUFDLGlCQUFpQixPQUFPLE1BQU07SUFDaEUsT0FBTyxnQkFBZ0IsQ0FBQyxTQUFTLE9BQU87UUFBRSxNQUFNLElBQUk7SUFBQztJQUVyRCxNQUFNLEtBQUssQ0FBQyxDQUFDLE9BQU8sYUFBYSxDQUFDO0lBQ2xDLE1BQU8sSUFBSSxDQUFFO1FBQ1gsTUFBTSxFQUFFLEtBQUksRUFBRSxNQUFLLEVBQUUsR0FBRyxNQUFNLFFBQVEsSUFBSSxDQUFDO1lBQUM7WUFBUSxHQUFHLElBQUk7U0FBRztRQUM5RCxJQUFJLE1BQU07WUFDUixPQUFPLG1CQUFtQixDQUFDLFNBQVM7WUFDcEM7UUFDRixDQUFDO1FBQ0QsTUFBTTtJQUNSO0FBQ0YsQ0FBQztBQUVELDZEQUE2RDtBQUM3RCxtQ0FBbUM7QUFDbkMsU0FBUyxpQkFBaUIsTUFBWSxFQUFnQjtJQUNwRCxPQUFPLElBQUksYUFDVCxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLFNBQVMsRUFDekM7QUFFSiJ9