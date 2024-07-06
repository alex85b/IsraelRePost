import { IPostofficeBranchRecord } from '../../../../data/models/persistenceModels/PostofficeBranchRecord';

export const filterByMakeAppointments = async (
	data: {
		branchRecords: IPostofficeBranchRecord[];
	} = { branchRecords: [] } // Default Value
) => {
	return data.branchRecords.reduce(
		(accumulate: IPostofficeBranchRecord[], current: IPostofficeBranchRecord) => {
			if (current.getIsMakeAppointment()) accumulate.push(current);
			return accumulate;
		},
		[] as IPostofficeBranchRecord[]
	);
};
