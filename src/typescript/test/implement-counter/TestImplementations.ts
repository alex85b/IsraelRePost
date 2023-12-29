import {
	APIRequestCounterData,
	VerifyDepletedMessage,
	CountRequestsBatch,
} from '../../atomic-counter/ImplementCounters';

export const constructRequestData = (run: boolean) => {
	if (!run) return;
	console.log('[Construct Request Data] Start');
	const apiRequestCounterData = new APIRequestCounterData(48);
	console.log('APIRequestCounterData(48) : ', apiRequestCounterData);
	console.log('apiRequestCounterData view[0]: ', apiRequestCounterData.view[0]);
	console.log('[Construct Request Data] End');
};

export const CountDepletedMessages = (run: boolean) => {
	if (!run) return;
	console.log('[Count Depleted Messages] Start');
	const requestCounterData = new APIRequestCounterData(48);
	const depletedMessages = new VerifyDepletedMessage(requestCounterData);
	console.log('[depletedMessages] requestCounterData : ', requestCounterData);
	// console.log('[depletedMessages] isValidDepleted : ', depletedMessages.());
	console.log('[depletedMessages] isValidDepleted : ', depletedMessages.isValidDepleted());

	// console.log('[depletedMessages] isFirstDepleted : ', depletedMessages.isFirstDepleted());
	// console.log('[depletedMessages] resetCounter : ', depletedMessages.resetDepletedCounter());
	// console.log('[depletedMessages] isFirstDepleted : ', depletedMessages.isFirstDepleted());
	// console.log('[depletedMessages] isFirstDepleted : ', depletedMessages.isFirstDepleted());
	console.log('[Count Depleted Messages] End');
};

export const countRequestsBatch = (run: boolean) => {
	if (!run) return;
	console.log('[Count Depleted Messages] Start');
	const countBatch = new CountRequestsBatch(300 - 2, 50 - 2);

	// 1
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	// 2
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	// 3
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	// 4
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	// 5
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	// 6
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	// 7
	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	const value = countBatch.countConsumedRequests().value;
	countBatch.setBatchSize(value);
	console.log(
		'[Count Depleted Messages] setBatchSize(value) countConsumedRequests',
		countBatch.countConsumedRequests()
	);

	console.log(
		'[Count Depleted Messages] countConsumedRequests : ',
		countBatch.countConsumedRequests()
	);

	console.log('[Count Depleted Messages] End');
};

// TODO: CountAPIRequest
