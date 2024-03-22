import path from 'path';
import fs from 'fs';

import { ERR_RESOURCE_MISSING } from '../../../shared/constants/ErrorCodes';

const MODULE_NAME = 'Elasticsearch Utils';

type ElasticAuthentication = {
	username: string;
	password: string;
	certificates: string;
};

type ElasticAuthenticationProvider = () => ElasticAuthentication;

export const getAuthenticationData: ElasticAuthenticationProvider = () => {
	const certificatePath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'..',
		'..',
		'elastic-cert',
		'http_ca.crt'
	);
	const certificates = fs.readFileSync(certificatePath, 'utf8');
	const username = process.env.ELS_USR ?? '';
	const password = process.env.ELS_PSS ?? '';
	if (username === '' || password === '' || certificates === '') {
		throw new Error(
			`[${MODULE_NAME}][${ERR_RESOURCE_MISSING}] : No Username / password / certificates`
		);
	}
	return { username, password, certificates };
};
