import { AxiosResponse } from 'axios';
import { IPostofficeResponseData } from './shared/PostofficeResponseData';

export interface ITimesResponseData {
	Time: number;
}

export interface IExpectedTimesResponse extends IPostofficeResponseData {
	Results: ITimesResponseData[];
}

export interface IRequestTimesResponse {
	getTimes(): ITimesResponseData[];
	toString(): string;
}

export class RequestTimesResponse implements IRequestTimesResponse {
	private times: ITimesResponseData[];
	private constructor(buildData: { postofficeAppointmentTimes: ITimesResponseData[] }) {
		this.times = buildData.postofficeAppointmentTimes;
	}

	getTimes() {
		return [...this.times];
	}

	toString() {
		return this.times
			.map((time) => {
				return [`Appointment time : ${timeNumberToHourFormat(time.Time)}`].join('\n');
			})
			.join('\n\n');
	}

	static Builder = class {
		private times: ITimesResponseData[] = [];

		useAxiosResponse(
			rawResponse: Omit<AxiosResponse<IExpectedTimesResponse, any>, 'request' | 'config'>
		) {
			const faults: string[] = [];
			const success = rawResponse.data?.Success ?? false;
			const times = rawResponse.data?.Results;

			if (typeof success !== 'boolean' || (typeof success === 'boolean' && !success)) {
				faults.push('times response status is failed');
			}
			if (!Array.isArray(times)) {
				faults.push('times response array is malformed or does not exist');
			} else if (!times.length) {
				faults.push('times response contains no appointment times');
			}
			if (faults.length) throw Error(faults.join(' | '));

			if (times.length) {
				const time = times[0]?.Time;
				if (typeof time !== 'number') throw Error('time is not a numerical value');
			}

			this.times = times;
			return this;
		}

		build() {
			return new RequestTimesResponse({ postofficeAppointmentTimes: this.times });
		}
	};
}

/**
 * Converts a "Time" value to a string representation in "HH:MM" format.
 * @param timeValue The "Time" value to convert.
 * @returns The time string in "HH:MM" format.
 */
function timeNumberToHourFormat(timeValue: number): string {
	// Calculate the hours by dividing the time value by 60 and flooring the result.
	const hours = Math.floor(timeValue / 60);

	// Calculate the minutes by getting the remainder of the time value divided by 60.
	const minutes = timeValue % 60;

	// Convert the hours to a string and pad with leading zeros if necessary.
	const formattedHours = hours.toString().padStart(2, '0');

	// Convert the minutes to a string and pad with leading zeros if necessary.
	const formattedMinutes = minutes.toString().padStart(2, '0');

	// Return the formatted time string in "HH:MM" format.
	return `${formattedHours}:${formattedMinutes}`;
}
