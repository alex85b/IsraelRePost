import { LocationGetServices } from '../api-requests-old/location-get-services';
import { MakeRequest } from '../api-requests-old/make-request';
import { SearchAvailableDates } from '../api-requests-old/search-avaliable-dates';
import { CookieBank } from '../common/cookie-bank';
import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { ILocationGetServices } from '../interfaces/api-responses/ILocationGetServices';
import { getTodayDateObject } from '../common/todays-date';
import { ISearchAvailableDates } from '../interfaces/api-responses/ISearchAvailableDates';
import { SearchAvailableSlots } from '../api-requests-old/search-available-slots';
import { ISearchAvailableSlots } from '../interfaces/api-responses/ISearchAvailableSlots';
import { ITimeSlotsDocument } from '../interfaces/ITimeSlotsDocument';

export const getBranchDetails = async (
	branch: ISingleBranchQueryResponse,
	cookieBank: CookieBank,
	userDataToken: string
) => {
	const { _id, _source } = branch;
	const { qnomycode, branchnameEN, branchnumber } = _source;

	const timeSlotsDocuments: ITimeSlotsDocument[] = [];

	const locationGetServices = await MakeRequest(
		new LocationGetServices(cookieBank.getCookies(), userDataToken, {
			locationId: String(qnomycode),
			serviceTypeId: '0',
		})
	);

	cookieBank.importAxiosCookies(locationGetServices.axiosCookies);

	const services = (locationGetServices.data as ILocationGetServices).Results;

	const todaysDate = getTodayDateObject();

	for (const service of services) {
		const { serviceId } = service;
		const { dates } = await helperGetDatePerService(
			cookieBank,
			userDataToken,
			String(serviceId),
			todaysDate.year,
			todaysDate.month,
			todaysDate.day
		);

		if (dates === null || dates == undefined || dates?.length === 0) return null;

		for (const date of dates) {
			const { calendarId } = date;
			const { hours } = await helperGetHoursPerDateService(
				cookieBank,
				userDataToken,
				String(serviceId),
				String(calendarId)
			);

			const timeSlotsDocument: ITimeSlotsDocument = {
				branchKey: _id,
				branchDate: date.calendarDate as string,
				branchServiceId: 0,
				branchServiceName: '',
				timeSlots: hours,
			};

			timeSlotsDocuments.push(timeSlotsDocument);
		}
	}
	console.log(
		`### [getBranchDetails] Examining branch ${branchnameEN} ${branchnumber}: Done`
	);
	return timeSlotsDocuments;
};

const helperGetDatePerService = async (
	cookieBank: CookieBank,
	userDataToken: string,
	serviceId: string,
	year: string,
	month: string,
	day: string
) => {
	const searchAvailableDates = await MakeRequest(
		new SearchAvailableDates(cookieBank.getCookies(), userDataToken, {
			serviceId: serviceId,
			startDate: {
				yyyy: year,
				mm: month,
				dd: day,
			},
		})
	);
	cookieBank.importAxiosCookies(searchAvailableDates.axiosCookies);
	return {
		dates: (searchAvailableDates?.data as ISearchAvailableDates).Results,
	};
};

const helperGetHoursPerDateService = async (
	cookieBank: CookieBank,
	userDataToken: string,
	serviceId: string,
	calendarId: string
) => {
	const searchAvailableSlots = await MakeRequest(
		new SearchAvailableSlots(cookieBank.getCookies(), userDataToken, {
			dayPart: '1',
			serviceId: serviceId,
			calendarId: calendarId,
		})
	);
	return { hours: (searchAvailableSlots.data as ISearchAvailableSlots).Results };
};