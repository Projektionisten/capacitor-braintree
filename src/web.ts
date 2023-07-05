import { WebPlugin } from '@capacitor/core';
import type { Client, GooglePayment, PayPal, PayPalTokenizePayload } from 'braintree-web';
import { client, googlePayment, paypal } from 'braintree-web';

import type {
  BraintreeSDKPlugin,
  PaymentMethodReadyResult,
  PaymentUIOptions,
  PaymentUIResult,
  TokenOptions,
} from './definitions';

export class BraintreeSDKWeb extends WebPlugin implements BraintreeSDKPlugin {
  private clientToken?: string;
  private braintreeClient?: Client;
  private googlePayClient?: GooglePayment;
  private googlePaymentsInstance?: google.payments.api.PaymentsClient;

  /**
   * Used to set the SDK token before building the drop in instance
   *
   * @param options Param object containing the client token for the braintree sdk
   */
  public async setClientToken (options: TokenOptions): Promise<void> {
    if (options.token !== '') {
      this.clientToken = options.token;
      this.braintreeClient = await client.create({
        authorization: this.clientToken
      });
      this.googlePayClient = await googlePayment.create({
        client: this.braintreeClient, // From braintree.client.create, see below for full example
        googlePayVersion: 2,
      });
      this.googlePaymentsInstance = new google.payments.api.PaymentsClient({
        environment: 'TEST' // or 'PRODUCTION', TODO
      });
      return;
    } else {
      throw 'Token is required';
    }
  }

  public async isGooglePayReady (): Promise<PaymentMethodReadyResult> {
    if (this.braintreeClient === undefined || this.googlePaymentsInstance === undefined || this.googlePayClient === undefined) {
      throw 'Use `setClientToken` first';
    }

    try {
      const readyToPay = await this.googlePaymentsInstance.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: (await this.googlePayClient.createPaymentDataRequest()).allowedPaymentMethods,
        existingPaymentMethodRequired: true
      });
      return {
        ready: readyToPay.result
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async startGooglePayPayment (options: PaymentUIOptions): Promise<PaymentUIResult> {
    if (options.amount == undefined) {
      throw 'Price is required';
    }

    if (this.braintreeClient == undefined || this.googlePaymentsInstance === undefined || this.googlePayClient === undefined) {
      throw 'Use `setClientToken` first';
    }

    try {

      const paymentRequest = await this.googlePayClient.createPaymentDataRequest({
        transactionInfo: {
          currencyCode: 'EUR',
          totalPriceStatus: 'FINAL',
          totalPrice: options.amount
        }
      })

      const paymentData = await this.googlePaymentsInstance.loadPaymentData(paymentRequest)
      const paymentResult = await this.googlePayClient.parseResponse(paymentData);

      return {
        userCancelled: false,
        nonce: paymentResult.nonce
      }

    } catch (error) {
      throw 'Error in google pay checkout: ' + error;
    }

  }

  public async startPaypalVaultPayment (options: PaymentUIOptions): Promise<PaymentUIResult> {
    if (options.amount == undefined) {
      throw 'Price is required';
    }
    if (this.braintreeClient == undefined) {
      throw 'Use `setClientToken` first';
    }

    let paypalClient: PayPal;

    try {
      paypalClient = await paypal.create({
        client: this.braintreeClient
      });

      const paypalTokenizeResult: PayPalTokenizePayload = await paypalClient.tokenize({
        flow: 'vault',
        locale: 'de_DE',
        billingAgreementDescription: options.primaryDescription
      })

      return {
        userCancelled: false,
        nonce: paypalTokenizeResult.nonce,
        payPalAccount: {
          email: paypalTokenizeResult.details?.email
        }
      }
    } catch (error) {
      throw 'Error in paypal checkout: ' + error;
    }
  }

  public async startApplePayPayment (options: PaymentUIOptions): Promise<PaymentUIResult> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  public async isApplePayAvailable (): Promise<PaymentMethodReadyResult> {
    throw new Error('Method not implemented.');
  }

}
