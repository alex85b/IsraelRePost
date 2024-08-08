import { PathStack } from "../PathStack";
import { ILogger, WinstonClient } from "../WinstonClient";

console.log("** Test Winston Client **");

export const testInfoLog = async () => {
	console.log("** (1) Test Winston Client | Test Info Log **");
	const pathStack = new PathStack();
	pathStack.push("Shared").push("Clases").push("Tests").push("Test Info Log");
	const loger: ILogger = new WinstonClient({ pathStack });
	loger.logInfo({
		message: "Test Info Log Message",
		details: "No Details",
		threadId: process.pid,
	});
};

export const testErrorLog = async () => {
	console.log("** (1) Test Winston Client | Test Error Log **");
	const pathStack = new PathStack();
	pathStack.push("Shared").push("Clases").push("Tests").push("Test Error Log");
	const loger: ILogger = new WinstonClient({ pathStack });
	loger.logError({
		message: "Test Info Log Message",
		details: "No Details",
		threadId: process.pid,
	});
};
