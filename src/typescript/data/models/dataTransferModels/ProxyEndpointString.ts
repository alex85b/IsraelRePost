import { ServiceError, ErrorSource } from "../../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../../shared/classes/WinstonClient";
import { readEnvironmentFile } from "../../../shared/functions/ReadEnv";
import { readLocalFile } from "../../../shared/functions/ReadTextFile";
import { isValidString, validateAndAssign } from "../shared/FieldValidation";

export type ProxyEndpointString = string;
export interface IProxyEndpointBuilder {
	useUsername(username: string): this;
	usePassword(password: string): this;
	useProtocol(protocol: string): this;
	useAddress(address: string): this;
	usePort(port: string): this;
	build(): ProxyEndpointString;
}

export class ProxyEndpointBuilder implements IProxyEndpointBuilder {
	private proxyEndpointObject = {
		username: "",
		password: "",
		protocol: "",
		address: "",
		port: "",
	};

	private faults: string[] = [];
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor() {
		this.pathStack = new PathStack().push("Proxy Endpoint String");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	useUsername(username: string): this {
		validateAndAssign({
			value: username,
			validatorFunction: isValidString,
			assignTarget: this.proxyEndpointObject,
			assignKey: "username",
			faults: this.faults,
			errorMessage: "proxy endpoint username is invalid",
		});
		return this;
	}
	usePassword(password: string): this {
		validateAndAssign({
			value: password,
			validatorFunction: isValidString,
			assignTarget: this.proxyEndpointObject,
			assignKey: "password",
			faults: this.faults,
			errorMessage: "proxy endpoint password is invalid",
		});
		return this;
	}
	useProtocol(protocol: string): this {
		validateAndAssign({
			value: protocol,
			validatorFunction: isValidString,
			assignTarget: this.proxyEndpointObject,
			assignKey: "protocol",
			faults: this.faults,
			errorMessage: "proxy endpoint protocol is invalid",
		});
		return this;
	}
	useAddress(address: string): this {
		validateAndAssign({
			value: address,
			validatorFunction: isValidString,
			assignTarget: this.proxyEndpointObject,
			assignKey: "address",
			faults: this.faults,
			errorMessage: "proxy endpoint address is invalid",
		});
		return this;
	}
	usePort(port: string): this {
		validateAndAssign({
			value: port,
			validatorFunction: isValidString,
			assignTarget: this.proxyEndpointObject,
			assignKey: "port",
			faults: this.faults,
			errorMessage: "proxy endpoint port is invalid",
		});
		return this;
	}
	build(): string {
		try {
			if (this.faults.length < 1)
				for (const key in this.proxyEndpointObject) {
					if (key.length === 0)
						this.faults.push(`result string is missing ${key}`);
				}
			if (this.faults.length > 0) {
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Internal,
					message: "Proxy Endpoint String is Invalid",
					details: {
						faults: this.faults.join(" | "),
					},
				});
			}
			const { address, password, port, protocol, username } =
				this.proxyEndpointObject;
			return `${protocol}://${username}:${password}@${address}:${port}`;
		} finally {
			this.faults = [];
			this.proxyEndpointObject = {
				username: "",
				password: "",
				protocol: "",
				address: "",
				port: "",
			};
		}
	}
}

export interface IEndpointsFileToArray {
	(args: {
		proxyFilepath: string;
		envFilepath: string;
		envUsernameKey: string;
		envPasswordKey: string;
	}): Promise<ProxyEndpointString[]>;
}

export const buildUsingProxyFile: IEndpointsFileToArray = async (args: {
	proxyFilepath: string;
	envFilepath: string;
	envUsernameKey: string;
	envPasswordKey: string;
}): Promise<ProxyEndpointString[]> => {
	const proxyBuilder: IProxyEndpointBuilder = new ProxyEndpointBuilder();
	const fileLines: string[][] = await readLocalFile({
		filePath: args.proxyFilepath,
		lineSplit: ":",
	});
	const username: string = readEnvironmentFile({
		envFilePath: args.envFilepath,
		envKey: args.envUsernameKey,
	});
	const password: string = readEnvironmentFile({
		envFilePath: args.envFilepath,
		envKey: args.envPasswordKey,
	});
	const endpoints = fileLines.map((lineArray) => {
		return proxyBuilder
			.useProtocol("http")
			.useAddress(lineArray[0])
			.usePort(lineArray[1])
			.useUsername(username)
			.usePassword(password)
			.build();
	});
	return endpoints;
};
