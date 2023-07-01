// type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
// type NozDigit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
// type ThreeUpDigit = '3' | '4' | '5' | '6' | '7' | '8' | '9';
// type Day = `0${NozDigit}` | `1${Digit}` | `2${Digit}` | '30' | '31';
// type Month = `0${NozDigit}` | '10' | '11' | '12';
// type Year = `202${ThreeUpDigit}` | `20${ThreeUpDigit}${Digit}`;

// export type ISODateTimeString = `${Year}-${Month}-${Day}T00:00:00`;

export interface ITimeSlotsDocument {
	branchKey: string;
	branchDate: string;
	branchServiceId: number;
	branchServiceName: string;
	timeSlots: { Time: number }[];
}
