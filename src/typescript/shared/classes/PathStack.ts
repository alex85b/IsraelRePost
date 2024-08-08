// PathStack.ts

export interface IPathTracker {
	push(module: string): this;
	pop(): string | undefined;
	toString(): string;
	reset(): this;
}

export class PathStack implements IPathTracker {
	private stack: string[] = [];

	push(module: string): this {
		this.stack.push(module);
		return this;
	}

	pop(): string | undefined {
		return this.stack.pop();
	}

	toString(): string {
		return this.stack.join("/");
	}

	reset(): this {
		this.stack = [];
		return this;
	}
}
