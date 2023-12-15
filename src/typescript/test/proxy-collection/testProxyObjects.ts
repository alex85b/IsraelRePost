import { SmartProxyCollection } from '../../proxy-management/SmartProxyCollection';
import { WebShareCollection } from '../../proxy-management/WebShareCollection';

export const webShareProxyObject = async () => {
	console.log('[Web Share Proxy Object] Start');
	const webShare = new WebShareCollection();
	const webShareProxyObject = await webShare.getProxyObject();
	console.log('[Result] WebShareProxyObject : ', webShareProxyObject);
	console.log('[Web Share Proxy Object] End');
};

export const smartProxyObjects = async () => {
	console.log('[Smart Proxy Objects] Start');
	const smartProxy = new SmartProxyCollection();
	const smartProxyObject = await smartProxy.getProxyObject();
	console.log('[Result] SmartProxyObject : ', smartProxyObject);
	console.log('[Smart Proxy Objects] End');
};
