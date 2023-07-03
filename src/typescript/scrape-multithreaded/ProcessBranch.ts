import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { ITimeSlotsDocument } from '../interfaces/ITimeSlotsDocument';
import { getDatesOfServiceOfBranch } from './GetDatesOfServiceOfBranch';
import { getServicesOfBranch } from './GetServicesOfBranch';
import { getTimesOfDateOfServiceOfBranch } from './GetTimesOfDateServiceBranch';
import { spinNewUser } from './SpinNewUser';
import { Worker, workerData, parentPort } from 'worker_threads';
import { getSharedData, setSharedData } from './SharedData';

// branch: ISingleBranchQueryResponse
const processBranch = async () => {
	const { branch, proxyAuth, proxyUrl, useProxy } = workerData as {
		branch: ISingleBranchQueryResponse;
		useProxy: boolean;
		proxyUrl: string;
		proxyAuth: { username: string; password: string };
	};

	setSharedData(Math.floor(Math.random() * 301));

	const branchNumber = branch._source.branchnumber;
	const branchKey = branch._id;
	const qnomy = branch._source.qnomycode;
	const branchName = branch._source.branchnameEN;
	console.log(`[Start] branch: ${branchName} ${branchNumber}`);
	const branchServicesDatesTimes: ITimeSlotsDocument[] = [];

	let username = '';
	const userResponse = await spinNewUser(username);
	username = userResponse.data.username;

	//* Get services.
	const services = await getServicesOfBranch(
		{
			ARRAffinity: userResponse.cookies.ARRAffinity,
			ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
			CentralJWTCookie: userResponse.cookies.CentralJWTCookie,
			GCLB: userResponse.cookies.GCLB,
		},
		{ locationId: String(qnomy), serviceTypeId: '0' },
		{ token: userResponse.data.token }
	);

	//* Get dates slots.
	for (const service of services) {
		const dates = await getDatesOfServiceOfBranch(
			{
				ARRAffinity: userResponse.cookies.ARRAffinity,
				ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
				GCLB: userResponse.cookies.GCLB,
			},
			{ serviceId: service.serviceId, startDate: '' },
			{ token: userResponse.data.token }
		);

		for (const date of dates) {
			const times = await getTimesOfDateOfServiceOfBranch(
				{
					ARRAffinity: userResponse.cookies.ARRAffinity,
					ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
					GCLB: userResponse.cookies.GCLB,
				},
				{
					CalendarId: date.calendarId,
					dayPart: '0',
					ServiceId: service.serviceId,
				},
				{ token: userResponse.data.token }
			);
			branchServicesDatesTimes.push({
				branchKey: branchKey,
				branchServiceId: Number.parseInt(service.serviceId),
				branchServiceName: service.serviceName,
				branchDate: date.calendarDate,
				timeSlots: times.map((time) => {
					return { Time: Number.parseInt(time.Time) };
				}),
			});
		}
	}
	parentPort?.postMessage(branchServicesDatesTimes);
};

processBranch();

// module.exports = processBranch;
