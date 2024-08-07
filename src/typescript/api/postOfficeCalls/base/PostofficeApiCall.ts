import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IPostofficeRequestAxiosConfig } from './PostofficeRequestConfig';
import { omit } from '../../elastic/base/ElasticsearchUtils';
import { IPostofficeResponseData } from '../../../data/models/dataTransferModels/postofficeResponses/shared/PostofficeResponseData';

// #############################################################################################
// ### Postoffice Api Call #####################################################################
// #############################################################################################

export type PostofficeApiCall = <SR extends IPostofficeResponseData>(
	axiosRequestConfig: IPostofficeRequestAxiosConfig
) => Promise<Omit<AxiosResponse<SR, any>, 'request' | 'config'>>;

/*
Concrete PostofficeApiCall,
Performs an Axios request using pre-made request-configuration*/
export const postofficeApiCall: PostofficeApiCall = async <SR extends IPostofficeResponseData>(
	axiosRequestConfig: IPostofficeRequestAxiosConfig
) => {
	try {
		const axiosResponse = await axios.request<
			IPostofficeRequestAxiosConfig,
			AxiosResponse<SR>,
			AxiosRequestConfig
		>(axiosRequestConfig);
		const filteredResponse = omit(axiosResponse, 'request', 'config');
		// console.log('[postofficeApiCall] response: ', JSON.stringify(filteredResponse, null, 4));

		return filteredResponse;
	} catch (error) {
		console.log('[israelPostRequest] Error', JSON.stringify(error, null, 3));
		throw new Error('[israelPostRequest] Error : ' + (error as Error).message);
	}
};
