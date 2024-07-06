import { IDocumentBranch } from "./BranchServicesIndexing";

export const bulkBranchDocuments = (bulkData: {
	addBranches: IDocumentBranch[];
	branchIndexName: string;
}) => {
	// Initialize an empty array to store the bulk data
	let bulk: string[] = [];

	// Iterate over each branch document in the addBranches array
	bulkData.addBranches.forEach((branchDocument) => {
		// Create the index metadata string for the current branch document
		const indexMetadata = JSON.stringify({
			index: {
				_index: bulkData.branchIndexName,
				_id: branchDocument.branchnumber.toString(),
			},
		});

		// Convert the branch document to a JSON string
		const stringedDocument = JSON.stringify(branchDocument);

		// Push the index metadata and branch document strings to the bulk array
		bulk.push(indexMetadata, stringedDocument);
	});

	// Join the bulk array elements with newline characters and add a trailing newline
	const stringedBulk = bulk.join("\n") + "\n";
	return stringedBulk;
};
