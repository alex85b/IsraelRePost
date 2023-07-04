"use strict";
// This is a multithreading test.
// This should handle different worker threads, and attach 3 listeners to each new thread.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const custom_error_1 = require("../errors/custom-error");
const handleWorkerThreads = (branches, useProxy, endpointUrl, endpointUsername, endpointPassword, timeout) => {
    const processBranchPath = path_1.default.join(__dirname, '..', 
    // 'js-build',
    'scrape-multithreaded', 'ProcessBranch.js');
    const proxyUrl = endpointUrl || 'http://gate.smartproxy.com:7000'; // Replace with your actual proxy URL
    const proxyAuth = {
        username: endpointUsername || 'spqejf32bn',
        password: endpointPassword || 'kcin1BkcpNIHul110t', // Replace with your actual password
    };
    const promises = [];
    for (const branch of branches) {
        //
        // Iterate each branch.
        const promise = new Promise((resolve, reject) => {
            //
            // Pass a branch to a workerInstance, then encapsulate it inside a promise.
            const workerInstance = new worker_threads_1.Worker(processBranchPath, {
                workerData: { branch, useProxy, proxyUrl, proxyAuth, timeout },
            });
            workerInstance.on('message', (result) => {
                console.log(`[handleWorkerThreads] [Result] Received result from ${branch._source.branchnameEN}`);
                workerInstance.terminate();
                resolve({
                    status: 1,
                    branchname: branch._source.branchnameEN,
                    branchId: branch._source.branchnumber,
                    branch: null,
                    error: null,
                });
            });
            workerInstance.on('error', (error) => {
                console.error(`[handleWorkerThreads] ${branch._source.branchnameEN} error:`);
                if (error instanceof custom_error_1.CustomError) {
                    console.log('[handleWorkerThreads] [Error] message: ', error.serializeErrors());
                }
                else {
                    console.log('[handleWorkerThreads] [Error] message: ', error);
                }
                const tError = error;
                workerInstance.terminate();
                reject({
                    status: 0,
                    branchname: null,
                    branchId: null,
                    branch: branch,
                    error: tError,
                });
            });
            workerInstance.on('exit', (code) => {
                console.log(`[handleWorkerThreads] [Exit] ${branch._source.branchnameEN} exited with code:`, code);
            });
        });
        promises.push(promise);
    }
    return Promise.allSettled(promises);
    // all(promises);
};
module.exports = { handleWorkerThreads };
