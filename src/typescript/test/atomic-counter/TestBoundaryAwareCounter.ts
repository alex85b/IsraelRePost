// import {
// 	IBoundaryAwareCounter,
// 	BoundaryAwareIncrementalCounter,
// } from '../../services/appointments-update/components/atomic-counter/BoundaryAwareCounter';
// import {
// 	IArrayCounterSetup,
// 	NaturalNumbersArraySetup,
// } from '../../services/appointments-update/components/atomic-counter/CounterSetup';

// export const Test_BoundaryAwareIncrementalCounter = (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Increment And Verify] Start');

// 	const counterSetup: IArrayCounterSetup = new NaturalNumbersArraySetup({
// 		counterRangeAndLength: { bottom: 0, length: 2, top: 10 },
// 	});

// 	console.log('[Test Increment And Verify] counterSetup : ', counterSetup);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.getArrayLength : ',
// 		counterSetup.getArrayLength()
// 	);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.setCellValue(1, -1) : ',
// 		counterSetup.setCellValue(1, -1)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.setCellValue(1, 2) : ',
// 		counterSetup.setCellValue(1, 2)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.setCellValue(-1, 1) : ',
// 		counterSetup.setCellValue(-1, 1)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.setCellValue(256, 1) : ',
// 		counterSetup.setCellValue(256, 1)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.setCellValue(5, 1) : ',
// 		counterSetup.setCellValue(5, 1)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] counterSetup.getCounterData : ',
// 		counterSetup.getCounterData()
// 	);

// 	const countNaturalNumbers: IBoundaryAwareCounter = new BoundaryAwareIncrementalCounter(
// 		counterSetup
// 	);

// 	console.log(
// 		'[Test Increment And Verify] .getLimits() : ',
// 		countNaturalNumbers.getValueLimits()
// 	);
// 	console.log('[Test Increment And Verify] .length() : ', countNaturalNumbers.length());

// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());

// 	console.log(
// 		'[Test Increment And Verify] .setBoundary(256) : ',
// 		countNaturalNumbers.setBoundary(256)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] .setBoundary(10) : ',
// 		countNaturalNumbers.setBoundary(10)
// 	);

// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());
// 	console.log('[Test Increment And Verify] .increment() : ', countNaturalNumbers.increment());

// 	console.log(
// 		'[Test Increment And Verify] .setCounterValue(-1) : ',
// 		countNaturalNumbers.setCounterValue(-1)
// 	);

// 	console.log(
// 		'[Test Increment And Verify] .setCounterValue(256) : ',
// 		countNaturalNumbers.setCounterValue(256)
// 	);

// 	console.log('[Test Increment And Verify] End');
// };
