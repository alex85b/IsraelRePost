import express, { Request, Response, NextFunction } from 'express';
import { URLs } from '../common/urls';
import { MakeRequest } from '../api-requests/make-request';
import dotenv from 'dotenv';

import { getRandomIntInclusive } from '../common/GetRandomIntInclusive';
import { extractPageData } from '../scrape/ExtractPageData';
import { queryAllBranches } from '../scrape/QueryAllBranches';

import {
	IBranchQueryResponse,
	ISingleBranchQueryResponse,
} from '../common/interfaces/IBranchQueryResponse';
import { myCustomDelay } from '../common/Deley';
import { CookieBank } from '../common/cookie-bank';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { NotProvided } from '../errors/NotProvided';
import { UserCreateAnonymous } from '../api-requests/new/UserCreateAnonymous';
import { UserGetInfo } from '../api-requests/new/UserGetInfo';
import { BadApiResponse } from '../errors/BadApiResponse';
import { LocationGetServices } from '../api-requests/new/LocationGetServices';
import { ITimeSlotsDocument } from '../common/interfaces/ITimeSlotsDocument';
import { SearchAvailableDates } from '../api-requests/new/SearchAvailableDates';
import { SearchAvailableSlots } from '../api-requests/new/SearchAvailableSlots';

dotenv.config();

const router = express.Router();

router.post(
	'/api/scrape/all-time-slots',
	async (req: Request, res: Response, next: NextFunction) => {
		//
		//* Get all branches.
		const { allBranches } = await queryAllBranches();
		console.log(`[Elastic] Branch query result amount: ${allBranches.length} `);
		const branchesBatches = helperSplitArrayIntoChunks(allBranches, 10);
		// const branch = branchesBatches[0][0];
		const branchServicesDatesTimes: ITimeSlotsDocument[] = [];
		try {
			for (const branch of allBranches) {
				const branchNumber = branch._source.branchnumber;
				const branchKey = branch._id;
				const qnomy = branch._source.qnomycode;
				const branchName = branch._source.branchnameEN;
				console.log(`[Start] branch: ${branchName} ${branchNumber}`);

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
			}
			res.status(200).send(branchServicesDatesTimes);
		} catch (error) {
			res.send(error);
		}

		console.log('Bottom of the code');
	}
);

const spinNewUser = async (oldUsername: string) => {
	const userCreateAnonymous = new UserCreateAnonymous();

	const anonymousResponse = await userCreateAnonymous.makeRequest();
	if (anonymousResponse.data.Success !== 'true') {
		throw new BadApiResponse({
			message: 'Success key is false',
			source: 'spinNewUser',
		});
	} else if (anonymousResponse.data.username === oldUsername) {
		throw new BadApiResponse({
			message: 'username has not changed',
			source: 'spinNewUser',
		});
	}

	return anonymousResponse;
};

const getServicesOfBranch = async (
	cookies: {
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		CentralJWTCookie: string;
		GCLB: string;
	},
	urlAttributes: { locationId: string; serviceTypeId: string },
	headers: { token: string }
) => {
	const locationGetServices = new LocationGetServices();
	const servicesResponse = await locationGetServices.makeRequest(
		{
			ARRAffinity: cookies.ARRAffinity,
			ARRAffinitySameSite: cookies.ARRAffinitySameSite,
			CentralJWTCookie: cookies.CentralJWTCookie,
			GCLB: cookies.GCLB,
		},
		{
			locationId: urlAttributes.locationId,
			serviceTypeId: urlAttributes.serviceTypeId,
		},
		{ token: headers.token }
	);

	if (servicesResponse.data.Success !== 'true') {
		throw new BadApiResponse({
			message: 'Success key is false',
			source: 'getServicesOfBranch',
		});
	}

	if (
		servicesResponse.data.TotalResults === '0' ||
		servicesResponse.nested.length === 0
	) {
		console.error('[getServicesOfBranch] no services for the branch');
	}
	return servicesResponse.nested;
};

const getDatesOfServiceOfBranch = async (
	cookies: {
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		GCLB: string;
	},
	urlAttributes: { serviceId: string; startDate: string },
	headers: { token: string }
) => {
	const searchAvailableDates = new SearchAvailableDates();
	const datesResponse = await searchAvailableDates.makeRequest(
		{
			ARRAffinity: cookies.ARRAffinity,
			ARRAffinitySameSite: cookies.ARRAffinitySameSite,
			GCLB: cookies.GCLB,
		},
		{ serviceId: urlAttributes.serviceId, startDate: urlAttributes.serviceId },
		{ token: headers.token }
	);
	if (datesResponse.data.Success !== 'true') {
		throw new BadApiResponse({
			message: 'Success key is false',
			source: 'getDatesOfServiceOfBranch',
		});
	}
	if (
		datesResponse.data.TotalResults === '0' ||
		datesResponse.nested.length === 0
	) {
		console.error(
			'[getDatesOfServiceOfBranch] no dates for branch-service combo'
		);
		console.error(datesResponse);
	}
	return datesResponse.nested;
};

const getTimesOfDateOfServiceOfBranch = async (
	cookies: {
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		GCLB: string;
	},
	urlAttributes: { CalendarId: string; dayPart: string; ServiceId: string },
	headers: { token: string }
) => {
	const searchAvailableSlots = new SearchAvailableSlots();
	try {
		const hoursResponse = await searchAvailableSlots.makeRequest(
			{
				ARRAffinity: cookies.ARRAffinity,
				ARRAffinitySameSite: cookies.ARRAffinitySameSite,
				GCLB: cookies.GCLB,
			},
			{
				CalendarId: urlAttributes.CalendarId,
				dayPart: urlAttributes.dayPart,
				ServiceId: urlAttributes.ServiceId,
			},
			{ token: headers.token }
		);
		if (hoursResponse.data.Success !== 'true') {
			throw new BadApiResponse({
				message: 'Success key is false',
				source: 'getTimesOfDateOfServiceOfBranch',
			});
		}
		if (
			hoursResponse.data.TotalResults === '0' ||
			hoursResponse.nested.length === 0
		) {
			console.error(
				'[getTimesOfDateOfServiceOfBranch] no times for branch-service-date combo'
			);
		}
		return hoursResponse.nested;
	} catch (error) {
		console.error('[getTimesOfDateOfServiceOfBranch] Failed!');
		console.log(error);
		throw error;
	}
};

// I Asked ChatGPT.
const helperSplitArrayIntoChunks = <T>(
	array: T[],
	chunkSize: number
): T[][] => {
	return Array.from(
		// Create an object with length, its elements will be ignored using the "_" sign.
		// I don't care about it's elements, i only need it to express "desired iterations".
		// Basically, this creates Indices Q from0 to "Math.ceil(array.length / chunkSize)".
		// the Elements P of this object, will be ignored.
		{ length: Math.ceil(array.length / chunkSize) },

		// For each of Q, map a slice S of the original array.
		// Said S, will Start at (q of Q) * chunksize, and will end at ((q of Q)+1) * chunksize.
		// Example: (0*3, 1*3) 3 slots, (1*3, 2*3) next 3 slots, (2*3, 3*3) next 3 slots, ...
		// This will create a slice of the array for each index (q of Q).
		// Notice that each p of P, is "_" which means "ignored".
		(_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)
	);
};

const processBranchBatch = async (
	branches: ISingleBranchQueryResponse[],
	retries: number
) => {};

export { router as AllTimeSlots };
