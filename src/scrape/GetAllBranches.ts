import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import { ElasticMalfunctionError } from '../errors/elst-malfunction-error';
import {
	SearchResponseBody,
	SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { NotProvided } from '../errors/NotProvided';
import { IBranchQueryResponse } from '../common/interfaces/IBranchQueryResponse';

export const getAllBranches = async () => {
	//Calculate path to certificates.
	const certificatePath = path.join(
		__dirname,
		'..',
		'..',
		'elastic-cert',
		'http_ca.crt'
	);

	const certificateContents = fs.readFileSync(certificatePath, 'utf8');
	console.log('### Fetch certificates : Done ###');

	// Create a client.
	const elasticClient = new ElasticClient(
		'https://127.0.0.1:9200',
		'elastic',
		process.env.ELS_PSS || '',
		certificateContents,
		false
	);

	elasticClient.sendPing();
	console.log('### [getAllBranches] Elastic is up and running ###');

	if (!(await elasticClient.allBranchesIndexExists()))
		throw new ElasticMalfunctionError('all-post-branches index does not exist');

	const branches: SearchResponseBody = await elasticClient.getAllBranches();
	console.log('### [getAllBranches] search all branches : Done ###');

	const resultsAmount = (branches.hits.total as SearchTotalHits).value;
	if (resultsAmount === 0)
		throw new NotProvided({
			message: 'query did not provide results',
			source: 'getAllBranches',
		});
	const results = branches.hits.hits as IBranchQueryResponse;
	return { allBranches: results };
};
