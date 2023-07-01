import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import { ITimeSlotsDocument } from '../interfaces/ITimeSlotsDocument';
// import dotenv from 'dotenv';

export const persistTimeSlots = async (
	branchSlots: ITimeSlotsDocument[],
	certificatePath: string
) => {
	if (!branchSlots.length) {
		console.error('### [persistTimeSlots] No branches to add ###');
		return { bulkAddSlotsResponse: [] };
	}
	try {
		// const certificatePath = path.join(
		// 	__dirname,
		// 	'..',
		// 	'..',
		// 	'elastic-cert',
		// 	'http_ca.crt'
		// );
		const certificateContents = fs.readFileSync(certificatePath, 'utf8');

		const elasticClient = new ElasticClient(
			'https://127.0.0.1:9200',
			'elastic',
			process.env.ELS_PSS || '',
			certificateContents,
			false
		);

		elasticClient.sendPing();

		const bulkAddSlotsResponse = await elasticClient.bulkAddSlots(branchSlots);
		console.log('### [persistTimeSlots] bulkAddSlots : Done ###');

		return { bulkAddSlotsResponse: bulkAddSlotsResponse };
	} catch (error) {
		throw error;
	}
};
