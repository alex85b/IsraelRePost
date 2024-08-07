import path from "path";
import fs from "fs";
import dotenv from "dotenv";

import { ERR_RESOURCE_MISSING } from "../../../shared/constants/ErrorCodes";
import { isValidString } from "../../../data/models/shared/FieldValidation";

const MODULE_NAME = "Elasticsearch Utils";

type ElasticAuthentication = {
	username: string;
	password: string;
	certificates: string;
};

type ElasticAuthenticationProvider = () => ElasticAuthentication;

export const getAuthenticationData: ElasticAuthenticationProvider = () => {
	dotenv.config();
	const faults: string[] = [];
	const certificatePath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"elastic-cert",
		"http_ca.crt"
	);
	const certificates = fs.readFileSync(certificatePath, "utf8") ?? "";
	const username = process.env.ELS_USR ?? "";
	const password = process.env.ELS_PSS ?? "";
	if (!isValidString(certificates)) faults.push("Faulty Certificates");
	if (!isValidString(username)) faults.push("Faulty Elastic Username");
	if (!isValidString(password)) faults.push("Faulty Elastic Password");
	if (faults.length) {
		throw new Error(
			`[${MODULE_NAME}][${ERR_RESOURCE_MISSING}] : ${faults.join(" | ")}`
		);
	}
	return { username, password, certificates };
};

export const omit = <T extends object, K extends keyof T>(
	obj: T,
	...keys: K[]
): Omit<T, K> => {
	const result = { ...obj };
	keys.forEach((key) => {
		if (result[key]) delete result[key];
	});
	return result;
};
