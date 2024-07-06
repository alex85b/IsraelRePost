import { buildUsingProxyFile } from "../../../../../data/models/dataTransferModels/ProxyEndpointString";
import {
	IPostofficeBranchServicesBuilder,
	PostofficeBranchServicesBuilder,
} from "../../../../../data/models/persistenceModels/PostofficeBranchServices";
import {
	IPostofficeUpdateErrorBuilder,
	PostofficeUpdateErrorBuilder,
} from "../../../../../data/models/persistenceModels/UpdateErrorRecord";
import {
	CreateUserNode,
	IPostofficeRequestNode,
} from "../PostofficeRequestNodes";
import path from "path";

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

console.log("** Test Fetch Branch Services **");

export const testCreateUserNode = async (
	skipBuild?: boolean
): Promise<{
	nodes: IPostofficeRequestNode[];
	servicesModelBuilder: IPostofficeBranchServicesBuilder;
	errorModelBuilder: IPostofficeUpdateErrorBuilder;
}> => {
	console.log("** (1) Test Fetch Branch Services | Test Create User Node **");
	const servicesModelBuilder: IPostofficeBranchServicesBuilder =
		new PostofficeBranchServicesBuilder();
	const errorModelBuilder: IPostofficeUpdateErrorBuilder =
		new PostofficeUpdateErrorBuilder();

	// Demo branch.
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

	const createUserNode = new CreateUserNode({
		errorModelBuilder,
		servicesModelBuilder,
		qnomyCodeLocationId: String(demoBranch._source.qnomycode),
	});

	const serviceNodes = await createUserNode.performRequest();
	console.log(
		"[testCreateUserNode] serviceNodes length : ",
		serviceNodes.length
	);

	if (!skipBuild) {
		console.log(
			"[testCreateUserNode] servicesModelBuilder : ",
			servicesModelBuilder.build(demoBranch._id).toString()
		);

		console.log(
			"[testCreateUserNode] servicesModelBuilder : ",
			errorModelBuilder.build(demoBranch._id).toString()
		);
	}
	console.log(
		"[testCreateUserNode] serviceNodes toString : ",
		createUserNode.toString()
	);
	return { nodes: serviceNodes, servicesModelBuilder, errorModelBuilder };
};

/*
Create User Node - Use proxy */
// ###########################
export const testCreateUserNodeUsingProxy = async (
	skipBuild?: boolean
): Promise<{
	nodes: IPostofficeRequestNode[];
	servicesModelBuilder: IPostofficeBranchServicesBuilder;
	errorModelBuilder: IPostofficeUpdateErrorBuilder;
	proxyEndpoint: string;
	branchID: string;
}> => {
	console.log(
		"** (1) Test Fetch Branch Services | Test Create User Node Using Proxy **"
	);
	const servicesModelBuilder: IPostofficeBranchServicesBuilder =
		new PostofficeBranchServicesBuilder();
	const errorModelBuilder: IPostofficeUpdateErrorBuilder =
		new PostofficeUpdateErrorBuilder();

	// Demo branch.
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
	console.log("[testCreateUserNodeUsingProxy] path to env : ", envFilepath);
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
	console.log(
		"[testCreateUserNodeUsingProxy] path to proxy file path : ",
		proxyFilepath
	);

	const proxyEndpoints = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: "PROX_WBSHA_PAS",
		envUsernameKey: "PROX_WBSHA_USR",
	});

	const createUserNode: IPostofficeRequestNode = new CreateUserNode({
		errorModelBuilder,
		servicesModelBuilder,
		qnomyCodeLocationId: String(demoBranch._source.qnomycode),
		endpointProxyString: proxyEndpoints[0],
	});

	const serviceNodes = await createUserNode.performRequest();
	console.log(
		"[testCreateUserNodeUsingProxy] serviceNodes length : ",
		serviceNodes.length
	);

	if (!skipBuild) {
		console.log(
			"[testCreateUserNodeUsingProxy] servicesModelBuilder : ",
			servicesModelBuilder.build(demoBranch._id).toString()
		);

		console.log(
			"[testCreateUserNodeUsingProxy] servicesModelBuilder : ",
			errorModelBuilder.build(demoBranch._id).toString()
		);
	}
	console.log(
		"[testCreateUserNodeUsingProxy] serviceNodes toString : ",
		createUserNode.toString()
	);
	return {
		nodes: serviceNodes,
		servicesModelBuilder,
		errorModelBuilder,
		proxyEndpoint: proxyEndpoints[0],
		branchID: demoBranch._id,
	};
};

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

