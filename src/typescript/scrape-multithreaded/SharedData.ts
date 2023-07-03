let sharedData: any = null;

export const setSharedData = (data: any) => {
	sharedData = data;
};

export const getSharedData = () => {
	return sharedData;
};

// module.exports = { setSharedData, getSharedData };
