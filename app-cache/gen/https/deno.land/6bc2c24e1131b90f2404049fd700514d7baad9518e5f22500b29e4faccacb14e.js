import { RedisConnection } from "./connection.ts";
import { MuxExecutor } from "./executor.ts";
import { createRedisPipeline } from "./pipeline.ts";
import { psubscribe, subscribe } from "./pubsub.ts";
import { convertMap, isCondArray, isNumber, isString, parseXGroupDetail, parseXId, parseXMessage, parseXPendingConsumers, parseXPendingCounts, parseXReadReply, rawnum, rawstr, xidstr } from "./stream.ts";
class RedisImpl {
    executor;
    get isClosed() {
        return this.executor.connection.isClosed;
    }
    get isConnected() {
        return this.executor.connection.isConnected;
    }
    constructor(executor){
        this.executor = executor;
    }
    sendCommand(command, ...args) {
        return this.executor.exec(command, ...args);
    }
    connect() {
        return this.executor.connection.connect();
    }
    close() {
        this.executor.close();
    }
    async execReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.value();
    }
    async execStatusReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.value();
    }
    async execIntegerReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.value();
    }
    async execBinaryReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.buffer();
    }
    async execBulkReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.value();
    }
    async execArrayReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.value();
    }
    async execIntegerOrNilReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.value();
    }
    async execStatusOrNilReply(command, ...args) {
        const reply = await this.executor.exec(command, ...args);
        return reply.string();
    }
    aclCat(categoryname) {
        if (categoryname !== undefined) {
            return this.execArrayReply("ACL", "CAT", categoryname);
        }
        return this.execArrayReply("ACL", "CAT");
    }
    aclDelUser(...usernames) {
        return this.execIntegerReply("ACL", "DELUSER", ...usernames);
    }
    aclGenPass(bits) {
        if (bits !== undefined) {
            return this.execBulkReply("ACL", "GENPASS", bits);
        }
        return this.execBulkReply("ACL", "GENPASS");
    }
    aclGetUser(username) {
        return this.execArrayReply("ACL", "GETUSER", username);
    }
    aclHelp() {
        return this.execArrayReply("ACL", "HELP");
    }
    aclList() {
        return this.execArrayReply("ACL", "LIST");
    }
    aclLoad() {
        return this.execStatusReply("ACL", "LOAD");
    }
    aclLog(param) {
        if (param === "RESET") {
            return this.execStatusReply("ACL", "LOG", "RESET");
        }
        return this.execArrayReply("ACL", "LOG", param);
    }
    aclSave() {
        return this.execStatusReply("ACL", "SAVE");
    }
    aclSetUser(username, ...rules) {
        return this.execStatusReply("ACL", "SETUSER", username, ...rules);
    }
    aclUsers() {
        return this.execArrayReply("ACL", "USERS");
    }
    aclWhoami() {
        return this.execBulkReply("ACL", "WHOAMI");
    }
    append(key, value) {
        return this.execIntegerReply("APPEND", key, value);
    }
    auth(param1, param2) {
        if (param2 !== undefined) {
            return this.execStatusReply("AUTH", param1, param2);
        }
        return this.execStatusReply("AUTH", param1);
    }
    bgrewriteaof() {
        return this.execStatusReply("BGREWRITEAOF");
    }
    bgsave() {
        return this.execStatusReply("BGSAVE");
    }
    bitcount(key, start, end) {
        if (start !== undefined && end !== undefined) {
            return this.execIntegerReply("BITCOUNT", key, start, end);
        }
        return this.execIntegerReply("BITCOUNT", key);
    }
    bitfield(key, opts) {
        const args = [
            key
        ];
        if (opts?.get) {
            const { type , offset  } = opts.get;
            args.push("GET", type, offset);
        }
        if (opts?.set) {
            const { type , offset , value  } = opts.set;
            args.push("SET", type, offset, value);
        }
        if (opts?.incrby) {
            const { type , offset , increment  } = opts.incrby;
            args.push("INCRBY", type, offset, increment);
        }
        if (opts?.overflow) {
            args.push("OVERFLOW", opts.overflow);
        }
        return this.execArrayReply("BITFIELD", ...args);
    }
    bitop(operation, destkey, ...keys) {
        return this.execIntegerReply("BITOP", operation, destkey, ...keys);
    }
    bitpos(key, bit, start, end) {
        if (start !== undefined && end !== undefined) {
            return this.execIntegerReply("BITPOS", key, bit, start, end);
        }
        if (start !== undefined) {
            return this.execIntegerReply("BITPOS", key, bit, start);
        }
        return this.execIntegerReply("BITPOS", key, bit);
    }
    blpop(timeout, ...keys) {
        return this.execArrayReply("BLPOP", ...keys, timeout);
    }
    brpop(timeout, ...keys) {
        return this.execArrayReply("BRPOP", ...keys, timeout);
    }
    brpoplpush(source, destination, timeout) {
        return this.execBulkReply("BRPOPLPUSH", source, destination, timeout);
    }
    bzpopmin(timeout, ...keys) {
        return this.execArrayReply("BZPOPMIN", ...keys, timeout);
    }
    bzpopmax(timeout, ...keys) {
        return this.execArrayReply("BZPOPMAX", ...keys, timeout);
    }
    clientCaching(mode) {
        return this.execStatusReply("CLIENT", "CACHING", mode);
    }
    clientGetName() {
        return this.execBulkReply("CLIENT", "GETNAME");
    }
    clientGetRedir() {
        return this.execIntegerReply("CLIENT", "GETREDIR");
    }
    clientID() {
        return this.execIntegerReply("CLIENT", "ID");
    }
    clientInfo() {
        return this.execBulkReply("CLIENT", "INFO");
    }
    clientKill(opts) {
        const args = [];
        if (opts.addr) {
            args.push("ADDR", opts.addr);
        }
        if (opts.laddr) {
            args.push("LADDR", opts.laddr);
        }
        if (opts.id) {
            args.push("ID", opts.id);
        }
        if (opts.type) {
            args.push("TYPE", opts.type);
        }
        if (opts.user) {
            args.push("USER", opts.user);
        }
        if (opts.skipme) {
            args.push("SKIPME", opts.skipme);
        }
        return this.execIntegerReply("CLIENT", "KILL", ...args);
    }
    clientList(opts) {
        if (opts && opts.type && opts.ids) {
            throw new Error("only one of `type` or `ids` can be specified");
        }
        if (opts && opts.type) {
            return this.execBulkReply("CLIENT", "LIST", "TYPE", opts.type);
        }
        if (opts && opts.ids) {
            return this.execBulkReply("CLIENT", "LIST", "ID", ...opts.ids);
        }
        return this.execBulkReply("CLIENT", "LIST");
    }
    clientPause(timeout, mode) {
        if (mode) {
            return this.execStatusReply("CLIENT", "PAUSE", timeout, mode);
        }
        return this.execStatusReply("CLIENT", "PAUSE", timeout);
    }
    clientSetName(connectionName) {
        return this.execStatusReply("CLIENT", "SETNAME", connectionName);
    }
    clientTracking(opts) {
        const args = [
            opts.mode
        ];
        if (opts.redirect) {
            args.push("REDIRECT", opts.redirect);
        }
        if (opts.prefixes) {
            opts.prefixes.forEach((prefix)=>{
                args.push("PREFIX");
                args.push(prefix);
            });
        }
        if (opts.bcast) {
            args.push("BCAST");
        }
        if (opts.optIn) {
            args.push("OPTIN");
        }
        if (opts.optOut) {
            args.push("OPTOUT");
        }
        if (opts.noLoop) {
            args.push("NOLOOP");
        }
        return this.execStatusReply("CLIENT", "TRACKING", ...args);
    }
    clientTrackingInfo() {
        return this.execArrayReply("CLIENT", "TRACKINGINFO");
    }
    clientUnblock(id, behaviour) {
        if (behaviour) {
            return this.execIntegerReply("CLIENT", "UNBLOCK", id, behaviour);
        }
        return this.execIntegerReply("CLIENT", "UNBLOCK", id);
    }
    clientUnpause() {
        return this.execStatusReply("CLIENT", "UNPAUSE");
    }
    asking() {
        return this.execStatusReply("ASKING");
    }
    clusterAddSlots(...slots) {
        return this.execStatusReply("CLUSTER", "ADDSLOTS", ...slots);
    }
    clusterCountFailureReports(nodeId) {
        return this.execIntegerReply("CLUSTER", "COUNT-FAILURE-REPORTS", nodeId);
    }
    clusterCountKeysInSlot(slot) {
        return this.execIntegerReply("CLUSTER", "COUNTKEYSINSLOT", slot);
    }
    clusterDelSlots(...slots) {
        return this.execStatusReply("CLUSTER", "DELSLOTS", ...slots);
    }
    clusterFailover(mode) {
        if (mode) {
            return this.execStatusReply("CLUSTER", "FAILOVER", mode);
        }
        return this.execStatusReply("CLUSTER", "FAILOVER");
    }
    clusterFlushSlots() {
        return this.execStatusReply("CLUSTER", "FLUSHSLOTS");
    }
    clusterForget(nodeId) {
        return this.execStatusReply("CLUSTER", "FORGET", nodeId);
    }
    clusterGetKeysInSlot(slot, count) {
        return this.execArrayReply("CLUSTER", "GETKEYSINSLOT", slot, count);
    }
    clusterInfo() {
        return this.execStatusReply("CLUSTER", "INFO");
    }
    clusterKeySlot(key) {
        return this.execIntegerReply("CLUSTER", "KEYSLOT", key);
    }
    clusterMeet(ip, port) {
        return this.execStatusReply("CLUSTER", "MEET", ip, port);
    }
    clusterMyID() {
        return this.execStatusReply("CLUSTER", "MYID");
    }
    clusterNodes() {
        return this.execBulkReply("CLUSTER", "NODES");
    }
    clusterReplicas(nodeId) {
        return this.execArrayReply("CLUSTER", "REPLICAS", nodeId);
    }
    clusterReplicate(nodeId) {
        return this.execStatusReply("CLUSTER", "REPLICATE", nodeId);
    }
    clusterReset(mode) {
        if (mode) {
            return this.execStatusReply("CLUSTER", "RESET", mode);
        }
        return this.execStatusReply("CLUSTER", "RESET");
    }
    clusterSaveConfig() {
        return this.execStatusReply("CLUSTER", "SAVECONFIG");
    }
    clusterSetSlot(slot, subcommand, nodeId) {
        if (nodeId !== undefined) {
            return this.execStatusReply("CLUSTER", "SETSLOT", slot, subcommand, nodeId);
        }
        return this.execStatusReply("CLUSTER", "SETSLOT", slot, subcommand);
    }
    clusterSlaves(nodeId) {
        return this.execArrayReply("CLUSTER", "SLAVES", nodeId);
    }
    clusterSlots() {
        return this.execArrayReply("CLUSTER", "SLOTS");
    }
    command() {
        return this.execArrayReply("COMMAND");
    }
    commandCount() {
        return this.execIntegerReply("COMMAND", "COUNT");
    }
    commandGetKeys() {
        return this.execArrayReply("COMMAND", "GETKEYS");
    }
    commandInfo(...commandNames) {
        return this.execArrayReply("COMMAND", "INFO", ...commandNames);
    }
    configGet(parameter) {
        return this.execArrayReply("CONFIG", "GET", parameter);
    }
    configResetStat() {
        return this.execStatusReply("CONFIG", "RESETSTAT");
    }
    configRewrite() {
        return this.execStatusReply("CONFIG", "REWRITE");
    }
    configSet(parameter, value) {
        return this.execStatusReply("CONFIG", "SET", parameter, value);
    }
    dbsize() {
        return this.execIntegerReply("DBSIZE");
    }
    debugObject(key) {
        return this.execStatusReply("DEBUG", "OBJECT", key);
    }
    debugSegfault() {
        return this.execStatusReply("DEBUG", "SEGFAULT");
    }
    decr(key) {
        return this.execIntegerReply("DECR", key);
    }
    decrby(key, decrement) {
        return this.execIntegerReply("DECRBY", key, decrement);
    }
    del(...keys) {
        return this.execIntegerReply("DEL", ...keys);
    }
    discard() {
        return this.execStatusReply("DISCARD");
    }
    dump(key) {
        return this.execBinaryReply("DUMP", key);
    }
    echo(message) {
        return this.execBulkReply("ECHO", message);
    }
    eval(script, keys, args) {
        return this.execReply("EVAL", script, keys.length, ...keys, ...args);
    }
    evalsha(sha1, keys, args) {
        return this.execReply("EVALSHA", sha1, keys.length, ...keys, ...args);
    }
    exec() {
        return this.execArrayReply("EXEC");
    }
    exists(...keys) {
        return this.execIntegerReply("EXISTS", ...keys);
    }
    expire(key, seconds) {
        return this.execIntegerReply("EXPIRE", key, seconds);
    }
    expireat(key, timestamp) {
        return this.execIntegerReply("EXPIREAT", key, timestamp);
    }
    flushall(async) {
        if (async) {
            return this.execStatusReply("FLUSHALL", "ASYNC");
        }
        return this.execStatusReply("FLUSHALL");
    }
    flushdb(async) {
        if (async) {
            return this.execStatusReply("FLUSHDB", "ASYNC");
        }
        return this.execStatusReply("FLUSHDB");
    }
    // deno-lint-ignore no-explicit-any
    geoadd(key, ...params) {
        const args = [
            key
        ];
        if (Array.isArray(params[0])) {
            args.push(...params.flatMap((e)=>e));
        } else if (typeof params[0] === "object") {
            for (const [member, lnglat] of Object.entries(params[0])){
                args.push(...lnglat, member);
            }
        } else {
            args.push(...params);
        }
        return this.execIntegerReply("GEOADD", ...args);
    }
    geohash(key, ...members) {
        return this.execArrayReply("GEOHASH", key, ...members);
    }
    geopos(key, ...members) {
        return this.execArrayReply("GEOPOS", key, ...members);
    }
    geodist(key, member1, member2, unit) {
        if (unit) {
            return this.execBulkReply("GEODIST", key, member1, member2, unit);
        }
        return this.execBulkReply("GEODIST", key, member1, member2);
    }
    georadius(key, longitude, latitude, radius, unit, opts) {
        const args = this.pushGeoRadiusOpts([
            key,
            longitude,
            latitude,
            radius,
            unit
        ], opts);
        return this.execArrayReply("GEORADIUS", ...args);
    }
    georadiusbymember(key, member, radius, unit, opts) {
        const args = this.pushGeoRadiusOpts([
            key,
            member,
            radius,
            unit
        ], opts);
        return this.execArrayReply("GEORADIUSBYMEMBER", ...args);
    }
    pushGeoRadiusOpts(args, opts) {
        if (opts?.withCoord) {
            args.push("WITHCOORD");
        }
        if (opts?.withDist) {
            args.push("WITHDIST");
        }
        if (opts?.withHash) {
            args.push("WITHHASH");
        }
        if (opts?.count !== undefined) {
            args.push(opts.count);
        }
        if (opts?.sort) {
            args.push(opts.sort);
        }
        if (opts?.store !== undefined) {
            args.push(opts.store);
        }
        if (opts?.storeDist !== undefined) {
            args.push(opts.storeDist);
        }
        return args;
    }
    get(key) {
        return this.execBulkReply("GET", key);
    }
    getbit(key, offset) {
        return this.execIntegerReply("GETBIT", key, offset);
    }
    getrange(key, start, end) {
        return this.execBulkReply("GETRANGE", key, start, end);
    }
    getset(key, value) {
        return this.execBulkReply("GETSET", key, value);
    }
    hdel(key, ...fields) {
        return this.execIntegerReply("HDEL", key, ...fields);
    }
    hexists(key, field) {
        return this.execIntegerReply("HEXISTS", key, field);
    }
    hget(key, field) {
        return this.execBulkReply("HGET", key, field);
    }
    hgetall(key) {
        return this.execArrayReply("HGETALL", key);
    }
    hincrby(key, field, increment) {
        return this.execIntegerReply("HINCRBY", key, field, increment);
    }
    hincrbyfloat(key, field, increment) {
        return this.execBulkReply("HINCRBYFLOAT", key, field, increment);
    }
    hkeys(key) {
        return this.execArrayReply("HKEYS", key);
    }
    hlen(key) {
        return this.execIntegerReply("HLEN", key);
    }
    hmget(key, ...fields) {
        return this.execArrayReply("HMGET", key, ...fields);
    }
    // deno-lint-ignore no-explicit-any
    hmset(key, ...params) {
        const args = [
            key
        ];
        if (Array.isArray(params[0])) {
            args.push(...params.flatMap((e)=>e));
        } else if (typeof params[0] === "object") {
            for (const [field, value] of Object.entries(params[0])){
                args.push(field, value);
            }
        } else {
            args.push(...params);
        }
        return this.execStatusReply("HMSET", ...args);
    }
    // deno-lint-ignore no-explicit-any
    hset(key, ...params) {
        const args = [
            key
        ];
        if (Array.isArray(params[0])) {
            args.push(...params.flatMap((e)=>e));
        } else if (typeof params[0] === "object") {
            for (const [field, value] of Object.entries(params[0])){
                args.push(field, value);
            }
        } else {
            args.push(...params);
        }
        return this.execIntegerReply("HSET", ...args);
    }
    hsetnx(key, field, value) {
        return this.execIntegerReply("HSETNX", key, field, value);
    }
    hstrlen(key, field) {
        return this.execIntegerReply("HSTRLEN", key, field);
    }
    hvals(key) {
        return this.execArrayReply("HVALS", key);
    }
    incr(key) {
        return this.execIntegerReply("INCR", key);
    }
    incrby(key, increment) {
        return this.execIntegerReply("INCRBY", key, increment);
    }
    incrbyfloat(key, increment) {
        return this.execBulkReply("INCRBYFLOAT", key, increment);
    }
    info(section) {
        if (section !== undefined) {
            return this.execStatusReply("INFO", section);
        }
        return this.execStatusReply("INFO");
    }
    keys(pattern) {
        return this.execArrayReply("KEYS", pattern);
    }
    lastsave() {
        return this.execIntegerReply("LASTSAVE");
    }
    lindex(key, index) {
        return this.execBulkReply("LINDEX", key, index);
    }
    linsert(key, loc, pivot, value) {
        return this.execIntegerReply("LINSERT", key, loc, pivot, value);
    }
    llen(key) {
        return this.execIntegerReply("LLEN", key);
    }
    lpop(key) {
        return this.execBulkReply("LPOP", key);
    }
    lpos(key, element, opts) {
        const args = [
            element
        ];
        if (opts?.rank != null) {
            args.push("RANK", String(opts.rank));
        }
        if (opts?.count != null) {
            args.push("COUNT", String(opts.count));
        }
        if (opts?.maxlen != null) {
            args.push("MAXLEN", String(opts.maxlen));
        }
        return opts?.count == null ? this.execIntegerReply("LPOS", key, ...args) : this.execArrayReply("LPOS", key, ...args);
    }
    lpush(key, ...elements) {
        return this.execIntegerReply("LPUSH", key, ...elements);
    }
    lpushx(key, ...elements) {
        return this.execIntegerReply("LPUSHX", key, ...elements);
    }
    lrange(key, start, stop) {
        return this.execArrayReply("LRANGE", key, start, stop);
    }
    lrem(key, count, element) {
        return this.execIntegerReply("LREM", key, count, element);
    }
    lset(key, index, element) {
        return this.execStatusReply("LSET", key, index, element);
    }
    ltrim(key, start, stop) {
        return this.execStatusReply("LTRIM", key, start, stop);
    }
    memoryDoctor() {
        return this.execBulkReply("MEMORY", "DOCTOR");
    }
    memoryHelp() {
        return this.execArrayReply("MEMORY", "HELP");
    }
    memoryMallocStats() {
        return this.execBulkReply("MEMORY", "MALLOC", "STATS");
    }
    memoryPurge() {
        return this.execStatusReply("MEMORY", "PURGE");
    }
    memoryStats() {
        return this.execArrayReply("MEMORY", "STATS");
    }
    memoryUsage(key, opts) {
        const args = [
            key
        ];
        if (opts?.samples !== undefined) {
            args.push("SAMPLES", opts.samples);
        }
        return this.execIntegerReply("MEMORY", "USAGE", ...args);
    }
    mget(...keys) {
        return this.execArrayReply("MGET", ...keys);
    }
    migrate(host, port, key, destinationDB, timeout, opts) {
        const args = [
            host,
            port,
            key,
            destinationDB,
            timeout
        ];
        if (opts?.copy) {
            args.push("COPY");
        }
        if (opts?.replace) {
            args.push("REPLACE");
        }
        if (opts?.auth !== undefined) {
            args.push("AUTH", opts.auth);
        }
        if (opts?.keys) {
            args.push("KEYS", ...opts.keys);
        }
        return this.execStatusReply("MIGRATE", ...args);
    }
    moduleList() {
        return this.execArrayReply("MODULE", "LIST");
    }
    moduleLoad(path, ...args) {
        return this.execStatusReply("MODULE", "LOAD", path, ...args);
    }
    moduleUnload(name) {
        return this.execStatusReply("MODULE", "UNLOAD", name);
    }
    monitor() {
        throw new Error("not supported yet");
    }
    move(key, db) {
        return this.execIntegerReply("MOVE", key, db);
    }
    // deno-lint-ignore no-explicit-any
    mset(...params) {
        const args = [];
        if (Array.isArray(params[0])) {
            args.push(...params.flatMap((e)=>e));
        } else if (typeof params[0] === "object") {
            for (const [key, value] of Object.entries(params[0])){
                args.push(key, value);
            }
        } else {
            args.push(...params);
        }
        return this.execStatusReply("MSET", ...args);
    }
    // deno-lint-ignore no-explicit-any
    msetnx(...params) {
        const args = [];
        if (Array.isArray(params[0])) {
            args.push(...params.flatMap((e)=>e));
        } else if (typeof params[0] === "object") {
            for (const [key, value] of Object.entries(params[0])){
                args.push(key, value);
            }
        } else {
            args.push(...params);
        }
        return this.execIntegerReply("MSETNX", ...args);
    }
    multi() {
        return this.execStatusReply("MULTI");
    }
    objectEncoding(key) {
        return this.execBulkReply("OBJECT", "ENCODING", key);
    }
    objectFreq(key) {
        return this.execIntegerOrNilReply("OBJECT", "FREQ", key);
    }
    objectHelp() {
        return this.execArrayReply("OBJECT", "HELP");
    }
    objectIdletime(key) {
        return this.execIntegerOrNilReply("OBJECT", "IDLETIME", key);
    }
    objectRefCount(key) {
        return this.execIntegerOrNilReply("OBJECT", "REFCOUNT", key);
    }
    persist(key) {
        return this.execIntegerReply("PERSIST", key);
    }
    pexpire(key, milliseconds) {
        return this.execIntegerReply("PEXPIRE", key, milliseconds);
    }
    pexpireat(key, millisecondsTimestamp) {
        return this.execIntegerReply("PEXPIREAT", key, millisecondsTimestamp);
    }
    pfadd(key, ...elements) {
        return this.execIntegerReply("PFADD", key, ...elements);
    }
    pfcount(...keys) {
        return this.execIntegerReply("PFCOUNT", ...keys);
    }
    pfmerge(destkey, ...sourcekeys) {
        return this.execStatusReply("PFMERGE", destkey, ...sourcekeys);
    }
    ping(message) {
        if (message) {
            return this.execBulkReply("PING", message);
        }
        return this.execStatusReply("PING");
    }
    psetex(key, milliseconds, value) {
        return this.execStatusReply("PSETEX", key, milliseconds, value);
    }
    publish(channel, message) {
        return this.execIntegerReply("PUBLISH", channel, message);
    }
    subscribe(...channels) {
        return subscribe(this.executor, ...channels);
    }
    psubscribe(...patterns) {
        return psubscribe(this.executor, ...patterns);
    }
    pubsubChannels(pattern) {
        if (pattern !== undefined) {
            return this.execArrayReply("PUBSUB", "CHANNELS", pattern);
        }
        return this.execArrayReply("PUBSUB", "CHANNELS");
    }
    pubsubNumpat() {
        return this.execIntegerReply("PUBSUB", "NUMPAT");
    }
    pubsubNumsub(...channels) {
        return this.execArrayReply("PUBSUB", "NUMSUB", ...channels);
    }
    pttl(key) {
        return this.execIntegerReply("PTTL", key);
    }
    quit() {
        return this.execStatusReply("QUIT").finally(()=>this.close());
    }
    randomkey() {
        return this.execBulkReply("RANDOMKEY");
    }
    readonly() {
        return this.execStatusReply("READONLY");
    }
    readwrite() {
        return this.execStatusReply("READWRITE");
    }
    rename(key, newkey) {
        return this.execStatusReply("RENAME", key, newkey);
    }
    renamenx(key, newkey) {
        return this.execIntegerReply("RENAMENX", key, newkey);
    }
    restore(key, ttl, serializedValue, opts) {
        const args = [
            key,
            ttl,
            serializedValue
        ];
        if (opts?.replace) {
            args.push("REPLACE");
        }
        if (opts?.absttl) {
            args.push("ABSTTL");
        }
        if (opts?.idletime !== undefined) {
            args.push("IDLETIME", opts.idletime);
        }
        if (opts?.freq !== undefined) {
            args.push("FREQ", opts.freq);
        }
        return this.execStatusReply("RESTORE", ...args);
    }
    role() {
        return this.execArrayReply("ROLE");
    }
    rpop(key) {
        return this.execBulkReply("RPOP", key);
    }
    rpoplpush(source, destination) {
        return this.execBulkReply("RPOPLPUSH", source, destination);
    }
    rpush(key, ...elements) {
        return this.execIntegerReply("RPUSH", key, ...elements);
    }
    rpushx(key, ...elements) {
        return this.execIntegerReply("RPUSHX", key, ...elements);
    }
    sadd(key, ...members) {
        return this.execIntegerReply("SADD", key, ...members);
    }
    save() {
        return this.execStatusReply("SAVE");
    }
    scard(key) {
        return this.execIntegerReply("SCARD", key);
    }
    scriptDebug(mode) {
        return this.execStatusReply("SCRIPT", "DEBUG", mode);
    }
    scriptExists(...sha1s) {
        return this.execArrayReply("SCRIPT", "EXISTS", ...sha1s);
    }
    scriptFlush() {
        return this.execStatusReply("SCRIPT", "FLUSH");
    }
    scriptKill() {
        return this.execStatusReply("SCRIPT", "KILL");
    }
    scriptLoad(script) {
        return this.execStatusReply("SCRIPT", "LOAD", script);
    }
    sdiff(...keys) {
        return this.execArrayReply("SDIFF", ...keys);
    }
    sdiffstore(destination, ...keys) {
        return this.execIntegerReply("SDIFFSTORE", destination, ...keys);
    }
    select(index) {
        return this.execStatusReply("SELECT", index);
    }
    set(key, value, opts) {
        const args = [
            key,
            value
        ];
        if (opts?.ex !== undefined) {
            args.push("EX", opts.ex);
        } else if (opts?.px !== undefined) {
            args.push("PX", opts.px);
        }
        if (opts?.keepttl) {
            args.push("KEEPTTL");
        }
        if (opts?.mode) {
            args.push(opts.mode);
            return this.execStatusOrNilReply("SET", ...args);
        }
        return this.execStatusReply("SET", ...args);
    }
    setbit(key, offset, value) {
        return this.execIntegerReply("SETBIT", key, offset, value);
    }
    setex(key, seconds, value) {
        return this.execStatusReply("SETEX", key, seconds, value);
    }
    setnx(key, value) {
        return this.execIntegerReply("SETNX", key, value);
    }
    setrange(key, offset, value) {
        return this.execIntegerReply("SETRANGE", key, offset, value);
    }
    shutdown(mode) {
        if (mode) {
            return this.execStatusReply("SHUTDOWN", mode);
        }
        return this.execStatusReply("SHUTDOWN");
    }
    sinter(...keys) {
        return this.execArrayReply("SINTER", ...keys);
    }
    sinterstore(destination, ...keys) {
        return this.execIntegerReply("SINTERSTORE", destination, ...keys);
    }
    sismember(key, member) {
        return this.execIntegerReply("SISMEMBER", key, member);
    }
    slaveof(host, port) {
        return this.execStatusReply("SLAVEOF", host, port);
    }
    slaveofNoOne() {
        return this.execStatusReply("SLAVEOF", "NO ONE");
    }
    replicaof(host, port) {
        return this.execStatusReply("REPLICAOF", host, port);
    }
    replicaofNoOne() {
        return this.execStatusReply("REPLICAOF", "NO ONE");
    }
    slowlog(subcommand, ...args) {
        return this.execArrayReply("SLOWLOG", subcommand, ...args);
    }
    smembers(key) {
        return this.execArrayReply("SMEMBERS", key);
    }
    smove(source, destination, member) {
        return this.execIntegerReply("SMOVE", source, destination, member);
    }
    sort(key, opts) {
        const args = [
            key
        ];
        if (opts?.by !== undefined) {
            args.push("BY", opts.by);
        }
        if (opts?.limit) {
            args.push("LIMIT", opts.limit.offset, opts.limit.count);
        }
        if (opts?.patterns) {
            args.push("GET", ...opts.patterns);
        }
        if (opts?.order) {
            args.push(opts.order);
        }
        if (opts?.alpha) {
            args.push("ALPHA");
        }
        if (opts?.destination !== undefined) {
            args.push("STORE", opts.destination);
            return this.execIntegerReply("SORT", ...args);
        }
        return this.execArrayReply("SORT", ...args);
    }
    spop(key, count) {
        if (count !== undefined) {
            return this.execArrayReply("SPOP", key, count);
        }
        return this.execBulkReply("SPOP", key);
    }
    srandmember(key, count) {
        if (count !== undefined) {
            return this.execArrayReply("SRANDMEMBER", key, count);
        }
        return this.execBulkReply("SRANDMEMBER", key);
    }
    srem(key, ...members) {
        return this.execIntegerReply("SREM", key, ...members);
    }
    stralgo(algorithm, target, a, b, opts) {
        const args = [];
        if (opts?.idx) {
            args.push("IDX");
        }
        if (opts?.len) {
            args.push("LEN");
        }
        if (opts?.withmatchlen) {
            args.push("WITHMATCHLEN");
        }
        if (opts?.minmatchlen) {
            args.push("MINMATCHLEN");
            args.push(opts.minmatchlen);
        }
        return this.execReply("STRALGO", algorithm, target, a, b, ...args);
    }
    strlen(key) {
        return this.execIntegerReply("STRLEN", key);
    }
    sunion(...keys) {
        return this.execArrayReply("SUNION", ...keys);
    }
    sunionstore(destination, ...keys) {
        return this.execIntegerReply("SUNIONSTORE", destination, ...keys);
    }
    swapdb(index1, index2) {
        return this.execStatusReply("SWAPDB", index1, index2);
    }
    sync() {
        throw new Error("not implemented");
    }
    time() {
        return this.execArrayReply("TIME");
    }
    touch(...keys) {
        return this.execIntegerReply("TOUCH", ...keys);
    }
    ttl(key) {
        return this.execIntegerReply("TTL", key);
    }
    type(key) {
        return this.execStatusReply("TYPE", key);
    }
    unlink(...keys) {
        return this.execIntegerReply("UNLINK", ...keys);
    }
    unwatch() {
        return this.execStatusReply("UNWATCH");
    }
    wait(numreplicas, timeout) {
        return this.execIntegerReply("WAIT", numreplicas, timeout);
    }
    watch(...keys) {
        return this.execStatusReply("WATCH", ...keys);
    }
    xack(key, group, ...xids) {
        return this.execIntegerReply("XACK", key, group, ...xids.map((xid)=>xidstr(xid)));
    }
    xadd(key, xid, fieldValues, maxlen = undefined) {
        const args = [
            key
        ];
        if (maxlen) {
            args.push("MAXLEN");
            if (maxlen.approx) {
                args.push("~");
            }
            args.push(maxlen.elements.toString());
        }
        args.push(xidstr(xid));
        if (fieldValues instanceof Map) {
            for (const [f, v] of fieldValues){
                args.push(f);
                args.push(v);
            }
        } else {
            for (const [f, v] of Object.entries(fieldValues)){
                args.push(f);
                args.push(v);
            }
        }
        return this.execBulkReply("XADD", ...args).then((rawId)=>parseXId(rawId));
    }
    xclaim(key, opts, ...xids) {
        const args = [];
        if (opts.idle) {
            args.push("IDLE");
            args.push(opts.idle);
        }
        if (opts.time) {
            args.push("TIME");
            args.push(opts.time);
        }
        if (opts.retryCount) {
            args.push("RETRYCOUNT");
            args.push(opts.retryCount);
        }
        if (opts.force) {
            args.push("FORCE");
        }
        if (opts.justXId) {
            args.push("JUSTID");
        }
        return this.execArrayReply("XCLAIM", key, opts.group, opts.consumer, opts.minIdleTime, ...xids.map((xid)=>xidstr(xid)), ...args).then((raw)=>{
            if (opts.justXId) {
                const xids = [];
                for (const r of raw){
                    if (typeof r === "string") {
                        xids.push(parseXId(r));
                    }
                }
                const payload = {
                    kind: "justxid",
                    xids
                };
                return payload;
            }
            const messages = [];
            for (const r of raw){
                if (typeof r !== "string") {
                    messages.push(parseXMessage(r));
                }
            }
            const payload = {
                kind: "messages",
                messages
            };
            return payload;
        });
    }
    xdel(key, ...xids) {
        return this.execIntegerReply("XDEL", key, ...xids.map((rawId)=>xidstr(rawId)));
    }
    xlen(key) {
        return this.execIntegerReply("XLEN", key);
    }
    xgroupCreate(key, groupName, xid, mkstream) {
        const args = [];
        if (mkstream) {
            args.push("MKSTREAM");
        }
        return this.execStatusReply("XGROUP", "CREATE", key, groupName, xidstr(xid), ...args);
    }
    xgroupDelConsumer(key, groupName, consumerName) {
        return this.execIntegerReply("XGROUP", "DELCONSUMER", key, groupName, consumerName);
    }
    xgroupDestroy(key, groupName) {
        return this.execIntegerReply("XGROUP", "DESTROY", key, groupName);
    }
    xgroupHelp() {
        return this.execBulkReply("XGROUP", "HELP");
    }
    xgroupSetID(key, groupName, xid) {
        return this.execStatusReply("XGROUP", "SETID", key, groupName, xidstr(xid));
    }
    xinfoStream(key) {
        return this.execArrayReply("XINFO", "STREAM", key).then((raw)=>{
            // Note that you should not rely on the fields
            // exact position, nor on the number of fields,
            // new fields may be added in the future.
            const data = convertMap(raw);
            const firstEntry = parseXMessage(data.get("first-entry"));
            const lastEntry = parseXMessage(data.get("last-entry"));
            return {
                length: rawnum(data.get("length") ?? null),
                radixTreeKeys: rawnum(data.get("radix-tree-keys") ?? null),
                radixTreeNodes: rawnum(data.get("radix-tree-nodes") ?? null),
                groups: rawnum(data.get("groups") ?? null),
                lastGeneratedId: parseXId(rawstr(data.get("last-generated-id") ?? null)),
                firstEntry,
                lastEntry
            };
        });
    }
    xinfoStreamFull(key, count) {
        const args = [];
        if (count) {
            args.push("COUNT");
            args.push(count);
        }
        return this.execArrayReply("XINFO", "STREAM", key, "FULL", ...args).then((raw)=>{
            // Note that you should not rely on the fields
            // exact position, nor on the number of fields,
            // new fields may be added in the future.
            if (raw == null) throw "no data";
            const data = convertMap(raw);
            if (data === undefined) throw "no data converted";
            const entries = data.get("entries").map((raw)=>parseXMessage(raw));
            return {
                length: rawnum(data.get("length") ?? null),
                radixTreeKeys: rawnum(data.get("radix-tree-keys") ?? null),
                radixTreeNodes: rawnum(data.get("radix-tree-nodes") ?? null),
                lastGeneratedId: parseXId(rawstr(data.get("last-generated-id") ?? null)),
                entries,
                groups: parseXGroupDetail(data.get("groups"))
            };
        });
    }
    xinfoGroups(key) {
        return this.execArrayReply("XINFO", "GROUPS", key).then((raws)=>raws.map((raw)=>{
                const data = convertMap(raw);
                return {
                    name: rawstr(data.get("name") ?? null),
                    consumers: rawnum(data.get("consumers") ?? null),
                    pending: rawnum(data.get("pending") ?? null),
                    lastDeliveredId: parseXId(rawstr(data.get("last-delivered-id") ?? null))
                };
            }));
    }
    xinfoConsumers(key, group) {
        return this.execArrayReply("XINFO", "CONSUMERS", key, group).then((raws)=>raws.map((raw)=>{
                const data = convertMap(raw);
                return {
                    name: rawstr(data.get("name") ?? null),
                    pending: rawnum(data.get("pending") ?? null),
                    idle: rawnum(data.get("idle") ?? null)
                };
            }));
    }
    xpending(key, group) {
        return this.execArrayReply("XPENDING", key, group).then((raw)=>{
            if (isNumber(raw[0]) && isString(raw[1]) && isString(raw[2]) && isCondArray(raw[3])) {
                return {
                    count: raw[0],
                    startId: parseXId(raw[1]),
                    endId: parseXId(raw[2]),
                    consumers: parseXPendingConsumers(raw[3])
                };
            } else {
                throw "parse err";
            }
        });
    }
    xpendingCount(key, group, startEndCount, consumer) {
        const args = [];
        args.push(startEndCount.start);
        args.push(startEndCount.end);
        args.push(startEndCount.count);
        if (consumer) {
            args.push(consumer);
        }
        return this.execArrayReply("XPENDING", key, group, ...args).then((raw)=>parseXPendingCounts(raw));
    }
    xrange(key, start, end, count) {
        const args = [
            key,
            xidstr(start),
            xidstr(end)
        ];
        if (count) {
            args.push("COUNT");
            args.push(count);
        }
        return this.execArrayReply("XRANGE", ...args).then((raw)=>raw.map((m)=>parseXMessage(m)));
    }
    xrevrange(key, start, end, count) {
        const args = [
            key,
            xidstr(start),
            xidstr(end)
        ];
        if (count) {
            args.push("COUNT");
            args.push(count);
        }
        return this.execArrayReply("XREVRANGE", ...args).then((raw)=>raw.map((m)=>parseXMessage(m)));
    }
    xread(keyXIds, opts) {
        const args = [];
        if (opts) {
            if (opts.count) {
                args.push("COUNT");
                args.push(opts.count);
            }
            if (opts.block) {
                args.push("BLOCK");
                args.push(opts.block);
            }
        }
        args.push("STREAMS");
        const theKeys = [];
        const theXIds = [];
        for (const a of keyXIds){
            if (a instanceof Array) {
                // XKeyIdLike
                theKeys.push(a[0]);
                theXIds.push(xidstr(a[1]));
            } else {
                // XKeyId
                theKeys.push(a.key);
                theXIds.push(xidstr(a.xid));
            }
        }
        return this.execArrayReply("XREAD", ...args.concat(theKeys).concat(theXIds)).then((raw)=>parseXReadReply(raw));
    }
    xreadgroup(keyXIds, { group , consumer , count , block  }) {
        const args = [
            "GROUP",
            group,
            consumer
        ];
        if (count) {
            args.push("COUNT");
            args.push(count);
        }
        if (block) {
            args.push("BLOCK");
            args.push(block);
        }
        args.push("STREAMS");
        const theKeys = [];
        const theXIds = [];
        for (const a of keyXIds){
            if (a instanceof Array) {
                // XKeyIdGroupLike
                theKeys.push(a[0]);
                theXIds.push(a[1] === ">" ? ">" : xidstr(a[1]));
            } else {
                // XKeyIdGroup
                theKeys.push(a.key);
                theXIds.push(a.xid === ">" ? ">" : xidstr(a.xid));
            }
        }
        return this.execArrayReply("XREADGROUP", ...args.concat(theKeys).concat(theXIds)).then((raw)=>parseXReadReply(raw));
    }
    xtrim(key, maxlen) {
        const args = [];
        if (maxlen.approx) {
            args.push("~");
        }
        args.push(maxlen.elements);
        return this.execIntegerReply("XTRIM", key, "MAXLEN", ...args);
    }
    zadd(key, param1, param2, opts) {
        const args = [
            key
        ];
        if (Array.isArray(param1)) {
            this.pushZAddOpts(args, param2);
            args.push(...param1.flatMap((e)=>e));
            opts = param2;
        } else if (typeof param1 === "object") {
            this.pushZAddOpts(args, param2);
            for (const [member, score] of Object.entries(param1)){
                args.push(score, member);
            }
        } else {
            this.pushZAddOpts(args, opts);
            args.push(param1, param2);
        }
        return this.execIntegerReply("ZADD", ...args);
    }
    pushZAddOpts(args, opts) {
        if (opts?.mode) {
            args.push(opts.mode);
        }
        if (opts?.ch) {
            args.push("CH");
        }
    }
    zaddIncr(key, score, member, opts) {
        const args = [
            key
        ];
        this.pushZAddOpts(args, opts);
        args.push("INCR", score, member);
        return this.execBulkReply("ZADD", ...args);
    }
    zcard(key) {
        return this.execIntegerReply("ZCARD", key);
    }
    zcount(key, min, max) {
        return this.execIntegerReply("ZCOUNT", key, min, max);
    }
    zincrby(key, increment, member) {
        return this.execBulkReply("ZINCRBY", key, increment, member);
    }
    zinter(keys, opts) {
        const args = this.pushZStoreArgs([], keys, opts);
        if (opts?.withScore) {
            args.push("WITHSCORES");
        }
        return this.execArrayReply("ZINTER", ...args);
    }
    zinterstore(destination, keys, opts) {
        const args = this.pushZStoreArgs([
            destination
        ], keys, opts);
        return this.execIntegerReply("ZINTERSTORE", ...args);
    }
    zunionstore(destination, keys, opts) {
        const args = this.pushZStoreArgs([
            destination
        ], keys, opts);
        return this.execIntegerReply("ZUNIONSTORE", ...args);
    }
    pushZStoreArgs(args, keys, opts) {
        if (Array.isArray(keys)) {
            args.push(keys.length);
            if (Array.isArray(keys[0])) {
                keys = keys;
                args.push(...keys.map((e)=>e[0]));
                args.push("WEIGHTS");
                args.push(...keys.map((e)=>e[1]));
            } else {
                args.push(...keys);
            }
        } else {
            args.push(Object.keys(keys).length);
            args.push(...Object.keys(keys));
            args.push("WEIGHTS");
            args.push(...Object.values(keys));
        }
        if (opts?.aggregate) {
            args.push("AGGREGATE", opts.aggregate);
        }
        return args;
    }
    zlexcount(key, min, max) {
        return this.execIntegerReply("ZLEXCOUNT", key, min, max);
    }
    zpopmax(key, count) {
        if (count !== undefined) {
            return this.execArrayReply("ZPOPMAX", key, count);
        }
        return this.execArrayReply("ZPOPMAX", key);
    }
    zpopmin(key, count) {
        if (count !== undefined) {
            return this.execArrayReply("ZPOPMIN", key, count);
        }
        return this.execArrayReply("ZPOPMIN", key);
    }
    zrange(key, start, stop, opts) {
        const args = this.pushZRangeOpts([
            key,
            start,
            stop
        ], opts);
        return this.execArrayReply("ZRANGE", ...args);
    }
    zrangebylex(key, min, max, opts) {
        const args = this.pushZRangeOpts([
            key,
            min,
            max
        ], opts);
        return this.execArrayReply("ZRANGEBYLEX", ...args);
    }
    zrangebyscore(key, min, max, opts) {
        const args = this.pushZRangeOpts([
            key,
            min,
            max
        ], opts);
        return this.execArrayReply("ZRANGEBYSCORE", ...args);
    }
    zrank(key, member) {
        return this.execIntegerOrNilReply("ZRANK", key, member);
    }
    zrem(key, ...members) {
        return this.execIntegerReply("ZREM", key, ...members);
    }
    zremrangebylex(key, min, max) {
        return this.execIntegerReply("ZREMRANGEBYLEX", key, min, max);
    }
    zremrangebyrank(key, start, stop) {
        return this.execIntegerReply("ZREMRANGEBYRANK", key, start, stop);
    }
    zremrangebyscore(key, min, max) {
        return this.execIntegerReply("ZREMRANGEBYSCORE", key, min, max);
    }
    zrevrange(key, start, stop, opts) {
        const args = this.pushZRangeOpts([
            key,
            start,
            stop
        ], opts);
        return this.execArrayReply("ZREVRANGE", ...args);
    }
    zrevrangebylex(key, max, min, opts) {
        const args = this.pushZRangeOpts([
            key,
            min,
            max
        ], opts);
        return this.execArrayReply("ZREVRANGEBYLEX", ...args);
    }
    zrevrangebyscore(key, max, min, opts) {
        const args = this.pushZRangeOpts([
            key,
            max,
            min
        ], opts);
        return this.execArrayReply("ZREVRANGEBYSCORE", ...args);
    }
    pushZRangeOpts(args, opts) {
        if (opts?.withScore) {
            args.push("WITHSCORES");
        }
        if (opts?.limit) {
            args.push("LIMIT", opts.limit.offset, opts.limit.count);
        }
        return args;
    }
    zrevrank(key, member) {
        return this.execIntegerOrNilReply("ZREVRANK", key, member);
    }
    zscore(key, member) {
        return this.execBulkReply("ZSCORE", key, member);
    }
    scan(cursor, opts) {
        const args = this.pushScanOpts([
            cursor
        ], opts);
        return this.execArrayReply("SCAN", ...args);
    }
    sscan(key, cursor, opts) {
        const args = this.pushScanOpts([
            key,
            cursor
        ], opts);
        return this.execArrayReply("SSCAN", ...args);
    }
    hscan(key, cursor, opts) {
        const args = this.pushScanOpts([
            key,
            cursor
        ], opts);
        return this.execArrayReply("HSCAN", ...args);
    }
    zscan(key, cursor, opts) {
        const args = this.pushScanOpts([
            key,
            cursor
        ], opts);
        return this.execArrayReply("ZSCAN", ...args);
    }
    pushScanOpts(args, opts) {
        if (opts?.pattern !== undefined) {
            args.push("MATCH", opts.pattern);
        }
        if (opts?.count !== undefined) {
            args.push("COUNT", opts.count);
        }
        if (opts?.type !== undefined) {
            args.push("TYPE", opts.type);
        }
        return args;
    }
    tx() {
        return createRedisPipeline(this.executor.connection, true);
    }
    pipeline() {
        return createRedisPipeline(this.executor.connection);
    }
}
/**
 * Connect to Redis server
 * @param options
 * @example
 * ```ts
 * import { connect } from "./mod.ts";
 * const conn1 = await connect({hostname: "127.0.0.1", port: 6379}); // -> TCP, 127.0.0.1:6379
 * const conn2 = await connect({hostname: "redis.proxy", port: 443, tls: true}); // -> TLS, redis.proxy:443
 * ```
 */ export async function connect(options) {
    const connection = createRedisConnection(options);
    await connection.connect();
    const executor = new MuxExecutor(connection);
    return create(executor);
}
/**
 * Create a lazy Redis client that will not establish a connection until a command is actually executed.
 *
 * ```ts
 * import { createLazyClient } from "./mod.ts";
 *
 * const client = createLazyClient({ hostname: "127.0.0.1", port: 6379 });
 * console.assert(!client.isConnected);
 * await client.get("foo");
 * console.assert(client.isConnected);
 * ```
 */ export function createLazyClient(options) {
    const connection = createRedisConnection(options);
    const executor = createLazyExecutor(connection);
    return create(executor);
}
/**
 * Create a redis client from `CommandExecutor`
 */ export function create(executor) {
    return new RedisImpl(executor);
}
/**
 * Extract RedisConnectOptions from redis URL
 * @param url
 * @example
 * ```ts
 * import { parseURL } from "./mod.ts";
 *
 * parseURL("redis://foo:bar@localhost:6379/1"); // -> {hostname: "localhost", port: "6379", tls: false, db: 1, name: foo, password: bar}
 * parseURL("rediss://127.0.0.1:443/?db=2&password=bar"); // -> {hostname: "127.0.0.1", port: "443", tls: true, db: 2, name: undefined, password: bar}
 * ```
 */ export function parseURL(url) {
    const { protocol , hostname , port , username , password , pathname , searchParams  } = new URL(url);
    const db = pathname.replace("/", "") !== "" ? pathname.replace("/", "") : searchParams.get("db") ?? undefined;
    return {
        hostname: hostname !== "" ? hostname : "localhost",
        port: port !== "" ? parseInt(port, 10) : 6379,
        tls: protocol == "rediss:" ? true : searchParams.get("ssl") === "true",
        db: db ? parseInt(db, 10) : undefined,
        name: username !== "" ? username : undefined,
        password: password !== "" ? password : searchParams.get("password") ?? undefined
    };
}
function createRedisConnection(options) {
    const { hostname , port =6379 , ...opts } = options;
    return new RedisConnection(hostname, port, opts);
}
function createLazyExecutor(connection) {
    let executor = null;
    return {
        get connection () {
            return connection;
        },
        async exec (command, ...args) {
            if (!executor) {
                executor = new MuxExecutor(connection);
                if (!connection.isConnected) {
                    await connection.connect();
                }
            }
            return executor.exec(command, ...args);
        },
        close () {
            if (executor) {
                return executor.close();
            }
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMjkuMC9yZWRpcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEFDTExvZ01vZGUsXG4gIEJpdGZpZWxkT3B0cyxcbiAgQml0ZmllbGRXaXRoT3ZlcmZsb3dPcHRzLFxuICBDbGllbnRDYWNoaW5nTW9kZSxcbiAgQ2xpZW50S2lsbE9wdHMsXG4gIENsaWVudExpc3RPcHRzLFxuICBDbGllbnRQYXVzZU1vZGUsXG4gIENsaWVudFRyYWNraW5nT3B0cyxcbiAgQ2xpZW50VW5ibG9ja2luZ0JlaGF2aW91cixcbiAgQ2x1c3RlckZhaWxvdmVyTW9kZSxcbiAgQ2x1c3RlclJlc2V0TW9kZSxcbiAgQ2x1c3RlclNldFNsb3RTdWJjb21tYW5kLFxuICBHZW9SYWRpdXNPcHRzLFxuICBHZW9Vbml0LFxuICBIU2Nhbk9wdHMsXG4gIExJbnNlcnRMb2NhdGlvbixcbiAgTFBvc09wdHMsXG4gIExQb3NXaXRoQ291bnRPcHRzLFxuICBNZW1vcnlVc2FnZU9wdHMsXG4gIE1pZ3JhdGVPcHRzLFxuICBSZWRpc0NvbW1hbmRzLFxuICBSZXN0b3JlT3B0cyxcbiAgU2Nhbk9wdHMsXG4gIFNjcmlwdERlYnVnTW9kZSxcbiAgU2V0T3B0cyxcbiAgU2V0V2l0aE1vZGVPcHRzLFxuICBTaHV0ZG93bk1vZGUsXG4gIFNvcnRPcHRzLFxuICBTb3J0V2l0aERlc3RpbmF0aW9uT3B0cyxcbiAgU1NjYW5PcHRzLFxuICBTdHJhbGdvQWxnb3JpdGhtLFxuICBTdHJhbGdvT3B0cyxcbiAgU3RyYWxnb1RhcmdldCxcbiAgWkFkZE9wdHMsXG4gIFpJbnRlck9wdHMsXG4gIFpJbnRlcnN0b3JlT3B0cyxcbiAgWlJhbmdlQnlMZXhPcHRzLFxuICBaUmFuZ2VCeVNjb3JlT3B0cyxcbiAgWlJhbmdlT3B0cyxcbiAgWlNjYW5PcHRzLFxuICBaVW5pb25zdG9yZU9wdHMsXG59IGZyb20gXCIuL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IFJlZGlzQ29ubmVjdGlvbiB9IGZyb20gXCIuL2Nvbm5lY3Rpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgQ29ubmVjdGlvbiB9IGZyb20gXCIuL2Nvbm5lY3Rpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgUmVkaXNDb25uZWN0aW9uT3B0aW9ucyB9IGZyb20gXCIuL2Nvbm5lY3Rpb24udHNcIjtcbmltcG9ydCB7IENvbW1hbmRFeGVjdXRvciwgTXV4RXhlY3V0b3IgfSBmcm9tIFwiLi9leGVjdXRvci50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBCaW5hcnksXG4gIEJ1bGssXG4gIEJ1bGtOaWwsXG4gIEJ1bGtTdHJpbmcsXG4gIENvbmRpdGlvbmFsQXJyYXksXG4gIEludGVnZXIsXG4gIFJhdyxcbiAgUmVkaXNSZXBseSxcbiAgUmVkaXNWYWx1ZSxcbiAgU2ltcGxlU3RyaW5nLFxufSBmcm9tIFwiLi9wcm90b2NvbC9tb2QudHNcIjtcbmltcG9ydCB7IGNyZWF0ZVJlZGlzUGlwZWxpbmUgfSBmcm9tIFwiLi9waXBlbGluZS50c1wiO1xuaW1wb3J0IHsgcHN1YnNjcmliZSwgc3Vic2NyaWJlIH0gZnJvbSBcIi4vcHVic3ViLnRzXCI7XG5pbXBvcnQge1xuICBjb252ZXJ0TWFwLFxuICBpc0NvbmRBcnJheSxcbiAgaXNOdW1iZXIsXG4gIGlzU3RyaW5nLFxuICBwYXJzZVhHcm91cERldGFpbCxcbiAgcGFyc2VYSWQsXG4gIHBhcnNlWE1lc3NhZ2UsXG4gIHBhcnNlWFBlbmRpbmdDb25zdW1lcnMsXG4gIHBhcnNlWFBlbmRpbmdDb3VudHMsXG4gIHBhcnNlWFJlYWRSZXBseSxcbiAgcmF3bnVtLFxuICByYXdzdHIsXG4gIFN0YXJ0RW5kQ291bnQsXG4gIFhBZGRGaWVsZFZhbHVlcyxcbiAgWENsYWltSnVzdFhJZCxcbiAgWENsYWltTWVzc2FnZXMsXG4gIFhDbGFpbU9wdHMsXG4gIFhJZCxcbiAgWElkQWRkLFxuICBYSWRJbnB1dCxcbiAgWElkTmVnLFxuICBYSWRQb3MsXG4gIHhpZHN0cixcbiAgWEtleUlkLFxuICBYS2V5SWRHcm91cCxcbiAgWEtleUlkR3JvdXBMaWtlLFxuICBYS2V5SWRMaWtlLFxuICBYTWF4bGVuLFxuICBYUmVhZEdyb3VwT3B0cyxcbiAgWFJlYWRJZERhdGEsXG4gIFhSZWFkT3B0cyxcbiAgWFJlYWRTdHJlYW1SYXcsXG59IGZyb20gXCIuL3N0cmVhbS50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlZGlzIGV4dGVuZHMgUmVkaXNDb21tYW5kcyB7XG4gIHJlYWRvbmx5IGlzQ2xvc2VkOiBib29sZWFuO1xuICByZWFkb25seSBpc0Nvbm5lY3RlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogTG93IGxldmVsIGludGVyZmFjZSBmb3IgUmVkaXMgc2VydmVyXG4gICAqL1xuICBzZW5kQ29tbWFuZChjb21tYW5kOiBzdHJpbmcsIC4uLmFyZ3M6IFJlZGlzVmFsdWVbXSk6IFByb21pc2U8UmVkaXNSZXBseT47XG4gIGNvbm5lY3QoKTogUHJvbWlzZTx2b2lkPjtcbiAgY2xvc2UoKTogdm9pZDtcbn1cblxuY2xhc3MgUmVkaXNJbXBsIGltcGxlbWVudHMgUmVkaXMge1xuICBwcml2YXRlIHJlYWRvbmx5IGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3I7XG5cbiAgZ2V0IGlzQ2xvc2VkKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWN1dG9yLmNvbm5lY3Rpb24uaXNDbG9zZWQ7XG4gIH1cblxuICBnZXQgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY3V0b3IuY29ubmVjdGlvbi5pc0Nvbm5lY3RlZDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dG9yID0gZXhlY3V0b3I7XG4gIH1cblxuICBzZW5kQ29tbWFuZChjb21tYW5kOiBzdHJpbmcsIC4uLmFyZ3M6IFJlZGlzVmFsdWVbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWN1dG9yLmV4ZWMoY29tbWFuZCwgLi4uYXJncyk7XG4gIH1cblxuICBjb25uZWN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmV4ZWN1dG9yLmNvbm5lY3Rpb24uY29ubmVjdCgpO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRvci5jbG9zZSgpO1xuICB9XG5cbiAgYXN5bmMgZXhlY1JlcGx5PFQgZXh0ZW5kcyBSYXcgPSBSYXc+KFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgcmVwbHkgPSBhd2FpdCB0aGlzLmV4ZWN1dG9yLmV4ZWMoXG4gICAgICBjb21tYW5kLFxuICAgICAgLi4uYXJncyxcbiAgICApO1xuICAgIHJldHVybiByZXBseS52YWx1ZSgpIGFzIFQ7XG4gIH1cblxuICBhc3luYyBleGVjU3RhdHVzUmVwbHkoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIC4uLmFyZ3M6IFJlZGlzVmFsdWVbXVxuICApOiBQcm9taXNlPFNpbXBsZVN0cmluZz4ge1xuICAgIGNvbnN0IHJlcGx5ID0gYXdhaXQgdGhpcy5leGVjdXRvci5leGVjKGNvbW1hbmQsIC4uLmFyZ3MpO1xuICAgIHJldHVybiByZXBseS52YWx1ZSgpIGFzIFNpbXBsZVN0cmluZztcbiAgfVxuXG4gIGFzeW5jIGV4ZWNJbnRlZ2VyUmVwbHkoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIC4uLmFyZ3M6IFJlZGlzVmFsdWVbXVxuICApOiBQcm9taXNlPEludGVnZXI+IHtcbiAgICBjb25zdCByZXBseSA9IGF3YWl0IHRoaXMuZXhlY3V0b3IuZXhlYyhjb21tYW5kLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gcmVwbHkudmFsdWUoKSBhcyBJbnRlZ2VyO1xuICB9XG5cbiAgYXN5bmMgZXhlY0JpbmFyeVJlcGx5KFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxCaW5hcnkgfCBCdWxrTmlsPiB7XG4gICAgY29uc3QgcmVwbHkgPSBhd2FpdCB0aGlzLmV4ZWN1dG9yLmV4ZWMoY29tbWFuZCwgLi4uYXJncyk7XG4gICAgcmV0dXJuIHJlcGx5LmJ1ZmZlcigpO1xuICB9XG5cbiAgYXN5bmMgZXhlY0J1bGtSZXBseTxUIGV4dGVuZHMgQnVsayA9IEJ1bGs+KFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgcmVwbHkgPSBhd2FpdCB0aGlzLmV4ZWN1dG9yLmV4ZWMoY29tbWFuZCwgLi4uYXJncyk7XG4gICAgcmV0dXJuIHJlcGx5LnZhbHVlKCkgYXMgVDtcbiAgfVxuXG4gIGFzeW5jIGV4ZWNBcnJheVJlcGx5PFQgZXh0ZW5kcyBSYXcgPSBSYXc+KFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxUW10+IHtcbiAgICBjb25zdCByZXBseSA9IGF3YWl0IHRoaXMuZXhlY3V0b3IuZXhlYyhjb21tYW5kLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gcmVwbHkudmFsdWUoKSBhcyBBcnJheTxUPjtcbiAgfVxuXG4gIGFzeW5jIGV4ZWNJbnRlZ2VyT3JOaWxSZXBseShcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgLi4uYXJnczogUmVkaXNWYWx1ZVtdXG4gICk6IFByb21pc2U8SW50ZWdlciB8IEJ1bGtOaWw+IHtcbiAgICBjb25zdCByZXBseSA9IGF3YWl0IHRoaXMuZXhlY3V0b3IuZXhlYyhjb21tYW5kLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gcmVwbHkudmFsdWUoKSBhcyBJbnRlZ2VyIHwgQnVsa05pbDtcbiAgfVxuXG4gIGFzeW5jIGV4ZWNTdGF0dXNPck5pbFJlcGx5KFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxTaW1wbGVTdHJpbmcgfCBCdWxrTmlsPiB7XG4gICAgY29uc3QgcmVwbHkgPSBhd2FpdCB0aGlzLmV4ZWN1dG9yLmV4ZWMoY29tbWFuZCwgLi4uYXJncyk7XG4gICAgcmV0dXJuIHJlcGx5LnN0cmluZygpIGFzIFNpbXBsZVN0cmluZyB8IEJ1bGtOaWw7XG4gIH1cblxuICBhY2xDYXQoY2F0ZWdvcnluYW1lPzogc3RyaW5nKSB7XG4gICAgaWYgKGNhdGVnb3J5bmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIkFDTFwiLCBcIkNBVFwiLCBjYXRlZ29yeW5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIkFDTFwiLCBcIkNBVFwiKTtcbiAgfVxuXG4gIGFjbERlbFVzZXIoLi4udXNlcm5hbWVzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJBQ0xcIiwgXCJERUxVU0VSXCIsIC4uLnVzZXJuYW1lcyk7XG4gIH1cblxuICBhY2xHZW5QYXNzKGJpdHM/OiBudW1iZXIpIHtcbiAgICBpZiAoYml0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5PEJ1bGtTdHJpbmc+KFwiQUNMXCIsIFwiR0VOUEFTU1wiLCBiaXRzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseTxCdWxrU3RyaW5nPihcIkFDTFwiLCBcIkdFTlBBU1NcIik7XG4gIH1cblxuICBhY2xHZXRVc2VyKHVzZXJuYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nIHwgQnVsa1N0cmluZ1tdPihcbiAgICAgIFwiQUNMXCIsXG4gICAgICBcIkdFVFVTRVJcIixcbiAgICAgIHVzZXJuYW1lLFxuICAgICk7XG4gIH1cblxuICBhY2xIZWxwKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiQUNMXCIsIFwiSEVMUFwiKTtcbiAgfVxuXG4gIGFjbExpc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJBQ0xcIiwgXCJMSVNUXCIpO1xuICB9XG5cbiAgYWNsTG9hZCgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJBQ0xcIiwgXCJMT0FEXCIpO1xuICB9XG5cbiAgYWNsTG9nKGNvdW50OiBudW1iZXIpOiBQcm9taXNlPEJ1bGtTdHJpbmdbXT47XG4gIGFjbExvZyhtb2RlOiBBQ0xMb2dNb2RlKTogUHJvbWlzZTxTaW1wbGVTdHJpbmc+O1xuICBhY2xMb2cocGFyYW06IG51bWJlciB8IEFDTExvZ01vZGUpIHtcbiAgICBpZiAocGFyYW0gPT09IFwiUkVTRVRcIikge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQUNMXCIsIFwiTE9HXCIsIFwiUkVTRVRcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiQUNMXCIsIFwiTE9HXCIsIHBhcmFtKTtcbiAgfVxuXG4gIGFjbFNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQUNMXCIsIFwiU0FWRVwiKTtcbiAgfVxuXG4gIGFjbFNldFVzZXIodXNlcm5hbWU6IHN0cmluZywgLi4ucnVsZXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQUNMXCIsIFwiU0VUVVNFUlwiLCB1c2VybmFtZSwgLi4ucnVsZXMpO1xuICB9XG5cbiAgYWNsVXNlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJBQ0xcIiwgXCJVU0VSU1wiKTtcbiAgfVxuXG4gIGFjbFdob2FtaSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5PEJ1bGtTdHJpbmc+KFwiQUNMXCIsIFwiV0hPQU1JXCIpO1xuICB9XG5cbiAgYXBwZW5kKGtleTogc3RyaW5nLCB2YWx1ZTogUmVkaXNWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJBUFBFTkRcIiwga2V5LCB2YWx1ZSk7XG4gIH1cblxuICBhdXRoKHBhcmFtMTogUmVkaXNWYWx1ZSwgcGFyYW0yPzogUmVkaXNWYWx1ZSkge1xuICAgIGlmIChwYXJhbTIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQVVUSFwiLCBwYXJhbTEsIHBhcmFtMik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkFVVEhcIiwgcGFyYW0xKTtcbiAgfVxuXG4gIGJncmV3cml0ZWFvZigpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJCR1JFV1JJVEVBT0ZcIik7XG4gIH1cblxuICBiZ3NhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQkdTQVZFXCIpO1xuICB9XG5cbiAgYml0Y291bnQoa2V5OiBzdHJpbmcsIHN0YXJ0PzogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcbiAgICBpZiAoc3RhcnQgIT09IHVuZGVmaW5lZCAmJiBlbmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkJJVENPVU5UXCIsIGtleSwgc3RhcnQsIGVuZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJCSVRDT1VOVFwiLCBrZXkpO1xuICB9XG5cbiAgYml0ZmllbGQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgb3B0cz86IEJpdGZpZWxkT3B0cyB8IEJpdGZpZWxkV2l0aE92ZXJmbG93T3B0cyxcbiAgKSB7XG4gICAgY29uc3QgYXJnczogKG51bWJlciB8IHN0cmluZylbXSA9IFtrZXldO1xuICAgIGlmIChvcHRzPy5nZXQpIHtcbiAgICAgIGNvbnN0IHsgdHlwZSwgb2Zmc2V0IH0gPSBvcHRzLmdldDtcbiAgICAgIGFyZ3MucHVzaChcIkdFVFwiLCB0eXBlLCBvZmZzZXQpO1xuICAgIH1cbiAgICBpZiAob3B0cz8uc2V0KSB7XG4gICAgICBjb25zdCB7IHR5cGUsIG9mZnNldCwgdmFsdWUgfSA9IG9wdHMuc2V0O1xuICAgICAgYXJncy5wdXNoKFwiU0VUXCIsIHR5cGUsIG9mZnNldCwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAob3B0cz8uaW5jcmJ5KSB7XG4gICAgICBjb25zdCB7IHR5cGUsIG9mZnNldCwgaW5jcmVtZW50IH0gPSBvcHRzLmluY3JieTtcbiAgICAgIGFyZ3MucHVzaChcIklOQ1JCWVwiLCB0eXBlLCBvZmZzZXQsIGluY3JlbWVudCk7XG4gICAgfVxuICAgIGlmICgob3B0cyBhcyBCaXRmaWVsZFdpdGhPdmVyZmxvd09wdHMpPy5vdmVyZmxvdykge1xuICAgICAgYXJncy5wdXNoKFwiT1ZFUkZMT1dcIiwgKG9wdHMgYXMgQml0ZmllbGRXaXRoT3ZlcmZsb3dPcHRzKS5vdmVyZmxvdyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEludGVnZXI+KFwiQklURklFTERcIiwgLi4uYXJncyk7XG4gIH1cblxuICBiaXRvcChvcGVyYXRpb246IHN0cmluZywgZGVzdGtleTogc3RyaW5nLCAuLi5rZXlzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJCSVRPUFwiLCBvcGVyYXRpb24sIGRlc3RrZXksIC4uLmtleXMpO1xuICB9XG5cbiAgYml0cG9zKGtleTogc3RyaW5nLCBiaXQ6IG51bWJlciwgc3RhcnQ/OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xuICAgIGlmIChzdGFydCAhPT0gdW5kZWZpbmVkICYmIGVuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiQklUUE9TXCIsIGtleSwgYml0LCBzdGFydCwgZW5kKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJCSVRQT1NcIiwga2V5LCBiaXQsIHN0YXJ0KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkJJVFBPU1wiLCBrZXksIGJpdCk7XG4gIH1cblxuICBibHBvcCh0aW1lb3V0OiBudW1iZXIsIC4uLmtleXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJCTFBPUFwiLCAuLi5rZXlzLCB0aW1lb3V0KSBhcyBQcm9taXNlPFxuICAgICAgW0J1bGtTdHJpbmcsIEJ1bGtTdHJpbmddIHwgQnVsa05pbFxuICAgID47XG4gIH1cblxuICBicnBvcCh0aW1lb3V0OiBudW1iZXIsIC4uLmtleXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJCUlBPUFwiLCAuLi5rZXlzLCB0aW1lb3V0KSBhcyBQcm9taXNlPFxuICAgICAgW0J1bGtTdHJpbmcsIEJ1bGtTdHJpbmddIHwgQnVsa05pbFxuICAgID47XG4gIH1cblxuICBicnBvcGxwdXNoKHNvdXJjZTogc3RyaW5nLCBkZXN0aW5hdGlvbjogc3RyaW5nLCB0aW1lb3V0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5KFwiQlJQT1BMUFVTSFwiLCBzb3VyY2UsIGRlc3RpbmF0aW9uLCB0aW1lb3V0KTtcbiAgfVxuXG4gIGJ6cG9wbWluKHRpbWVvdXQ6IG51bWJlciwgLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIkJaUE9QTUlOXCIsIC4uLmtleXMsIHRpbWVvdXQpIGFzIFByb21pc2U8XG4gICAgICBbQnVsa1N0cmluZywgQnVsa1N0cmluZywgQnVsa1N0cmluZ10gfCBCdWxrTmlsXG4gICAgPjtcbiAgfVxuXG4gIGJ6cG9wbWF4KHRpbWVvdXQ6IG51bWJlciwgLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIkJaUE9QTUFYXCIsIC4uLmtleXMsIHRpbWVvdXQpIGFzIFByb21pc2U8XG4gICAgICBbQnVsa1N0cmluZywgQnVsa1N0cmluZywgQnVsa1N0cmluZ10gfCBCdWxrTmlsXG4gICAgPjtcbiAgfVxuXG4gIGNsaWVudENhY2hpbmcobW9kZTogQ2xpZW50Q2FjaGluZ01vZGUpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTElFTlRcIiwgXCJDQUNISU5HXCIsIG1vZGUpO1xuICB9XG5cbiAgY2xpZW50R2V0TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5KFwiQ0xJRU5UXCIsIFwiR0VUTkFNRVwiKTtcbiAgfVxuXG4gIGNsaWVudEdldFJlZGlyKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJDTElFTlRcIiwgXCJHRVRSRURJUlwiKTtcbiAgfVxuXG4gIGNsaWVudElEKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJDTElFTlRcIiwgXCJJRFwiKTtcbiAgfVxuXG4gIGNsaWVudEluZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkNMSUVOVFwiLCBcIklORk9cIik7XG4gIH1cblxuICBjbGllbnRLaWxsKG9wdHM6IENsaWVudEtpbGxPcHRzKSB7XG4gICAgY29uc3QgYXJnczogKHN0cmluZyB8IG51bWJlcilbXSA9IFtdO1xuICAgIGlmIChvcHRzLmFkZHIpIHtcbiAgICAgIGFyZ3MucHVzaChcIkFERFJcIiwgb3B0cy5hZGRyKTtcbiAgICB9XG4gICAgaWYgKG9wdHMubGFkZHIpIHtcbiAgICAgIGFyZ3MucHVzaChcIkxBRERSXCIsIG9wdHMubGFkZHIpO1xuICAgIH1cbiAgICBpZiAob3B0cy5pZCkge1xuICAgICAgYXJncy5wdXNoKFwiSURcIiwgb3B0cy5pZCk7XG4gICAgfVxuICAgIGlmIChvcHRzLnR5cGUpIHtcbiAgICAgIGFyZ3MucHVzaChcIlRZUEVcIiwgb3B0cy50eXBlKTtcbiAgICB9XG4gICAgaWYgKG9wdHMudXNlcikge1xuICAgICAgYXJncy5wdXNoKFwiVVNFUlwiLCBvcHRzLnVzZXIpO1xuICAgIH1cbiAgICBpZiAob3B0cy5za2lwbWUpIHtcbiAgICAgIGFyZ3MucHVzaChcIlNLSVBNRVwiLCBvcHRzLnNraXBtZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJDTElFTlRcIiwgXCJLSUxMXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgY2xpZW50TGlzdChvcHRzPzogQ2xpZW50TGlzdE9wdHMpIHtcbiAgICBpZiAob3B0cyAmJiBvcHRzLnR5cGUgJiYgb3B0cy5pZHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm9ubHkgb25lIG9mIGB0eXBlYCBvciBgaWRzYCBjYW4gYmUgc3BlY2lmaWVkXCIpO1xuICAgIH1cbiAgICBpZiAob3B0cyAmJiBvcHRzLnR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHkoXCJDTElFTlRcIiwgXCJMSVNUXCIsIFwiVFlQRVwiLCBvcHRzLnR5cGUpO1xuICAgIH1cbiAgICBpZiAob3B0cyAmJiBvcHRzLmlkcykge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkNMSUVOVFwiLCBcIkxJU1RcIiwgXCJJRFwiLCAuLi5vcHRzLmlkcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHkoXCJDTElFTlRcIiwgXCJMSVNUXCIpO1xuICB9XG5cbiAgY2xpZW50UGF1c2UodGltZW91dDogbnVtYmVyLCBtb2RlPzogQ2xpZW50UGF1c2VNb2RlKSB7XG4gICAgaWYgKG1vZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkNMSUVOVFwiLCBcIlBBVVNFXCIsIHRpbWVvdXQsIG1vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTElFTlRcIiwgXCJQQVVTRVwiLCB0aW1lb3V0KTtcbiAgfVxuXG4gIGNsaWVudFNldE5hbWUoY29ubmVjdGlvbk5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkNMSUVOVFwiLCBcIlNFVE5BTUVcIiwgY29ubmVjdGlvbk5hbWUpO1xuICB9XG5cbiAgY2xpZW50VHJhY2tpbmcob3B0czogQ2xpZW50VHJhY2tpbmdPcHRzKSB7XG4gICAgY29uc3QgYXJnczogKG51bWJlciB8IHN0cmluZylbXSA9IFtvcHRzLm1vZGVdO1xuICAgIGlmIChvcHRzLnJlZGlyZWN0KSB7XG4gICAgICBhcmdzLnB1c2goXCJSRURJUkVDVFwiLCBvcHRzLnJlZGlyZWN0KTtcbiAgICB9XG4gICAgaWYgKG9wdHMucHJlZml4ZXMpIHtcbiAgICAgIG9wdHMucHJlZml4ZXMuZm9yRWFjaCgocHJlZml4KSA9PiB7XG4gICAgICAgIGFyZ3MucHVzaChcIlBSRUZJWFwiKTtcbiAgICAgICAgYXJncy5wdXNoKHByZWZpeCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKG9wdHMuYmNhc3QpIHtcbiAgICAgIGFyZ3MucHVzaChcIkJDQVNUXCIpO1xuICAgIH1cbiAgICBpZiAob3B0cy5vcHRJbikge1xuICAgICAgYXJncy5wdXNoKFwiT1BUSU5cIik7XG4gICAgfVxuICAgIGlmIChvcHRzLm9wdE91dCkge1xuICAgICAgYXJncy5wdXNoKFwiT1BUT1VUXCIpO1xuICAgIH1cbiAgICBpZiAob3B0cy5ub0xvb3ApIHtcbiAgICAgIGFyZ3MucHVzaChcIk5PTE9PUFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQ0xJRU5UXCIsIFwiVFJBQ0tJTkdcIiwgLi4uYXJncyk7XG4gIH1cblxuICBjbGllbnRUcmFja2luZ0luZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJDTElFTlRcIiwgXCJUUkFDS0lOR0lORk9cIik7XG4gIH1cblxuICBjbGllbnRVbmJsb2NrKFxuICAgIGlkOiBudW1iZXIsXG4gICAgYmVoYXZpb3VyPzogQ2xpZW50VW5ibG9ja2luZ0JlaGF2aW91cixcbiAgKTogUHJvbWlzZTxJbnRlZ2VyPiB7XG4gICAgaWYgKGJlaGF2aW91cikge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkNMSUVOVFwiLCBcIlVOQkxPQ0tcIiwgaWQsIGJlaGF2aW91cik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJDTElFTlRcIiwgXCJVTkJMT0NLXCIsIGlkKTtcbiAgfVxuXG4gIGNsaWVudFVucGF1c2UoKTogUHJvbWlzZTxTaW1wbGVTdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTElFTlRcIiwgXCJVTlBBVVNFXCIpO1xuICB9XG5cbiAgYXNraW5nKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkFTS0lOR1wiKTtcbiAgfVxuXG4gIGNsdXN0ZXJBZGRTbG90cyguLi5zbG90czogbnVtYmVyW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiQUREU0xPVFNcIiwgLi4uc2xvdHMpO1xuICB9XG5cbiAgY2x1c3RlckNvdW50RmFpbHVyZVJlcG9ydHMobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiQ0xVU1RFUlwiLCBcIkNPVU5ULUZBSUxVUkUtUkVQT1JUU1wiLCBub2RlSWQpO1xuICB9XG5cbiAgY2x1c3RlckNvdW50S2V5c0luU2xvdChzbG90OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiQ0xVU1RFUlwiLCBcIkNPVU5US0VZU0lOU0xPVFwiLCBzbG90KTtcbiAgfVxuXG4gIGNsdXN0ZXJEZWxTbG90cyguLi5zbG90czogbnVtYmVyW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiREVMU0xPVFNcIiwgLi4uc2xvdHMpO1xuICB9XG5cbiAgY2x1c3RlckZhaWxvdmVyKG1vZGU/OiBDbHVzdGVyRmFpbG92ZXJNb2RlKSB7XG4gICAgaWYgKG1vZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkNMVVNURVJcIiwgXCJGQUlMT1ZFUlwiLCBtb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQ0xVU1RFUlwiLCBcIkZBSUxPVkVSXCIpO1xuICB9XG5cbiAgY2x1c3RlckZsdXNoU2xvdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQ0xVU1RFUlwiLCBcIkZMVVNIU0xPVFNcIik7XG4gIH1cblxuICBjbHVzdGVyRm9yZ2V0KG5vZGVJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQ0xVU1RFUlwiLCBcIkZPUkdFVFwiLCBub2RlSWQpO1xuICB9XG5cbiAgY2x1c3RlckdldEtleXNJblNsb3Qoc2xvdDogbnVtYmVyLCBjb3VudDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXG4gICAgICBcIkNMVVNURVJcIixcbiAgICAgIFwiR0VUS0VZU0lOU0xPVFwiLFxuICAgICAgc2xvdCxcbiAgICAgIGNvdW50LFxuICAgICk7XG4gIH1cblxuICBjbHVzdGVySW5mbygpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiSU5GT1wiKTtcbiAgfVxuXG4gIGNsdXN0ZXJLZXlTbG90KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkNMVVNURVJcIiwgXCJLRVlTTE9UXCIsIGtleSk7XG4gIH1cblxuICBjbHVzdGVyTWVldChpcDogc3RyaW5nLCBwb3J0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiTUVFVFwiLCBpcCwgcG9ydCk7XG4gIH1cblxuICBjbHVzdGVyTXlJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiTVlJRFwiKTtcbiAgfVxuXG4gIGNsdXN0ZXJOb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5PEJ1bGtTdHJpbmc+KFwiQ0xVU1RFUlwiLCBcIk5PREVTXCIpO1xuICB9XG5cbiAgY2x1c3RlclJlcGxpY2FzKG5vZGVJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJDTFVTVEVSXCIsIFwiUkVQTElDQVNcIiwgbm9kZUlkKTtcbiAgfVxuXG4gIGNsdXN0ZXJSZXBsaWNhdGUobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiUkVQTElDQVRFXCIsIG5vZGVJZCk7XG4gIH1cblxuICBjbHVzdGVyUmVzZXQobW9kZT86IENsdXN0ZXJSZXNldE1vZGUpIHtcbiAgICBpZiAobW9kZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQ0xVU1RFUlwiLCBcIlJFU0VUXCIsIG1vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiUkVTRVRcIik7XG4gIH1cblxuICBjbHVzdGVyU2F2ZUNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiU0FWRUNPTkZJR1wiKTtcbiAgfVxuXG4gIGNsdXN0ZXJTZXRTbG90KFxuICAgIHNsb3Q6IG51bWJlcixcbiAgICBzdWJjb21tYW5kOiBDbHVzdGVyU2V0U2xvdFN1YmNvbW1hbmQsXG4gICAgbm9kZUlkPzogc3RyaW5nLFxuICApIHtcbiAgICBpZiAobm9kZUlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcbiAgICAgICAgXCJDTFVTVEVSXCIsXG4gICAgICAgIFwiU0VUU0xPVFwiLFxuICAgICAgICBzbG90LFxuICAgICAgICBzdWJjb21tYW5kLFxuICAgICAgICBub2RlSWQsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJDTFVTVEVSXCIsIFwiU0VUU0xPVFwiLCBzbG90LCBzdWJjb21tYW5kKTtcbiAgfVxuXG4gIGNsdXN0ZXJTbGF2ZXMobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIkNMVVNURVJcIiwgXCJTTEFWRVNcIiwgbm9kZUlkKTtcbiAgfVxuXG4gIGNsdXN0ZXJTbG90cygpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIkNMVVNURVJcIiwgXCJTTE9UU1wiKTtcbiAgfVxuXG4gIGNvbW1hbmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJDT01NQU5EXCIpIGFzIFByb21pc2U8XG4gICAgICBbQnVsa1N0cmluZywgSW50ZWdlciwgQnVsa1N0cmluZ1tdLCBJbnRlZ2VyLCBJbnRlZ2VyLCBJbnRlZ2VyXVtdXG4gICAgPjtcbiAgfVxuXG4gIGNvbW1hbmRDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiQ09NTUFORFwiLCBcIkNPVU5UXCIpO1xuICB9XG5cbiAgY29tbWFuZEdldEtleXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJDT01NQU5EXCIsIFwiR0VUS0VZU1wiKTtcbiAgfVxuXG4gIGNvbW1hbmRJbmZvKC4uLmNvbW1hbmROYW1lczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIkNPTU1BTkRcIiwgXCJJTkZPXCIsIC4uLmNvbW1hbmROYW1lcykgYXMgUHJvbWlzZTxcbiAgICAgIChcbiAgICAgICAgfCBbQnVsa1N0cmluZywgSW50ZWdlciwgQnVsa1N0cmluZ1tdLCBJbnRlZ2VyLCBJbnRlZ2VyLCBJbnRlZ2VyXVxuICAgICAgICB8IEJ1bGtOaWxcbiAgICAgIClbXVxuICAgID47XG4gIH1cblxuICBjb25maWdHZXQocGFyYW1ldGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIkNPTkZJR1wiLCBcIkdFVFwiLCBwYXJhbWV0ZXIpO1xuICB9XG5cbiAgY29uZmlnUmVzZXRTdGF0KCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkNPTkZJR1wiLCBcIlJFU0VUU1RBVFwiKTtcbiAgfVxuXG4gIGNvbmZpZ1Jld3JpdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiQ09ORklHXCIsIFwiUkVXUklURVwiKTtcbiAgfVxuXG4gIGNvbmZpZ1NldChwYXJhbWV0ZXI6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkNPTkZJR1wiLCBcIlNFVFwiLCBwYXJhbWV0ZXIsIHZhbHVlKTtcbiAgfVxuXG4gIGRic2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiREJTSVpFXCIpO1xuICB9XG5cbiAgZGVidWdPYmplY3Qoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJERUJVR1wiLCBcIk9CSkVDVFwiLCBrZXkpO1xuICB9XG5cbiAgZGVidWdTZWdmYXVsdCgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJERUJVR1wiLCBcIlNFR0ZBVUxUXCIpO1xuICB9XG5cbiAgZGVjcihrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJERUNSXCIsIGtleSk7XG4gIH1cblxuICBkZWNyYnkoa2V5OiBzdHJpbmcsIGRlY3JlbWVudDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkRFQ1JCWVwiLCBrZXksIGRlY3JlbWVudCk7XG4gIH1cblxuICBkZWwoLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiREVMXCIsIC4uLmtleXMpO1xuICB9XG5cbiAgZGlzY2FyZCgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJESVNDQVJEXCIpO1xuICB9XG5cbiAgZHVtcChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNCaW5hcnlSZXBseShcIkRVTVBcIiwga2V5KTtcbiAgfVxuXG4gIGVjaG8obWVzc2FnZTogUmVkaXNWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHk8QnVsa1N0cmluZz4oXCJFQ0hPXCIsIG1lc3NhZ2UpO1xuICB9XG5cbiAgZXZhbChzY3JpcHQ6IHN0cmluZywga2V5czogc3RyaW5nW10sIGFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1JlcGx5KFxuICAgICAgXCJFVkFMXCIsXG4gICAgICBzY3JpcHQsXG4gICAgICBrZXlzLmxlbmd0aCxcbiAgICAgIC4uLmtleXMsXG4gICAgICAuLi5hcmdzLFxuICAgICk7XG4gIH1cblxuICBldmFsc2hhKHNoYTE6IHN0cmluZywga2V5czogc3RyaW5nW10sIGFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1JlcGx5KFxuICAgICAgXCJFVkFMU0hBXCIsXG4gICAgICBzaGExLFxuICAgICAga2V5cy5sZW5ndGgsXG4gICAgICAuLi5rZXlzLFxuICAgICAgLi4uYXJncyxcbiAgICApO1xuICB9XG5cbiAgZXhlYygpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIkVYRUNcIik7XG4gIH1cblxuICBleGlzdHMoLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiRVhJU1RTXCIsIC4uLmtleXMpO1xuICB9XG5cbiAgZXhwaXJlKGtleTogc3RyaW5nLCBzZWNvbmRzOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiRVhQSVJFXCIsIGtleSwgc2Vjb25kcyk7XG4gIH1cblxuICBleHBpcmVhdChrZXk6IHN0cmluZywgdGltZXN0YW1wOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiRVhQSVJFQVRcIiwga2V5LCB0aW1lc3RhbXApO1xuICB9XG5cbiAgZmx1c2hhbGwoYXN5bmM/OiBib29sZWFuKSB7XG4gICAgaWYgKGFzeW5jKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJGTFVTSEFMTFwiLCBcIkFTWU5DXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJGTFVTSEFMTFwiKTtcbiAgfVxuXG4gIGZsdXNoZGIoYXN5bmM/OiBib29sZWFuKSB7XG4gICAgaWYgKGFzeW5jKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJGTFVTSERCXCIsIFwiQVNZTkNcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkZMVVNIREJcIik7XG4gIH1cblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBnZW9hZGQoa2V5OiBzdHJpbmcsIC4uLnBhcmFtczogYW55W10pIHtcbiAgICBjb25zdCBhcmdzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gW2tleV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW1zWzBdKSkge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcy5mbGF0TWFwKChlKSA9PiBlKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zWzBdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IFttZW1iZXIsIGxuZ2xhdF0gb2YgT2JqZWN0LmVudHJpZXMocGFyYW1zWzBdKSkge1xuICAgICAgICBhcmdzLnB1c2goLi4uKGxuZ2xhdCBhcyBbbnVtYmVyLCBudW1iZXJdKSwgbWVtYmVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJHRU9BRERcIiwgLi4uYXJncyk7XG4gIH1cblxuICBnZW9oYXNoKGtleTogc3RyaW5nLCAuLi5tZW1iZXJzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGs+KFwiR0VPSEFTSFwiLCBrZXksIC4uLm1lbWJlcnMpO1xuICB9XG5cbiAgZ2VvcG9zKGtleTogc3RyaW5nLCAuLi5tZW1iZXJzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5KFwiR0VPUE9TXCIsIGtleSwgLi4ubWVtYmVycykgYXMgUHJvbWlzZTxcbiAgICAgIChbQnVsa1N0cmluZywgQnVsa1N0cmluZ10gfCBCdWxrTmlsIHwgW10pW11cbiAgICA+O1xuICB9XG5cbiAgZ2VvZGlzdChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBtZW1iZXIxOiBzdHJpbmcsXG4gICAgbWVtYmVyMjogc3RyaW5nLFxuICAgIHVuaXQ/OiBHZW9Vbml0LFxuICApIHtcbiAgICBpZiAodW5pdCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkdFT0RJU1RcIiwga2V5LCBtZW1iZXIxLCBtZW1iZXIyLCB1bml0KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkdFT0RJU1RcIiwga2V5LCBtZW1iZXIxLCBtZW1iZXIyKTtcbiAgfVxuXG4gIGdlb3JhZGl1cyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICBsb25naXR1ZGU6IG51bWJlcixcbiAgICBsYXRpdHVkZTogbnVtYmVyLFxuICAgIHJhZGl1czogbnVtYmVyLFxuICAgIHVuaXQ6IFwibVwiIHwgXCJrbVwiIHwgXCJmdFwiIHwgXCJtaVwiLFxuICAgIG9wdHM/OiBHZW9SYWRpdXNPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoR2VvUmFkaXVzT3B0cyhcbiAgICAgIFtrZXksIGxvbmdpdHVkZSwgbGF0aXR1ZGUsIHJhZGl1cywgdW5pdF0sXG4gICAgICBvcHRzLFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJHRU9SQURJVVNcIiwgLi4uYXJncyk7XG4gIH1cblxuICBnZW9yYWRpdXNieW1lbWJlcihcbiAgICBrZXk6IHN0cmluZyxcbiAgICBtZW1iZXI6IHN0cmluZyxcbiAgICByYWRpdXM6IG51bWJlcixcbiAgICB1bml0OiBHZW9Vbml0LFxuICAgIG9wdHM/OiBHZW9SYWRpdXNPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoR2VvUmFkaXVzT3B0cyhba2V5LCBtZW1iZXIsIHJhZGl1cywgdW5pdF0sIG9wdHMpO1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5KFwiR0VPUkFESVVTQllNRU1CRVJcIiwgLi4uYXJncyk7XG4gIH1cblxuICBwcml2YXRlIHB1c2hHZW9SYWRpdXNPcHRzKFxuICAgIGFyZ3M6IChzdHJpbmcgfCBudW1iZXIpW10sXG4gICAgb3B0cz86IEdlb1JhZGl1c09wdHMsXG4gICkge1xuICAgIGlmIChvcHRzPy53aXRoQ29vcmQpIHtcbiAgICAgIGFyZ3MucHVzaChcIldJVEhDT09SRFwiKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LndpdGhEaXN0KSB7XG4gICAgICBhcmdzLnB1c2goXCJXSVRIRElTVFwiKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LndpdGhIYXNoKSB7XG4gICAgICBhcmdzLnB1c2goXCJXSVRISEFTSFwiKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LmNvdW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaChvcHRzLmNvdW50KTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LnNvcnQpIHtcbiAgICAgIGFyZ3MucHVzaChvcHRzLnNvcnQpO1xuICAgIH1cbiAgICBpZiAob3B0cz8uc3RvcmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKG9wdHMuc3RvcmUpO1xuICAgIH1cbiAgICBpZiAob3B0cz8uc3RvcmVEaXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaChvcHRzLnN0b3JlRGlzdCk7XG4gICAgfVxuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgZ2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkdFVFwiLCBrZXkpO1xuICB9XG5cbiAgZ2V0Yml0KGtleTogc3RyaW5nLCBvZmZzZXQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJHRVRCSVRcIiwga2V5LCBvZmZzZXQpO1xuICB9XG5cbiAgZ2V0cmFuZ2Uoa2V5OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseTxCdWxrU3RyaW5nPihcIkdFVFJBTkdFXCIsIGtleSwgc3RhcnQsIGVuZCk7XG4gIH1cblxuICBnZXRzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBSZWRpc1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkdFVFNFVFwiLCBrZXksIHZhbHVlKTtcbiAgfVxuXG4gIGhkZWwoa2V5OiBzdHJpbmcsIC4uLmZpZWxkczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiSERFTFwiLCBrZXksIC4uLmZpZWxkcyk7XG4gIH1cblxuICBoZXhpc3RzKGtleTogc3RyaW5nLCBmaWVsZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkhFWElTVFNcIiwga2V5LCBmaWVsZCk7XG4gIH1cblxuICBoZ2V0KGtleTogc3RyaW5nLCBmaWVsZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIkhHRVRcIiwga2V5LCBmaWVsZCk7XG4gIH1cblxuICBoZ2V0YWxsKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJIR0VUQUxMXCIsIGtleSk7XG4gIH1cblxuICBoaW5jcmJ5KGtleTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCBpbmNyZW1lbnQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJISU5DUkJZXCIsIGtleSwgZmllbGQsIGluY3JlbWVudCk7XG4gIH1cblxuICBoaW5jcmJ5ZmxvYXQoa2V5OiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIGluY3JlbWVudDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseTxCdWxrU3RyaW5nPihcbiAgICAgIFwiSElOQ1JCWUZMT0FUXCIsXG4gICAgICBrZXksXG4gICAgICBmaWVsZCxcbiAgICAgIGluY3JlbWVudCxcbiAgICApO1xuICB9XG5cbiAgaGtleXMoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIkhLRVlTXCIsIGtleSk7XG4gIH1cblxuICBobGVuKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkhMRU5cIiwga2V5KTtcbiAgfVxuXG4gIGhtZ2V0KGtleTogc3RyaW5nLCAuLi5maWVsZHM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsaz4oXCJITUdFVFwiLCBrZXksIC4uLmZpZWxkcyk7XG4gIH1cblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBobXNldChrZXk6IHN0cmluZywgLi4ucGFyYW1zOiBhbnlbXSkge1xuICAgIGNvbnN0IGFyZ3MgPSBba2V5XSBhcyBSZWRpc1ZhbHVlW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW1zWzBdKSkge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcy5mbGF0TWFwKChlKSA9PiBlKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zWzBdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IFtmaWVsZCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHBhcmFtc1swXSkpIHtcbiAgICAgICAgYXJncy5wdXNoKGZpZWxkLCB2YWx1ZSBhcyBSZWRpc1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkhNU0VUXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgaHNldChrZXk6IHN0cmluZywgLi4ucGFyYW1zOiBhbnlbXSkge1xuICAgIGNvbnN0IGFyZ3MgPSBba2V5XSBhcyBSZWRpc1ZhbHVlW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW1zWzBdKSkge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcy5mbGF0TWFwKChlKSA9PiBlKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zWzBdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IFtmaWVsZCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHBhcmFtc1swXSkpIHtcbiAgICAgICAgYXJncy5wdXNoKGZpZWxkLCB2YWx1ZSBhcyBSZWRpc1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJIU0VUXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgaHNldG54KGtleTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCB2YWx1ZTogUmVkaXNWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJIU0VUTlhcIiwga2V5LCBmaWVsZCwgdmFsdWUpO1xuICB9XG5cbiAgaHN0cmxlbihrZXk6IHN0cmluZywgZmllbGQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJIU1RSTEVOXCIsIGtleSwgZmllbGQpO1xuICB9XG5cbiAgaHZhbHMoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIkhWQUxTXCIsIGtleSk7XG4gIH1cblxuICBpbmNyKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIklOQ1JcIiwga2V5KTtcbiAgfVxuXG4gIGluY3JieShrZXk6IHN0cmluZywgaW5jcmVtZW50OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiSU5DUkJZXCIsIGtleSwgaW5jcmVtZW50KTtcbiAgfVxuXG4gIGluY3JieWZsb2F0KGtleTogc3RyaW5nLCBpbmNyZW1lbnQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHk8QnVsa1N0cmluZz4oXCJJTkNSQllGTE9BVFwiLCBrZXksIGluY3JlbWVudCk7XG4gIH1cblxuICBpbmZvKHNlY3Rpb24/OiBzdHJpbmcpIHtcbiAgICBpZiAoc2VjdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJJTkZPXCIsIHNlY3Rpb24pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJJTkZPXCIpO1xuICB9XG5cbiAga2V5cyhwYXR0ZXJuOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIktFWVNcIiwgcGF0dGVybik7XG4gIH1cblxuICBsYXN0c2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiTEFTVFNBVkVcIik7XG4gIH1cblxuICBsaW5kZXgoa2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5KFwiTElOREVYXCIsIGtleSwgaW5kZXgpO1xuICB9XG5cbiAgbGluc2VydChrZXk6IHN0cmluZywgbG9jOiBMSW5zZXJ0TG9jYXRpb24sIHBpdm90OiBzdHJpbmcsIHZhbHVlOiBSZWRpc1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkxJTlNFUlRcIiwga2V5LCBsb2MsIHBpdm90LCB2YWx1ZSk7XG4gIH1cblxuICBsbGVuKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkxMRU5cIiwga2V5KTtcbiAgfVxuXG4gIGxwb3Aoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5KFwiTFBPUFwiLCBrZXkpO1xuICB9XG5cbiAgbHBvcyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICBlbGVtZW50OiBSZWRpc1ZhbHVlLFxuICAgIG9wdHM/OiBMUG9zT3B0cyxcbiAgKTogUHJvbWlzZTxJbnRlZ2VyIHwgQnVsa05pbD47XG5cbiAgbHBvcyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICBlbGVtZW50OiBSZWRpc1ZhbHVlLFxuICAgIG9wdHM6IExQb3NXaXRoQ291bnRPcHRzLFxuICApOiBQcm9taXNlPEludGVnZXJbXT47XG5cbiAgbHBvcyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICBlbGVtZW50OiBSZWRpc1ZhbHVlLFxuICAgIG9wdHM/OiBMUG9zT3B0cyB8IExQb3NXaXRoQ291bnRPcHRzLFxuICApOiBQcm9taXNlPEludGVnZXIgfCBCdWxrTmlsIHwgSW50ZWdlcltdPiB7XG4gICAgY29uc3QgYXJncyA9IFtlbGVtZW50XTtcbiAgICBpZiAob3B0cz8ucmFuayAhPSBudWxsKSB7XG4gICAgICBhcmdzLnB1c2goXCJSQU5LXCIsIFN0cmluZyhvcHRzLnJhbmspKTtcbiAgICB9XG5cbiAgICBpZiAob3B0cz8uY291bnQgIT0gbnVsbCkge1xuICAgICAgYXJncy5wdXNoKFwiQ09VTlRcIiwgU3RyaW5nKG9wdHMuY291bnQpKTtcbiAgICB9XG5cbiAgICBpZiAob3B0cz8ubWF4bGVuICE9IG51bGwpIHtcbiAgICAgIGFyZ3MucHVzaChcIk1BWExFTlwiLCBTdHJpbmcob3B0cy5tYXhsZW4pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0cz8uY291bnQgPT0gbnVsbFxuICAgICAgPyB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJMUE9TXCIsIGtleSwgLi4uYXJncylcbiAgICAgIDogdGhpcy5leGVjQXJyYXlSZXBseTxJbnRlZ2VyPihcIkxQT1NcIiwga2V5LCAuLi5hcmdzKTtcbiAgfVxuXG4gIGxwdXNoKGtleTogc3RyaW5nLCAuLi5lbGVtZW50czogUmVkaXNWYWx1ZVtdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkxQVVNIXCIsIGtleSwgLi4uZWxlbWVudHMpO1xuICB9XG5cbiAgbHB1c2h4KGtleTogc3RyaW5nLCAuLi5lbGVtZW50czogUmVkaXNWYWx1ZVtdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIkxQVVNIWFwiLCBrZXksIC4uLmVsZW1lbnRzKTtcbiAgfVxuXG4gIGxyYW5nZShrZXk6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgc3RvcDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJMUkFOR0VcIiwga2V5LCBzdGFydCwgc3RvcCk7XG4gIH1cblxuICBscmVtKGtleTogc3RyaW5nLCBjb3VudDogbnVtYmVyLCBlbGVtZW50OiBzdHJpbmcgfCBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiTFJFTVwiLCBrZXksIGNvdW50LCBlbGVtZW50KTtcbiAgfVxuXG4gIGxzZXQoa2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGVsZW1lbnQ6IHN0cmluZyB8IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIkxTRVRcIiwga2V5LCBpbmRleCwgZWxlbWVudCk7XG4gIH1cblxuICBsdHJpbShrZXk6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgc3RvcDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiTFRSSU1cIiwga2V5LCBzdGFydCwgc3RvcCk7XG4gIH1cblxuICBtZW1vcnlEb2N0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseTxCdWxrU3RyaW5nPihcIk1FTU9SWVwiLCBcIkRPQ1RPUlwiKTtcbiAgfVxuXG4gIG1lbW9yeUhlbHAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJNRU1PUllcIiwgXCJIRUxQXCIpO1xuICB9XG5cbiAgbWVtb3J5TWFsbG9jU3RhdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseTxCdWxrU3RyaW5nPihcIk1FTU9SWVwiLCBcIk1BTExPQ1wiLCBcIlNUQVRTXCIpO1xuICB9XG5cbiAgbWVtb3J5UHVyZ2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiTUVNT1JZXCIsIFwiUFVSR0VcIik7XG4gIH1cblxuICBtZW1vcnlTdGF0cygpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIk1FTU9SWVwiLCBcIlNUQVRTXCIpO1xuICB9XG5cbiAgbWVtb3J5VXNhZ2Uoa2V5OiBzdHJpbmcsIG9wdHM/OiBNZW1vcnlVc2FnZU9wdHMpIHtcbiAgICBjb25zdCBhcmdzOiAobnVtYmVyIHwgc3RyaW5nKVtdID0gW2tleV07XG4gICAgaWYgKG9wdHM/LnNhbXBsZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKFwiU0FNUExFU1wiLCBvcHRzLnNhbXBsZXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiTUVNT1JZXCIsIFwiVVNBR0VcIiwgLi4uYXJncyk7XG4gIH1cblxuICBtZ2V0KC4uLmtleXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsaz4oXCJNR0VUXCIsIC4uLmtleXMpO1xuICB9XG5cbiAgbWlncmF0ZShcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogbnVtYmVyLFxuICAgIGtleTogc3RyaW5nLFxuICAgIGRlc3RpbmF0aW9uREI6IHN0cmluZyxcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgb3B0cz86IE1pZ3JhdGVPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gW2hvc3QsIHBvcnQsIGtleSwgZGVzdGluYXRpb25EQiwgdGltZW91dF07XG4gICAgaWYgKG9wdHM/LmNvcHkpIHtcbiAgICAgIGFyZ3MucHVzaChcIkNPUFlcIik7XG4gICAgfVxuICAgIGlmIChvcHRzPy5yZXBsYWNlKSB7XG4gICAgICBhcmdzLnB1c2goXCJSRVBMQUNFXCIpO1xuICAgIH1cbiAgICBpZiAob3B0cz8uYXV0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goXCJBVVRIXCIsIG9wdHMuYXV0aCk7XG4gICAgfVxuICAgIGlmIChvcHRzPy5rZXlzKSB7XG4gICAgICBhcmdzLnB1c2goXCJLRVlTXCIsIC4uLm9wdHMua2V5cyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIk1JR1JBVEVcIiwgLi4uYXJncyk7XG4gIH1cblxuICBtb2R1bGVMaXN0KCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiTU9EVUxFXCIsIFwiTElTVFwiKTtcbiAgfVxuXG4gIG1vZHVsZUxvYWQocGF0aDogc3RyaW5nLCAuLi5hcmdzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIk1PRFVMRVwiLCBcIkxPQURcIiwgcGF0aCwgLi4uYXJncyk7XG4gIH1cblxuICBtb2R1bGVVbmxvYWQobmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiTU9EVUxFXCIsIFwiVU5MT0FEXCIsIG5hbWUpO1xuICB9XG5cbiAgbW9uaXRvcigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJub3Qgc3VwcG9ydGVkIHlldFwiKTtcbiAgfVxuXG4gIG1vdmUoa2V5OiBzdHJpbmcsIGRiOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiTU9WRVwiLCBrZXksIGRiKTtcbiAgfVxuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIG1zZXQoLi4ucGFyYW1zOiBhbnlbXSkge1xuICAgIGNvbnN0IGFyZ3M6IFJlZGlzVmFsdWVbXSA9IFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtc1swXSkpIHtcbiAgICAgIGFyZ3MucHVzaCguLi5wYXJhbXMuZmxhdE1hcCgoZSkgPT4gZSkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBhcmFtc1swXSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocGFyYW1zWzBdKSkge1xuICAgICAgICBhcmdzLnB1c2goa2V5LCB2YWx1ZSBhcyBSZWRpc1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIk1TRVRcIiwgLi4uYXJncyk7XG4gIH1cblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBtc2V0bngoLi4ucGFyYW1zOiBhbnlbXSkge1xuICAgIGNvbnN0IGFyZ3M6IFJlZGlzVmFsdWVbXSA9IFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtc1swXSkpIHtcbiAgICAgIGFyZ3MucHVzaCguLi5wYXJhbXMuZmxhdE1hcCgoZSkgPT4gZSkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBhcmFtc1swXSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocGFyYW1zWzBdKSkge1xuICAgICAgICBhcmdzLnB1c2goa2V5LCB2YWx1ZSBhcyBSZWRpc1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKC4uLnBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJNU0VUTlhcIiwgLi4uYXJncyk7XG4gIH1cblxuICBtdWx0aSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJNVUxUSVwiKTtcbiAgfVxuXG4gIG9iamVjdEVuY29kaW5nKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIk9CSkVDVFwiLCBcIkVOQ09ESU5HXCIsIGtleSk7XG4gIH1cblxuICBvYmplY3RGcmVxKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJPck5pbFJlcGx5KFwiT0JKRUNUXCIsIFwiRlJFUVwiLCBrZXkpO1xuICB9XG5cbiAgb2JqZWN0SGVscCgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIk9CSkVDVFwiLCBcIkhFTFBcIik7XG4gIH1cblxuICBvYmplY3RJZGxldGltZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyT3JOaWxSZXBseShcIk9CSkVDVFwiLCBcIklETEVUSU1FXCIsIGtleSk7XG4gIH1cblxuICBvYmplY3RSZWZDb3VudChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyT3JOaWxSZXBseShcIk9CSkVDVFwiLCBcIlJFRkNPVU5UXCIsIGtleSk7XG4gIH1cblxuICBwZXJzaXN0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlBFUlNJU1RcIiwga2V5KTtcbiAgfVxuXG4gIHBleHBpcmUoa2V5OiBzdHJpbmcsIG1pbGxpc2Vjb25kczogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlBFWFBJUkVcIiwga2V5LCBtaWxsaXNlY29uZHMpO1xuICB9XG5cbiAgcGV4cGlyZWF0KGtleTogc3RyaW5nLCBtaWxsaXNlY29uZHNUaW1lc3RhbXA6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJQRVhQSVJFQVRcIiwga2V5LCBtaWxsaXNlY29uZHNUaW1lc3RhbXApO1xuICB9XG5cbiAgcGZhZGQoa2V5OiBzdHJpbmcsIC4uLmVsZW1lbnRzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJQRkFERFwiLCBrZXksIC4uLmVsZW1lbnRzKTtcbiAgfVxuXG4gIHBmY291bnQoLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiUEZDT1VOVFwiLCAuLi5rZXlzKTtcbiAgfVxuXG4gIHBmbWVyZ2UoZGVzdGtleTogc3RyaW5nLCAuLi5zb3VyY2VrZXlzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIlBGTUVSR0VcIiwgZGVzdGtleSwgLi4uc291cmNla2V5cyk7XG4gIH1cblxuICBwaW5nKG1lc3NhZ2U/OiBSZWRpc1ZhbHVlKSB7XG4gICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHk8QnVsa1N0cmluZz4oXCJQSU5HXCIsIG1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJQSU5HXCIpO1xuICB9XG5cbiAgcHNldGV4KGtleTogc3RyaW5nLCBtaWxsaXNlY29uZHM6IG51bWJlciwgdmFsdWU6IFJlZGlzVmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJQU0VURVhcIiwga2V5LCBtaWxsaXNlY29uZHMsIHZhbHVlKTtcbiAgfVxuXG4gIHB1Ymxpc2goY2hhbm5lbDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiUFVCTElTSFwiLCBjaGFubmVsLCBtZXNzYWdlKTtcbiAgfVxuXG4gIHN1YnNjcmliZTxUTWVzc2FnZSBleHRlbmRzIHN0cmluZyB8IHN0cmluZ1tdID0gc3RyaW5nPihcbiAgICAuLi5jaGFubmVsczogc3RyaW5nW11cbiAgKSB7XG4gICAgcmV0dXJuIHN1YnNjcmliZTxUTWVzc2FnZT4odGhpcy5leGVjdXRvciwgLi4uY2hhbm5lbHMpO1xuICB9XG5cbiAgcHN1YnNjcmliZTxUTWVzc2FnZSBleHRlbmRzIHN0cmluZyB8IHN0cmluZ1tdID0gc3RyaW5nPihcbiAgICAuLi5wYXR0ZXJuczogc3RyaW5nW11cbiAgKSB7XG4gICAgcmV0dXJuIHBzdWJzY3JpYmU8VE1lc3NhZ2U+KHRoaXMuZXhlY3V0b3IsIC4uLnBhdHRlcm5zKTtcbiAgfVxuXG4gIHB1YnN1YkNoYW5uZWxzKHBhdHRlcm4/OiBzdHJpbmcpIHtcbiAgICBpZiAocGF0dGVybiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlBVQlNVQlwiLCBcIkNIQU5ORUxTXCIsIHBhdHRlcm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlBVQlNVQlwiLCBcIkNIQU5ORUxTXCIpO1xuICB9XG5cbiAgcHVic3ViTnVtcGF0KCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJQVUJTVUJcIiwgXCJOVU1QQVRcIik7XG4gIH1cblxuICBwdWJzdWJOdW1zdWIoLi4uY2hhbm5lbHM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZyB8IEludGVnZXI+KFxuICAgICAgXCJQVUJTVUJcIixcbiAgICAgIFwiTlVNU1VCXCIsXG4gICAgICAuLi5jaGFubmVscyxcbiAgICApO1xuICB9XG5cbiAgcHR0bChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJQVFRMXCIsIGtleSk7XG4gIH1cblxuICBxdWl0KCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIlFVSVRcIikuZmluYWxseSgoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICB9XG5cbiAgcmFuZG9ta2V5KCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHkoXCJSQU5ET01LRVlcIik7XG4gIH1cblxuICByZWFkb25seSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJSRUFET05MWVwiKTtcbiAgfVxuXG4gIHJlYWR3cml0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJSRUFEV1JJVEVcIik7XG4gIH1cblxuICByZW5hbWUoa2V5OiBzdHJpbmcsIG5ld2tleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiUkVOQU1FXCIsIGtleSwgbmV3a2V5KTtcbiAgfVxuXG4gIHJlbmFtZW54KGtleTogc3RyaW5nLCBuZXdrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJSRU5BTUVOWFwiLCBrZXksIG5ld2tleSk7XG4gIH1cblxuICByZXN0b3JlKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHR0bDogbnVtYmVyLFxuICAgIHNlcmlhbGl6ZWRWYWx1ZTogQmluYXJ5LFxuICAgIG9wdHM/OiBSZXN0b3JlT3B0cyxcbiAgKSB7XG4gICAgY29uc3QgYXJncyA9IFtrZXksIHR0bCwgc2VyaWFsaXplZFZhbHVlXTtcbiAgICBpZiAob3B0cz8ucmVwbGFjZSkge1xuICAgICAgYXJncy5wdXNoKFwiUkVQTEFDRVwiKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LmFic3R0bCkge1xuICAgICAgYXJncy5wdXNoKFwiQUJTVFRMXCIpO1xuICAgIH1cbiAgICBpZiAob3B0cz8uaWRsZXRpbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKFwiSURMRVRJTUVcIiwgb3B0cy5pZGxldGltZSk7XG4gICAgfVxuICAgIGlmIChvcHRzPy5mcmVxICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaChcIkZSRVFcIiwgb3B0cy5mcmVxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiUkVTVE9SRVwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHJvbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJST0xFXCIpIGFzIFByb21pc2U8XG4gICAgICB8IFtcIm1hc3RlclwiLCBJbnRlZ2VyLCBCdWxrU3RyaW5nW11bXV1cbiAgICAgIHwgW1wic2xhdmVcIiwgQnVsa1N0cmluZywgSW50ZWdlciwgQnVsa1N0cmluZywgSW50ZWdlcl1cbiAgICAgIHwgW1wic2VudGluZWxcIiwgQnVsa1N0cmluZ1tdXVxuICAgID47XG4gIH1cblxuICBycG9wKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIlJQT1BcIiwga2V5KTtcbiAgfVxuXG4gIHJwb3BscHVzaChzb3VyY2U6IHN0cmluZywgZGVzdGluYXRpb246IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHkoXCJSUE9QTFBVU0hcIiwgc291cmNlLCBkZXN0aW5hdGlvbik7XG4gIH1cblxuICBycHVzaChrZXk6IHN0cmluZywgLi4uZWxlbWVudHM6IFJlZGlzVmFsdWVbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJSUFVTSFwiLCBrZXksIC4uLmVsZW1lbnRzKTtcbiAgfVxuXG4gIHJwdXNoeChrZXk6IHN0cmluZywgLi4uZWxlbWVudHM6IFJlZGlzVmFsdWVbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJSUFVTSFhcIiwga2V5LCAuLi5lbGVtZW50cyk7XG4gIH1cblxuICBzYWRkKGtleTogc3RyaW5nLCAuLi5tZW1iZXJzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJTQUREXCIsIGtleSwgLi4ubWVtYmVycyk7XG4gIH1cblxuICBzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIlNBVkVcIik7XG4gIH1cblxuICBzY2FyZChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJTQ0FSRFwiLCBrZXkpO1xuICB9XG5cbiAgc2NyaXB0RGVidWcobW9kZTogU2NyaXB0RGVidWdNb2RlKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU0NSSVBUXCIsIFwiREVCVUdcIiwgbW9kZSk7XG4gIH1cblxuICBzY3JpcHRFeGlzdHMoLi4uc2hhMXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8SW50ZWdlcj4oXCJTQ1JJUFRcIiwgXCJFWElTVFNcIiwgLi4uc2hhMXMpO1xuICB9XG5cbiAgc2NyaXB0Rmx1c2goKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU0NSSVBUXCIsIFwiRkxVU0hcIik7XG4gIH1cblxuICBzY3JpcHRLaWxsKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIlNDUklQVFwiLCBcIktJTExcIik7XG4gIH1cblxuICBzY3JpcHRMb2FkKHNjcmlwdDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU0NSSVBUXCIsIFwiTE9BRFwiLCBzY3JpcHQpO1xuICB9XG5cbiAgc2RpZmYoLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlNESUZGXCIsIC4uLmtleXMpO1xuICB9XG5cbiAgc2RpZmZzdG9yZShkZXN0aW5hdGlvbjogc3RyaW5nLCAuLi5rZXlzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJTRElGRlNUT1JFXCIsIGRlc3RpbmF0aW9uLCAuLi5rZXlzKTtcbiAgfVxuXG4gIHNlbGVjdChpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU0VMRUNUXCIsIGluZGV4KTtcbiAgfVxuXG4gIHNldChcbiAgICBrZXk6IHN0cmluZyxcbiAgICB2YWx1ZTogUmVkaXNWYWx1ZSxcbiAgICBvcHRzPzogU2V0T3B0cyxcbiAgKTogUHJvbWlzZTxTaW1wbGVTdHJpbmc+O1xuICBzZXQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgdmFsdWU6IFJlZGlzVmFsdWUsXG4gICAgb3B0cz86IFNldFdpdGhNb2RlT3B0cyxcbiAgKTogUHJvbWlzZTxTaW1wbGVTdHJpbmcgfCBCdWxrTmlsPjtcbiAgc2V0KFxuICAgIGtleTogc3RyaW5nLFxuICAgIHZhbHVlOiBSZWRpc1ZhbHVlLFxuICAgIG9wdHM/OiBTZXRPcHRzIHwgU2V0V2l0aE1vZGVPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzOiBSZWRpc1ZhbHVlW10gPSBba2V5LCB2YWx1ZV07XG4gICAgaWYgKG9wdHM/LmV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaChcIkVYXCIsIG9wdHMuZXgpO1xuICAgIH0gZWxzZSBpZiAob3B0cz8ucHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKFwiUFhcIiwgb3B0cy5weCk7XG4gICAgfVxuICAgIGlmIChvcHRzPy5rZWVwdHRsKSB7XG4gICAgICBhcmdzLnB1c2goXCJLRUVQVFRMXCIpO1xuICAgIH1cbiAgICBpZiAoKG9wdHMgYXMgU2V0V2l0aE1vZGVPcHRzKT8ubW9kZSkge1xuICAgICAgYXJncy5wdXNoKChvcHRzIGFzIFNldFdpdGhNb2RlT3B0cykubW9kZSk7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzT3JOaWxSZXBseShcIlNFVFwiLCAuLi5hcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU0VUXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgc2V0Yml0KGtleTogc3RyaW5nLCBvZmZzZXQ6IG51bWJlciwgdmFsdWU6IFJlZGlzVmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiU0VUQklUXCIsIGtleSwgb2Zmc2V0LCB2YWx1ZSk7XG4gIH1cblxuICBzZXRleChrZXk6IHN0cmluZywgc2Vjb25kczogbnVtYmVyLCB2YWx1ZTogUmVkaXNWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIlNFVEVYXCIsIGtleSwgc2Vjb25kcywgdmFsdWUpO1xuICB9XG5cbiAgc2V0bngoa2V5OiBzdHJpbmcsIHZhbHVlOiBSZWRpc1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlNFVE5YXCIsIGtleSwgdmFsdWUpO1xuICB9XG5cbiAgc2V0cmFuZ2Uoa2V5OiBzdHJpbmcsIG9mZnNldDogbnVtYmVyLCB2YWx1ZTogUmVkaXNWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJTRVRSQU5HRVwiLCBrZXksIG9mZnNldCwgdmFsdWUpO1xuICB9XG5cbiAgc2h1dGRvd24obW9kZT86IFNodXRkb3duTW9kZSkge1xuICAgIGlmIChtb2RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJTSFVURE9XTlwiLCBtb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU0hVVERPV05cIik7XG4gIH1cblxuICBzaW50ZXIoLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlNJTlRFUlwiLCAuLi5rZXlzKTtcbiAgfVxuXG4gIHNpbnRlcnN0b3JlKGRlc3RpbmF0aW9uOiBzdHJpbmcsIC4uLmtleXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlNJTlRFUlNUT1JFXCIsIGRlc3RpbmF0aW9uLCAuLi5rZXlzKTtcbiAgfVxuXG4gIHNpc21lbWJlcihrZXk6IHN0cmluZywgbWVtYmVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiU0lTTUVNQkVSXCIsIGtleSwgbWVtYmVyKTtcbiAgfVxuXG4gIHNsYXZlb2YoaG9zdDogc3RyaW5nLCBwb3J0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJTTEFWRU9GXCIsIGhvc3QsIHBvcnQpO1xuICB9XG5cbiAgc2xhdmVvZk5vT25lKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcIlNMQVZFT0ZcIiwgXCJOTyBPTkVcIik7XG4gIH1cblxuICByZXBsaWNhb2YoaG9zdDogc3RyaW5nLCBwb3J0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJSRVBMSUNBT0ZcIiwgaG9zdCwgcG9ydCk7XG4gIH1cblxuICByZXBsaWNhb2ZOb09uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJSRVBMSUNBT0ZcIiwgXCJOTyBPTkVcIik7XG4gIH1cblxuICBzbG93bG9nKHN1YmNvbW1hbmQ6IHN0cmluZywgLi4uYXJnczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIlNMT1dMT0dcIiwgc3ViY29tbWFuZCwgLi4uYXJncyk7XG4gIH1cblxuICBzbWVtYmVycyhrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiU01FTUJFUlNcIiwga2V5KTtcbiAgfVxuXG4gIHNtb3ZlKHNvdXJjZTogc3RyaW5nLCBkZXN0aW5hdGlvbjogc3RyaW5nLCBtZW1iZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJTTU9WRVwiLCBzb3VyY2UsIGRlc3RpbmF0aW9uLCBtZW1iZXIpO1xuICB9XG5cbiAgc29ydChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBvcHRzPzogU29ydE9wdHMsXG4gICk6IFByb21pc2U8QnVsa1N0cmluZ1tdPjtcbiAgc29ydChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBvcHRzPzogU29ydFdpdGhEZXN0aW5hdGlvbk9wdHMsXG4gICk6IFByb21pc2U8SW50ZWdlcj47XG4gIHNvcnQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgb3B0cz86IFNvcnRPcHRzIHwgU29ydFdpdGhEZXN0aW5hdGlvbk9wdHMsXG4gICkge1xuICAgIGNvbnN0IGFyZ3M6IChudW1iZXIgfCBzdHJpbmcpW10gPSBba2V5XTtcbiAgICBpZiAob3B0cz8uYnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKFwiQllcIiwgb3B0cy5ieSk7XG4gICAgfVxuICAgIGlmIChvcHRzPy5saW1pdCkge1xuICAgICAgYXJncy5wdXNoKFwiTElNSVRcIiwgb3B0cy5saW1pdC5vZmZzZXQsIG9wdHMubGltaXQuY291bnQpO1xuICAgIH1cbiAgICBpZiAob3B0cz8ucGF0dGVybnMpIHtcbiAgICAgIGFyZ3MucHVzaChcIkdFVFwiLCAuLi5vcHRzLnBhdHRlcm5zKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/Lm9yZGVyKSB7XG4gICAgICBhcmdzLnB1c2gob3B0cy5vcmRlcik7XG4gICAgfVxuICAgIGlmIChvcHRzPy5hbHBoYSkge1xuICAgICAgYXJncy5wdXNoKFwiQUxQSEFcIik7XG4gICAgfVxuICAgIGlmICgob3B0cyBhcyBTb3J0V2l0aERlc3RpbmF0aW9uT3B0cyk/LmRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaChcIlNUT1JFXCIsIChvcHRzIGFzIFNvcnRXaXRoRGVzdGluYXRpb25PcHRzKS5kZXN0aW5hdGlvbik7XG4gICAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiU09SVFwiLCAuLi5hcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJTT1JUXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgc3BvcChrZXk6IHN0cmluZyk6IFByb21pc2U8QnVsaz47XG4gIHNwb3Aoa2V5OiBzdHJpbmcsIGNvdW50OiBudW1iZXIpOiBQcm9taXNlPEJ1bGtTdHJpbmdbXT47XG4gIHNwb3Aoa2V5OiBzdHJpbmcsIGNvdW50PzogbnVtYmVyKSB7XG4gICAgaWYgKGNvdW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiU1BPUFwiLCBrZXksIGNvdW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIlNQT1BcIiwga2V5KTtcbiAgfVxuXG4gIHNyYW5kbWVtYmVyKGtleTogc3RyaW5nKTogUHJvbWlzZTxCdWxrPjtcbiAgc3JhbmRtZW1iZXIoa2V5OiBzdHJpbmcsIGNvdW50OiBudW1iZXIpOiBQcm9taXNlPEJ1bGtTdHJpbmdbXT47XG4gIHNyYW5kbWVtYmVyKGtleTogc3RyaW5nLCBjb3VudD86IG51bWJlcikge1xuICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlNSQU5ETUVNQkVSXCIsIGtleSwgY291bnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5KFwiU1JBTkRNRU1CRVJcIiwga2V5KTtcbiAgfVxuXG4gIHNyZW0oa2V5OiBzdHJpbmcsIC4uLm1lbWJlcnM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlNSRU1cIiwga2V5LCAuLi5tZW1iZXJzKTtcbiAgfVxuXG4gIHN0cmFsZ28oXG4gICAgYWxnb3JpdGhtOiBTdHJhbGdvQWxnb3JpdGhtLFxuICAgIHRhcmdldDogU3RyYWxnb1RhcmdldCxcbiAgICBhOiBzdHJpbmcsXG4gICAgYjogc3RyaW5nLFxuICApOiBQcm9taXNlPEJ1bGs+O1xuXG4gIHN0cmFsZ28oXG4gICAgYWxnb3JpdGhtOiBTdHJhbGdvQWxnb3JpdGhtLFxuICAgIHRhcmdldDogU3RyYWxnb1RhcmdldCxcbiAgICBhOiBzdHJpbmcsXG4gICAgYjogc3RyaW5nLFxuICAgIG9wdHM/OiB7IGxlbjogdHJ1ZSB9LFxuICApOiBQcm9taXNlPEludGVnZXI+O1xuXG4gIHN0cmFsZ28oXG4gICAgYWxnb3JpdGhtOiBTdHJhbGdvQWxnb3JpdGhtLFxuICAgIHRhcmdldDogU3RyYWxnb1RhcmdldCxcbiAgICBhOiBzdHJpbmcsXG4gICAgYjogc3RyaW5nLFxuICAgIG9wdHM/OiB7IGlkeDogdHJ1ZSB9LFxuICApOiBQcm9taXNlPFxuICAgIFtcbiAgICAgIHN0cmluZywgLy9gXCJtYXRjaGVzXCJgXG4gICAgICBBcnJheTxbW251bWJlciwgbnVtYmVyXSwgW251bWJlciwgbnVtYmVyXV0+LFxuICAgICAgc3RyaW5nLCAvLyBgXCJsZW5cImBcbiAgICAgIEludGVnZXIsXG4gICAgXVxuICA+O1xuXG4gIHN0cmFsZ28oXG4gICAgYWxnb3JpdGhtOiBTdHJhbGdvQWxnb3JpdGhtLFxuICAgIHRhcmdldDogU3RyYWxnb1RhcmdldCxcbiAgICBhOiBzdHJpbmcsXG4gICAgYjogc3RyaW5nLFxuICAgIG9wdHM/OiB7IGlkeDogdHJ1ZTsgd2l0aG1hdGNobGVuOiB0cnVlIH0sXG4gICk6IFByb21pc2U8XG4gICAgW1xuICAgICAgc3RyaW5nLCAvLyBgXCJtYXRjaGVzXCJgXG4gICAgICBBcnJheTxbW251bWJlciwgbnVtYmVyXSwgW251bWJlciwgbnVtYmVyXSwgbnVtYmVyXT4sXG4gICAgICBzdHJpbmcsIC8vIGBcImxlblwiYFxuICAgICAgSW50ZWdlcixcbiAgICBdXG4gID47XG5cbiAgc3RyYWxnbyhcbiAgICBhbGdvcml0aG06IFN0cmFsZ29BbGdvcml0aG0sXG4gICAgdGFyZ2V0OiBTdHJhbGdvVGFyZ2V0LFxuICAgIGE6IHN0cmluZyxcbiAgICBiOiBzdHJpbmcsXG4gICAgb3B0cz86IFN0cmFsZ29PcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzOiAobnVtYmVyIHwgc3RyaW5nKVtdID0gW107XG4gICAgaWYgKG9wdHM/LmlkeCkge1xuICAgICAgYXJncy5wdXNoKFwiSURYXCIpO1xuICAgIH1cbiAgICBpZiAob3B0cz8ubGVuKSB7XG4gICAgICBhcmdzLnB1c2goXCJMRU5cIik7XG4gICAgfVxuICAgIGlmIChvcHRzPy53aXRobWF0Y2hsZW4pIHtcbiAgICAgIGFyZ3MucHVzaChcIldJVEhNQVRDSExFTlwiKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/Lm1pbm1hdGNobGVuKSB7XG4gICAgICBhcmdzLnB1c2goXCJNSU5NQVRDSExFTlwiKTtcbiAgICAgIGFyZ3MucHVzaChvcHRzLm1pbm1hdGNobGVuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY1JlcGx5PEJ1bGsgfCBJbnRlZ2VyIHwgQ29uZGl0aW9uYWxBcnJheT4oXG4gICAgICBcIlNUUkFMR09cIixcbiAgICAgIGFsZ29yaXRobSxcbiAgICAgIHRhcmdldCxcbiAgICAgIGEsXG4gICAgICBiLFxuICAgICAgLi4uYXJncyxcbiAgICApO1xuICB9XG5cbiAgc3RybGVuKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlNUUkxFTlwiLCBrZXkpO1xuICB9XG5cbiAgc3VuaW9uKC4uLmtleXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJTVU5JT05cIiwgLi4ua2V5cyk7XG4gIH1cblxuICBzdW5pb25zdG9yZShkZXN0aW5hdGlvbjogc3RyaW5nLCAuLi5rZXlzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJTVU5JT05TVE9SRVwiLCBkZXN0aW5hdGlvbiwgLi4ua2V5cyk7XG4gIH1cblxuICBzd2FwZGIoaW5kZXgxOiBudW1iZXIsIGluZGV4MjogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiU1dBUERCXCIsIGluZGV4MSwgaW5kZXgyKTtcbiAgfVxuXG4gIHN5bmMoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgdGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIlRJTUVcIikgYXMgUHJvbWlzZTxbQnVsa1N0cmluZywgQnVsa1N0cmluZ10+O1xuICB9XG5cbiAgdG91Y2goLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiVE9VQ0hcIiwgLi4ua2V5cyk7XG4gIH1cblxuICB0dGwoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiVFRMXCIsIGtleSk7XG4gIH1cblxuICB0eXBlKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiVFlQRVwiLCBrZXkpO1xuICB9XG5cbiAgdW5saW5rKC4uLmtleXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlVOTElOS1wiLCAuLi5rZXlzKTtcbiAgfVxuXG4gIHVud2F0Y2goKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFwiVU5XQVRDSFwiKTtcbiAgfVxuXG4gIHdhaXQobnVtcmVwbGljYXM6IG51bWJlciwgdGltZW91dDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIldBSVRcIiwgbnVtcmVwbGljYXMsIHRpbWVvdXQpO1xuICB9XG5cbiAgd2F0Y2goLi4ua2V5czogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjU3RhdHVzUmVwbHkoXCJXQVRDSFwiLCAuLi5rZXlzKTtcbiAgfVxuXG4gIHhhY2soa2V5OiBzdHJpbmcsIGdyb3VwOiBzdHJpbmcsIC4uLnhpZHM6IFhJZElucHV0W10pIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFxuICAgICAgXCJYQUNLXCIsXG4gICAgICBrZXksXG4gICAgICBncm91cCxcbiAgICAgIC4uLnhpZHMubWFwKCh4aWQpID0+IHhpZHN0cih4aWQpKSxcbiAgICApO1xuICB9XG5cbiAgeGFkZChcbiAgICBrZXk6IHN0cmluZyxcbiAgICB4aWQ6IFhJZEFkZCxcbiAgICBmaWVsZFZhbHVlczogWEFkZEZpZWxkVmFsdWVzLFxuICAgIG1heGxlbjogWE1heGxlbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgKSB7XG4gICAgY29uc3QgYXJnczogUmVkaXNWYWx1ZVtdID0gW2tleV07XG5cbiAgICBpZiAobWF4bGVuKSB7XG4gICAgICBhcmdzLnB1c2goXCJNQVhMRU5cIik7XG4gICAgICBpZiAobWF4bGVuLmFwcHJveCkge1xuICAgICAgICBhcmdzLnB1c2goXCJ+XCIpO1xuICAgICAgfVxuICAgICAgYXJncy5wdXNoKG1heGxlbi5lbGVtZW50cy50b1N0cmluZygpKTtcbiAgICB9XG5cbiAgICBhcmdzLnB1c2goeGlkc3RyKHhpZCkpO1xuXG4gICAgaWYgKGZpZWxkVmFsdWVzIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICBmb3IgKGNvbnN0IFtmLCB2XSBvZiBmaWVsZFZhbHVlcykge1xuICAgICAgICBhcmdzLnB1c2goZik7XG4gICAgICAgIGFyZ3MucHVzaCh2KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBbZiwgdl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRWYWx1ZXMpKSB7XG4gICAgICAgIGFyZ3MucHVzaChmKTtcbiAgICAgICAgYXJncy5wdXNoKHYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHk8QnVsa1N0cmluZz4oXG4gICAgICBcIlhBRERcIixcbiAgICAgIC4uLmFyZ3MsXG4gICAgKS50aGVuKChyYXdJZCkgPT4gcGFyc2VYSWQocmF3SWQpKTtcbiAgfVxuXG4gIHhjbGFpbShrZXk6IHN0cmluZywgb3B0czogWENsYWltT3B0cywgLi4ueGlkczogWElkSW5wdXRbXSkge1xuICAgIGNvbnN0IGFyZ3MgPSBbXTtcbiAgICBpZiAob3B0cy5pZGxlKSB7XG4gICAgICBhcmdzLnB1c2goXCJJRExFXCIpO1xuICAgICAgYXJncy5wdXNoKG9wdHMuaWRsZSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMudGltZSkge1xuICAgICAgYXJncy5wdXNoKFwiVElNRVwiKTtcbiAgICAgIGFyZ3MucHVzaChvcHRzLnRpbWUpO1xuICAgIH1cblxuICAgIGlmIChvcHRzLnJldHJ5Q291bnQpIHtcbiAgICAgIGFyZ3MucHVzaChcIlJFVFJZQ09VTlRcIik7XG4gICAgICBhcmdzLnB1c2gob3B0cy5yZXRyeUNvdW50KTtcbiAgICB9XG5cbiAgICBpZiAob3B0cy5mb3JjZSkge1xuICAgICAgYXJncy5wdXNoKFwiRk9SQ0VcIik7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuanVzdFhJZCkge1xuICAgICAgYXJncy5wdXNoKFwiSlVTVElEXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PFhSZWFkSWREYXRhIHwgQnVsa1N0cmluZz4oXG4gICAgICBcIlhDTEFJTVwiLFxuICAgICAga2V5LFxuICAgICAgb3B0cy5ncm91cCxcbiAgICAgIG9wdHMuY29uc3VtZXIsXG4gICAgICBvcHRzLm1pbklkbGVUaW1lLFxuICAgICAgLi4ueGlkcy5tYXAoKHhpZCkgPT4geGlkc3RyKHhpZCkpLFxuICAgICAgLi4uYXJncyxcbiAgICApLnRoZW4oKHJhdykgPT4ge1xuICAgICAgaWYgKG9wdHMuanVzdFhJZCkge1xuICAgICAgICBjb25zdCB4aWRzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgciBvZiByYXcpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHhpZHMucHVzaChwYXJzZVhJZChyKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBheWxvYWQ6IFhDbGFpbUp1c3RYSWQgPSB7IGtpbmQ6IFwianVzdHhpZFwiLCB4aWRzIH07XG4gICAgICAgIHJldHVybiBwYXlsb2FkO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtZXNzYWdlcyA9IFtdO1xuICAgICAgZm9yIChjb25zdCByIG9mIHJhdykge1xuICAgICAgICBpZiAodHlwZW9mIHIgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBtZXNzYWdlcy5wdXNoKHBhcnNlWE1lc3NhZ2UocikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBwYXlsb2FkOiBYQ2xhaW1NZXNzYWdlcyA9IHsga2luZDogXCJtZXNzYWdlc1wiLCBtZXNzYWdlcyB9O1xuICAgICAgcmV0dXJuIHBheWxvYWQ7XG4gICAgfSk7XG4gIH1cblxuICB4ZGVsKGtleTogc3RyaW5nLCAuLi54aWRzOiBYSWRJbnB1dFtdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcbiAgICAgIFwiWERFTFwiLFxuICAgICAga2V5LFxuICAgICAgLi4ueGlkcy5tYXAoKHJhd0lkKSA9PiB4aWRzdHIocmF3SWQpKSxcbiAgICApO1xuICB9XG5cbiAgeGxlbihrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJYTEVOXCIsIGtleSk7XG4gIH1cblxuICB4Z3JvdXBDcmVhdGUoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgZ3JvdXBOYW1lOiBzdHJpbmcsXG4gICAgeGlkOiBYSWRJbnB1dCB8IFwiJFwiLFxuICAgIG1rc3RyZWFtPzogYm9vbGVhbixcbiAgKSB7XG4gICAgY29uc3QgYXJncyA9IFtdO1xuICAgIGlmIChta3N0cmVhbSkge1xuICAgICAgYXJncy5wdXNoKFwiTUtTVFJFQU1cIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZXhlY1N0YXR1c1JlcGx5KFxuICAgICAgXCJYR1JPVVBcIixcbiAgICAgIFwiQ1JFQVRFXCIsXG4gICAgICBrZXksXG4gICAgICBncm91cE5hbWUsXG4gICAgICB4aWRzdHIoeGlkKSxcbiAgICAgIC4uLmFyZ3MsXG4gICAgKTtcbiAgfVxuXG4gIHhncm91cERlbENvbnN1bWVyKFxuICAgIGtleTogc3RyaW5nLFxuICAgIGdyb3VwTmFtZTogc3RyaW5nLFxuICAgIGNvbnN1bWVyTmFtZTogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFxuICAgICAgXCJYR1JPVVBcIixcbiAgICAgIFwiREVMQ09OU1VNRVJcIixcbiAgICAgIGtleSxcbiAgICAgIGdyb3VwTmFtZSxcbiAgICAgIGNvbnN1bWVyTmFtZSxcbiAgICApO1xuICB9XG5cbiAgeGdyb3VwRGVzdHJveShrZXk6IHN0cmluZywgZ3JvdXBOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiWEdST1VQXCIsIFwiREVTVFJPWVwiLCBrZXksIGdyb3VwTmFtZSk7XG4gIH1cblxuICB4Z3JvdXBIZWxwKCkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNCdWxrUmVwbHk8QnVsa1N0cmluZz4oXCJYR1JPVVBcIiwgXCJIRUxQXCIpO1xuICB9XG5cbiAgeGdyb3VwU2V0SUQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgZ3JvdXBOYW1lOiBzdHJpbmcsXG4gICAgeGlkOiBYSWQsXG4gICkge1xuICAgIHJldHVybiB0aGlzLmV4ZWNTdGF0dXNSZXBseShcbiAgICAgIFwiWEdST1VQXCIsXG4gICAgICBcIlNFVElEXCIsXG4gICAgICBrZXksXG4gICAgICBncm91cE5hbWUsXG4gICAgICB4aWRzdHIoeGlkKSxcbiAgICApO1xuICB9XG5cbiAgeGluZm9TdHJlYW0oa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxSYXc+KFwiWElORk9cIiwgXCJTVFJFQU1cIiwga2V5KS50aGVuKFxuICAgICAgKHJhdykgPT4ge1xuICAgICAgICAvLyBOb3RlIHRoYXQgeW91IHNob3VsZCBub3QgcmVseSBvbiB0aGUgZmllbGRzXG4gICAgICAgIC8vIGV4YWN0IHBvc2l0aW9uLCBub3Igb24gdGhlIG51bWJlciBvZiBmaWVsZHMsXG4gICAgICAgIC8vIG5ldyBmaWVsZHMgbWF5IGJlIGFkZGVkIGluIHRoZSBmdXR1cmUuXG4gICAgICAgIGNvbnN0IGRhdGE6IE1hcDxzdHJpbmcsIFJhdz4gPSBjb252ZXJ0TWFwKHJhdyk7XG5cbiAgICAgICAgY29uc3QgZmlyc3RFbnRyeSA9IHBhcnNlWE1lc3NhZ2UoXG4gICAgICAgICAgZGF0YS5nZXQoXCJmaXJzdC1lbnRyeVwiKSBhcyBYUmVhZElkRGF0YSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgbGFzdEVudHJ5ID0gcGFyc2VYTWVzc2FnZShcbiAgICAgICAgICBkYXRhLmdldChcImxhc3QtZW50cnlcIikgYXMgWFJlYWRJZERhdGEsXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsZW5ndGg6IHJhd251bShkYXRhLmdldChcImxlbmd0aFwiKSA/PyBudWxsKSxcbiAgICAgICAgICByYWRpeFRyZWVLZXlzOiByYXdudW0oZGF0YS5nZXQoXCJyYWRpeC10cmVlLWtleXNcIikgPz8gbnVsbCksXG4gICAgICAgICAgcmFkaXhUcmVlTm9kZXM6IHJhd251bShkYXRhLmdldChcInJhZGl4LXRyZWUtbm9kZXNcIikgPz8gbnVsbCksXG4gICAgICAgICAgZ3JvdXBzOiByYXdudW0oZGF0YS5nZXQoXCJncm91cHNcIikgPz8gbnVsbCksXG4gICAgICAgICAgbGFzdEdlbmVyYXRlZElkOiBwYXJzZVhJZChcbiAgICAgICAgICAgIHJhd3N0cihkYXRhLmdldChcImxhc3QtZ2VuZXJhdGVkLWlkXCIpID8/IG51bGwpLFxuICAgICAgICAgICksXG4gICAgICAgICAgZmlyc3RFbnRyeSxcbiAgICAgICAgICBsYXN0RW50cnksXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICB4aW5mb1N0cmVhbUZ1bGwoa2V5OiBzdHJpbmcsIGNvdW50PzogbnVtYmVyKSB7XG4gICAgY29uc3QgYXJncyA9IFtdO1xuICAgIGlmIChjb3VudCkge1xuICAgICAgYXJncy5wdXNoKFwiQ09VTlRcIik7XG4gICAgICBhcmdzLnB1c2goY291bnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxSYXc+KFwiWElORk9cIiwgXCJTVFJFQU1cIiwga2V5LCBcIkZVTExcIiwgLi4uYXJncylcbiAgICAgIC50aGVuKFxuICAgICAgICAocmF3KSA9PiB7XG4gICAgICAgICAgLy8gTm90ZSB0aGF0IHlvdSBzaG91bGQgbm90IHJlbHkgb24gdGhlIGZpZWxkc1xuICAgICAgICAgIC8vIGV4YWN0IHBvc2l0aW9uLCBub3Igb24gdGhlIG51bWJlciBvZiBmaWVsZHMsXG4gICAgICAgICAgLy8gbmV3IGZpZWxkcyBtYXkgYmUgYWRkZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgICAgICBpZiAocmF3ID09IG51bGwpIHRocm93IFwibm8gZGF0YVwiO1xuXG4gICAgICAgICAgY29uc3QgZGF0YTogTWFwPHN0cmluZywgUmF3PiA9IGNvbnZlcnRNYXAocmF3KTtcbiAgICAgICAgICBpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBcIm5vIGRhdGEgY29udmVydGVkXCI7XG5cbiAgICAgICAgICBjb25zdCBlbnRyaWVzID0gKGRhdGEuZ2V0KFwiZW50cmllc1wiKSBhcyBDb25kaXRpb25hbEFycmF5KS5tYXAoKFxuICAgICAgICAgICAgcmF3OiBSYXcsXG4gICAgICAgICAgKSA9PiBwYXJzZVhNZXNzYWdlKHJhdyBhcyBYUmVhZElkRGF0YSkpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsZW5ndGg6IHJhd251bShkYXRhLmdldChcImxlbmd0aFwiKSA/PyBudWxsKSxcbiAgICAgICAgICAgIHJhZGl4VHJlZUtleXM6IHJhd251bShkYXRhLmdldChcInJhZGl4LXRyZWUta2V5c1wiKSA/PyBudWxsKSxcbiAgICAgICAgICAgIHJhZGl4VHJlZU5vZGVzOiByYXdudW0oZGF0YS5nZXQoXCJyYWRpeC10cmVlLW5vZGVzXCIpID8/IG51bGwpLFxuICAgICAgICAgICAgbGFzdEdlbmVyYXRlZElkOiBwYXJzZVhJZChcbiAgICAgICAgICAgICAgcmF3c3RyKGRhdGEuZ2V0KFwibGFzdC1nZW5lcmF0ZWQtaWRcIikgPz8gbnVsbCksXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgZW50cmllcyxcbiAgICAgICAgICAgIGdyb3VwczogcGFyc2VYR3JvdXBEZXRhaWwoZGF0YS5nZXQoXCJncm91cHNcIikgYXMgQ29uZGl0aW9uYWxBcnJheSksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gIH1cblxuICB4aW5mb0dyb3VwcyhrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PENvbmRpdGlvbmFsQXJyYXk+KFwiWElORk9cIiwgXCJHUk9VUFNcIiwga2V5KS50aGVuKFxuICAgICAgKHJhd3MpID0+XG4gICAgICAgIHJhd3MubWFwKChyYXcpID0+IHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gY29udmVydE1hcChyYXcpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiByYXdzdHIoZGF0YS5nZXQoXCJuYW1lXCIpID8/IG51bGwpLFxuICAgICAgICAgICAgY29uc3VtZXJzOiByYXdudW0oZGF0YS5nZXQoXCJjb25zdW1lcnNcIikgPz8gbnVsbCksXG4gICAgICAgICAgICBwZW5kaW5nOiByYXdudW0oZGF0YS5nZXQoXCJwZW5kaW5nXCIpID8/IG51bGwpLFxuICAgICAgICAgICAgbGFzdERlbGl2ZXJlZElkOiBwYXJzZVhJZChcbiAgICAgICAgICAgICAgcmF3c3RyKGRhdGEuZ2V0KFwibGFzdC1kZWxpdmVyZWQtaWRcIikgPz8gbnVsbCksXG4gICAgICAgICAgICApLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICB4aW5mb0NvbnN1bWVycyhrZXk6IHN0cmluZywgZ3JvdXA6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PENvbmRpdGlvbmFsQXJyYXk+KFxuICAgICAgXCJYSU5GT1wiLFxuICAgICAgXCJDT05TVU1FUlNcIixcbiAgICAgIGtleSxcbiAgICAgIGdyb3VwLFxuICAgICkudGhlbihcbiAgICAgIChyYXdzKSA9PlxuICAgICAgICByYXdzLm1hcCgocmF3KSA9PiB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGNvbnZlcnRNYXAocmF3KTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogcmF3c3RyKGRhdGEuZ2V0KFwibmFtZVwiKSA/PyBudWxsKSxcbiAgICAgICAgICAgIHBlbmRpbmc6IHJhd251bShkYXRhLmdldChcInBlbmRpbmdcIikgPz8gbnVsbCksXG4gICAgICAgICAgICBpZGxlOiByYXdudW0oZGF0YS5nZXQoXCJpZGxlXCIpID8/IG51bGwpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICB4cGVuZGluZyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICBncm91cDogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxSYXc+KFwiWFBFTkRJTkdcIiwga2V5LCBncm91cClcbiAgICAgIC50aGVuKChyYXcpID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGlzTnVtYmVyKHJhd1swXSkgJiYgaXNTdHJpbmcocmF3WzFdKSAmJlxuICAgICAgICAgIGlzU3RyaW5nKHJhd1syXSkgJiYgaXNDb25kQXJyYXkocmF3WzNdKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY291bnQ6IHJhd1swXSxcbiAgICAgICAgICAgIHN0YXJ0SWQ6IHBhcnNlWElkKHJhd1sxXSksXG4gICAgICAgICAgICBlbmRJZDogcGFyc2VYSWQocmF3WzJdKSxcbiAgICAgICAgICAgIGNvbnN1bWVyczogcGFyc2VYUGVuZGluZ0NvbnN1bWVycyhyYXdbM10pLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgXCJwYXJzZSBlcnJcIjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICB4cGVuZGluZ0NvdW50KFxuICAgIGtleTogc3RyaW5nLFxuICAgIGdyb3VwOiBzdHJpbmcsXG4gICAgc3RhcnRFbmRDb3VudDogU3RhcnRFbmRDb3VudCxcbiAgICBjb25zdW1lcj86IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgYXJncyA9IFtdO1xuICAgIGFyZ3MucHVzaChzdGFydEVuZENvdW50LnN0YXJ0KTtcbiAgICBhcmdzLnB1c2goc3RhcnRFbmRDb3VudC5lbmQpO1xuICAgIGFyZ3MucHVzaChzdGFydEVuZENvdW50LmNvdW50KTtcblxuICAgIGlmIChjb25zdW1lcikge1xuICAgICAgYXJncy5wdXNoKGNvbnN1bWVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxSYXc+KFwiWFBFTkRJTkdcIiwga2V5LCBncm91cCwgLi4uYXJncylcbiAgICAgIC50aGVuKChyYXcpID0+IHBhcnNlWFBlbmRpbmdDb3VudHMocmF3KSk7XG4gIH1cblxuICB4cmFuZ2UoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgc3RhcnQ6IFhJZE5lZyxcbiAgICBlbmQ6IFhJZFBvcyxcbiAgICBjb3VudD86IG51bWJlcixcbiAgKSB7XG4gICAgY29uc3QgYXJnczogKHN0cmluZyB8IG51bWJlcilbXSA9IFtrZXksIHhpZHN0cihzdGFydCksIHhpZHN0cihlbmQpXTtcbiAgICBpZiAoY291bnQpIHtcbiAgICAgIGFyZ3MucHVzaChcIkNPVU5UXCIpO1xuICAgICAgYXJncy5wdXNoKGNvdW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8WFJlYWRJZERhdGE+KFwiWFJBTkdFXCIsIC4uLmFyZ3MpLnRoZW4oXG4gICAgICAocmF3KSA9PiByYXcubWFwKChtKSA9PiBwYXJzZVhNZXNzYWdlKG0pKSxcbiAgICApO1xuICB9XG5cbiAgeHJldnJhbmdlKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHN0YXJ0OiBYSWRQb3MsXG4gICAgZW5kOiBYSWROZWcsXG4gICAgY291bnQ/OiBudW1iZXIsXG4gICkge1xuICAgIGNvbnN0IGFyZ3M6IChzdHJpbmcgfCBudW1iZXIpW10gPSBba2V5LCB4aWRzdHIoc3RhcnQpLCB4aWRzdHIoZW5kKV07XG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBhcmdzLnB1c2goXCJDT1VOVFwiKTtcbiAgICAgIGFyZ3MucHVzaChjb3VudCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PFhSZWFkSWREYXRhPihcIlhSRVZSQU5HRVwiLCAuLi5hcmdzKS50aGVuKFxuICAgICAgKHJhdykgPT4gcmF3Lm1hcCgobSkgPT4gcGFyc2VYTWVzc2FnZShtKSksXG4gICAgKTtcbiAgfVxuXG4gIHhyZWFkKFxuICAgIGtleVhJZHM6IChYS2V5SWQgfCBYS2V5SWRMaWtlKVtdLFxuICAgIG9wdHM/OiBYUmVhZE9wdHMsXG4gICkge1xuICAgIGNvbnN0IGFyZ3MgPSBbXTtcbiAgICBpZiAob3B0cykge1xuICAgICAgaWYgKG9wdHMuY291bnQpIHtcbiAgICAgICAgYXJncy5wdXNoKFwiQ09VTlRcIik7XG4gICAgICAgIGFyZ3MucHVzaChvcHRzLmNvdW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRzLmJsb2NrKSB7XG4gICAgICAgIGFyZ3MucHVzaChcIkJMT0NLXCIpO1xuICAgICAgICBhcmdzLnB1c2gob3B0cy5ibG9jayk7XG4gICAgICB9XG4gICAgfVxuICAgIGFyZ3MucHVzaChcIlNUUkVBTVNcIik7XG5cbiAgICBjb25zdCB0aGVLZXlzID0gW107XG4gICAgY29uc3QgdGhlWElkcyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBhIG9mIGtleVhJZHMpIHtcbiAgICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgLy8gWEtleUlkTGlrZVxuICAgICAgICB0aGVLZXlzLnB1c2goYVswXSk7XG4gICAgICAgIHRoZVhJZHMucHVzaCh4aWRzdHIoYVsxXSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gWEtleUlkXG4gICAgICAgIHRoZUtleXMucHVzaChhLmtleSk7XG4gICAgICAgIHRoZVhJZHMucHVzaCh4aWRzdHIoYS54aWQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxYUmVhZFN0cmVhbVJhdz4oXG4gICAgICBcIlhSRUFEXCIsXG4gICAgICAuLi5hcmdzLmNvbmNhdCh0aGVLZXlzKS5jb25jYXQodGhlWElkcyksXG4gICAgKS50aGVuKChyYXcpID0+IHBhcnNlWFJlYWRSZXBseShyYXcpKTtcbiAgfVxuXG4gIHhyZWFkZ3JvdXAoXG4gICAga2V5WElkczogKFhLZXlJZEdyb3VwIHwgWEtleUlkR3JvdXBMaWtlKVtdLFxuICAgIHsgZ3JvdXAsIGNvbnN1bWVyLCBjb3VudCwgYmxvY2sgfTogWFJlYWRHcm91cE9wdHMsXG4gICkge1xuICAgIGNvbnN0IGFyZ3M6IChzdHJpbmcgfCBudW1iZXIpW10gPSBbXG4gICAgICBcIkdST1VQXCIsXG4gICAgICBncm91cCxcbiAgICAgIGNvbnN1bWVyLFxuICAgIF07XG5cbiAgICBpZiAoY291bnQpIHtcbiAgICAgIGFyZ3MucHVzaChcIkNPVU5UXCIpO1xuICAgICAgYXJncy5wdXNoKGNvdW50KTtcbiAgICB9XG4gICAgaWYgKGJsb2NrKSB7XG4gICAgICBhcmdzLnB1c2goXCJCTE9DS1wiKTtcbiAgICAgIGFyZ3MucHVzaChibG9jayk7XG4gICAgfVxuXG4gICAgYXJncy5wdXNoKFwiU1RSRUFNU1wiKTtcblxuICAgIGNvbnN0IHRoZUtleXMgPSBbXTtcbiAgICBjb25zdCB0aGVYSWRzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGEgb2Yga2V5WElkcykge1xuICAgICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAvLyBYS2V5SWRHcm91cExpa2VcbiAgICAgICAgdGhlS2V5cy5wdXNoKGFbMF0pO1xuICAgICAgICB0aGVYSWRzLnB1c2goYVsxXSA9PT0gXCI+XCIgPyBcIj5cIiA6IHhpZHN0cihhWzFdKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBYS2V5SWRHcm91cFxuICAgICAgICB0aGVLZXlzLnB1c2goYS5rZXkpO1xuICAgICAgICB0aGVYSWRzLnB1c2goYS54aWQgPT09IFwiPlwiID8gXCI+XCIgOiB4aWRzdHIoYS54aWQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxYUmVhZFN0cmVhbVJhdz4oXG4gICAgICBcIlhSRUFER1JPVVBcIixcbiAgICAgIC4uLmFyZ3MuY29uY2F0KHRoZUtleXMpLmNvbmNhdCh0aGVYSWRzKSxcbiAgICApLnRoZW4oKHJhdykgPT4gcGFyc2VYUmVhZFJlcGx5KHJhdykpO1xuICB9XG5cbiAgeHRyaW0oa2V5OiBzdHJpbmcsIG1heGxlbjogWE1heGxlbikge1xuICAgIGNvbnN0IGFyZ3MgPSBbXTtcbiAgICBpZiAobWF4bGVuLmFwcHJveCkge1xuICAgICAgYXJncy5wdXNoKFwiflwiKTtcbiAgICB9XG5cbiAgICBhcmdzLnB1c2gobWF4bGVuLmVsZW1lbnRzKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJYVFJJTVwiLCBrZXksIFwiTUFYTEVOXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgemFkZChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBzY29yZTogbnVtYmVyLFxuICAgIG1lbWJlcjogc3RyaW5nLFxuICAgIG9wdHM/OiBaQWRkT3B0cyxcbiAgKTogUHJvbWlzZTxJbnRlZ2VyPjtcbiAgemFkZChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBzY29yZU1lbWJlcnM6IFtudW1iZXIsIHN0cmluZ11bXSxcbiAgICBvcHRzPzogWkFkZE9wdHMsXG4gICk6IFByb21pc2U8SW50ZWdlcj47XG4gIHphZGQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgbWVtYmVyU2NvcmVzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+LFxuICAgIG9wdHM/OiBaQWRkT3B0cyxcbiAgKTogUHJvbWlzZTxJbnRlZ2VyPjtcbiAgemFkZChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBwYXJhbTE6IG51bWJlciB8IFtudW1iZXIsIHN0cmluZ11bXSB8IFJlY29yZDxzdHJpbmcsIG51bWJlcj4sXG4gICAgcGFyYW0yPzogc3RyaW5nIHwgWkFkZE9wdHMsXG4gICAgb3B0cz86IFpBZGRPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gW2tleV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW0xKSkge1xuICAgICAgdGhpcy5wdXNoWkFkZE9wdHMoYXJncywgcGFyYW0yIGFzIFpBZGRPcHRzKTtcbiAgICAgIGFyZ3MucHVzaCguLi5wYXJhbTEuZmxhdE1hcCgoZSkgPT4gZSkpO1xuICAgICAgb3B0cyA9IHBhcmFtMiBhcyBaQWRkT3B0cztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbTEgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHRoaXMucHVzaFpBZGRPcHRzKGFyZ3MsIHBhcmFtMiBhcyBaQWRkT3B0cyk7XG4gICAgICBmb3IgKGNvbnN0IFttZW1iZXIsIHNjb3JlXSBvZiBPYmplY3QuZW50cmllcyhwYXJhbTEpKSB7XG4gICAgICAgIGFyZ3MucHVzaChzY29yZSBhcyBudW1iZXIsIG1lbWJlcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHVzaFpBZGRPcHRzKGFyZ3MsIG9wdHMpO1xuICAgICAgYXJncy5wdXNoKHBhcmFtMSwgcGFyYW0yIGFzIHN0cmluZyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJaQUREXCIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgcHJpdmF0ZSBwdXNoWkFkZE9wdHMoXG4gICAgYXJnczogKHN0cmluZyB8IG51bWJlcilbXSxcbiAgICBvcHRzPzogWkFkZE9wdHMsXG4gICk6IHZvaWQge1xuICAgIGlmIChvcHRzPy5tb2RlKSB7XG4gICAgICBhcmdzLnB1c2gob3B0cy5tb2RlKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LmNoKSB7XG4gICAgICBhcmdzLnB1c2goXCJDSFwiKTtcbiAgICB9XG4gIH1cblxuICB6YWRkSW5jcihcbiAgICBrZXk6IHN0cmluZyxcbiAgICBzY29yZTogbnVtYmVyLFxuICAgIG1lbWJlcjogc3RyaW5nLFxuICAgIG9wdHM/OiBaQWRkT3B0cyxcbiAgKSB7XG4gICAgY29uc3QgYXJnczogKHN0cmluZyB8IG51bWJlcilbXSA9IFtrZXldO1xuICAgIHRoaXMucHVzaFpBZGRPcHRzKGFyZ3MsIG9wdHMpO1xuICAgIGFyZ3MucHVzaChcIklOQ1JcIiwgc2NvcmUsIG1lbWJlcik7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseShcIlpBRERcIiwgLi4uYXJncyk7XG4gIH1cblxuICB6Y2FyZChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJaQ0FSRFwiLCBrZXkpO1xuICB9XG5cbiAgemNvdW50KGtleTogc3RyaW5nLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiWkNPVU5UXCIsIGtleSwgbWluLCBtYXgpO1xuICB9XG5cbiAgemluY3JieShrZXk6IHN0cmluZywgaW5jcmVtZW50OiBudW1iZXIsIG1lbWJlcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0J1bGtSZXBseTxCdWxrU3RyaW5nPihcIlpJTkNSQllcIiwga2V5LCBpbmNyZW1lbnQsIG1lbWJlcik7XG4gIH1cblxuICB6aW50ZXIoXG4gICAga2V5czogc3RyaW5nW10gfCBbc3RyaW5nLCBudW1iZXJdW10gfCBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+LFxuICAgIG9wdHM/OiBaSW50ZXJPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoWlN0b3JlQXJncyhbXSwga2V5cywgb3B0cyk7XG4gICAgaWYgKG9wdHM/LndpdGhTY29yZSkge1xuICAgICAgYXJncy5wdXNoKFwiV0lUSFNDT1JFU1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJaSU5URVJcIiwgLi4uYXJncyk7XG4gIH1cblxuICB6aW50ZXJzdG9yZShcbiAgICBkZXN0aW5hdGlvbjogc3RyaW5nLFxuICAgIGtleXM6IHN0cmluZ1tdIHwgW3N0cmluZywgbnVtYmVyXVtdIHwgUmVjb3JkPHN0cmluZywgbnVtYmVyPixcbiAgICBvcHRzPzogWkludGVyc3RvcmVPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoWlN0b3JlQXJncyhbZGVzdGluYXRpb25dLCBrZXlzLCBvcHRzKTtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiWklOVEVSU1RPUkVcIiwgLi4uYXJncyk7XG4gIH1cblxuICB6dW5pb25zdG9yZShcbiAgICBkZXN0aW5hdGlvbjogc3RyaW5nLFxuICAgIGtleXM6IHN0cmluZ1tdIHwgW3N0cmluZywgbnVtYmVyXVtdIHwgUmVjb3JkPHN0cmluZywgbnVtYmVyPixcbiAgICBvcHRzPzogWlVuaW9uc3RvcmVPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoWlN0b3JlQXJncyhbZGVzdGluYXRpb25dLCBrZXlzLCBvcHRzKTtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiWlVOSU9OU1RPUkVcIiwgLi4uYXJncyk7XG4gIH1cblxuICBwcml2YXRlIHB1c2haU3RvcmVBcmdzKFxuICAgIGFyZ3M6IChudW1iZXIgfCBzdHJpbmcpW10sXG4gICAga2V5czogc3RyaW5nW10gfCBbc3RyaW5nLCBudW1iZXJdW10gfCBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+LFxuICAgIG9wdHM/OiBaSW50ZXJzdG9yZU9wdHMgfCBaVW5pb25zdG9yZU9wdHMsXG4gICkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBhcmdzLnB1c2goa2V5cy5sZW5ndGgpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5c1swXSkpIHtcbiAgICAgICAga2V5cyA9IGtleXMgYXMgW3N0cmluZywgbnVtYmVyXVtdO1xuICAgICAgICBhcmdzLnB1c2goLi4ua2V5cy5tYXAoKGUpID0+IGVbMF0pKTtcbiAgICAgICAgYXJncy5wdXNoKFwiV0VJR0hUU1wiKTtcbiAgICAgICAgYXJncy5wdXNoKC4uLmtleXMubWFwKChlKSA9PiBlWzFdKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmdzLnB1c2goLi4uKGtleXMgYXMgc3RyaW5nW10pKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKE9iamVjdC5rZXlzKGtleXMpLmxlbmd0aCk7XG4gICAgICBhcmdzLnB1c2goLi4uT2JqZWN0LmtleXMoa2V5cykpO1xuICAgICAgYXJncy5wdXNoKFwiV0VJR0hUU1wiKTtcbiAgICAgIGFyZ3MucHVzaCguLi5PYmplY3QudmFsdWVzKGtleXMpKTtcbiAgICB9XG4gICAgaWYgKG9wdHM/LmFnZ3JlZ2F0ZSkge1xuICAgICAgYXJncy5wdXNoKFwiQUdHUkVHQVRFXCIsIG9wdHMuYWdncmVnYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICB6bGV4Y291bnQoa2V5OiBzdHJpbmcsIG1pbjogc3RyaW5nLCBtYXg6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJaTEVYQ09VTlRcIiwga2V5LCBtaW4sIG1heCk7XG4gIH1cblxuICB6cG9wbWF4KGtleTogc3RyaW5nLCBjb3VudD86IG51bWJlcikge1xuICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlpQT1BNQVhcIiwga2V5LCBjb3VudCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiWlBPUE1BWFwiLCBrZXkpO1xuICB9XG5cbiAgenBvcG1pbihrZXk6IHN0cmluZywgY291bnQ/OiBudW1iZXIpIHtcbiAgICBpZiAoY291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJaUE9QTUlOXCIsIGtleSwgY291bnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlpQT1BNSU5cIiwga2V5KTtcbiAgfVxuXG4gIHpyYW5nZShcbiAgICBrZXk6IHN0cmluZyxcbiAgICBzdGFydDogbnVtYmVyLFxuICAgIHN0b3A6IG51bWJlcixcbiAgICBvcHRzPzogWlJhbmdlT3B0cyxcbiAgKSB7XG4gICAgY29uc3QgYXJncyA9IHRoaXMucHVzaFpSYW5nZU9wdHMoW2tleSwgc3RhcnQsIHN0b3BdLCBvcHRzKTtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlpSQU5HRVwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHpyYW5nZWJ5bGV4KFxuICAgIGtleTogc3RyaW5nLFxuICAgIG1pbjogc3RyaW5nLFxuICAgIG1heDogc3RyaW5nLFxuICAgIG9wdHM/OiBaUmFuZ2VCeUxleE9wdHMsXG4gICkge1xuICAgIGNvbnN0IGFyZ3MgPSB0aGlzLnB1c2haUmFuZ2VPcHRzKFtrZXksIG1pbiwgbWF4XSwgb3B0cyk7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJaUkFOR0VCWUxFWFwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHpyYW5nZWJ5c2NvcmUoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgbWluOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgbWF4OiBudW1iZXIgfCBzdHJpbmcsXG4gICAgb3B0cz86IFpSYW5nZUJ5U2NvcmVPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoWlJhbmdlT3B0cyhba2V5LCBtaW4sIG1heF0sIG9wdHMpO1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiWlJBTkdFQllTQ09SRVwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHpyYW5rKGtleTogc3RyaW5nLCBtZW1iZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyT3JOaWxSZXBseShcIlpSQU5LXCIsIGtleSwgbWVtYmVyKTtcbiAgfVxuXG4gIHpyZW0oa2V5OiBzdHJpbmcsIC4uLm1lbWJlcnM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0ludGVnZXJSZXBseShcIlpSRU1cIiwga2V5LCAuLi5tZW1iZXJzKTtcbiAgfVxuXG4gIHpyZW1yYW5nZWJ5bGV4KGtleTogc3RyaW5nLCBtaW46IHN0cmluZywgbWF4OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiWlJFTVJBTkdFQllMRVhcIiwga2V5LCBtaW4sIG1heCk7XG4gIH1cblxuICB6cmVtcmFuZ2VieXJhbmsoa2V5OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIHN0b3A6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyUmVwbHkoXCJaUkVNUkFOR0VCWVJBTktcIiwga2V5LCBzdGFydCwgc3RvcCk7XG4gIH1cblxuICB6cmVtcmFuZ2VieXNjb3JlKGtleTogc3RyaW5nLCBtaW46IG51bWJlciB8IHN0cmluZywgbWF4OiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjSW50ZWdlclJlcGx5KFwiWlJFTVJBTkdFQllTQ09SRVwiLCBrZXksIG1pbiwgbWF4KTtcbiAgfVxuXG4gIHpyZXZyYW5nZShcbiAgICBrZXk6IHN0cmluZyxcbiAgICBzdGFydDogbnVtYmVyLFxuICAgIHN0b3A6IG51bWJlcixcbiAgICBvcHRzPzogWlJhbmdlT3B0cyxcbiAgKSB7XG4gICAgY29uc3QgYXJncyA9IHRoaXMucHVzaFpSYW5nZU9wdHMoW2tleSwgc3RhcnQsIHN0b3BdLCBvcHRzKTtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseTxCdWxrU3RyaW5nPihcIlpSRVZSQU5HRVwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHpyZXZyYW5nZWJ5bGV4KFxuICAgIGtleTogc3RyaW5nLFxuICAgIG1heDogc3RyaW5nLFxuICAgIG1pbjogc3RyaW5nLFxuICAgIG9wdHM/OiBaUmFuZ2VCeUxleE9wdHMsXG4gICkge1xuICAgIGNvbnN0IGFyZ3MgPSB0aGlzLnB1c2haUmFuZ2VPcHRzKFtrZXksIG1pbiwgbWF4XSwgb3B0cyk7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHk8QnVsa1N0cmluZz4oXCJaUkVWUkFOR0VCWUxFWFwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHpyZXZyYW5nZWJ5c2NvcmUoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgbWF4OiBudW1iZXIsXG4gICAgbWluOiBudW1iZXIsXG4gICAgb3B0cz86IFpSYW5nZUJ5U2NvcmVPcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoWlJhbmdlT3B0cyhba2V5LCBtYXgsIG1pbl0sIG9wdHMpO1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5PEJ1bGtTdHJpbmc+KFwiWlJFVlJBTkdFQllTQ09SRVwiLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHByaXZhdGUgcHVzaFpSYW5nZU9wdHMoXG4gICAgYXJnczogKG51bWJlciB8IHN0cmluZylbXSxcbiAgICBvcHRzPzogWlJhbmdlT3B0cyB8IFpSYW5nZUJ5TGV4T3B0cyB8IFpSYW5nZUJ5U2NvcmVPcHRzLFxuICApIHtcbiAgICBpZiAoKG9wdHMgYXMgWlJhbmdlQnlTY29yZU9wdHMpPy53aXRoU2NvcmUpIHtcbiAgICAgIGFyZ3MucHVzaChcIldJVEhTQ09SRVNcIik7XG4gICAgfVxuICAgIGlmICgob3B0cyBhcyBaUmFuZ2VCeVNjb3JlT3B0cyk/LmxpbWl0KSB7XG4gICAgICBhcmdzLnB1c2goXG4gICAgICAgIFwiTElNSVRcIixcbiAgICAgICAgKG9wdHMgYXMgWlJhbmdlQnlTY29yZU9wdHMpLmxpbWl0IS5vZmZzZXQsXG4gICAgICAgIChvcHRzIGFzIFpSYW5nZUJ5U2NvcmVPcHRzKS5saW1pdCEuY291bnQsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gYXJncztcbiAgfVxuXG4gIHpyZXZyYW5rKGtleTogc3RyaW5nLCBtZW1iZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmV4ZWNJbnRlZ2VyT3JOaWxSZXBseShcIlpSRVZSQU5LXCIsIGtleSwgbWVtYmVyKTtcbiAgfVxuXG4gIHpzY29yZShrZXk6IHN0cmluZywgbWVtYmVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjQnVsa1JlcGx5KFwiWlNDT1JFXCIsIGtleSwgbWVtYmVyKTtcbiAgfVxuXG4gIHNjYW4oXG4gICAgY3Vyc29yOiBudW1iZXIsXG4gICAgb3B0cz86IFNjYW5PcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoU2Nhbk9wdHMoW2N1cnNvcl0sIG9wdHMpO1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5KFwiU0NBTlwiLCAuLi5hcmdzKSBhcyBQcm9taXNlPFxuICAgICAgW0J1bGtTdHJpbmcsIEJ1bGtTdHJpbmdbXV1cbiAgICA+O1xuICB9XG5cbiAgc3NjYW4oXG4gICAga2V5OiBzdHJpbmcsXG4gICAgY3Vyc29yOiBudW1iZXIsXG4gICAgb3B0cz86IFNTY2FuT3B0cyxcbiAgKSB7XG4gICAgY29uc3QgYXJncyA9IHRoaXMucHVzaFNjYW5PcHRzKFtrZXksIGN1cnNvcl0sIG9wdHMpO1xuICAgIHJldHVybiB0aGlzLmV4ZWNBcnJheVJlcGx5KFwiU1NDQU5cIiwgLi4uYXJncykgYXMgUHJvbWlzZTxcbiAgICAgIFtCdWxrU3RyaW5nLCBCdWxrU3RyaW5nW11dXG4gICAgPjtcbiAgfVxuXG4gIGhzY2FuKFxuICAgIGtleTogc3RyaW5nLFxuICAgIGN1cnNvcjogbnVtYmVyLFxuICAgIG9wdHM/OiBIU2Nhbk9wdHMsXG4gICkge1xuICAgIGNvbnN0IGFyZ3MgPSB0aGlzLnB1c2hTY2FuT3B0cyhba2V5LCBjdXJzb3JdLCBvcHRzKTtcbiAgICByZXR1cm4gdGhpcy5leGVjQXJyYXlSZXBseShcIkhTQ0FOXCIsIC4uLmFyZ3MpIGFzIFByb21pc2U8XG4gICAgICBbQnVsa1N0cmluZywgQnVsa1N0cmluZ1tdXVxuICAgID47XG4gIH1cblxuICB6c2NhbihcbiAgICBrZXk6IHN0cmluZyxcbiAgICBjdXJzb3I6IG51bWJlcixcbiAgICBvcHRzPzogWlNjYW5PcHRzLFxuICApIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5wdXNoU2Nhbk9wdHMoW2tleSwgY3Vyc29yXSwgb3B0cyk7XG4gICAgcmV0dXJuIHRoaXMuZXhlY0FycmF5UmVwbHkoXCJaU0NBTlwiLCAuLi5hcmdzKSBhcyBQcm9taXNlPFxuICAgICAgW0J1bGtTdHJpbmcsIEJ1bGtTdHJpbmdbXV1cbiAgICA+O1xuICB9XG5cbiAgcHJpdmF0ZSBwdXNoU2Nhbk9wdHMoXG4gICAgYXJnczogKG51bWJlciB8IHN0cmluZylbXSxcbiAgICBvcHRzPzogU2Nhbk9wdHMgfCBIU2Nhbk9wdHMgfCBaU2Nhbk9wdHMgfCBTU2Nhbk9wdHMsXG4gICkge1xuICAgIGlmIChvcHRzPy5wYXR0ZXJuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaChcIk1BVENIXCIsIG9wdHMucGF0dGVybik7XG4gICAgfVxuICAgIGlmIChvcHRzPy5jb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goXCJDT1VOVFwiLCBvcHRzLmNvdW50KTtcbiAgICB9XG4gICAgaWYgKChvcHRzIGFzIFNjYW5PcHRzKT8udHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goXCJUWVBFXCIsIChvcHRzIGFzIFNjYW5PcHRzKS50eXBlISk7XG4gICAgfVxuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgdHgoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVJlZGlzUGlwZWxpbmUodGhpcy5leGVjdXRvci5jb25uZWN0aW9uLCB0cnVlKTtcbiAgfVxuXG4gIHBpcGVsaW5lKCkge1xuICAgIHJldHVybiBjcmVhdGVSZWRpc1BpcGVsaW5lKHRoaXMuZXhlY3V0b3IuY29ubmVjdGlvbik7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWRpc0Nvbm5lY3RPcHRpb25zIGV4dGVuZHMgUmVkaXNDb25uZWN0aW9uT3B0aW9ucyB7XG4gIGhvc3RuYW1lOiBzdHJpbmc7XG4gIHBvcnQ/OiBudW1iZXIgfCBzdHJpbmc7XG59XG5cbi8qKlxuICogQ29ubmVjdCB0byBSZWRpcyBzZXJ2ZXJcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNvbm5lY3QgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqIGNvbnN0IGNvbm4xID0gYXdhaXQgY29ubmVjdCh7aG9zdG5hbWU6IFwiMTI3LjAuMC4xXCIsIHBvcnQ6IDYzNzl9KTsgLy8gLT4gVENQLCAxMjcuMC4wLjE6NjM3OVxuICogY29uc3QgY29ubjIgPSBhd2FpdCBjb25uZWN0KHtob3N0bmFtZTogXCJyZWRpcy5wcm94eVwiLCBwb3J0OiA0NDMsIHRsczogdHJ1ZX0pOyAvLyAtPiBUTFMsIHJlZGlzLnByb3h5OjQ0M1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb25uZWN0KG9wdGlvbnM6IFJlZGlzQ29ubmVjdE9wdGlvbnMpOiBQcm9taXNlPFJlZGlzPiB7XG4gIGNvbnN0IGNvbm5lY3Rpb24gPSBjcmVhdGVSZWRpc0Nvbm5lY3Rpb24ob3B0aW9ucyk7XG4gIGF3YWl0IGNvbm5lY3Rpb24uY29ubmVjdCgpO1xuICBjb25zdCBleGVjdXRvciA9IG5ldyBNdXhFeGVjdXRvcihjb25uZWN0aW9uKTtcbiAgcmV0dXJuIGNyZWF0ZShleGVjdXRvcik7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbGF6eSBSZWRpcyBjbGllbnQgdGhhdCB3aWxsIG5vdCBlc3RhYmxpc2ggYSBjb25uZWN0aW9uIHVudGlsIGEgY29tbWFuZCBpcyBhY3R1YWxseSBleGVjdXRlZC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY3JlYXRlTGF6eUNsaWVudCB9IGZyb20gXCIuL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUxhenlDbGllbnQoeyBob3N0bmFtZTogXCIxMjcuMC4wLjFcIiwgcG9ydDogNjM3OSB9KTtcbiAqIGNvbnNvbGUuYXNzZXJ0KCFjbGllbnQuaXNDb25uZWN0ZWQpO1xuICogYXdhaXQgY2xpZW50LmdldChcImZvb1wiKTtcbiAqIGNvbnNvbGUuYXNzZXJ0KGNsaWVudC5pc0Nvbm5lY3RlZCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxhenlDbGllbnQob3B0aW9uczogUmVkaXNDb25uZWN0T3B0aW9ucyk6IFJlZGlzIHtcbiAgY29uc3QgY29ubmVjdGlvbiA9IGNyZWF0ZVJlZGlzQ29ubmVjdGlvbihvcHRpb25zKTtcbiAgY29uc3QgZXhlY3V0b3IgPSBjcmVhdGVMYXp5RXhlY3V0b3IoY29ubmVjdGlvbik7XG4gIHJldHVybiBjcmVhdGUoZXhlY3V0b3IpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHJlZGlzIGNsaWVudCBmcm9tIGBDb21tYW5kRXhlY3V0b3JgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUoZXhlY3V0b3I6IENvbW1hbmRFeGVjdXRvcik6IFJlZGlzIHtcbiAgcmV0dXJuIG5ldyBSZWRpc0ltcGwoZXhlY3V0b3IpO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgUmVkaXNDb25uZWN0T3B0aW9ucyBmcm9tIHJlZGlzIFVSTFxuICogQHBhcmFtIHVybFxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZVVSTCB9IGZyb20gXCIuL21vZC50c1wiO1xuICpcbiAqIHBhcnNlVVJMKFwicmVkaXM6Ly9mb286YmFyQGxvY2FsaG9zdDo2Mzc5LzFcIik7IC8vIC0+IHtob3N0bmFtZTogXCJsb2NhbGhvc3RcIiwgcG9ydDogXCI2Mzc5XCIsIHRsczogZmFsc2UsIGRiOiAxLCBuYW1lOiBmb28sIHBhc3N3b3JkOiBiYXJ9XG4gKiBwYXJzZVVSTChcInJlZGlzczovLzEyNy4wLjAuMTo0NDMvP2RiPTImcGFzc3dvcmQ9YmFyXCIpOyAvLyAtPiB7aG9zdG5hbWU6IFwiMTI3LjAuMC4xXCIsIHBvcnQ6IFwiNDQzXCIsIHRsczogdHJ1ZSwgZGI6IDIsIG5hbWU6IHVuZGVmaW5lZCwgcGFzc3dvcmQ6IGJhcn1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VVUkwodXJsOiBzdHJpbmcpOiBSZWRpc0Nvbm5lY3RPcHRpb25zIHtcbiAgY29uc3Qge1xuICAgIHByb3RvY29sLFxuICAgIGhvc3RuYW1lLFxuICAgIHBvcnQsXG4gICAgdXNlcm5hbWUsXG4gICAgcGFzc3dvcmQsXG4gICAgcGF0aG5hbWUsXG4gICAgc2VhcmNoUGFyYW1zLFxuICB9ID0gbmV3IFVSTCh1cmwpO1xuICBjb25zdCBkYiA9IHBhdGhuYW1lLnJlcGxhY2UoXCIvXCIsIFwiXCIpICE9PSBcIlwiXG4gICAgPyBwYXRobmFtZS5yZXBsYWNlKFwiL1wiLCBcIlwiKVxuICAgIDogc2VhcmNoUGFyYW1zLmdldChcImRiXCIpID8/IHVuZGVmaW5lZDtcbiAgcmV0dXJuIHtcbiAgICBob3N0bmFtZTogaG9zdG5hbWUgIT09IFwiXCIgPyBob3N0bmFtZSA6IFwibG9jYWxob3N0XCIsXG4gICAgcG9ydDogcG9ydCAhPT0gXCJcIiA/IHBhcnNlSW50KHBvcnQsIDEwKSA6IDYzNzksXG4gICAgdGxzOiBwcm90b2NvbCA9PSBcInJlZGlzczpcIiA/IHRydWUgOiBzZWFyY2hQYXJhbXMuZ2V0KFwic3NsXCIpID09PSBcInRydWVcIixcbiAgICBkYjogZGIgPyBwYXJzZUludChkYiwgMTApIDogdW5kZWZpbmVkLFxuICAgIG5hbWU6IHVzZXJuYW1lICE9PSBcIlwiID8gdXNlcm5hbWUgOiB1bmRlZmluZWQsXG4gICAgcGFzc3dvcmQ6IHBhc3N3b3JkICE9PSBcIlwiXG4gICAgICA/IHBhc3N3b3JkXG4gICAgICA6IHNlYXJjaFBhcmFtcy5nZXQoXCJwYXNzd29yZFwiKSA/PyB1bmRlZmluZWQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlZGlzQ29ubmVjdGlvbihvcHRpb25zOiBSZWRpc0Nvbm5lY3RPcHRpb25zKTogQ29ubmVjdGlvbiB7XG4gIGNvbnN0IHsgaG9zdG5hbWUsIHBvcnQgPSA2Mzc5LCAuLi5vcHRzIH0gPSBvcHRpb25zO1xuICByZXR1cm4gbmV3IFJlZGlzQ29ubmVjdGlvbihob3N0bmFtZSwgcG9ydCwgb3B0cyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxhenlFeGVjdXRvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKTogQ29tbWFuZEV4ZWN1dG9yIHtcbiAgbGV0IGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3IgfCBudWxsID0gbnVsbDtcbiAgcmV0dXJuIHtcbiAgICBnZXQgY29ubmVjdGlvbigpIHtcbiAgICAgIHJldHVybiBjb25uZWN0aW9uO1xuICAgIH0sXG4gICAgYXN5bmMgZXhlYyhjb21tYW5kLCAuLi5hcmdzKSB7XG4gICAgICBpZiAoIWV4ZWN1dG9yKSB7XG4gICAgICAgIGV4ZWN1dG9yID0gbmV3IE11eEV4ZWN1dG9yKGNvbm5lY3Rpb24pO1xuICAgICAgICBpZiAoIWNvbm5lY3Rpb24uaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGV4ZWN1dG9yLmV4ZWMoY29tbWFuZCwgLi4uYXJncyk7XG4gICAgfSxcbiAgICBjbG9zZSgpIHtcbiAgICAgIGlmIChleGVjdXRvcikge1xuICAgICAgICByZXR1cm4gZXhlY3V0b3IuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJDQSxTQUFTLGVBQWUsUUFBUSxrQkFBa0I7QUFHbEQsU0FBMEIsV0FBVyxRQUFRLGdCQUFnQjtBQWE3RCxTQUFTLG1CQUFtQixRQUFRLGdCQUFnQjtBQUNwRCxTQUFTLFVBQVUsRUFBRSxTQUFTLFFBQVEsY0FBYztBQUNwRCxTQUNFLFVBQVUsRUFDVixXQUFXLEVBQ1gsUUFBUSxFQUNSLFFBQVEsRUFDUixpQkFBaUIsRUFDakIsUUFBUSxFQUNSLGFBQWEsRUFDYixzQkFBc0IsRUFDdEIsbUJB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