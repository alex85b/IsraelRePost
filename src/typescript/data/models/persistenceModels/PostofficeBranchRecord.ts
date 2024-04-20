import { IXhrBranch } from '../../../services/updateBranches/helpers/scrape/base/PuppeteerClient';
import {
	IDocumentBranch,
	INewServiceRecord,
	ISingleBranchQueryResponse,
} from '../../elastic/BranchModel';

export interface IPostofficeBranchRecord {
	getServices(): INewServiceRecord[];
	getBranchDocumentCopy(): IDocumentBranch;
	setServices(services: INewServiceRecord[]): void;
	getIsMakeAppointment(): number;
	getBranchID(): number;
	getBranchNameEn(): string;
	toString(): string;
}

export class PostofficeBranchRecord implements IPostofficeBranchRecord {
	private branchDocument: IDocumentBranch;

	private constructor(buildData: { branchDocument: IDocumentBranch }) {
		this.branchDocument = buildData.branchDocument;
	}

	getServices() {
		return this.branchDocument.services;
	}

	getBranchDocumentCopy() {
		return { ...this.branchDocument };
	}

	setServices(services: INewServiceRecord[]) {
		this.branchDocument.services = services;
	}

	getBranchID() {
		return this.branchDocument.id;
	}

	getBranchNameEn() {
		return this.branchDocument.branchnameEN;
	}

	getIsMakeAppointment() {
		return this.branchDocument.isMakeAppointment;
	}

	toString() {
		return JSON.stringify(this.branchDocument, null, 2);
	}

