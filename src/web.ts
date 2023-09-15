import { WebPlugin } from '@capacitor/core';
import type {
  Client,
  GooglePayment,
  PayPal,
  PayPalTokenizePayload,
} from 'braintree-web';
import { client, googlePayment, paypal, dataCollector } from 'braintree-web';

import type {
  BraintreeSDKPlugin,
  GooglePaymentOptions,
  PaymentMethodReadyResult,
  PaymentUIResult,
  PaypalPaymentOptions,
  TokenOptions,
} from './definitions';
import { PAYPAL_PAYMENT_FLOW, PAYPAL_USER_ACTION } from './definitions';

export class BraintreeSDKWeb extends WebPlugin implements BraintreeSDKPlugin {
  private braintreeClient?: Client;
  private correlationId?: string;
  private googlePayClient?: GooglePayment;
  private googlePaymentsInstance?: google.payments.api.PaymentsClient;

  /**
   * Used to set the SDK token before building the drop in instance
   *
   * @param options Param object containing the client token for the braintree sdk
   */
  public async setClientToken(options: TokenOptions): Promise<void> {
    if (options.token !== '') {
      // initialize general braintree client
      this.braintreeClient = await client.create({
        authorization: options.token,
      });

      const dataCollectorInstance = await dataCollector.create({client: this.braintreeClient, paypal: true});
      const deviceData: any = await dataCollectorInstance.getDeviceData({raw: true}) as object;

      this.correlationId = deviceData.correlationId;

      try {
        // because we could not check for google pay availability otherwise, we also
        // already initialize the google payment client
        this.googlePayClient = await googlePayment.create({
          client: this.braintreeClient,
          googlePayVersion: 2,
        });

        this.googlePaymentsInstance = new google.payments.api.PaymentsClient({
          environment: options.env === 'development' ? 'TEST' : 'PRODUCTION',
        });
      } catch (error) {
        console.debug('Creation of google client failed', error);
      }

      return Promise.resolve();
    } else {
      throw 'Token is required';
    }
  }

  /**
   * Checks if google pay is configured and ready to be used on this device.
   *
   * @returns Object containing a boolean of the status of google pay
   */
  public async isGooglePayReady(): Promise<PaymentMethodReadyResult> {
    if (
      this.braintreeClient === undefined ||
      this.googlePaymentsInstance === undefined ||
      this.googlePayClient === undefined
    ) {
      throw 'Use `setClientToken` first to initialize client';
    }

    try {
      const readyToPay = await this.googlePaymentsInstance.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: (
          await this.googlePayClient.createPaymentDataRequest()
        ).allowedPaymentMethods,
        existingPaymentMethodRequired: true,
      });
      return Promise.resolve({
        ready: readyToPay.result,
      });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  /**
   * Initiates a payment via google pay and returns the result, when the user completes or aborts the flow.
   *
   * @returns Resulting information from the payment. Most importantly, the nonce of the authorized payment
   */
  public async startGooglePayPayment(
    options: GooglePaymentOptions,
  ): Promise<PaymentUIResult> {
    if (options.amount == undefined) {
      throw 'Price is required';
    }

    if (
      this.braintreeClient == undefined ||
      this.googlePaymentsInstance === undefined ||
      this.googlePayClient === undefined
    ) {
      throw 'Use `setClientToken` first';
    }

    try {
      const paymentRequest =
        await this.googlePayClient.createPaymentDataRequest({
          transactionInfo: {
            currencyCode: 'EUR',
            totalPriceStatus: 'FINAL',
            totalPrice: options.amount,
          },
        });

      const paymentData = await this.googlePaymentsInstance.loadPaymentData(
        paymentRequest,
      );
      const paymentResult = await this.googlePayClient.parseResponse(
        paymentData,
      );

      return Promise.resolve({
        userCancelled: false,
        nonce: paymentResult.nonce,
      });
    } catch (error) {
      throw 'Error in google pay checkout: ' + error;
    }
  }

  /**
   * Initiates a payment via paypal vault and returns the result, when the user completes or aborts the flow.
   *
   * @returns Resulting information from the payment. Most importantly, the nonce of the authorized payment
   */
  public async startPaypalPayment(
    options: PaypalPaymentOptions,
  ): Promise<PaymentUIResult> {
    if (options.amount === undefined) {
      throw 'Price is required';
    }

    if (this.braintreeClient == undefined) {
      throw 'Use `setClientToken` first to initialize client';
    }

    let paypalClient: PayPal;

    try {
      paypalClient = await paypal.create({
        client: this.braintreeClient,
      });

      const paypalTokenizeResult: PayPalTokenizePayload =
        await paypalClient.tokenize({
          flow:
            options.paymentFlow === PAYPAL_PAYMENT_FLOW.VAULT
              ? 'vault'
              : 'checkout',
          locale: 'de_DE',
          amount: options.amount,
          currency: 'EUR',
          useraction:
            options.userAction === PAYPAL_USER_ACTION.COMMIT
              ? 'commit'
              : undefined,
          billingAgreementDescription: options.primaryDescription ?? '',
        });

      return Promise.resolve({
        userCancelled: false,
        nonce: paypalTokenizeResult.nonce,
        paypalAccount: {
          email: paypalTokenizeResult.details?.email,
          clientMetadataId: this.correlationId
        },
      });
    } catch (error) {
      throw 'Error in paypal checkout: ' + error;
    }
  }

  public async startApplePayPayment(): Promise<PaymentUIResult> {
    throw new Error('Method not implemented.');
  }

  public async isApplePayReady(): Promise<PaymentMethodReadyResult> {
    throw new Error('Method not implemented.');
  }
}
