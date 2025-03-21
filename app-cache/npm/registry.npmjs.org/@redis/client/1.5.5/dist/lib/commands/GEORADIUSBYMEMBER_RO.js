"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = require("./generic-transformers");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, member, radius, unit, options) {
    return (0, generic_transformers_1.pushGeoRadiusArguments)(['GEORADIUSBYMEMBER_RO'], key, member, radius, unit, options);
}
exports.transformArguments = transformArguments;
