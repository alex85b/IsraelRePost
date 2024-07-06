// This is a "Lean" model, that represents an object that can be updated.

export interface IReadable<T> {
	read(): T;
}

export interface IWriteable<T> {
	write(update: T): T;
}

export interface IUpdatable<T> extends IReadable<T>, IWriteable<T> {
	updateTarget: T;
}

export interface IRequestsPool extends IUpdatable<number> {}
