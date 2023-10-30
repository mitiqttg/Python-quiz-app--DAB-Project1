import { RedisCommandArgument, RedisCommandArguments } from '.';
export declare const FIRST_KEY_INDEX = 1;
export declare const IS_READ_ONLY = true;
export declare function transformArguments(key: RedisCommandArgument, start: number, end: number): RedisCommandArguments;
export declare function transformReply(): RedisCommandArgument;
