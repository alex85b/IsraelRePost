// import {
// 	ICounterSetup,
// 	NaturalNumbersCounterSetup,
// } from '../../services/appointments-update/components/atomic-counter/CounterSetup';
// import {
// 	NaturalNumbersCounter,
// 	IIncrementalCounter,
// } from '../../services/appointments-update/components/atomic-counter/IncrementalCounter';

// export const testNaturalNumbersCounter = (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Thread Safe Counter] Start');

// 	const counterSetup: ICounterSetup = new NaturalNumbersCounterSetup({
// 		counterRange: { bottom: 0, top: 5 },
// 	});

// 	console.log('[Test Thread Safe Counter] counterSetup', counterSetup);

// 	const countNaturalNumbers: IIncrementalCounter = new NaturalNumbersCounter(counterSetup);

// 	console.log('[Test Thread Safe Counter] .getLimits()', countNaturalNumbers.getLimits());

// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());

// 	console.log('[Test Thread Safe Counter] .reset(10)', countNaturalNumbers.reset(10));

// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());

// 	console.log(
// 		'[Test Thread Safe Counter] .reset(Max_Limit -1)',
// 		countNaturalNumbers.reset(countNaturalNumbers.getLimits().max - 1)
// 	);
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .clearMemory()', countNaturalNumbers.clearMemory());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] .increment()', countNaturalNumbers.increment());
// 	console.log('[Test Thread Safe Counter] End');
// };
