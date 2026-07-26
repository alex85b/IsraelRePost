import winston from "winston";
import fs from "fs";
import path from "path";
import { IPathTracker } from "./PathStack";
import { numericDate } from "../functions/GetDateAndOrTime";

export interface ILogMessage {
	message: string;
	details?: any;
	threadId?: number;
}

export interface ILogger {
	logInfo(args: ILogMessage): void;
	logError(args: ILogMessage): void;
	setPathStack(pathStack: IPathTracker): void;
}

export class WinstonClient implements ILogger {
	private localLogDirPath: string;
	private logger: winston.Logger;
	private pathStack: IPathTracker;
	private static instance: WinstonClient | null = null;

	private constructor(args: {
		localLogDirPath?: string;
		fileSuffix?: string;
		pathStack: IPathTracker;
	}) {
		if (args.localLogDirPath) this.localLogDirPath = args.localLogDirPath;
		else {
			this.localLogDirPath = path.join(__dirname, "logs");
		}
		if (!fs.existsSync(this.localLogDirPath)) {
			fs.mkdirSync(this.localLogDirPath);
		}

		this.logger = this.getWinstonLogger("YYYY/MM/DD HH:mm:ss", args.fileSuffix);
		this.pathStack = args.pathStack;
	}

	public static getInstance(args: {
		localLogDirPath?: string;
		fileSuffix?: string;
		pathStack: IPathTracker;
	}): WinstonClient {
		if (!WinstonClient.instance) {
			WinstonClient.instance = new WinstonClient(args);
		}
		return WinstonClient.instance;
	}

	private get consoleFormat(): winston.Logform.Format {
		return winston.format.printf(
			({ level, message, timestamp, ...metadata }) => {
				let msg = `[${level}] : ${message}`;

				if (Object.keys(metadata).length > 0) {
					msg += " " + JSON.stringify(metadata);
				}

				msg += ` [${timestamp}]`;

				return msg;
			}
		);
	}

	private getLogerTransporters(timeStampFormat: string, fileSuffix?: string) {
		const today = numericDate();
		const transporters: winston.LoggerOptions["transports"] = [
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.timestamp({ format: timeStampFormat }),
					winston.format.json({ space: 2 }),
					winston.format.colorize(),
					this.consoleFormat
				),
			}),
			new winston.transports.File({
				level: "error",
				filename: path.join(
					this.localLogDirPath,
					`${fileSuffix ? fileSuffix + "_" : ""}app_errors_${today}.log`
				),
				format: winston.format.combine(
					winston.format.timestamp({ format: timeStampFormat }),
					winston.format.json()
				),
			}),
			new winston.transports.File({
				level: "info",
				filename: path.join(
					this.localLogDirPath,
					`${fileSuffix ? fileSuffix + "_" : ""}app_info_${today}.log`
				),
				format: winston.format.combine(
					winston.format.timestamp({ format: timeStampFormat }),
					winston.format.json(),
					winston.format((log) => (log.level === "info" ? log : false))()
				),
			}),
		];
		return transporters;
	}

	private getWinstonLogger(timeStampFormat: string, fileSuffix?: string) {
		return winston.createLogger({
			transports: this.getLogerTransporters(timeStampFormat, fileSuffix),
		});
	}

	logInfo(args: ILogMessage) {
		this.logger.info({ ...args, pathStack: this.pathStack.toString() });
	}

	logError(args: ILogMessage) {
		this.logger.error({ ...args, pathStack: this.pathStack.toString() });
	}

	setPathStack(pathStack: IPathTracker): void {
		this.pathStack.reset();
		for (const step in pathStack) {
			this.pathStack.push(step);
		}
	}
}
