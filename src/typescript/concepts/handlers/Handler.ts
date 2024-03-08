export type EnumLike = {
	[key: string]: string;
};

export type EnumValues<T extends EnumLike> = T[keyof T];

export interface IHandlerClass<E extends EnumLike> {
	message: EnumValues<E>;
	handle(): void;
}

export abstract class HandlerClass<D, E extends EnumLike> implements IHandlerClass<E> {
	abstract message: E[keyof E];
	protected abstract data: D;

	abstract handle(): void;
}

export type MessageDataPair<E extends EnumLike> = {
	[K in EnumValues<E>]: IHandlerClass<E> & { message: K };
};
