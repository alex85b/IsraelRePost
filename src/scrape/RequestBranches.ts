import { LoadBranchesBuilder } from '../api-requests/load-braches';
import { MakeRequest } from '../api-requests/make-request';
import { IBranch } from '../common/interfaces/IBranch';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { IDocumentBranch } from '../common/interfaces/IDocumentBranch';

// Define the response to the LoadBranches server request.
interface ILoadBranchesResponse {
	branches: IBranch[];
}

export interface IRequestBranchesResponse {
	filteredBranches: IDocumentBranch[];
}

export const requestBranches = async (requestSetup: {
	cookieObj: ICookiesObject;
	htmlToken: string;
}) => {
	const { cookieObj, htmlToken } = requestSetup;
	const branchesList = (
		await MakeRequest(
			new LoadBranchesBuilder(cookieObj, undefined, undefined, {
				__RequestVerificationToken: htmlToken,
			})
		)
	).data as ILoadBranchesResponse;
	console.log('### [requestBranches] Fetch all branches : Done ###');

	console.log(
		'### [requestBranches] Dataset size before filtering ### : ',
		Object.keys(branchesList.branches).length
	);

	// Filter out the all the kiosks and shops that only offer mail pickup services.
	const filteredBranches: IDocumentBranch[] = branchesList.branches.reduce(
		(accumulator: IDocumentBranch[], branch: IBranch) => {
			if (branch.qnomycode !== 0) {
				const newBranch: IDocumentBranch = {
					id: branch.id,
					branchnumber: branch.branchnumber,
					branchname: branch.branchname,
					branchnameEN: branch.branchnameEN || '',
					city: branch.city,
					cityEN: branch.cityEN || '',
					street: branch.street,
					streetEN: branch.streetEN || '',
					streetcode: branch.streetcode || '',
					zip: branch.zip,
					qnomycode: branch.qnomycode,
					qnomyWaitTimeCode: branch.qnomyWaitTimeCode,
					haszimuntor: branch.haszimuntor,
					isMakeAppointment: branch.haszimuntor,
					location: {
						// This conforms to elastic's { type: 'geo_point' } mapping upon 'location'.
						lat: branch.geocode_latitude,
						lon: branch.geocode_longitude,
					},
				};

				accumulator.push(newBranch);
			}
			return accumulator;
		},
		[]
	);
	console.log(
		'### [requestBranches] Filter and transform branch-list : Done ###'
	);

	console.log(
		'### [requestBranches] Dataset size after filtering ### : ',
		Object.keys(filteredBranches).length
	);

	return { filteredBranches: filteredBranches };
};
