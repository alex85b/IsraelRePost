"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayDateObject = void 0;
function getTodayDateObject() {
    const today = new Date();
    const year = today.getFullYear();
    // 'getMonth' returns a zero-based value: January == 0.
    // padStart ensures that i have 2 'digits', it pads with 0 in case i have 1 digit.
    const month = String(today.getMonth() + 1).padStart(2, '0');
    // same procedure as month.
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return {
        date: dateString,
        year: String(year),
        month: String(month),
        day: String(day),
    };
}
exports.getTodayDateObject = getTodayDateObject;
