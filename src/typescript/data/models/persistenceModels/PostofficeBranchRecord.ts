import { IXhrBranch } from '../../../services/updateBranches/helpers/scrape/base/PuppeteerClient';
import {
	IDocumentBranch,
	INewServiceRecord,
	ISingleBranchQueryResponse,
} from '../../elastic/BranchModel';
import { branchServicesFromRecords } from './PostofficeBranchServices';
import { isValidNumber, isValidString, validateAndAssign } from '../shared/FieldValidation';

// ###########################################################################################
// ### Builder and Builder-product Interfaces ################################################
// ###########################################################################################

export interface IPostofficeBranchRecord {
	getServices(): INewServiceRecord[];
	getBranchDocumentCopy(): IDocumentBranch;
	setServices(services: INewServiceRecord[]): void;
	getIsMakeAppointment(): number;
	getBranchNumber(): number;
	getBranchNameEn(): string;
	getBranchIdAndQnomycode(): number;
	toString(): string;
}

export interface IPostofficeBranchRecordBuilder {
	withBranchId(data: { id: number }): this;
	withBranchNumber(data: { branchnumber: number }): this;
	withBranchName(data: { branchname: string }): this;
	withBranchNameEN(data: { branchnameEN: string }): this;
	withCity(data: { city: string }): this;
	withCityEN(data: { cityEN: string }): this;
	withStreet(data: { street: string }): this;
	withStreetEN(data: { streetEN: string }): this;
	withStreetCode(data: { streetcode: string }): this;
	withZip(data: { zip: string }): this;
	withQnomyCode(data: { qnomycode: number }): this;
	withQnomyWaitTimeCode(data: { qnomyWaitTimeCode: number }): this;
	withHasZimunTor(data: { haszimuntor: number }): this;
	withIsMakeAppointment(data: { isMakeAppointment: number }): this;
	withLocation(data: { location: { lat: number; lon: number } }): this;
	withServices(data: { services: INewServiceRecord[] }): this;
	build(): IPostofficeBranchRecord;
}

// ###########################################################################################
// ### IPostofficeBranchRecordBuilder Implementation #########################################
// ###########################################################################################

export class PostofficeBranchRecordBuilder implements IPostofficeBranchRecordBuilder {
	private branchDocument: IDocumentBranch;
	private faults: string[] = [];
	private PostofficeBranchRecord = class implements IPostofficeBranchRecord {
		private branchDocument: IDocumentBranch;

		constructor(buildData: { branchDocument: IDocumentBranch }) {
			this.branchDocument = buildData.branchDocument;
		}

		getServices(): INewServiceRecord[] {
			return this.branchDocument.services;
		}

		getBranchDocumentCopy(): IDocumentBranch {
			return { ...this.branchDocument };
		}

		setServices(services: INewServiceRecord[]): void {
			this.branchDocument.services = services;
		}

		getBranchNumber(): number {
			return this.branchDocument.branchnumber;
		}

		getBranchNameEn(): string {
			return this.branchDocument.branchnameEN;
		}

		getIsMakeAppointment(): number {
			return this.branchDocument.isMakeAppointment;
		}

		getBranchIdAndQnomycode(): number {
			return this.branchDocument.qnomycode;
		}

		toString(): string {
			return JSON.stringify(this.branchDocument, null, 3);
		}
	};

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

	withBranchId(data: { id: number }) {
		validateAndAssign({
			value: data.id,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument,
			assignKey: 'id',
			faults: this.faults,
			errorMessage: 'branch id is not valid number',
		});
		return this;
	}

	withBranchNumber(data: { branchnumber: number }) {
		validateAndAssign({
			value: data.branchnumber,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument,
			assignKey: 'branchnumber',
			faults: this.faults,
			errorMessage: 'branchnumber is not valid number',
		});
		return this;
	}

	withBranchName(data: { branchname: string }) {
		validateAndAssign({
			value: data.branchname,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'branchname',
			faults: this.faults,
			errorMessage: 'branchname is not valid string',
		});
		return this;
	}

	withBranchNameEN(data: { branchnameEN: string }) {
		validateAndAssign({
			value: data.branchnameEN,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'branchnameEN',
			faults: this.faults,
			errorMessage: 'branchnameEN is not valid string',
		});
		return this;
	}

	withCity(data: { city: string }) {
		validateAndAssign({
			value: data.city,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'city',
			faults: this.faults,
			errorMessage: 'branch city is not valid string',
		});
		return this;
	}

	withCityEN(data: { cityEN: string }) {
		validateAndAssign({
			value: data.cityEN,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'cityEN',
			faults: this.faults,
			errorMessage: 'branch cityEN is not valid string',
		});
		return this;
	}

	withStreet(data: { street: string }) {
		validateAndAssign({
			value: data.street,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'street',
			faults: this.faults,
			errorMessage: 'branch street is invalid',
		});
		return this;
	}

	withStreetEN(data: { streetEN: string }) {
		validateAndAssign({
			value: data.streetEN,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'streetEN',
			faults: this.faults,
			errorMessage: 'branch streetEN is invalid',
		});
		return this;
	}

	withStreetCode(data: { streetcode: string }) {
		validateAndAssign({
			value: data.streetcode,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'streetcode',
			faults: this.faults,
			errorMessage: 'branch streetcode is not valid',
		});
		return this;
	}

	withZip(data: { zip: string }) {
		validateAndAssign({
			value: data.zip,
			validatorFunction: isValidString,
			assignTarget: this.branchDocument,
			assignKey: 'zip',
			faults: this.faults,
			errorMessage: 'branch zip code is not valid string',
		});
		return this;
	}

