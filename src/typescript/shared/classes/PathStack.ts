// PathStack.ts

export interface IPathTracker {
	push(module: string): this;
	pop(): this;
	toString(): string;
	reset(): this;
	set(stack: string[]): this;
	copy(): IPathTracker;
}

export class PathStack implements IPathTracker {
	private stack: string[] = [];

	push(module: string): this {
		this.stack.push(module);
		return this;
	}

	pop(): this {
		this.stack.pop();
		return this;
	}

	toString(): string {
		return `[${this.stack.join("][")}]`;
	}

	reset(): this {
		this.stack = [];
		return this;
	}

	set(stack: string[]): this {
		this.stack = stack;
		return this;
	}

	copy(): IPathTracker {
		return new PathStack().set(this.stack.map((node) => node));
	}
}
