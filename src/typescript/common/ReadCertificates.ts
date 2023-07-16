import path from 'path';
import fs from 'fs';

export const readCertificates = () => {
	const certificatePath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'elastic-cert',
		'http_ca.crt'
	);
	return fs.readFileSync(certificatePath, 'utf8');
};
