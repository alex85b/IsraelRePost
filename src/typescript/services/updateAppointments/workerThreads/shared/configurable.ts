export interface IConfigurable<T> {
	configure(args: T): void;
}
