import * as fs from "fs";
import { ConstructLogMessage } from "../classes/ConstructLogMessage";

export const writeTextFile = (filename: string, content: string): void => {
	const log = new ConstructLogMessage(["Write Text File"]);
	log.createLogMessage({ subject: "Start" });
	fs.writeFile(filename, content, (err) => {
		if (err) {
			console.error(
				log.createLogMessage({
					subject: "Error writing file",
					message: err.message,
				})
			);
		} else {
			console.log(
				log.createLogMessage({
					subject: "File written successfully",
				})
			);
		}
	});
};
