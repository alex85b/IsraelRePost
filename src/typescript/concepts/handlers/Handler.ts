// export type EnumLike = {
// 	[key: string]: string;
// };

// export type EnumValues<T extends EnumLike> = T[keyof T];

// export interface IHandlerClass<M> {
// 	handle(): void;
// }

// export abstract class HandlerClass<D, M> implements IHandlerClass<M> {
// 	data: D;

// 	constructor(data: D) {
// 		this.data = data;
// 	}

// 	abstract handle(): void;
// }

// export type MessageDataPair<E extends EnumLike> = {
// 	[K in EnumValues<E>]: IHandlerClass<K>;
// };
