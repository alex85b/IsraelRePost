import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Build a test axios config to make request using proxy.
 * @param proxyUrl Type: string | null
 * @param proxyAuth Type: { username: string; password: string } | null
 * @returns Type: AxiosRequestConfig<any>
 */
const buildRequest = (
	proxyUrl: string | null,
	proxyAuth: { username: string; password: string } | null
) => {
	const requestConfig: AxiosRequestConfig<any> = {
		method: 'get',
		maxBodyLength: Infinity,
		url: 'https://central.qnomy.com/CentralAPI/UserCreateAnonymous',
		headers: {
			authority: 'central.qnomy.com',
			accept: 'application/json, text/javascript, */*; q=0.01',
			'accept-language': 'he-IL,he;q=0.9',
			'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
			'application-name': 'PostIL',
			authorization: 'JWT null',
			origin: 'https://israelpost.co.il',
			'sec-ch-ua':
				'"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'cross-site',
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
		},
	};

	if (proxyUrl) {
		const proxyURL = new URL(proxyUrl);
		if (proxyAuth) {
			proxyURL.username = proxyAuth.username;
			proxyURL.password = proxyAuth.password;
		}

		const proxyAgent = new HttpsProxyAgent(proxyURL.toString());
		requestConfig.httpsAgent = proxyAgent;
	}

	return requestConfig;
};

/**
 * Make a test request using proxy.
 * @param proxyUrl Type: string | null
 * @param proxyAuth Type: { username: string; password: string } | null
 * @returns Type: AxiosResponse<any, any>
 */
const makeRequest = async (
	proxyUrl: string | null,
	proxyAuth: { username: string; password: string } | null
) => {
	const config = buildRequest(proxyUrl, proxyAuth);
	const result = await axios.request(config);

	// Retrieve the IP address from the response headers
	const ipAddress =
		result.headers['x-your-real-ip'] ||
		result.headers['x-forwarded-for'] ||
		result.headers['x-client-ip'];
	console.log('[makeRequest] [ipAddress]: ', ipAddress);
	// Check the response headers for the proxy information
	console.log('[makeRequest] Proxy Information:');
	console.log('Proxy URL:', result.config?.httpsAgent?.proxy?.origin);
	console.log('Proxy Username:', result.config?.httpsAgent?.proxy?.username);
	console.log('Proxy Password:', result.config?.httpsAgent?.proxy?.password);

	return result.data;
};

module.exports = { buildRequest, makeRequest };
