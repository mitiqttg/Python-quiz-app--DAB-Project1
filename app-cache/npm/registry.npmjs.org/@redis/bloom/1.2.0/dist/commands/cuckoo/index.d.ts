import * as ADD from './ADD';
import * as ADDNX from './ADDNX';
import * as COUNT from './COUNT';
import * as DEL from './DEL';
import * as EXISTS from './EXISTS';
import * as INFO from './INFO';
import * as INSERT from './INSERT';
import * as INSERTNX from './INSERTNX';
import * as LOADCHUNK from './LOADCHUNK';
import * as RESERVE from './RESERVE';
import * as SCANDUMP from './SCANDUMP';
import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
declare const _default: {
    ADD: typeof ADD;
    add: typeof ADD;
    ADDNX: typeof ADDNX;
    addNX: typeof ADDNX;
    COUNT: typeof COUNT;
    count: typeof COUNT;
    DEL: typeof DEL;
    del: typeof DEL;
    EXISTS: typeof EXISTS;
    exists: typeof EXISTS;
    INFO: typeof INFO;
    info: typeof INFO;
    INSERT: typeof INSERT;
    insert: typeof INSERT;
    INSERTNX: typeof INSERTNX;
    insertNX: typeof INSERTNX;
    LOADCHUNK: typeof LOADCHUNK;
    loadChunk: typeof LOADCHUNK;
    RESERVE: typeof RESERVE;
    reserve: typeof RESERVE;
    SCANDUMP: typeof SCANDUMP;
    scanDump: typeof SCANDUMP;
};
export default _default;
export interface InsertOptions {
    CAPACITY?: number;
    NOCREATE?: true;
}
export declare function pushInsertOptions(args: RedisCommandArguments, items: string | Array<string>, options?: InsertOptions): RedisCommandArguments;
