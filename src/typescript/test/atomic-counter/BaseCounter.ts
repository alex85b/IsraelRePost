import { AtomicCounter } from '../../atomic-counter/AtomicCounter';

export const constructCounter = (run: boolean) => {
	if (!run) return;
	console.log('[constructCounter] Start');

	const AtomicCounter_50 = new AtomicCounter(50);
	console.log('AtomicCounter(50) bounds : ', AtomicCounter_50.getCounterBounds());

	const AtomicCounter_255 = new AtomicCounter(255);
	console.log('AtomicCounter(255) bounds : ', AtomicCounter_255.getCounterBounds());

	const AtomicCounter_256 = new AtomicCounter(256);
	console.log('AtomicCounter(256) bounds : ', AtomicCounter_256.getCounterBounds());

	try {
		const AtomicCounter_m1 = new AtomicCounter(-1);
	} catch (error) {
		const err = error as Error;
		console.log('AtomicCounter(-1) bounds : ', err.message);
	}

	try {
		const AtomicCounter_4294967296 = new AtomicCounter(4294967296);
	} catch (error) {
		const err = error as Error;
		console.log('AtomicCounter(4294967296) bounds : ', err.message);
	}

	console.log('AtomicCounter_50 resetCount(51) : ', AtomicCounter_50.resetCount(51));
	console.log('AtomicCounter_50 resetCount(256) : ', AtomicCounter_50.resetCount(256));
	console.log('AtomicCounter_50 resetCount(-1) : ', AtomicCounter_50.resetCount(-1));

	console.log('[constructCounter] End');
};

export const resetCounter = (run: boolean) => {
	if (!run) return;
	console.log('[resetCounter] Start');

	const AtomicCounter_50 = new AtomicCounter(50);
	console.log('AtomicCounter(50) bounds : ', AtomicCounter_50.getCounterBounds());
	console.log('AtomicCounter_50 resetCount(51) : ', AtomicCounter_50.resetCount(51));
	console.log('AtomicCounter_50 resetCount(256) : ', AtomicCounter_50.resetCount(256));
	console.log('AtomicCounter_50 resetCount(-1) : ', AtomicCounter_50.resetCount(-1));

	console.log('[constructCounter] End');
};

export const addToCounter = (run: boolean) => {
	if (!run) return;
	console.log('[addToCounter] Start');

	const AtomicCounter_2 = new AtomicCounter(2);
	console.log('AtomicCounter(2) bounds : ', AtomicCounter_2.getCounterBounds());
	console.log('AtomicCounter_2 resetCount(1) : ', AtomicCounter_2.resetCount(1));
	console.log('AtomicCounter_2 addAndGet : ', AtomicCounter_2.addAndGet());
	console.log('AtomicCounter_2 addAndGet : ', AtomicCounter_2.addAndGet());
	console.log('AtomicCounter_2 addAndGet : ', AtomicCounter_2.addAndGet());

	console.log('[addToCounter] End');
};

export const subtractFromCounter = (run: boolean) => {
	if (!run) return;
	console.log('[subtractFromCounter] Start');

	const AtomicCounter_2 = new AtomicCounter(2);
	console.log('AtomicCounter(2) bounds : ', AtomicCounter_2.getCounterBounds());
	console.log('AtomicCounter_2 resetCount(2) : ', AtomicCounter_2.resetCount(2));
	console.log('AtomicCounter_2 subtractAndGet : ', AtomicCounter_2.subtractAndGet());
	console.log('AtomicCounter_2 subtractAndGet : ', AtomicCounter_2.subtractAndGet());
	console.log('AtomicCounter_2 subtractAndGet : ', AtomicCounter_2.subtractAndGet());

	const AtomicCounter_10 = new AtomicCounter(10);
	console.log('AtomicCounter(10) bounds : ', AtomicCounter_10.getCounterBounds());
	console.log('AtomicCounter_10 resetCount(10) : ', AtomicCounter_2.resetCount(10));
	console.log('AtomicCounter_10 subtractAndGet : ', AtomicCounter_2.subtractAndGet(3));
	console.log('AtomicCounter_10 subtractAndGet : ', AtomicCounter_2.subtractAndGet(3));
	console.log('AtomicCounter_10 subtractAndGet : ', AtomicCounter_2.subtractAndGet(3));
	console.log('AtomicCounter_10 subtractAndGet : ', AtomicCounter_2.subtractAndGet(3));
	console.log('AtomicCounter_10 subtractAndGet : ', AtomicCounter_2.subtractAndGet(1));
	console.log('AtomicCounter_10 subtractAndGet : ', AtomicCounter_2.subtractAndGet(1));

	console.log('[subtractFromCounter] End');
};

export const isAtBoundary = (run: boolean) => {
	if (!run) return;
	console.log('[Is At Boundary] Start');

	const AtomicCounter_10 = new AtomicCounter(10);
	console.log('AtomicCounter_10 bounds : ', AtomicCounter_10.getCounterBounds());
	console.log('AtomicCounter_10 isAtBoundary : ', AtomicCounter_10.isAtBoundary());
	console.log('AtomicCounter_10 addAndGet : ', AtomicCounter_10.addAndGet());
	console.log('AtomicCounter_10 isAtBoundary : ', AtomicCounter_10.isAtBoundary());

	console.log('[Is At Boundary] End');
};
