"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_error_1 = require("../errors/custom-error");
/*
    Will be used to Always response with a { errors: [{ message: error-message}, { message: error-message}, ...]}.
*/
// A function that uses an error to generate response.
const errorHandler = (err, req, res, next) => {
    // Is error is from the expected type.
    if (err instanceof custom_error_1.CustomError) {
        console.log('### Error handler: known error ###');
        const errPrintout = err.serializeErrors();
        return res.status(err.statusCode).send({ errors: errPrintout });
    }
    // Error isn't from the expected type.
    // Something unexpected has gone wrong.
    console.log('### Error handler: unknown error ### : ', err);
    res.status(500).send({
        errors: [{ message: 'Something went wrong' }],
    });
};
module.exports = errorHandler;
