import { registerPlugin } from '@capacitor/core';

import type { BraintreeSDKPlugin } from './definitions';

const BraintreeSDK = registerPlugin<BraintreeSDKPlugin>('BraintreeSDK', {
	web: () => import('./web').then((m) => new m.BraintreeSDKWeb())
});

export * from './definitions';
export { BraintreeSDK };
