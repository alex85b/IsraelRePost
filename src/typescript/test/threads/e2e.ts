import { ContinuesUpdate } from '../../continues-update/ContinuesUpdate';

export const testE2E = (run: boolean) => {
	if (!run) return;
	const cUpdate = new ContinuesUpdate(false);
	cUpdate.test();
};
