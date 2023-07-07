import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { ITimeSlotsDocument } from '../interfaces/ITimeSlotsDocument';
import { getDatesOfServiceOfBranch } from './GetDatesOfServiceOfBranch';
import { getServicesOfBranch } from './GetServicesOfBranch';
import { getTimesOfDateOfServiceOfBranch } from './GetTimesOfDateServiceBranch';
import { spinNewUser } from './SpinNewUser';
import { Worker, workerData, parentPort } from 'worker_threads';
import { getSharedData, setSharedData } from './SharedData';
import { NotProvided } from '../errors/NotProvided';

const processBranch = async () => {
	//
	//* /////////////////////////////////////////////////////
	//* Extract worker data ////////////////////////////////
	//* ///////////////////////////////////////////////////
	const { branch, proxyAuth, proxyUrl, useProxy, timeout } = workerData as {
		branch: ISingleBranchQueryResponse;
		useProxy: boolean;
		proxyUrl: string;
		proxyAuth: { username: string; password: string };
		timeout: number;
	};

	//* /////////////////////////////////////////////////////
	//* Type guard /////////////////////////////////////////
	//* ///////////////////////////////////////////////////
	if (!branch._id || !branch._index || !branch._source) {
		throw new NotProvided({
			message: 'workerData provided invalid branch',
			source: 'processBranch',
		});
	}

	if (useProxy) {
		if (!proxyUrl || typeof proxyUrl !== 'string' || proxyUrl.length === 0) {
			console.error('[processBranch] [proxyUrl] Error: ', proxyUrl);

			throw new NotProvided({
				message: 'workerData provided invalid proxyUrl',
				source: 'processBranch',
			});
		}
		if (
			!proxyAuth ||
			!proxyAuth.password ||
			!proxyAuth.username ||
			typeof proxyAuth.password !== 'string' ||
			typeof proxyAuth.username !== 'string' ||
			proxyAuth.password.length === 0 ||
			proxyAuth.username.length === 0
		) {
			console.error('[processBranch] [proxyAuth] Error: ', proxyAuth);
			throw new NotProvided({
				message: 'workerData provided invalid proxyAuth object',
				source: 'processBranch',
			});
		}
	}

	if (!timeout || typeof timeout !== 'number') {
		throw new NotProvided({
			message: 'workerData provided invalid timeout',
			source: 'processBranch',
		});
	}

	// setTimeout(() => {
	// 	console.log('Function execution timed out');
	// 	throw new Error(`Execution timed out after ${timeout}`); // Throw an error to abort execution
	// }, timeout);

	//* /////////////////////////////////////////////////////
	//* Initialization /////////////////////////////////////
	//* ///////////////////////////////////////////////////
	const branchNumber = branch._source.branchnumber;
	const branchKey = branch._id;
	const qnomy = branch._source.qnomycode;
	const branchName = branch._source.branchnameEN;
	console.log(`[Start] branch: ${branchName} ${branchNumber}`);
	const branchServicesDatesTimes: ITimeSlotsDocument[] = [];

	//* /////////////////////////////////////////////////////
	//* Create new anonymous user //////////////////////////
	//* ///////////////////////////////////////////////////
	const userResponse = await spinNewUser(useProxy, proxyUrl, proxyAuth);

	//* /////////////////////////////////////////////////////
	//* Get services ///////////////////////////////////////
	//* ///////////////////////////////////////////////////
	const services = await getServicesOfBranch(
		{
			ARRAffinity: userResponse.cookies.ARRAffinity,
			ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
			CentralJWTCookie: userResponse.cookies.CentralJWTCookie,
			GCLB: userResponse.cookies.GCLB,
		},
		{ locationId: String(qnomy), serviceTypeId: '0' },
		{ token: userResponse.data.token },
		useProxy,
		proxyUrl,
		proxyAuth
	);

	//* /////////////////////////////////////////////////////
	//* Get dates per service //////////////////////////////
	//* ///////////////////////////////////////////////////
	for (const service of services) {
		const dates = await getDatesOfServiceOfBranch(
			{
				ARRAffinity: userResponse.cookies.ARRAffinity,
				ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
				GCLB: userResponse.cookies.GCLB,
			},
			{ serviceId: service.serviceId, startDate: '' },
			{ token: userResponse.data.token },
			useProxy,
			proxyUrl,
			proxyAuth
		);

		//* /////////////////////////////////////////////////////
		//* Get times per date /////////////////////////////////
		//* ///////////////////////////////////////////////////
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
				{ token: userResponse.data.token },
				useProxy,
				proxyUrl,
				proxyAuth
			);
			//* /////////////////////////////////////////////////////
			// TODO:Write document /////////////////////////////////
			//* ///////////////////////////////////////////////////
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
