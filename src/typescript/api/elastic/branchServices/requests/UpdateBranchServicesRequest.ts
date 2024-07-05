import {
	InlineScript,
	QueryDslQueryContainer,
} from "@elastic/elasticsearch/lib/api/types";
import { UpdateByQueryBuilder } from "../../shared/requestBuilders/UpdateByQueryBuilder";

// ##############################################
// ### Interfaces ###############################
// ##############################################

export interface ICustomUpdateByQuery {
	query: QueryDslQueryContainer;
	script: InlineScript;
}

interface ISpecificServiceScript extends InlineScript {
	source: "ctx._source.services = params.updatedServicesArray";
	lang: "painless";
	params: {};
}

interface ISpecificBranchQuery extends QueryDslQueryContainer {
	term: {
		_id: string;
	};
}

// ##############################################
// ### Build Update Branch Services Request #####
// ##############################################

export const updateBranchServicesRequest = (buildData: {
	branchID: string;
	params: { updatedServicesArray: any[] };
}): ICustomUpdateByQuery => {
	const QUERY_SPECIFIC_BRANCH: ISpecificBranchQuery = {
		term: { _id: buildData.branchID },
	};
	const SPECIFIC_SERVICE_SCRIPT: ISpecificServiceScript = {
		source: "ctx._source.services = params.updatedServicesArray",
		lang: "painless",
		params: buildData.params,
	};

	const request = new UpdateByQueryBuilder()
		.withQuery(QUERY_SPECIFIC_BRANCH)
		.withScript(SPECIFIC_SERVICE_SCRIPT)
		.build();
	return request;
};
