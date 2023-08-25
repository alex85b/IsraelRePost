import { ElasticClient } from "../elastic/elstClient";

export const SetUpElasticClient = async (resetIndex: boolean, certificates: string) => {
	const elasticClient = new ElasticClient({
		caCertificate: certificates,
		password: process.env.ELS_PSS || "",
		rejectUnauthorized: false,
		username: "elastic",
		node: "https://127.0.0.1:9200",
	});

	elasticClient.sendPing();

	if (resetIndex) {
		if (await elasticClient.branchIndexExists()) {
			await elasticClient.deleteBranchesIndex();
			await elasticClient.createBranchesIndex();
		} else await elasticClient.createBranchesIndex();
	}

	return elasticClient;
};
