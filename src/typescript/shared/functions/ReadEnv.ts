import * as dotenv from 'dotenv';

export interface IEnvironmentReader {
	(args: { envFilePath: string; envKey: string }): string;
}

export const readEnvironmentFile: IEnvironmentReader = (args: {
	envFilePath: string;
	envKey: string;
}) => {
	dotenv.config({ path: args.envFilePath });
	const envValue = process.env[args.envKey] ?? '';
	return envValue;
};
