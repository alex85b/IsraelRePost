import { ILogger, ILogMessage } from "../shared/classes/WinstonClient";

export enum ErrorSource {
	Database = "DATABASE",
	ThirdPartyAPI = "THIRD_PARTY_API",
	Internal = "INTERNAL",
}

export class ServiceError extends Error {
	constructor(
		private args: {
			message: string;
			source: ErrorSource;
			logger: ILogger;
			threadId?: number;
			details?: any;
		}
	) {
		super(args.message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
		this.logError();
	}

	private logError() {
		const logMessage: ILogMessage = {
			message: `${this.name}: ${this.message}`,
			threadId: this.args.threadId,
			details: {
				source: this.args.source,
				...this.args.details,
			},
		};
		this.args.logger.logError(logMessage);
	}
}
