import { createNestedFolders, createLogsFolder } from "../SetupLoggingFolders";

export const testCreateNestedFolders = () => {
	const now = new Date();
	const dateFolder =
		`${now.getFullYear()}` +
		`${String(now.getMonth() + 1).padStart(2, "0")}` +
		`${String(now.getDate()).padStart(2, "0")}`;

	const basePath = "logs"; // current directory
	const foldersToCreate = [dateFolder, "IP Manager 1", "Updater 1"];

	createNestedFolders(basePath, foldersToCreate);
};

export const testCreateLogsFolders = async () => {
	console.log("[testCreateLogsFolders] Test 1 : ", await createLogsFolder({}));
	console.log(
		"[testCreateLogsFolders] Test 2 : ",
		await createLogsFolder({ ipManagerId: "1", updaterId: "2" })
	);
	console.log(
		"[testCreateLogsFolders] Test 3 : ",
		await createLogsFolder({ ipManagerId: "3" })
	);
	console.log(
		"[testCreateLogsFolders] Test 4 : ",
		await createLogsFolder({ updaterId: "4" })
	);
};
