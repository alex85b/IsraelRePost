import { addUpdateBranches, deleteAddBranches } from "../UpdateBranches";

console.log("** Test Update Branches **");

export const testDeleteAddBranches = async () => {
	console.log("** (1) Test Delete Add Branches **");
	const response = await deleteAddBranches();
	console.log(
		"Succesful updates demo : " +
			JSON.stringify(response.successful[0], null, 4)
	);
	console.log(
		"Failed updates demo : " + JSON.stringify(response.failed[0], null, 4)
	);
};

export const testAddUpdateBranches = async () => {
	console.log("** (2) Test Add Update Branches **");
	const response = await addUpdateBranches();
	console.log(
		"Succesful updates demo : " +
			JSON.stringify(response.successful[0], null, 4)
	);
	console.log(
		"Failed updates demo : " + JSON.stringify(response.failed[0], null, 4)
	);
};
