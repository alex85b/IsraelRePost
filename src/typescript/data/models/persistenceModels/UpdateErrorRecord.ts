import { IErrorMapping } from '../../../api/elastic/updateErrors/UpdateErrorsIndexing';

export interface IPostofficeUpdateErrorBuilder {}
export interface IPostofficeUpdateError {}
export class PostofficeUpdateErrorBuilder implements IPostofficeUpdateErrorBuilder {
	private updateErrorDocument: IErrorMapping;
	private PostofficeUpdateError = class implements IPostofficeUpdateError {};
	private faults: string[];
	constructor() {
		this.updateErrorDocument = {
			userError: '',
			services: [],
		};
		this.faults = [];
	}
}
