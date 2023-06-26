import express, { Request, Response, NextFunction } from 'express';
import { URLs } from '../common/urls';
import { MakeRequest } from '../api-requests/make-request';
import dotenv from 'dotenv';
import { UserCreateAnonymous } from '../api-requests/user-create-anonymouse';
import { IUserCreateAnonymous } from '../common/interfaces/api-response/IUserCreateAnonymous';
import { getRandomIntInclusive } from '../common/GetRandomIntInclusive';
import { extractPageData } from '../scrape/ExtractPageData';
import { queryAllBranches } from '../scrape/QueryAllBranches';
import { getBranchDetails } from '../scrape/GetBranchDetails';
import { persistTimeSlots } from '../scrape/PersistTimeSlots';
import { SetUpElasticClient } from '../scrape/SetUpElasticClient';
import {
	IBranchQueryResponse,
	ISingleBranchQueryResponse,
} from '../common/interfaces/IBranchQueryResponse';
import { myCustomDelay } from '../common/Deley';
import { CookieBank } from '../common/cookie-bank';

dotenv.config();

const router = express.Router();

router.post(
	'/api/scrape/all-time-slots',
	async (req: Request, res: Response, next: NextFunction) => {
		//
		//* Get all branches.
		const { allBranches } = await queryAllBranches();
		console.log(
			'### [all-time-slots] Branch query result amount ### : ',
			allBranches.length
		);
		const branchesBatches = helperSplitArrayIntoChunks(allBranches, 10);

		try {
			await SetUpElasticClient('slots');
			let counter = 0;
			for (const batch of branchesBatches) {
				console.log('### [all-time-slots] batch ### : ', batch);
				console.log(`### [all-time-slots] done ${counter} batches ###`);
				console.log(`### [all-time-slots] done ${counter * 10} branches ###`);

				const { branches, errors, skipped, retriesLeft } = await processBranchBatch(
					batch,
					3
				);

				console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
				console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
				console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
				console.log({
					branches: branches,
					errors: JSON.stringify(errors),
					skipped: skipped,
					retriesLeft: retriesLeft,
				});
				console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
				console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
				console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');

				if (errors.length) break;

				counter = counter + 1;
				await myCustomDelay(10000);
			}

			res.status(200).send('Done');
		} catch (error) {
			console.error({
				unhandledAmount: allBranches.length,
				// unhandledBranches: allBranches,
				// Unhandled Branches !
				// TODO: throw error with all the unhandled branches.
			});
			next(error);
		}

		// res.status(200).send(allBranches);
	}
);

const helperResetTokenAndCookies = async (
	allBranches: IBranchQueryResponse,
	retries: number
) => {
	let run = retries;
	let cookieBank = new CookieBank();
	let htmlToken = '';
	let userDataToken = '';
	do {
		try {
			const randomIndex = getRandomIntInclusive(0, allBranches.length - 1);

			const response = await extractPageData(
				{
					PartialBranchUrl: URLs.PartialBranchUrl,
					branchNumber: allBranches[randomIndex]._source.branchnumber,
				},
				60000,
				true,
				true,
				true
			);

			cookieBank.addCookies(response.cookies);
			if (Object.keys(cookieBank.getCookies()).length === 0) {
				console.error('@@@ helperResetTokenAndCookies no cookies in the bank @@@');
			}
			htmlToken = response.htmlToken;

			const anonymousUser = await MakeRequest(
				new UserCreateAnonymous(cookieBank.getCookies(), htmlToken)
			);

			userDataToken = (anonymousUser.data as IUserCreateAnonymous).Results.token;

			cookieBank.importAxiosCookies(anonymousUser.axiosCookies);
		} catch (error) {
			retries = retries - 1;
		} finally {
			return { cookieBank, htmlToken, userDataToken };
		}
	} while (run);
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
) => {
	let run = retries;
	const errors: { branch: number; error: Error }[] = [];
	const skipped: number[] = [];
	let response = await helperResetTokenAndCookies(branches, retries);
	let cookieBank = response.cookieBank;
	let htmlToken = response.htmlToken;
	let userDataToken = response.userDataToken;
	let latestBranch = branches[branches.length];
	while (branches.length && run) {
		try {
			let branch = branches.pop();
			if (!branch) break;
			latestBranch = branch;
			const documentsArray =
				(await getBranchDetails(branch, cookieBank, userDataToken)) || [];

			if (documentsArray && documentsArray.length) {
				await persistTimeSlots(documentsArray);
				console.log(
					`### [processBranchBatch] ${branch._source.branchnameEN} : Done ###`
				);
			} else {
				skipped.push(branch._source.branchnumber);
			}
		} catch (error) {
			run = run - 1;
			errors.push({
				branch: latestBranch._source.branchnumber,
				error: error as Error,
			});
			branches.push(latestBranch);
			response = await helperResetTokenAndCookies(branches, retries);
			cookieBank = response.cookieBank;
			htmlToken = response.htmlToken;
			userDataToken = response.userDataToken;
		}
	}

	return { errors, skipped, branches, retriesLeft: run };
};

export { router as AllTimeSlots };
