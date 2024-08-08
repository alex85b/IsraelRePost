import winston from "winston";
import fs from "fs";
import path from "path";

// ##########################################################
// ##########################################################
// ##########################################################

// Use Winston's LogEntry type as a base
interface LogFormat extends winston.LogEntry {
	timestamp?: string;
	[key: string]: any;
}

// Test function
function testLogging(): void {
	const testMessage = "Test log message ";
	console.log("[console][log] Logging test message:", testMessage);

	/* Create local log folder
	########################## */
	const logDir = path.join(__dirname, "..", "..", "..", "..", "logs");
	console.log("[console][log] logDir : ", logDir);
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir);
	}

	const consoleFormat = winston.format.printf((info: LogFormat) => {
		const { level, message, timestamp, ...metadata } = info;

		let msg = `${
			timestamp || new Date().toISOString()
		} [${level}] : ${message}`;

		if (Object.keys(metadata).length > 0) {
			const metadataStr = Object.entries(metadata)
				.map(([key, value]) => `${key}=${value}`)
				.join(", ");
			msg += ` [${metadataStr}]`;
		}

		return msg;
	});

	/* Create a logger
	################## */
	const logger = winston.createLogger({
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.timestamp({ format: "YYYY-MM-DD:HH-mm-ss" }),
					winston.format.colorize(),
					consoleFormat,
					winston.format.prettyPrint()
				),
			}),
			new winston.transports.File({
				level: "error",
				filename: path.join(
					logDir,
					`app_errors_${new Date().toISOString().split("T")[0]}.log`
				),
				format: winston.format.combine(
					winston.format.timestamp({ format: "YYYY-MM-DD:HH-mm-ss" }),
					winston.format.json()
				),
			}),
			new winston.transports.File({
				level: "info",
				filename: path.join(
					logDir,
					`app_info_${new Date().toISOString().split("T")[0]}.log`
				),
				format: winston.format.combine(
					winston.format.timestamp({ format: "YYYY-MM-DD:HH-mm-ss" }),
					winston.format.json(),
					winston.format((log) => (log.level === "info" ? log : false))()
				),
			}),
		],
	});

	logger.info(testMessage, {
		details: "Message Details",
		path: "test-service",
		threadId: process.pid, // Use process ID as a stand-in for thread ID
	});

	logger.error(testMessage, {
		details: "Message Details",
		path: "test-service",
		threadId: process.pid, // Use process ID as a stand-in for thread ID
	});
}

// Run the test
function runTest() {
	testLogging();
	console.log("[console][log] Logging test completed");
}

runTest();