	withQnomyCode(data: { qnomycode: number }) {
		validateAndAssign({
			value: data.qnomycode,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument,
			assignKey: 'qnomycode',
			faults: this.faults,
			errorMessage: 'branch qnomy-code is not valid number',
		});
		return this;
	}

	withQnomyWaitTimeCode(data: { qnomyWaitTimeCode: number }) {
		validateAndAssign({
			value: data.qnomyWaitTimeCode,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument,
			assignKey: 'qnomyWaitTimeCode',
			faults: this.faults,
			errorMessage: 'branch qnomyWaitTimeCode is not valid number',
		});
		return this;
	}

	withHasZimunTor(data: { haszimuntor: number }) {
		validateAndAssign({
			value: data.haszimuntor,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument,
			assignKey: 'haszimuntor',
			faults: this.faults,
			errorMessage: 'branch haszimuntor is not valid number',
		});
		return this;
	}

	withIsMakeAppointment(data: { isMakeAppointment: number }) {
		validateAndAssign({
			value: data.isMakeAppointment,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument,
			assignKey: 'isMakeAppointment',
			faults: this.faults,
			errorMessage: 'branch isMakeAppointment is not valid number',
		});
		return this;
	}

	withLocation(data: { location: { lat: number; lon: number } }) {
		validateAndAssign({
			value: data.location.lat,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument.location,
			assignKey: 'lat',
			faults: this.faults,
			errorMessage: 'branch location latitude is not valid number',
		});

		validateAndAssign({
			value: data.location.lon,
			validatorFunction: isValidNumber,
			assignTarget: this.branchDocument.location,
			assignKey: 'lon',
			faults: this.faults,
			errorMessage: 'branch location longitude is not valid number',
		});

		return this;
	}

	withServices(data: { services: INewServiceRecord[] }) {
		const { branchServices, faults } = branchServicesFromRecords({
			branchId: String(this.branchDocument.id ?? ''),
			branchServices: data.services,
		});
		if (faults.length) faults.forEach((fault) => this.faults.push(fault));
		if (branchServices) this.branchDocument.services = branchServices.getServices();
		this.branchDocument.services = data.services;
		return this;
	}

	build() {
		if (this.faults.length)
			throw Error(
				'[PostofficeBranchRecord] Errors : ' +
					JSON.stringify(this.branchDocument, null, 3) +
					' ' +
					this.faults.join(' | ')
			);
		return new this.PostofficeBranchRecord({ branchDocument: this.branchDocument });
	}
}

// ###########################################################################################
// ### Helper Functions ######################################################################
// ###########################################################################################

const fixEmptyNulledString = (data: { fieldValue: any; fieldName: string }) => {
	let returnFieldValue = data.fieldValue;
	if (typeof returnFieldValue === 'object')
		returnFieldValue = JSON.stringify(returnFieldValue, null, 3);
	if (typeof returnFieldValue !== 'string') return returnFieldValue;
	return returnFieldValue ? (returnFieldValue.length ? returnFieldValue : 'EMPTY') : 'NULL';
};

const fixIncomingXhrBranch = (data: { rawXhrObject: IXhrBranch }) => {
	const { rawXhrObject } = data;
	rawXhrObject.branchnameEN = fixEmptyNulledString({
		fieldValue: rawXhrObject.branchnameEN,
		fieldName: 'branchnameEN',
	});
	rawXhrObject.city = fixEmptyNulledString({
		fieldValue: rawXhrObject.city,
		fieldName: 'city',
	});
	rawXhrObject.cityEN = fixEmptyNulledString({
		fieldValue: rawXhrObject.cityEN,
		fieldName: 'cityEN',
	});
	rawXhrObject.street = fixEmptyNulledString({
		fieldValue: rawXhrObject.street,
		fieldName: 'street',
	});
	rawXhrObject.streetEN = fixEmptyNulledString({
		fieldValue: rawXhrObject.streetEN,
		fieldName: 'streetEN',
	});
	rawXhrObject.streetcode = fixEmptyNulledString({
		fieldValue: rawXhrObject.streetcode,
		fieldName: 'streetcode',
	});
};

// ###########################################################################################
// ### Branch Builder Implementations ########################################################
// ###########################################################################################

/*
Creates PostofficeBranchRecordBuilder using ISingleBranchQueryResponse*/
// ####################################################################

export interface IBuildBranchFromSingleBranchResponse {
	(data: { rawQueryResponse: ISingleBranchQueryResponse }): IPostofficeBranchRecordBuilder;
}

export const useSingleBranchQueryResponse: IBuildBranchFromSingleBranchResponse = (data: {
	rawQueryResponse: ISingleBranchQueryResponse;
}) => {
	const { _source } = data.rawQueryResponse;
	const builder: IPostofficeBranchRecordBuilder = new PostofficeBranchRecordBuilder()
		.withBranchId({ id: _source.id })
		.withBranchNumber({ branchnumber: _source.branchnumber })
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
	return builder;
};

/*
Creates PostofficeBranchRecordBuilder using IXhrBranch*/
// ####################################################

export interface IBuildBranchFromRawXhrObject {
	(data: { rawXhrObject: IXhrBranch }): IPostofficeBranchRecordBuilder;
}

export const useXhrLoadBranches: IBuildBranchFromRawXhrObject = (data: {
	rawXhrObject: IXhrBranch;
}) => {
	const { rawXhrObject } = data;

	fixIncomingXhrBranch({ rawXhrObject: rawXhrObject });

	const builder: IPostofficeBranchRecordBuilder = new PostofficeBranchRecordBuilder()
		.withBranchId({ id: rawXhrObject.id })
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

	return builder;
};