	static Builder = class {
		private branchDocument: IDocumentBranch;
		private faults: string[] = [];
		constructor() {
			this.branchDocument = {
				id: -1,
				branchnumber: -1,
				branchname: '',
				branchnameEN: '',
				city: '',
				cityEN: '',
				street: '',
				streetEN: '',
				streetcode: '',
				zip: '',
				qnomycode: -1,
				qnomyWaitTimeCode: -1,
				haszimuntor: -1,
				isMakeAppointment: -1,
				location: {
					lat: -1,
					lon: -1,
				},
				services: [],
			};
		}

		private fixEmptyNulledString(data: { fieldValue: any; fieldName: string }) {
			let returnFieldValue = data.fieldValue;
			if (typeof returnFieldValue === 'object')
				returnFieldValue = JSON.stringify(returnFieldValue);
			if (typeof returnFieldValue !== 'string') return returnFieldValue;
			return returnFieldValue
				? returnFieldValue.length
					? returnFieldValue
					: 'EMPTY'
				: 'NULL';
		}

		private fixIncomingXhrBranch(data: { rawXhrObject: IXhrBranch }) {
			const { rawXhrObject } = data;
			rawXhrObject.branchnameEN = this.fixEmptyNulledString({
				fieldValue: rawXhrObject.branchnameEN,
				fieldName: 'branchnameEN',
			});
			rawXhrObject.city = this.fixEmptyNulledString({
				fieldValue: rawXhrObject.city,
				fieldName: 'city',
			});
			rawXhrObject.cityEN = this.fixEmptyNulledString({
				fieldValue: rawXhrObject.cityEN,
				fieldName: 'cityEN',
			});
			rawXhrObject.street = this.fixEmptyNulledString({
				fieldValue: rawXhrObject.street,
				fieldName: 'street',
			});
			rawXhrObject.streetEN = this.fixEmptyNulledString({
				fieldValue: rawXhrObject.streetEN,
				fieldName: 'streetEN',
			});
			rawXhrObject.streetcode = this.fixEmptyNulledString({
				fieldValue: rawXhrObject.streetcode,
				fieldName: 'streetcode',
			});
		}

		useSingleBranchQueryResponse(data: { rawQueryResponse: ISingleBranchQueryResponse }) {
			const { _source } = data.rawQueryResponse;
			this.withBranchId({ id: _source.id })
				.withBranchNumber({ branchnumber: _source.id })
				.withBranchName({ branchname: _source.branchname })
				.withBranchNameEN({ branchnameEN: _source.branchnameEN })
				.withCity({ city: _source.city })
				.withCityEN({ cityEN: _source.cityEN })
				.withStreet({ street: _source.street })
				.withStreetEN({ streetEN: _source.streetEN })
				.withStreetCode({ streetcode: _source.streetcode })
				.withZip({ zip: _source.zip })
				.withQnomyCode({ qnomycode: _source.qnomycode })
				.withQnomyWaitTimeCode({ qnomyWaitTimeCode: _source.qnomyWaitTimeCode })
				.withHasZimunTor({ haszimuntor: _source.haszimuntor })
				.withIsMakeAppointment({ isMakeAppointment: _source.isMakeAppointment })
				.withLocation({ location: _source.location })
				.withServices({ services: _source.services });
			return this;
		}

		useXhrLoadBranches(data: { rawXhrObject: IXhrBranch }) {
			const { rawXhrObject } = data;

			this.fixIncomingXhrBranch({ rawXhrObject: rawXhrObject });

			this.withBranchId({ id: rawXhrObject.id })
				.withBranchNumber({ branchnumber: rawXhrObject.branchnumber })
				.withBranchName({ branchname: rawXhrObject.branchname })
				.withBranchNameEN({ branchnameEN: rawXhrObject.branchnameEN })
				.withCity({ city: rawXhrObject.city })
				.withCityEN({ cityEN: rawXhrObject.cityEN })
				.withStreet({ street: rawXhrObject.street })
				.withStreetEN({ streetEN: rawXhrObject.streetEN })
				.withStreetCode({ streetcode: rawXhrObject.streetcode })
				.withZip({ zip: rawXhrObject.zip })
				.withQnomyCode({ qnomycode: rawXhrObject.qnomycode })
				.withQnomyWaitTimeCode({ qnomyWaitTimeCode: rawXhrObject.qnomyWaitTimeCode })
				.withHasZimunTor({ haszimuntor: rawXhrObject.haszimuntor })
				.withIsMakeAppointment({
					isMakeAppointment: rawXhrObject.isMakeAppointment ? 1 : 0,
				})
				.withLocation({
					location: {
						lat: rawXhrObject.geocode_latitude,
						lon: rawXhrObject.geocode_longitude,
					},
				})
				.withServices({ services: [] });

			return this;
		}

		private isNonEmptyString(data: { stringValue: string }) {
			if (typeof data.stringValue !== 'string' || !data.stringValue.length) {
				return false;
			}
			return true;
		}

		withBranchId(data: { id: number }) {
			if (typeof data.id !== 'number' || data.id < 0) {
				this.faults.push('branch id is not valid number');
			} else this.branchDocument.id = data.id;
			return this;
		}

		withBranchNumber(data: { branchnumber: number }) {
			if (typeof data.branchnumber !== 'number' || data.branchnumber < 0) {
				this.faults.push('branchnumber is not valid number');
			} else this.branchDocument.branchnumber = data.branchnumber;
			return this;
		}

		withBranchName(data: { branchname: string }) {
			if (this.isNonEmptyString({ stringValue: data.branchname }))
				if (typeof data.branchname !== 'string' || !data.branchname.length) {
					this.faults.push('branchname is not valid string');
				} else this.branchDocument.branchname = data.branchname;
			return this;
		}

		withBranchNameEN(data: { branchnameEN: string }) {
			if (typeof data.branchnameEN !== 'string' || !data.branchnameEN.length) {
				this.faults.push('branchnameEN is not valid string');
			} else this.branchDocument.branchnameEN = data.branchnameEN;
			return this;
		}

		withCity(data: { city: string }) {
			if (typeof data.city !== 'string' || !data.city.length) {
				this.faults.push('branch city is not valid string');
			} else this.branchDocument.city = data.city;
			return this;
		}

		withCityEN(data: { cityEN: string }) {
			if (typeof data.cityEN !== 'string' || !data.cityEN.length) {
				this.faults.push('branch cityEN is not valid string');
			} else this.branchDocument.cityEN = data.cityEN;
			return this;
		}

		withStreet(data: { street: string }) {
			if (typeof data.street !== 'string' || !data.street.length) {
				this.faults.push('branch street is invalid');
			} else this.branchDocument.street = data.street;
			return this;
		}

		withStreetEN(data: { streetEN: string }) {
			if (typeof data.streetEN !== 'string' || !data.streetEN.length) {
				this.faults.push('branch streetEN is invalid');
			} else this.branchDocument.streetEN = data.streetEN;
			return this;
		}

		withStreetCode(data: { streetcode: string }) {
			if (typeof data.streetcode !== 'string' || !data.streetcode.length) {
				this.faults.push('branch streetcode is not valid');
			} else this.branchDocument.streetcode = data.streetcode;
			return this;
		}

		withZip(data: { zip: string }) {
			if (typeof data.zip !== 'string' || !data.zip.length) {
				this.faults.push('branch zip code is not valid string');
			} else this.branchDocument.zip = data.zip;
			return this;
		}

		withQnomyCode(data: { qnomycode: number }) {
			if (typeof data.qnomycode !== 'number' || data.qnomycode < 0) {
				this.faults.push('branch qnomy-code is not valid number');
			} else this.branchDocument.qnomycode = data.qnomycode;
			return this;
		}

		withQnomyWaitTimeCode(data: { qnomyWaitTimeCode: number }) {
			if (typeof data.qnomyWaitTimeCode !== 'number' || data.qnomyWaitTimeCode < 0) {
				this.faults.push('branch qnomyWaitTimeCode is not valid number');
			} else this.branchDocument.qnomyWaitTimeCode = data.qnomyWaitTimeCode;
			return this;
		}

		withHasZimunTor(data: { haszimuntor: number }) {
			if (typeof data.haszimuntor !== 'number' || data.haszimuntor < 0) {
				this.faults.push('branch haszimuntor is not valid number');
			} else this.branchDocument.haszimuntor = data.haszimuntor;
			return this;
		}

		withIsMakeAppointment(data: { isMakeAppointment: number }) {
			if (typeof data.isMakeAppointment !== 'number' || data.isMakeAppointment < 0) {
				this.faults.push('branch isMakeAppointment is not valid number');
			} else this.branchDocument.isMakeAppointment = data.isMakeAppointment;
			return this;
		}

		withLocation(data: { location: { lat: number; lon: number } }) {
			let success = true;
			if (typeof data.location.lat !== 'number' || data.location.lat < 0) {
				this.faults.push('branch location latitude is not valid number');
			} else this.branchDocument.location.lat = data.location.lat;

			if (typeof data.location.lon !== 'number' || data.location.lon < 0) {
				this.faults.push('branch location longitude is not valid number');
			} else this.branchDocument.location.lon = data.location.lon;

			return this;
		}

		withServices(data: { services: INewServiceRecord[] }) {
			// TODO: Make this function to depend on 'Services' Model.
			this.branchDocument.services = data.services;
			return this;
		}

		build() {
			if (this.faults.length)
				throw Error(
					'[PostofficeBranchRecord] Errors : ' +
						JSON.stringify(this.branchDocument, null, 3) +
						this.faults.join(' | ')
				);
			return new PostofficeBranchRecord({ branchDocument: this.branchDocument });
		}
	};
}
