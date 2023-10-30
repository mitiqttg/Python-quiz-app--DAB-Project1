// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
// deno-lint-ignore-file no-inner-declarations
import { core } from "./_core.ts";
import { validateCallback } from "./internal/validators.mjs";
import { _exiting } from "./_process/exiting.ts";
import { FixedQueue } from "./_fixed_queue.ts";
const queue = new FixedQueue();
// deno-lint-ignore no-explicit-any
let _nextTick;
if (typeof core.setNextTickCallback !== "undefined") {
    function runNextTicks() {
        // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
        // if (!hasTickScheduled() && !hasRejectionToWarn())
        //   runMicrotasks();
        // if (!hasTickScheduled() && !hasRejectionToWarn())
        //   return;
        if (!core.hasTickScheduled()) {
            core.runMicrotasks();
        }
        if (!core.hasTickScheduled()) {
            return true;
        }
        processTicksAndRejections();
        return true;
    }
    function processTicksAndRejections() {
        let tock;
        do {
            // deno-lint-ignore no-cond-assign
            while(tock = queue.shift()){
                // FIXME(bartlomieju): Deno currently doesn't support async hooks
                // const asyncId = tock[async_id_symbol];
                // emitBefore(asyncId, tock[trigger_async_id_symbol], tock);
                try {
                    const callback = tock.callback;
                    if (tock.args === undefined) {
                        callback();
                    } else {
                        const args = tock.args;
                        switch(args.length){
                            case 1:
                                callback(args[0]);
                                break;
                            case 2:
                                callback(args[0], args[1]);
                                break;
                            case 3:
                                callback(args[0], args[1], args[2]);
                                break;
                            case 4:
                                callback(args[0], args[1], args[2], args[3]);
                                break;
                            default:
                                callback(...args);
                        }
                    }
                } finally{
                // FIXME(bartlomieju): Deno currently doesn't support async hooks
                // if (destroyHooksExist())
                // emitDestroy(asyncId);
                }
            // FIXME(bartlomieju): Deno currently doesn't support async hooks
            // emitAfter(asyncId);
            }
            core.runMicrotasks();
        // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
        // } while (!queue.isEmpty() || processPromiseRejections());
        }while (!queue.isEmpty())
        core.setHasTickScheduled(false);
    // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
    // setHasRejectionToWarn(false);
    }
    core.setNextTickCallback(processTicksAndRejections);
    core.setMacrotaskCallback(runNextTicks);
    function __nextTickNative(callback, ...args) {
        validateCallback(callback);
        if (_exiting) {
            return;
        }
        // TODO(bartlomieju): seems superfluous if we don't depend on `arguments`
        let args_;
        switch(args.length){
            case 0:
                break;
            case 1:
                args_ = [
                    args[0]
                ];
                break;
            case 2:
                args_ = [
                    args[0],
                    args[1]
                ];
                break;
            case 3:
                args_ = [
                    args[0],
                    args[1],
                    args[2]
                ];
                break;
            default:
                args_ = new Array(args.length);
                for(let i = 0; i < args.length; i++){
                    args_[i] = args[i];
                }
        }
        if (queue.isEmpty()) {
            core.setHasTickScheduled(true);
        }
        // FIXME(bartlomieju): Deno currently doesn't support async hooks
        // const asyncId = newAsyncId();
        // const triggerAsyncId = getDefaultTriggerAsyncId();
        const tickObject = {
            // FIXME(bartlomieju): Deno currently doesn't support async hooks
            // [async_id_symbol]: asyncId,
            // [trigger_async_id_symbol]: triggerAsyncId,
            callback,
            args: args_
        };
        // FIXME(bartlomieju): Deno currently doesn't support async hooks
        // if (initHooksExist())
        //   emitInit(asyncId, 'TickObject', triggerAsyncId, tickObject);
        queue.push(tickObject);
    }
    _nextTick = __nextTickNative;
} else {
    function __nextTickQueueMicrotask(callback, ...args) {
        if (args) {
            queueMicrotask(()=>callback.call(this, ...args));
        } else {
            queueMicrotask(callback);
        }
    }
    _nextTick = __nextTickQueueMicrotask;
}
export function nextTick(callback, ...args) {
    _nextTick(callback, ...args);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvX25leHRfdGljay50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG5cbi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcblxuaW1wb3J0IHsgY29yZSB9IGZyb20gXCIuL19jb3JlLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUNhbGxiYWNrIH0gZnJvbSBcIi4vaW50ZXJuYWwvdmFsaWRhdG9ycy5tanNcIjtcbmltcG9ydCB7IF9leGl0aW5nIH0gZnJvbSBcIi4vX3Byb2Nlc3MvZXhpdGluZy50c1wiO1xuaW1wb3J0IHsgRml4ZWRRdWV1ZSB9IGZyb20gXCIuL19maXhlZF9xdWV1ZS50c1wiO1xuXG5pbnRlcmZhY2UgVG9jayB7XG4gIGNhbGxiYWNrOiAoLi4uYXJnczogQXJyYXk8dW5rbm93bj4pID0+IHZvaWQ7XG4gIGFyZ3M6IEFycmF5PHVua25vd24+O1xufVxuXG5jb25zdCBxdWV1ZSA9IG5ldyBGaXhlZFF1ZXVlKCk7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5sZXQgX25leHRUaWNrOiBhbnk7XG5cbmlmICh0eXBlb2YgY29yZS5zZXROZXh0VGlja0NhbGxiYWNrICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIGZ1bmN0aW9uIHJ1bk5leHRUaWNrcygpIHtcbiAgICAvLyBGSVhNRShiYXJ0bG9taWVqdSk6IERlbm8gY3VycmVudGx5IGRvZXNuJ3QgdW5oYW5kbGVkIHJlamVjdGlvbnNcbiAgICAvLyBpZiAoIWhhc1RpY2tTY2hlZHVsZWQoKSAmJiAhaGFzUmVqZWN0aW9uVG9XYXJuKCkpXG4gICAgLy8gICBydW5NaWNyb3Rhc2tzKCk7XG4gICAgLy8gaWYgKCFoYXNUaWNrU2NoZWR1bGVkKCkgJiYgIWhhc1JlamVjdGlvblRvV2FybigpKVxuICAgIC8vICAgcmV0dXJuO1xuICAgIGlmICghY29yZS5oYXNUaWNrU2NoZWR1bGVkKCkpIHtcbiAgICAgIGNvcmUucnVuTWljcm90YXNrcygpO1xuICAgIH1cbiAgICBpZiAoIWNvcmUuaGFzVGlja1NjaGVkdWxlZCgpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcm9jZXNzVGlja3NBbmRSZWplY3Rpb25zKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9jZXNzVGlja3NBbmRSZWplY3Rpb25zKCkge1xuICAgIGxldCB0b2NrO1xuICAgIGRvIHtcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tY29uZC1hc3NpZ25cbiAgICAgIHdoaWxlICh0b2NrID0gcXVldWUuc2hpZnQoKSkge1xuICAgICAgICAvLyBGSVhNRShiYXJ0bG9taWVqdSk6IERlbm8gY3VycmVudGx5IGRvZXNuJ3Qgc3VwcG9ydCBhc3luYyBob29rc1xuICAgICAgICAvLyBjb25zdCBhc3luY0lkID0gdG9ja1thc3luY19pZF9zeW1ib2xdO1xuICAgICAgICAvLyBlbWl0QmVmb3JlKGFzeW5jSWQsIHRvY2tbdHJpZ2dlcl9hc3luY19pZF9zeW1ib2xdLCB0b2NrKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gKHRvY2sgYXMgVG9jaykuY2FsbGJhY2s7XG4gICAgICAgICAgaWYgKCh0b2NrIGFzIFRvY2spLmFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYXJncyA9ICh0b2NrIGFzIFRvY2spLmFyZ3M7XG4gICAgICAgICAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0sIGFyZ3NbMV0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdLCBhcmdzWzNdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjYWxsYmFjayguLi5hcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgLy8gRklYTUUoYmFydGxvbWllanUpOiBEZW5vIGN1cnJlbnRseSBkb2Vzbid0IHN1cHBvcnQgYXN5bmMgaG9va3NcbiAgICAgICAgICAvLyBpZiAoZGVzdHJveUhvb2tzRXhpc3QoKSlcbiAgICAgICAgICAvLyBlbWl0RGVzdHJveShhc3luY0lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZJWE1FKGJhcnRsb21pZWp1KTogRGVubyBjdXJyZW50bHkgZG9lc24ndCBzdXBwb3J0IGFzeW5jIGhvb2tzXG4gICAgICAgIC8vIGVtaXRBZnRlcihhc3luY0lkKTtcbiAgICAgIH1cbiAgICAgIGNvcmUucnVuTWljcm90YXNrcygpO1xuICAgICAgLy8gRklYTUUoYmFydGxvbWllanUpOiBEZW5vIGN1cnJlbnRseSBkb2Vzbid0IHVuaGFuZGxlZCByZWplY3Rpb25zXG4gICAgICAvLyB9IHdoaWxlICghcXVldWUuaXNFbXB0eSgpIHx8IHByb2Nlc3NQcm9taXNlUmVqZWN0aW9ucygpKTtcbiAgICB9IHdoaWxlICghcXVldWUuaXNFbXB0eSgpKTtcbiAgICBjb3JlLnNldEhhc1RpY2tTY2hlZHVsZWQoZmFsc2UpO1xuICAgIC8vIEZJWE1FKGJhcnRsb21pZWp1KTogRGVubyBjdXJyZW50bHkgZG9lc24ndCB1bmhhbmRsZWQgcmVqZWN0aW9uc1xuICAgIC8vIHNldEhhc1JlamVjdGlvblRvV2FybihmYWxzZSk7XG4gIH1cblxuICBjb3JlLnNldE5leHRUaWNrQ2FsbGJhY2socHJvY2Vzc1RpY2tzQW5kUmVqZWN0aW9ucyk7XG4gIGNvcmUuc2V0TWFjcm90YXNrQ2FsbGJhY2socnVuTmV4dFRpY2tzKTtcblxuICBmdW5jdGlvbiBfX25leHRUaWNrTmF0aXZlPFQgZXh0ZW5kcyBBcnJheTx1bmtub3duPj4oXG4gICAgdGhpczogdW5rbm93bixcbiAgICBjYWxsYmFjazogKC4uLmFyZ3M6IFQpID0+IHZvaWQsXG4gICAgLi4uYXJnczogVFxuICApIHtcbiAgICB2YWxpZGF0ZUNhbGxiYWNrKGNhbGxiYWNrKTtcblxuICAgIGlmIChfZXhpdGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE8oYmFydGxvbWllanUpOiBzZWVtcyBzdXBlcmZsdW91cyBpZiB3ZSBkb24ndCBkZXBlbmQgb24gYGFyZ3VtZW50c2BcbiAgICBsZXQgYXJnc187XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgYXJnc18gPSBbYXJnc1swXV07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBhcmdzXyA9IFthcmdzWzBdLCBhcmdzWzFdXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGFyZ3NfID0gW2FyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl1dO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3NfID0gbmV3IEFycmF5KGFyZ3MubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXJnc19baV0gPSBhcmdzW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHF1ZXVlLmlzRW1wdHkoKSkge1xuICAgICAgY29yZS5zZXRIYXNUaWNrU2NoZWR1bGVkKHRydWUpO1xuICAgIH1cbiAgICAvLyBGSVhNRShiYXJ0bG9taWVqdSk6IERlbm8gY3VycmVudGx5IGRvZXNuJ3Qgc3VwcG9ydCBhc3luYyBob29rc1xuICAgIC8vIGNvbnN0IGFzeW5jSWQgPSBuZXdBc3luY0lkKCk7XG4gICAgLy8gY29uc3QgdHJpZ2dlckFzeW5jSWQgPSBnZXREZWZhdWx0VHJpZ2dlckFzeW5jSWQoKTtcbiAgICBjb25zdCB0aWNrT2JqZWN0ID0ge1xuICAgICAgLy8gRklYTUUoYmFydGxvbWllanUpOiBEZW5vIGN1cnJlbnRseSBkb2Vzbid0IHN1cHBvcnQgYXN5bmMgaG9va3NcbiAgICAgIC8vIFthc3luY19pZF9zeW1ib2xdOiBhc3luY0lkLFxuICAgICAgLy8gW3RyaWdnZXJfYXN5bmNfaWRfc3ltYm9sXTogdHJpZ2dlckFzeW5jSWQsXG4gICAgICBjYWxsYmFjayxcbiAgICAgIGFyZ3M6IGFyZ3NfLFxuICAgIH07XG4gICAgLy8gRklYTUUoYmFydGxvbWllanUpOiBEZW5vIGN1cnJlbnRseSBkb2Vzbid0IHN1cHBvcnQgYXN5bmMgaG9va3NcbiAgICAvLyBpZiAoaW5pdEhvb2tzRXhpc3QoKSlcbiAgICAvLyAgIGVtaXRJbml0KGFzeW5jSWQsICdUaWNrT2JqZWN0JywgdHJpZ2dlckFzeW5jSWQsIHRpY2tPYmplY3QpO1xuICAgIHF1ZXVlLnB1c2godGlja09iamVjdCk7XG4gIH1cbiAgX25leHRUaWNrID0gX19uZXh0VGlja05hdGl2ZTtcbn0gZWxzZSB7XG4gIGZ1bmN0aW9uIF9fbmV4dFRpY2tRdWV1ZU1pY3JvdGFzazxUIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4+KFxuICAgIHRoaXM6IHVua25vd24sXG4gICAgY2FsbGJhY2s6ICguLi5hcmdzOiBUKSA9PiB2b2lkLFxuICAgIC4uLmFyZ3M6IFRcbiAgKSB7XG4gICAgaWYgKGFyZ3MpIHtcbiAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IGNhbGxiYWNrLmNhbGwodGhpcywgLi4uYXJncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBxdWV1ZU1pY3JvdGFzayhjYWxsYmFjayk7XG4gICAgfVxuICB9XG5cbiAgX25leHRUaWNrID0gX19uZXh0VGlja1F1ZXVlTWljcm90YXNrO1xufVxuXG4vLyBgbmV4dFRpY2soKWAgd2lsbCBub3QgZW5xdWV1ZSBhbnkgY2FsbGJhY2sgd2hlbiB0aGUgcHJvY2VzcyBpcyBhYm91dCB0b1xuLy8gZXhpdCBzaW5jZSB0aGUgY2FsbGJhY2sgd291bGQgbm90IGhhdmUgYSBjaGFuY2UgdG8gYmUgZXhlY3V0ZWQuXG5leHBvcnQgZnVuY3Rpb24gbmV4dFRpY2sodGhpczogdW5rbm93biwgY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIG5leHRUaWNrPFQgZXh0ZW5kcyBBcnJheTx1bmtub3duPj4oXG4gIHRoaXM6IHVua25vd24sXG4gIGNhbGxiYWNrOiAoLi4uYXJnczogVCkgPT4gdm9pZCxcbiAgLi4uYXJnczogVFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBuZXh0VGljazxUIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4+KFxuICB0aGlzOiB1bmtub3duLFxuICBjYWxsYmFjazogKC4uLmFyZ3M6IFQpID0+IHZvaWQsXG4gIC4uLmFyZ3M6IFRcbikge1xuICBfbmV4dFRpY2soY2FsbGJhY2ssIC4uLmFyZ3MpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxzREFBc0Q7QUFFdEQsOENBQThDO0FBRTlDLFNBQVMsSUFBSSxRQUFR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