import * as fs from "fs";
import * as path from "path";
import { numericDate } from "../functions/GetDateAndOrTime";

export const createNestedFolders = (
	basePath: string,
	nestedFolders: string[]
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const fullPath = path.join(basePath, ...nestedFolders);
		fs.mkdir(fullPath, { recursive: true }, (err) => {
			if (err) {
				console.error(`Error creating folders: ${err.message}`);
				reject(err.message);
			} else {
				console.log(`Folders created successfully: ${fullPath}`);
				resolve(fullPath);
			}
		});
	});
};

export const createLogsFolder = async (args: {
	basePath?: string;
	ipManagerId?: string;
	updaterId?: string;
}): Promise<{ fullPath: string | null }> => {
	const today = numericDate();
	const basePath = args.basePath ?? "logs";
	const foldersToCreate = [today];
	if (args.ipManagerId) {
		foldersToCreate.push(`Ip Manager ${args.ipManagerId}`);
		if (args.updaterId) foldersToCreate.push(`Updater ${args.updaterId}`);
	} else if (args.updaterId) {
		return { fullPath: null };
	}
	return { fullPath: await createNestedFolders(basePath, foldersToCreate) };
};
