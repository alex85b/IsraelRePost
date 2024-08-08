import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { IPostofficeRequestAxiosConfig } from "./PostofficeRequestConfig";
import { omit } from "../../elastic/base/ElasticsearchUtils";
import { IPostofficeResponseData } from "../../../data/models/dataTransferModels/postofficeResponses/shared/PostofficeResponseData";
import { ErrorSource, ServiceError } from "../../../errors/ServiceError";
import { ILogger, WinstonClient } from "../../../shared/classes/WinstonClient";
import { PathStack } from "../../../shared/classes/PathStack";

// #############################################################################################
// ### Postoffice Api Call #####################################################################
// #############################################################################################

export type PostofficeApiCall = <SR extends IPostofficeResponseData>(
	axiosRequestConfig: IPostofficeRequestAxiosConfig
) => Promise<Omit<AxiosResponse<SR, any>, "request" | "config">>;

/*
Concrete PostofficeApiCall,
Performs an Axios request using pre-made request-configuration*/
export const postofficeApiCall: PostofficeApiCall = async <
	SR extends IPostofficeResponseData
>(
	axiosRequestConfig: IPostofficeRequestAxiosConfig
) => {
	const logger: ILogger = new WinstonClient({
		pathStack: new PathStack().push("Postoffice Api Call"),
	});
	try {
		const axiosResponse = await axios.request<
			IPostofficeRequestAxiosConfig,
			AxiosResponse<SR>,
			AxiosRequestConfig
		>(axiosRequestConfig);
		const filteredResponse = omit(axiosResponse, "request", "config");
		// console.log('[postofficeApiCall] response: ', JSON.stringify(filteredResponse, null, 4));

		return filteredResponse;
	} catch (error) {
		throw new ServiceError({
			logger: logger,
			source: ErrorSource.ThirdPartyAPI,
			message: `Post Office API Request has failed`,
			details: {
				error: (error as Error).message,
				stack: (error as Error).stack,
			},
		});
	}
};
