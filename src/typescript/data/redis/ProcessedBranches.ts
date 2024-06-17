// import { IBranchQnomycodePair } from '../elastic/BranchModel';
// import { BaseRedisQueue } from './BaseRedisQueue';

// export class ProcessedBranches extends BaseRedisQueue {
// 	protected queueName: string = 'ProcessedBranches';

// 	async enqueueBranch(enqueue: IBranchQnomycodePair) {
// 		return await super.enqueue(enqueue);
// 	}

// 	async enqueueBranches(bulkEnqueue: IBranchQnomycodePair[]) {
// 		return await super.bEnqueue(bulkEnqueue);
// 	}

// 	async dequeueBranch() {
// 		return await super.dequeue();
// 	}

// 	async dequeueBranches() {
// 		return await super.bDequeueAll();
// 	}

// 	async queueSize() {
// 		return await super.qSize();
// 	}
// }
