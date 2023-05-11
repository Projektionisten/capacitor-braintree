import { WebPlugin } from '@capacitor/core';
import * as dropin from "braintree-web-drop-in";

import type {
  ApplePayOptions,
  BraintreePlugin,
  PaymentUIOptions,
  PaymentUIResult,
} from './definitions';

export class BraintreeWeb extends WebPlugin implements BraintreePlugin {
  private clientToken?: string;
  private dropinInstance?: dropin.Dropin;
  private defaultSelector = '#dropin-container';

  /**
   * Used to set the SDK token before building the drop in instance
   *
   * @param options Param object containing the client token for the braintree sdk
   */
  public async setClientToken (options: {
    token: string
  }): Promise<void> {
    if (options.token !== '') {
      this.clientToken = options.token;
      return;
    } else {
      throw "Token is required";
    }
  }

  public async setupApplePay (): Promise<void> {
    throw this.unimplemented()
  }

  /**
   * TODO Web needs a different flow, because the *creation* of the dropin displays it already, and the user needs to complete
   * the flow for a payment method *before* we use `requestPaymentMethod` to collect the nonce.
   *
   * @param options Object with some options for the transaction, like the price or user email address.
   * Important: the web SDK needs the "selector" option for it's bootstrapping into the page
   * @returns Promise with some result data. Most important of which is the nonce of the finished payment authorization
   */
  public async presentDropInPaymentUI (options?: PaymentUIOptions | undefined): Promise<PaymentUIResult> {
    // No need to create another drop in instance if there already is on (but should propably be done in another method after the change for the web flow)
    if (this.dropinInstance === undefined) {
      this.dropinInstance = await this.createDropin(options?.selector ?? this.defaultSelector);
    }

    return new Promise<PaymentUIResult>((resolve) => {
      this.dropinInstance?.requestPaymentMethod({
        threeDSecure: {...(options?.amount !== undefined
          ? {
            amount: options?.amount,
            email: options.email
          }
          : {
            amount: '0.00'
          })
        }
      }).then((payload: dropin.PaymentMethodPayload) => {
        const dropinResult: PaymentUIResult = {
          'nonce': payload.nonce,
          'userCancelled': false
        };

        switch (payload.type) {
          case 'CreditCard':
            dropinResult['card'] = {
              'network': payload.details.cardType,
              'lastTwo': payload.details.lastTwo
            }
            break;
          case 'PayPalAccount':
            dropinResult['payPalAccount'] = {
              'email': payload.details.email,
              'firstName': payload.details.firstName,
              'lastName': payload.details.lastName,
              'payerId': payload.details.payerId,
              'phone': payload.details.phone
            }
            break;
          default:
            break;
        }

        resolve(dropinResult);
      }).catch((error) => {
        if (error) {
          throw error;
        }
        return {
          'nonce': undefined,
          'userCancelled': true
        };
      });
    });
  }

  /**
   * Uses the client token and html selector to create the drop-in UI instance.
   * Upon creation, the SDK already injects the drop in into the HTML element specified by `selector` and the user
   * can choose their payment method
   *
   * @param selector HTML Selector which the app supplied in `presentDropInPaymentUI`
   * @returns Instance of the Drop-in UI
   */
  private async createDropin (selector: string): Promise<dropin.Dropin> {
    return new Promise<dropin.Dropin>((resolve, reject) => {
      if (this.clientToken !== undefined && this.clientToken !== '') {
        dropin.create({
          authorization: this.clientToken,
          container: selector,
          vaultManager: true,
          paypal: {
            flow: 'vault'
          }
        }, (error: any | null, dropin: dropin.Dropin | undefined) => {
          if (!error) {
            if (dropin !== undefined) {
              resolve(dropin);
            } else {
              reject('Dropin UI could not be created');
            }
          } else {
            throw error;
          }
        });
      } else {
        throw "Token is required";
      }
    })

  }


}
