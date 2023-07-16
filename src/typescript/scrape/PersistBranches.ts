import { ElasticClient } from '../elastic/elstClient';

import { IDocumentBranch } from '../interfaces/IDocumentBranch';
// import dotenv from 'dotenv';

export const persistBranches = async (persistConfig: {
	doResetBranches: boolean;
	filteredBranches: IDocumentBranch[];
	certificateContents: string;
}) => {
	try {
		const { certificateContents, doResetBranches, filteredBranches } =
			persistConfig;
		const elasticClient = new ElasticClient({
			caCertificate: certificateContents,
			password: process.env.ELS_PSS || '',
			rejectUnauthorized: false,
			username: 'elastic',
			node: 'https://127.0.0.1:9200',
		});

		elasticClient.sendPing();

		if (doResetBranches) {
			await elasticClient.deleteIndices('all');
			console.log('[persistBranches] deleteAllIndices : Done');
		}

		await elasticClient.setupIndex('branches');

		const branches = await elasticClient.bulkAddBranches(filteredBranches);
		console.log('[persistBranches] Done : Done');

		return { branches };
	} catch (error) {
		throw error;
	}
};
