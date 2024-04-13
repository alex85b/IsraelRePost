import {
	IDocumentBranch,
	INewServiceRecord,
	ISingleBranchQueryResponse,
} from '../../elastic/BranchModel';

export interface IPostofficeBranchRecord {
	getServices(): INewServiceRecord[];
	getBranchDocumentCopy(): IDocumentBranch;
	setServices(services: INewServiceRecord[]): void;
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

		useSingleBranchQueryResponse(data: { rawQueryResponse: ISingleBranchQueryResponse }) {
			const { _source } = data.rawQueryResponse;

			this.withBranchId({ id: _source.id })
				.withBranchNumber({ branchnumber: _source.id })
				.withBranchName({ branchname: _source.branchname })
				.withBranchNameEN({ branchnameEN: _source.branchnameEN })
				.withCity({ city: _source.city })
				.withCityEN({ cityEN: _source.cityEN })
				.withStreet({ street: _source.street ?? 'null' })
				.withStreetEN({ streetEN: _source.streetEN ?? 'null' })
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
			if (typeof data.branchname !== 'string' || !data.branchname.length) {
				this.faults.push('branchname is not valid string');
			} else this.branchDocument.branchname = data.branchname;
			return this;
		}

		withBranchNameEN(data: { branchnameEN: string }) {
			if (typeof data.branchnameEN !== 'string') {
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
			if (typeof data.cityEN !== 'string') {
				this.faults.push('branch cityEN is not valid string');
			} else this.branchDocument.cityEN = data.cityEN;
			return this;
		}

		withStreet(data: { street: string }) {
			if (typeof data.street !== 'string') {
				this.faults.push('branch street is invalid');
			} else this.branchDocument.street = data.street;
			return this;
		}

		withStreetEN(data: { streetEN: string }) {
			if (typeof data.streetEN !== 'string') {
				this.faults.push('branch streetEN is invalid');
			} else this.branchDocument.streetEN = data.streetEN;
			return this;
		}

		withStreetCode(data: { streetcode: string }) {
			if (typeof data.streetcode !== 'string') {
				this.faults.push('branch streetEN is not valid string');
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
				throw Error('[PostofficeBranchRecord] Errors : ' + this.faults.join(' | '));
			return new PostofficeBranchRecord({ branchDocument: this.branchDocument });
		}
	};
}
