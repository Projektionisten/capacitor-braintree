import { WebPlugin } from '@capacitor/core';
import type {
  ApplePay,
  ApplePayPayload,
  ApplePayPaymentRequest,
  Client,
  GooglePayment,
  PayPal,
  PayPalTokenizePayload,
} from 'braintree-web';
import { client, googlePayment, paypal, dataCollector, ApplePaySession, applePay } from 'braintree-web';

import type {
  ApplePaymentOptions,
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
  private applePayClient?: ApplePay;
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

      const dataCollectorInstance = await dataCollector.create({
        client: this.braintreeClient,
        paypal: true,
      });
      const deviceData: any = (await dataCollectorInstance.getDeviceData({
        raw: true,
      })) as Record<string, unknown>;

      this.correlationId = deviceData['correlation_id'];

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
        return Promise.reject();
      }

      try {
        // because we could not check for apple pay availability otherwise, we also
        // already initialize the apple payment client
        this.applePayClient = await applePay.create({client: this.braintreeClient});
      } catch (error) {
        console.debug('Creation of apple client failed', error);
        return Promise.reject();
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
   * @returns Resulting information from the payment. Most importantly, the nonce of the authorized payment.
   */
  public async startGooglePayPayment(options: GooglePaymentOptions): Promise<PaymentUIResult> {
    if (options.amount == undefined) {
      throw 'Amount is required';
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
          merchantInfo:
            options.merchantId !== undefined
              ? { merchantId: options.merchantId }
              : undefined,
          transactionInfo: {
            currencyCode: options.currencyCode ?? 'EUR',
            totalPriceStatus: options.amountStatus ?? 'FINAL',
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
   * @returns Resulting information from the payment. Most importantly, the nonce of the authorized payment.
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
          clientMetadataId: this.correlationId,
        },
      });
    } catch (error) {
      throw 'Error in paypal checkout: ' + error;
    }
  }

  /**
   * A method to check if apple pay is possible to use for this device.
   *
   * @returns A result object containing a boolean about the availability of apple pay on this device
   */
  public async isApplePayReady(): Promise<PaymentMethodReadyResult> {
    if ((window as any).ApplePaySession && ApplePaySession.supportsVersion(3) && ApplePaySession.canMakePayments()) {
      return Promise.resolve({
        ready: true
      });
    } else {
      return Promise.resolve({
        ready: false
      });
    }
  }

  /**
   * Create an apple payment request and start the process for the user.
   *
   * @returns Resulting information from the payment. Most importantly, the nonce of the authorized payment.
   */
  public async startApplePayPayment(options: ApplePaymentOptions): Promise<PaymentUIResult> {
    if (
      this.braintreeClient == undefined ||
      this.applePayClient === undefined
    ) {
      throw 'Use `setClientToken` first';
    }

    const paymentRequest: ApplePayPaymentRequest = this.applePayClient.createPaymentRequest({
      currencyCode: options.currencyCode ?? 'EUR',
      countryCode: options.countryCode,
      total: {
        amount: options.amount,
        label: options.primaryDescription ?? ''
      }
    });
    const session: ApplePaySession = new ApplePaySession(3, paymentRequest);

    return new Promise((resolve, reject) => {
      session.onvalidatemerchant = (event) => {
        this.applePayClient?.performValidation({
          validationURL: event.validationURL
        }, (err, merchantSession) => {
          if (err) {
            throw 'Apple Pay failed to load'
          }
          session.completeMerchantValidation(merchantSession);
        });
      };

      session.onpaymentauthorized = (event) => {
        console.log('Your shipping address is:', event.payment.shippingContact);

        this.applePayClient?.tokenize({
          token: event.payment.token
        }, (tokenizeErr, payload?: ApplePayPayload) => {
          if (tokenizeErr) {
            console.error('Error tokenizing Apple Pay:', tokenizeErr);
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            reject();
          }

          if (payload === undefined) {
            console.error('Apple Pay payload was empty');
            reject();
          }

          // After you have transacted with the payload.nonce,
          // call 'completePayment' to dismiss the Apple Pay sheet.
          session.completePayment(ApplePaySession.STATUS_SUCCESS);

          resolve({
            userCancelled: false,
            nonce: payload?.nonce ?? '',
            type: payload?.type,
            localizedDescription: payload?.description
          });
        });
      };

      session.begin();
    })
  }

}
