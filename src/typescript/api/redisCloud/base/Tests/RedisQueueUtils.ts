import { getRedisCloudData as fetchData } from "../RedisQueueUtils";
import { IBranchIdQnomyCodePair } from "../../../../data/models/persistenceModels/PostofficeBranchIdCodePair";

console.log("** Test Redis Queue Utilities **");

export const getRedisCloudData = () => {
	console.log("** (1) getRedisCloudData **");
	const data = fetchData();
	console.log(`[getRedisCloudData] data keys : `, Object.keys(data));
};

export const deserializeItems = () => {
	console.log("** (2) deserializeItems **");
	const container: string[] = [];
	container.push(JSON.stringify({ key: "value" }));
	container.push("qwep!");
	console.log(`[deserializeItems] Serialized items : `, container);
	const data = deserialize({ serializedItems: container });
	console.log(`[deserializeItems] De serialized items : `, data);
};

const deserialize = (data: { serializedItems: string[] }) => {
	if (!Array.isArray(data.serializedItems)) return null;
	let deserialized: IBranchIdQnomyCodePair[] = [];
	try {
		deserialized = data.serializedItems.map((item) => JSON.parse(item));
	} catch (error) {
		console.error(
			`[PostofficeBranchQueueItem][deserializeItems] Error : ` + error
		);
	}
	return deserialized;
};