export const testFetchServicesNode = async (
	skipBuild?: boolean
): Promise<{
	nodes: IPostofficeRequestNode[];
	servicesModelBuilder: IPostofficeBranchServicesBuilder;
	errorModelBuilder: IPostofficeUpdateErrorBuilder;
}> => {
	console.log(
		"** (2) Test Fetch Branch Services | Test Fetch Services Node **"
	);

	const {
		nodes: services,
		errorModelBuilder,
		servicesModelBuilder,
	} = await testCreateUserNode(true);
	if (!services[0])
		throw Error(
			"[TestFetchBranchServices][testFetchServicesNode] No Service Node"
		);

	try {
		const service0Dates = await services[0].performRequest();
		console.log(
			"[testFetchServicesNode] service0Dates length : ",
			service0Dates.length
		);
		return { nodes: service0Dates, servicesModelBuilder, errorModelBuilder };
	} finally {
		if (!skipBuild) {
			console.log(
				"[testFetchServicesNode] servicesModelBuilder : ",
				servicesModelBuilder.build("999").toString()
			);

			console.log(
				"[testFetchServicesNode] servicesModelBuilder : ",
				errorModelBuilder.build("999").toString()
			);
		}
	}
};

/*
Create Services Node - Use proxy */
// ###############################
export const testFetchServicesNodeUsingProxy = async (
	skipBuild?: boolean
): Promise<{
	nodes: IPostofficeRequestNode[];
	servicesModelBuilder: IPostofficeBranchServicesBuilder;
	errorModelBuilder: IPostofficeUpdateErrorBuilder;
	proxyEndpoint: string;
	branchID: string;
}> => {
	console.log(
		"** (2) Test Fetch Branch Services | Test Fetch Services Node Using Proxy **"
	);

	const {
		nodes: services,
		errorModelBuilder,
		servicesModelBuilder,
		proxyEndpoint,
		branchID,
	} = await testCreateUserNodeUsingProxy(true);

	if (!services[0])
		throw Error("[testFetchServicesNodeUsingProxy] No Service Node");

	try {
		const service0Dates = await services[0].performRequest();
		console.log(
			"[testFetchServicesNodeUsingProxy] service0Dates length : ",
			service0Dates.length
		);
		return {
			nodes: service0Dates,
			servicesModelBuilder,
			errorModelBuilder,
			branchID,
			proxyEndpoint,
		};
	} finally {
		if (!skipBuild) {
			console.log(
				"[testFetchServicesNodeUsingProxy] servicesModelBuilder : ",
				servicesModelBuilder.build(branchID).toString()
			);

			console.log(
				"[testFetchServicesNodeUsingProxy] servicesModelBuilder : ",
				errorModelBuilder.build(branchID).toString()
			);
		}
	}
};

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

export const testFetchDatesNode = async (
	skipBuild?: boolean
): Promise<{
	nodes: IPostofficeRequestNode[];
	servicesModelBuilder: IPostofficeBranchServicesBuilder;
	errorModelBuilder: IPostofficeUpdateErrorBuilder;
}> => {
	console.log("** (3) Test Fetch Branch Services | Test Fetch Dates Node **");

	const {
		nodes: service0Dates,
		errorModelBuilder,
		servicesModelBuilder,
	} = await testFetchServicesNode(true);
	if (!service0Dates[0])
		throw Error("[TestFetchBranchServices][testFetchDatesNode] No Dates Node");

	try {
		const service0Dates0Times = await service0Dates[0].performRequest();
		console.log(
			"[testFetchDatesNode] service0Dates0Times length : ",
			service0Dates0Times.length
		);
		return {
			nodes: service0Dates0Times,
			servicesModelBuilder,
			errorModelBuilder,
		};
	} finally {
		if (!skipBuild) {
			console.log(
				"[testFetchDatesNode] servicesModelBuilder : ",
				servicesModelBuilder.build("999").toString()
			);

			console.log(
				"[testFetchDatesNode] servicesModelBuilder : ",
				errorModelBuilder.build("999").toString()
			);
		}
	}
};

