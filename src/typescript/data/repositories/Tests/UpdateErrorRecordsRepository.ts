import { ISingleErrorQueryResponse } from "../../../api/elastic/updateErrors/UpdateErrorsIndexing";
import { useSingleErrorQueryResponse } from "../../models/persistenceModels/UpdateErrorRecord";
import {
	IUpdateErrorRecordsRepository,
	UpdateErrorRecordsRepository,
} from "../UpdateErrorRecordsRepository";

console.log("** Test Update-Error Records Repository **");

export const getAllErrors = async () => {
	console.log("** (1) Update-Error Records Repository | Get All Errors **");
	const eRepo: IUpdateErrorRecordsRepository =
		new UpdateErrorRecordsRepository();
	const allErrors = await eRepo.getAllErrorRecords();
	console.log("[getAllErrors] allErrors demo : ", allErrors[0].toString());
};

export const addUpdateErrorRecord = async () => {
	console.log(
		"** (2) Update-Error Records Repository | Add Update Error Record **"
	);
	const eRepo: IUpdateErrorRecordsRepository =
		new UpdateErrorRecordsRepository();
	const fakeError: ISingleErrorQueryResponse = {
		_index: "errors",
		_id: "9996",
		_score: 1.0,
		_source: {
			userError: "fake user error",
			services: [
				{
					serviceId: "serviceID_1",
					serviceError: "fake service error",
					dates: [
						{
							calendarId: "2024-03-26T20:41:01",
							datesError: "fake date error",
							timesError: "fake time error",
						},
					],
				},
			],
		},
	};
	const builder = useSingleErrorQueryResponse({ rawQueryResponse: fakeError });

	const response = await eRepo.addUpdateErrorRecord({
		errorModel: builder.build(fakeError._id),
	});

	console.log(
		"[addUpdateErrorRecord] addUpdateErrorRecord response : ",
		response
	);
};
