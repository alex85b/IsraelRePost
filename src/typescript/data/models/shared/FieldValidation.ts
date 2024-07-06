export const isValidString = (value: any) => {
	return typeof value === 'string' && value.length > 0;
};

export const isValidNumber = (value: any) => {
	return typeof value === 'number' && value >= 0;
};

export const isValidISO8601DateTime = (value: any) => {
	const regex =
		/^(\d{4})-((0[1-9])|(1[0-2]))-(0[1-9]|[12][0-9]|3[01])T(([01][0-9])|(2[0-3])):([0-5][0-9]):([0-5][0-9])$/;
	return typeof value === 'string' && regex.test(value);
};

export const validateAndAssign = <T, K extends keyof T>(data: {
	value: T[K];
	validatorFunction: (value: T[K]) => boolean;
	assignTarget: T;
	assignKey: K;
	faults: string[];
	errorMessage: string;
}) => {
	if (!data.validatorFunction(data.value)) {
		data.faults.push(data.errorMessage);
	} else {
		data.assignTarget[data.assignKey] = data.value as T[K];
	}
};
