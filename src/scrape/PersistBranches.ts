import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';

import { IDocumentBranch } from '../common/interfaces/IDocumentBranch';
// import dotenv from 'dotenv';

export const persistBranches = async (
	doResetBranches: boolean,
	filteredBranches: IDocumentBranch[]
) => {
	try {
		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);

		const certificateContents = fs.readFileSync(certificatePath, 'utf8');

		const elasticClient = new ElasticClient(
			'https://127.0.0.1:9200',
			'elastic',
			process.env.ELS_PSS || '',
			certificateContents,
			false
		);

		elasticClient.sendPing();

		if (doResetBranches) {
			await elasticClient.deleteIndices('all');
			console.log('### [persistBranches] deleteAllIndices : Done ###');
		}

		await elasticClient.setupIndex('branches');

		const branches = await elasticClient.bulkAddBranches(filteredBranches);
		console.log('### [persistBranches] Done : Done ###');

		return { branches };
	} catch (error) {
		throw error;
	}
};
