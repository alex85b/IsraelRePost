export interface ILogMessageConstructor {
	createLogMessage(args: { subject: string; message?: string }): string;
	addLogHeader(header: string): void;
	popLogHeader(): string | undefined;
	replaceLastHeader(header: string): void;
	setLogHeaders(headers: string[]): void;
	getHeadersAmount(): number;
	replaceHeaderAtIndex(args: { headerIndex: number; replacement: string }): boolean;
}

export class ConstructLogMessage implements ILogMessageConstructor {
	private logMessageHeaders: string[];

	constructor(headers?: string[]) {
		if (headers) this.logMessageHeaders = headers.map((header) => `[${header}]`);
		else this.logMessageHeaders = [];
	}

	addLogHeader(header: string): void {
		this.logMessageHeaders.push(`[${header}]`);
	}

	popLogHeader(): string | undefined {
		return this.logMessageHeaders.pop();
	}

	setLogHeaders(headers: string[]): void {
		this.logMessageHeaders = headers.map((header) => `[${header}]`);
	}

	replaceLastHeader(header: string): void {
		this.logMessageHeaders[this.logMessageHeaders.length - 1] = `[${header}]`;
	}

	createLogMessage(args: { subject: string; message?: string }): string {
		return (
			this.logMessageHeaders.join('') +
			` ${args.subject}${args.message ? ' : ' + args.message : ''}`
		);
	}

	getHeadersAmount(): number {
		return this.logMessageHeaders.length;
	}

	replaceHeaderAtIndex(args: { headerIndex: number; replacement: string }): boolean {
		if (args.headerIndex > this.logMessageHeaders.length - 1 || args.headerIndex < 1)
			return false;
		this.logMessageHeaders[args.headerIndex] = args.replacement;
		return true;
	}
}
