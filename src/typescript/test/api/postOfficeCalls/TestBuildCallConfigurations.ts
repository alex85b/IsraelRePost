import { BuildPostRequestAxiosConfig } from '../../../api/postOfficeCalls/base/PostofficeRequestConfig';

console.log('** Test Build Call Configurations **');

export const multipleConfigBuildsInSingleRun = async () => {
	console.log('** (1) Multiple Config Builds In Single Run **');

	const builder1 = new BuildPostRequestAxiosConfig.Builder(); // Static
	builder1.requestUrl({ url: 'BUILDER1-BUILDER1-BUILDER1' });
	builder1.requestBaseURL({ baseURL: 'BUILDER1-BUILDER1-BUILDER1' });

	// console.log(
	// 	'[multipleConfigBuildsInSingleRun] builder1 getConfig : ',
	// 	builder1.build().getConfig()
	// );

	const builder2 = new BuildPostRequestAxiosConfig.Builder(); // Static
	builder2.requestUrl({ url: 'BUILDER2-BUILDER2-BUILDER2' });

	console.log(
		'[multipleConfigBuildsInSingleRun] builder2 getConfig : ',
		builder2.build().getConfig()
	);
};
