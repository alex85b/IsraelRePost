"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myCustomDelay = void 0;
const myCustomDelay = (milliseconds) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
};
exports.myCustomDelay = myCustomDelay;
