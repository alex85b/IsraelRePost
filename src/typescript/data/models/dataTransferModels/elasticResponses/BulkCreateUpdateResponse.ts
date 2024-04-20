import { AxiosResponse } from 'axios';
import { IElasticBulkResponse } from '../../../elastic/BaseElastic';
import { extractResponseData } from './shared/ExtractResponseData';

export interface IBulkCreateUpdateResponseData {
	branchID: string;
	status: 'created' | 'updated' | 'failed';
}

export interface IBulkCreateUpdateResponse {
	toStringSuccessful(): string;
	toStringFailed(): string;
	getSuccessful(): IBulkCreateUpdateResponseData[];
	getFailed(): IBulkCreateUpdateResponseData[];
	countResponseItems(): {
		successful: number;
		failed: number;
	};
}

export class BulkCreateUpdateResponse implements IBulkCreateUpdateResponse {
	private successful: IBulkCreateUpdateResponseData[];
	private failed: IBulkCreateUpdateResponseData[];
	private updatedCounter: number;
	private createdCounter: number;

	private constructor(buildData: {
		successful: IBulkCreateUpdateResponseData[];
		failed: IBulkCreateUpdateResponseData[];
		updatedCounter: number;
		createdCounter: number;
	}) {
		this.successful = buildData.successful;
		this.failed = buildData.failed;
		this.createdCounter = buildData.createdCounter;
		this.updatedCounter = buildData.updatedCounter;
	}

	toStringSuccessful() {
		return (
			'[Successful]' +
			this.successful
				.map((item) => {
					return [`Branch ID: ${item.branchID}`, `Status : ${item.status}`].join('\n');
				})
				.join('\n\n')
		);
	}

	toStringFailed() {
		return (
			'[Failed]' +
			this.failed
				.map((item) => {
					return [`Branch ID: ${item.branchID}`, `Status : ${item.status}`].join('\n');
				})
				.join('\n\n')
		);
	}

	getSuccessful() {
		return [...this.successful];
	}

	getFailed() {
		return [...this.failed];
	}

	countResponseItems() {
		return {
			successful: this.successful.length,
			failed: this.failed.length,
			created: this.createdCounter,
			updated: this.updatedCounter,
		};
	}

	static Builder = class {
		private successful: IBulkCreateUpdateResponseData[] = [];
		private failed: IBulkCreateUpdateResponseData[] = [];
		private updatedCounter = 0;
		private createdCounter = 0;

		useAxiosResponse(
			rawResponse: Omit<AxiosResponse<IElasticBulkResponse, any>, 'request' | 'config'>
		) {
			const bulkResponse = extractResponseData<IElasticBulkResponse>(rawResponse);
			const { items, errors } = bulkResponse;

			items.forEach((item) => {
				const faults = this.validateIndexResultStatus({
					id: item?.index?._id,
					result: item?.index?.result,
					successful: item?.index?._shards.successful,
					failed: item?.index?._shards.failed,
				});

				if (faults.length)
					throw Error(
						'[BulkCreateUpdateResponse] : ' +
							faults.join(' | ') +
							JSON.stringify(item, null, 2)
					);

				if (item?.index?._shards.successful > 0 && item?.index?._shards.failed === 0) {
					this.successful.push({
						branchID: item?.index?._id,
						status: item?.index?.result,
					});
				} else if (
					item?.index?._shards.successful === 0 &&
					item?.index?._shards.failed > 0
				) {
					this.failed.push({ branchID: item?.index?._id, status: 'failed' });
				} else
					throw Error(
						'[BulkCreateUpdateResponse] items success\fail count is invalid : ' +
							JSON.stringify(item, null, 2)
					);
			});
			return this;
		}

		private validateIndexResultStatus(data: {
			id: string;
			result: string;
			successful: number;
			failed: number;
		}): string[] {
			const faults: string[] = [];
			if (typeof data.id !== 'string' || !data.id.length) faults.push('item id is invalid');
			if (data.result == 'created') this.createdCounter++;
			else if (data.result == 'updated') this.updatedCounter++;
			else faults.push('item result is invalid');
			if (typeof data.successful !== 'number')
				faults.push('item successful count is invalid');
			if (typeof data.failed !== 'number') faults.push('item failed count is invalid');
			return faults;
		}

		build() {
			return new BulkCreateUpdateResponse({
				failed: this.failed,
				successful: this.successful,
				createdCounter: this.createdCounter,
				updatedCounter: this.updatedCounter,
			});
		}
	};
}
