"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringFieldExistNonEmpty = void 0;
const stringFieldExistNonEmpty = (target) => {
    if (target) {
        return typeof target === 'string' && target.length !== 0;
    }
    return false;
};
exports.stringFieldExistNonEmpty = stringFieldExistNonEmpty;
