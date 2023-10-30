import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ListSide } from './generic-transformers';
export declare const FIRST_KEY_INDEX = 1;
export declare function transformArguments(source: RedisCommandArgument, destination: RedisCommandArgument, sourceSide: ListSide, destinationSide: ListSide): RedisCommandArguments;
export declare function transformReply(): RedisCommandArgument | null;
