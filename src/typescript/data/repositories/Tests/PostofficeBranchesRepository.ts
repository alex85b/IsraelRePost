import { ISingleBranchQueryResponse } from "../../../api/elastic/branchServices/BranchServicesIndexing";
import { IBranchIdQnomyCodePair } from "../../models/persistenceModels/PostofficeBranchIdCodePair";
import {
	IPostofficeBranchRecordBuilder,
	PostofficeBranchRecordBuilder,
	useSingleBranchQueryResponse,
} from "../../models/persistenceModels/PostofficeBranchRecord";
import { branchServicesFromRecords } from "../../models/persistenceModels/PostofficeBranchServices";
import { PostofficeBranchesRepository } from "../PostofficeBranchesRepository";

console.log("** Test Postoffice Branches Repository **");

export const getAllBranches = async () => {
	console.log("** (1) Postoffice Branches Repository | Get All Branches **");
	const bRepo = new PostofficeBranchesRepository();
	const allBranches = await bRepo.getAllBranches();
	console.log(
		"[getAllBranches] allBranches demo : ",
		allBranches[0].toString()
	);
};

export const getAllBranchesIdAndQnomyCode = async () => {
	console.log(
		"** (2) Postoffice Branches Repository | Get All Branches Id And Qnomy Code **"
	);
	const bRepo = new PostofficeBranchesRepository();
	const IdAndQnomyCodes = await bRepo.getAllBranchesIdAndQnomyCode();
	console.log(
		"[getAllBranchesIdAndQnomyCode] IdAndQnomyCodes demo : ",
		JSON.stringify(IdAndQnomyCodes, null)
	);
};

export const getAllBranchesIdAndQnomyCodeExcluding = async () => {
	console.log(
		"** (3) Postoffice Branches Repository | Get All Branches Id And Qnomy Code Excluding **"
	);
	const bRepo = new PostofficeBranchesRepository();
	const IdAndQnomyCodes = await bRepo.getAllBranchesIdAndQnomyCodeExcluding([]);
	console.log(
		"[getAllBranchesIdAndQnomyCode] IdAndQnomyCodes demo : ",
		JSON.stringify(IdAndQnomyCodes, null)
	);

	/*
	data.branchRecords.reduce(
		(accumulate: IPostofficeBranchRecord[], current: IPostofficeBranchRecord) => {
			if (current.getIsMakeAppointment()) accumulate.push(current);
			return accumulate;
		},
		[] as IPostofficeBranchRecord[]
	);
	*/
	const exclude = ["113", "114", "115", "116", "117"];
	const idToExclude = IdAndQnomyCodes.reduce(
		(accumulate: string[], current: IBranchIdQnomyCodePair) => {
			if (!exclude.includes(current.branchId))
				accumulate.push(current.branchId);
			return accumulate;
		},
		[] as string[]
	);

	console.log(
		"[getAllBranchesIdAndQnomyCodeExcluding] exclude : ",
		JSON.stringify(idToExclude, null)
	);

	const IdAndQnomyCodes_2 = await bRepo.getAllBranchesIdAndQnomyCodeExcluding(
		idToExclude
	);
	console.log(
		"[getAllBranchesIdAndQnomyCode] IdAndQnomyCodes_2 demo : ",
		JSON.stringify(IdAndQnomyCodes_2, null)
	);
};

export const testUpdateBranchServices = async () => {
	console.log(
		"** (4) Postoffice Branches Repository | Test Update Branch Services **"
	);

	// Demo branch.
	const demoBranch: ISingleBranchQueryResponse = {
		_index: "branches",
		_id: "113",
		_score: 0,
		_source: {
			id: 9,
			branchnumber: 113,
			branchname: "branchname",
			branchnameEN: "branchnameEN",
			city: "city",
			cityEN: "cityEN",
			street: "street",
			streetEN: "streetEN",
			streetcode: "streetcode",
			zip: "123",
			qnomycode: 123,
			qnomyWaitTimeCode: 456,
			haszimuntor: 1,
			isMakeAppointment: 1,
			location: {
				lat: 1.0,
				lon: 1.0,
			},
			services: [{ serviceId: "789", serviceName: "serviceName", dates: [] }],
		},
	};

	console.log(
		"[testUpdateBranchServices] Before update demoBranch : ",
		JSON.stringify(demoBranch, null, 4)
	);

	// { serviceId: '789', serviceName: 'serviceName', dates: [] }
	const servicesModelBuilder = branchServicesFromRecords({
		branchId: String(demoBranch._id),
		branchServices: demoBranch._source.services,
	});

	if (!servicesModelBuilder.branchServices)
		throw Error(
			"[testUpdateBranchServices] BUilder has failed, branchServices in null : " +
				JSON.stringify(servicesModelBuilder.faults, null, 4)
		);

	const servicesModel = servicesModelBuilder.branchServices;

	const bRepo = new PostofficeBranchesRepository();

	const updateResponse = await bRepo.updateBranchServices({
		servicesModel,
	});

	console.log("[testUpdateBranchServices] updateResponse : ", updateResponse);
};
