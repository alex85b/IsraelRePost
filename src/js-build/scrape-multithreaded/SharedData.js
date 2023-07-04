"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedData = exports.setSharedData = void 0;
let sharedData = null;
const setSharedData = (data) => {
    sharedData = data;
};
exports.setSharedData = setSharedData;
const getSharedData = () => {
    return sharedData;
};
exports.getSharedData = getSharedData;
// module.exports = { setSharedData, getSharedData };
