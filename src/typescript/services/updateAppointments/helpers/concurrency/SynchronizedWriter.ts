import { Mutex } from 'async-mutex';
import { IUpdatable } from '../../../../data/models/dataTransferModels/Updatable';

export interface ISynchronizedWriter<T> {
	read(): Promise<T>;
	write(newData: T): Promise<T>;
}

export interface ISynchronizedCountDown {
	read(): Promise<number>;
	subtract(subtractThis: number): Promise<number>;
}

export class MutexCounter implements ISynchronizedCountDown {
	private data: IUpdatable<number>;
	private mutex: Mutex;

	constructor(initialData: IUpdatable<number>) {
		this.data = initialData;
		this.mutex = new Mutex();
	}

	async read(): Promise<number> {
		const release = await this.mutex.acquire();
		try {
			return this.data.read();
		} finally {
			release();
		}
	}

	async subtract(subtractThis: number): Promise<number> {
		const release = await this.mutex.acquire();
		try {
			const current = this.data.read();
			return this.data.write(current - subtractThis);
		} finally {
			release();
		}
	}
}
