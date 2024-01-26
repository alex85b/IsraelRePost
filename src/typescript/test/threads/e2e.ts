import { ContinuesUpdateRoot } from '../../services/appointments-update/entry-point/ContinuesUpdateRoot';

export const testE2E = (run: boolean) => {
	if (!run) return;
	const cUpdate = new ContinuesUpdateRoot(false);
	cUpdate.test();
};
