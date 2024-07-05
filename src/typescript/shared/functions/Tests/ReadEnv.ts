import path from "path";
import { readEnvironmentFile } from "../ReadEnv";

console.log("** Test Read Env **");

export const testReadExisting = async () => {
	console.log("** (1) Test Read Env | Test Read Existing **");
	const envPath = path.join(__dirname, "..", "..", "..", "..", "..", ".env");
	console.log("[testReadExisting] path to env : ", envPath);
	const envValue: string = readEnvironmentFile({
		envFilePath: envPath,
		envKey: "TEST_KEY",
	});
	console.log("[testReadExisting] read result : ", envValue);
};
