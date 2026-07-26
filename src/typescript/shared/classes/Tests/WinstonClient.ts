import { PathStack } from "../PathStack";
import { ILogger, WinstonClient } from "../WinstonClient";
import { createLogsFolder } from "../SetupLoggingFolders";

console.log("** Test Winston Client **");

export const testInfoLog = async () => {
	console.log("** (1) Test Winston Client | Test Info Log **");
	const pathStack = new PathStack();
	pathStack.push("Shared").push("Clases").push("Tests").push("Test Info Log");
	const loger: ILogger = WinstonClient.getInstance({ pathStack });
	loger.logInfo({
		message: "Test Info Log Message",
		details: "No Details",
		threadId: process.pid,
	});
};

export const testErrorLog = async () => {
	console.log("** (2) Test Winston Client | Test Error Log **");
	const pathStack = new PathStack();
	pathStack.push("Shared").push("Clases").push("Tests").push("Test Error Log");
	const loger: ILogger = WinstonClient.getInstance({ pathStack });
	loger.logError({
		message: "Test Info Log Message",
		details: "No Details",
		threadId: process.pid,
	});
};

export const testInfoLogCustomPath = async () => {
	console.log("** (3) Test Winston Client | Test Info Log **");
	const pathStack = new PathStack();
	pathStack
		.push("Shared")
		.push("Clases")
		.push("Tests")
		.push("Test Info Log Custom Path");
	const loger: ILogger = WinstonClient.getInstance({
		pathStack,
		localLogDirPath:
			(await createLogsFolder({ ipManagerId: "1", updaterId: "2" })).fullPath ??
			"logs",
	});
	loger.logInfo({
		message: "Test Info Log Message",
		details: "No Details",
		threadId: process.pid,
	});
};
