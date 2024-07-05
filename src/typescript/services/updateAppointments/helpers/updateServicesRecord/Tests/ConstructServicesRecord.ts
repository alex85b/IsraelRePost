import { buildUsingProxyFile } from "../../../../../data/models/dataTransferModels/ProxyEndpointString";
import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from "../../../../../data/repositories/PostofficeBranchesRepository";
import {
	IUpdateErrorRecordsRepository,
	UpdateErrorRecordsRepository,
} from "../../../../../data/repositories/UpdateErrorRecordsRepository";
import { buildPostOfficePerMinuteLimitTracker } from "../../consumptionTracker/RequestTracker";
import {
	ConstructServicesRecord,
	IConstructServicesRecord,
} from "../ConstructServicesRecord";
import path from "path";

console.log("** Test Construct Services Record **");

const demoBranch = {
	_index: "branches",
	_id: "102",
	_version: 1,
	_seq_no: 1,
	_primary_term: 1,
	found: true,
	_source: {
		id: 9,
		branchnumber: 102,
		branchname: "בית הכרם",
		branchnameEN: "Beit Hakerem",
		city: "ירושלים",
		cityEN: "Jerusalem",
		street: "בית הכרם",
		streetEN: "Beit Hakerem",
		streetcode: "101064",
		zip: "9634346",
		qnomycode: 82,
		qnomyWaitTimeCode: 136,
		haszimuntor: 1,
		isMakeAppointment: 1,
		location: {
			lat: 31.7806279,
			lon: 35.1895441,
		},
		services: [],
	},
};

// #############################################################################################
// #############################################################################################
// #############################################################################################

export const testDepleteContinue = async () => {
	console.log(
		"** (1) Test Construct Services Record | Test Deplete Continue **"
	);

	const branchesRepository: IPostofficeBranchesRepository =
		new PostofficeBranchesRepository();
	const errorRepository: IUpdateErrorRecordsRepository =
		new UpdateErrorRecordsRepository();
	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 5,
	});
	const servicesUpdater: IConstructServicesRecord = new ConstructServicesRecord(
		{
			branchesRepository,
			errorRepository,
			requestTracker,
		}
	);

	const { status: firstStatus } = await servicesUpdater.constructRecord({
		serviceIdAndQnomycode: {
			branchId: demoBranch._id,
			qnomycode: demoBranch._source.qnomycode,
		},
	});

	console.log(
		"[testDepleteContinue] servicesUpdater.constructNewServicesRecord status : ",
		firstStatus
	);

	console.log("[testDepleteContinue] memoryView : ", memoryView);

	console.log(
		"[testDepleteContinue] resetTracking 15 : ",
		requestTracker.resetTracking({ sharedLimit: 15, resetLocalMemory: true }) ??
			"Null"
	);

	console.log("[testDepleteContinue] memoryView : ", memoryView);

	const {
		status: secondStatus,
		errorsBuilder: secondErrorsBuilder,
		servicesBuilder: secondServicesBuilder,
	} = await servicesUpdater.constructRecord({
		serviceIdAndQnomycode: {
			branchId: demoBranch._id,
			qnomycode: demoBranch._source.qnomycode,
		},
	});

	console.log(
		"[testDepleteContinue] servicesUpdater.constructNewServicesRecord status : ",
		secondStatus
	);

	console.log("[testDepleteContinue] memoryView : ", memoryView);

	console.log(
		"[testDepleteContinue] servicesBuilder.build : ",
		secondServicesBuilder.build(String(demoBranch._source.qnomycode)).toString()
	);

	console.log(
		"[testDepleteContinue] errorsBuilder.build : ",
		secondErrorsBuilder.build(String(demoBranch._source.qnomycode)).toString()
	);
};

// #############################################################################################
// #############################################################################################
// #############################################################################################

export const testDepleteContinueUseProxy = async () => {
	console.log(
		"** (2) Test Construct Services Record | Test Deplete Continue Use Proxy **"
	);

	const branchesRepository: IPostofficeBranchesRepository =
		new PostofficeBranchesRepository();
	const errorRepository: IUpdateErrorRecordsRepository =
		new UpdateErrorRecordsRepository();
	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 5,
	});
	const servicesUpdater: IConstructServicesRecord = new ConstructServicesRecord(
		{
			branchesRepository,
			errorRepository,
			requestTracker,
		}
	);

	const { status: firstStatus } = await servicesUpdater.constructRecord({
		serviceIdAndQnomycode: {
			branchId: demoBranch._id,
			qnomycode: demoBranch._source.qnomycode,
		},
		endpointProxyString: await gerProxyEndpoint(),
	});

	console.log(
		"[testDepleteContinueUseProxy] servicesUpdater.constructNewServicesRecord status : ",
		firstStatus
	);

	console.log("[testDepleteContinueUseProxy] memoryView : ", memoryView);

	console.log(
		"[testDepleteContinueUseProxy] resetTracking 15 : ",
		requestTracker.resetTracking({ sharedLimit: 15, resetLocalMemory: true }) ??
			"Null"
	);

	console.log("[testDepleteContinueUseProxy] memoryView : ", memoryView);

	const {
		status: secondStatus,
		errorsBuilder: secondErrorsBuilder,
		servicesBuilder: secondServicesBuilder,
	} = await servicesUpdater.constructRecord({
		serviceIdAndQnomycode: {
			branchId: demoBranch._id,
			qnomycode: demoBranch._source.qnomycode,
		},
		endpointProxyString: await gerProxyEndpoint(),
	});

	console.log(
		"[testDepleteContinueUseProxy] servicesUpdater.constructNewServicesRecord status : ",
		secondStatus
	);

	console.log("[testDepleteContinueUseProxy] memoryView : ", memoryView);

	console.log(
		"[testDepleteContinueUseProxy] servicesBuilder.build : ",
		secondServicesBuilder.build(String(demoBranch._source.qnomycode)).toString()
	);

	console.log(
		"[testDepleteContinueUseProxy] errorsBuilder.build : ",
		secondErrorsBuilder.build(String(demoBranch._source.qnomycode)).toString()
	);
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

const gerProxyEndpoint = async (): Promise<string> => {
	const envFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		".env"
	);
	console.log("[gerProxyEndpoint] path to env : ", envFilepath);
	const proxyFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"WebShare.txt"
	);
	console.log("[gerProxyEndpoint] path to proxy file path : ", proxyFilepath);

	const proxyEndpoints = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: "PROX_WBSHA_PAS",
		envUsernameKey: "PROX_WBSHA_USR",
	});

	console.log("[gerProxyEndpoint] proxyEndpoint : ", proxyEndpoints[0]);
	return proxyEndpoints[0];
};
