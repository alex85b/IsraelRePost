import path from "path";
import { readLocalFile } from "../ReadTextFile";

console.log("** Test Read Text File **");

export const testReadSmartProxyFile = async () => {
	console.log("** (1) Test Read Text File | Test Read Smart Proxy File **");
	const filePath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"SmartProxy.txt"
	);
	console.log("[testReadSmartProxyFile] path to file : ", filePath);
	const fileLines: string[][] = await readLocalFile({
		filePath,
		lineSplit: ":",
	});
	console.log("[testReadSmartProxyFile] read result : ", fileLines);
};

export const testReadWebShareFile = async () => {
	console.log("** (2) Test Read Text File | Test Read Web Share File **");
	const filePath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"WebShare.txt"
	);
	console.log("[testReadWebShareFile] path to file : ", filePath);
	const fileLines: string[][] = await readLocalFile({
		filePath,
		lineSplit: ":",
	});
	console.log("[testReadWebShareFile] read result : ", fileLines);
};
