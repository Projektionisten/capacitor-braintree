import { WebPlugin } from '@capacitor/core';

import type {
  ApplePayOptions,
  BraintreePlugin,
  PaymentUIOptions,
  PaymentUIResult,
} from './definitions';

export class BraintreeWeb extends WebPlugin implements BraintreePlugin {
  async initialize (options: {
    token: string
  }): Promise<void> {
    console.log(options.token);
    throw this.unimplemented()
  }

  async setClientToken (options: {
    token: string
  }): Promise<void> {
    console.log(options.token);
    throw this.unimplemented()
  }

  async setupApplePay (options?: ApplePayOptions | undefined): Promise<void> {
    console.log(options);
    throw this.unimplemented()
  }

  async presentDropInPaymentUI (options?: PaymentUIOptions | undefined): Promise<PaymentUIResult> {
    console.log(options);
    throw this.unimplemented()
  }


}
