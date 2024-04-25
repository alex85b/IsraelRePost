export const isValidString = (value: any) => {
	return typeof value === 'string' && value.length > 0;
};

export const isValidNumber = (value: any) => {
	return typeof value === 'number' && value >= 0;
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