/*
Create Dates Node - Use proxy */
// ############################
export const testFetchDatesNodeUsingProxy = async (
	skipBuild?: boolean
): Promise<{
	nodes: IPostofficeRequestNode[];
	servicesModelBuilder: IPostofficeBranchServicesBuilder;
	errorModelBuilder: IPostofficeUpdateErrorBuilder;
	proxyEndpoint: string;
	branchID: string;
}> => {
	console.log(
		"** (3) Test Fetch Branch Services | Test Fetch Dates Node Using Proxy **"
	);

	const {
		nodes: service0Dates,
		errorModelBuilder,
		servicesModelBuilder,
		branchID,
		proxyEndpoint,
	} = await testFetchServicesNodeUsingProxy(true);
	if (!service0Dates[0])
		throw Error("[testFetchDatesNodeUsingProxy] No Dates Node");

	try {
		const service0Dates0Times = await service0Dates[0].performRequest();
		console.log(
			"[testFetchDatesNodeUsingProxy] service0Dates0Times length : ",
			service0Dates0Times.length
		);
		return {
			nodes: service0Dates0Times,
			servicesModelBuilder,
			errorModelBuilder,
			branchID,
			proxyEndpoint,
		};
	} finally {
		if (!skipBuild) {
			console.log(
				"[testFetchDatesNodeUsingProxy] servicesModelBuilder : ",
				servicesModelBuilder.build(branchID).toString()
			);

			console.log(
				"[testFetchDatesNodeUsingProxy] servicesModelBuilder : ",
				errorModelBuilder.build(branchID).toString()
			);
		}
	}
};

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

export const testFetchTimesNode = async (skipBuild?: boolean) => {
	console.log("** (4) Test Fetch Branch Services | Test Fetch Times Node **");

	const {
		nodes: service0Dates0Times,
		errorModelBuilder,
		servicesModelBuilder,
	} = await testFetchDatesNode(true);
	if (!service0Dates0Times[0])
		throw Error("[testFetchTimesNode] No Times Node");

	try {
		const empty = await service0Dates0Times[0].performRequest();
		console.log("[testFetchTimesNode] empty length : ", empty.length);
	} finally {
		if (!skipBuild) {
			console.log(
				"[testFetchTimesNode] servicesModelBuilder : ",
				servicesModelBuilder.build("999").toString()
			);

			console.log(
				"[testFetchTimesNode] servicesModelBuilder : ",
				errorModelBuilder.build("999").toString()
			);
		}
	}
};

/*
Create Times Node - Use proxy */
// ############################
export const testFetchTimesNodeUsingProxy = async (skipBuild?: boolean) => {
	console.log(
		"** (4) Test Fetch Branch Services | Test Fetch Times Node Using Proxy **"
	);

	const {
		nodes: service0Dates0Times,
		errorModelBuilder,
		servicesModelBuilder,
		branchID,
		proxyEndpoint,
	} = await testFetchDatesNodeUsingProxy(true);
	if (!service0Dates0Times[0])
		throw Error("[testFetchTimesNodeUsingProxy] No Times Node");

	try {
		const empty = await service0Dates0Times[0].performRequest();
		console.log("[testFetchTimesNodeUsingProxy] empty length : ", empty.length);
	} finally {
		if (!skipBuild) {
			console.log(
				"[testFetchTimesNodeUsingProxy] servicesModelBuilder : ",
				servicesModelBuilder.build(branchID).toString()
			);

			console.log(
				"[testFetchTimesNodeUsingProxy] servicesModelBuilder : ",
				errorModelBuilder.build(branchID).toString()
			);
		}
	}
};
