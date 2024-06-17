import fs from 'fs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
dotenv.config();

interface IFileReader {
	(args: { filePath: string; lineSplit?: string }): Promise<string[][]>;
}

export const readLocalFile: IFileReader = async (args: {
	filePath: string;
	lineSplit?: string;
}) => {
	const fileLines: string[][] = [];

	const fileStream = fs.createReadStream(args.filePath);

	const lineReader = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	lineReader.on('line', (line) => {
		if (args.lineSplit) {
			const lineArray = line.split(args.lineSplit);
			fileLines.push(lineArray);
		} else {
			fileLines.push([line]);
		}
	});

	return new Promise<string[][]>((resolve) => {
		lineReader.on('close', () => {
			resolve(fileLines);
		});
	});
};
