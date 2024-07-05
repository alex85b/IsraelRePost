import { ISingleErrorQueryResponse } from "../../../../api/elastic/updateErrors/UpdateErrorsIndexing";
import {
	IPostofficeUpdateErrorBuilder,
	PostofficeUpdateErrorBuilder,
	useSingleErrorQueryResponse,
} from "../UpdateErrorRecord";

console.log("** Test Update Error Record **");

export const testUserErrorConstruction = async () => {
	console.log("** (1) Test User Error Construction **");

	try {
		const userError = new PostofficeUpdateErrorBuilder()
			.addUserError({ userError: "test user error" })
			.build("Br123")
			.toString();

		console.log("[testUserErrorConstruction] userError : ", userError);
	} catch (error) {
		console.log(
			"[testUserErrorConstruction] userError faulted : ",
			(error as Error).message
		);
	}
};

export const testServiceErrorConstruction = async () => {
	console.log("** (2) Test Service Error Construction **");

	try {
		const serviceError = new PostofficeUpdateErrorBuilder()
			.addServiceError({
				serviceId: "Sr123",
				serviceError: "test service error A",
			})
			.addServiceError({
				serviceId: "Sr456",
				serviceError: "test service error B",
			})
			.build("Br123")
			.toString();

		console.log("[testUserErrorConstruction] serviceError : ", serviceError);
	} catch (error) {
		console.log(
			"[testUserErrorConstruction] serviceError faulted : ",
			(error as Error).message
		);
	}
};

export const testDatesErrorConstruction = async () => {
	console.log("** (3) Test Dates Error Construction **");

	try {
		const datesError = new PostofficeUpdateErrorBuilder()
			.addDateError({
				serviceId: "Sr123",
				calendarId: "Dt123",
				datesError: "test dates error A",
			})
			.addDateError({
				serviceId: "Sr456",
				calendarId: "Dt456",
				datesError: "test dates error B",
			})
			.build("Br123")
			.toString();

		console.log("[testUserErrorConstruction] datesError : ", datesError);
	} catch (error) {
		console.log(
			"[testUserErrorConstruction] datesError faulted : ",
			(error as Error).message
		);
	}
};

export const testTimesErrorConstruction = async () => {
	console.log("** (4) Test Times Error Construction **");

	try {
		const timesError = new PostofficeUpdateErrorBuilder()
			.addTimesError({
				serviceId: "Sr123",
				calendarId: "Dt123",
				timesError: "test times error A",
			})
			.addTimesError({
				serviceId: "Sr123",
				calendarId: "Dt123",
				timesError: "test times error B",
			})
			.build("Br123")
			.toString();

		console.log("[testUserErrorConstruction] timesError : ", timesError);
	} catch (error) {
		console.log(
			"[testUserErrorConstruction] timesError faulted : ",
			(error as Error).message
		);
	}
};

export const useErrorRecord = async () => {
	console.log("** (2) Use Error Record **");
	const rawQueryResponse: ISingleErrorQueryResponse = {
		_index: "Test Index",
		_id: "Test_ID1",
		_score: 0,
		_source: {
			userError: "fake user error 1",
			services: [
				{
					serviceId: "ServiceID1",
					serviceError: "Test service ERR",
					dates: [
						{
							calendarId: "Test Calendar Id1",
							datesError: "fake dates error 1",
							timesError: "fake times error 1",
						},
						{
							calendarId: "Test Calendar Id21",
							datesError: "fake dates error 21",
							timesError: "fake times error 21",
						},
					],
				},
				{
					serviceId: "ServiceID2",
					serviceError: "Test service ERR",
					dates: [
						{
							calendarId: "Test Calendar Id2",
							datesError: "fake dates error 2",
							timesError: "fake times error 2",
						},
					],
				},
			],
		},
	};
	const errBuilder: IPostofficeUpdateErrorBuilder = useSingleErrorQueryResponse(
		{
			rawQueryResponse: rawQueryResponse,
		}
	);
	console.log(
		"[useErrorRecord] demo : ",
		errBuilder.build("Branch_Test1").toString()
	);
};
