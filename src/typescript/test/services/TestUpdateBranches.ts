import { addUpdateBranches, deleteAddBranches } from '../../services/updateBranches/UpdateBranches';

console.log('** Test Update Branches **');

export const testDeleteAddBranches = async () => {
	console.log('** (1) Test Delete Add Branches **');
	const response = await deleteAddBranches();
};

export const testAddUpdateBranches = async () => {
	console.log('** (2) Test Add Update Branches **');
	const response = await addUpdateBranches();
};
