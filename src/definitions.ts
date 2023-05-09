/**
 * Options for the setupApplePay method.
 */
export interface ApplePayOptions {
  /**
   * Apple Merchant ID can be obtained from Apple.
   */
  merchantId: string;

  /**
   * 3 letter currency code ISO 4217
   */
  currencyCode: string;

  /**
   * 2 letter country code ISO 3166-1
   */
  countryCode: string;
}

/**
 * Options for setting up payment tokens
 */
export interface TokenOptions {
  /**
   * The token to be used
   */
  token: string;
}

/**
* Options for the presentDropInPaymentUI method.
*/
export interface PaymentUIOptions {

  /**
   * The amount of the transaction to show in the drop-in UI on the
   * summary row as well as the call to action button.
   */
  amount: string;

  /**
   * The description of the transaction to show in the drop-in UI on the
   * summary row.
   */
  primaryDescription: string;

  /**
   * The account email of the user for GooglePay, 3d secure etc
   */
  email: string;
}

/**
* Successful callback result for the presentDropInPaymentUI method.
*/
export interface PaymentUIResult {

  /**
   * Indicates if the user used the cancel button to close the dialog without
   * completing the payment.
   */
  userCancelled: boolean;

  /**
   * The nonce for the payment transaction (if a payment was completed).
   */
  nonce: string;

  /**
   * The payment type (if a payment was completed).
   */
  type: string;

  /**
   * A description of the payment method (if a payment was completed).
   */
  localizedDescription: string;

  /**
   * Information about the credit card used to complete a payment (if a credit card was used).
   */
  card: {

      /**
       * The last two digits of the credit card used.
       */
      lastTwo: string;

      /**
       * An enumerated value used to indicate the type of credit card used.
       *
       * Can be one of the following values:
       *
       * BTCardNetworkUnknown
       * BTCardNetworkAMEX
       * BTCardNetworkDinersClub
       * BTCardNetworkDiscover
       * BTCardNetworkMasterCard
       * BTCardNetworkVisa
       * BTCardNetworkJCB
       * BTCardNetworkLaser
       * BTCardNetworkMaestro
       * BTCardNetworkUnionPay
       * BTCardNetworkSolo
       * BTCardNetworkSwitch
       * BTCardNetworkUKMaestro
       */
      network: string;
  };

  /**
   * Information about the PayPal account used to complete a payment (if a PayPal account was used).
   */
  payPalAccount: {
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      billingAddress: string;
      shippingAddress: string;
      clientMetadataId: string;
      payerId: string;
  };

  /**
   * Information about the Apple Pay card used to complete a payment (if Apple Pay was used).
   */
  applePaycard: {
  };

  /**
   * Information about 3D Secure card used to complete a payment (if 3D Secure was used).
   */
  threeDSecureCard: {
      liabilityShifted: boolean;
      liabilityShiftPossible: boolean;
  };

  /**
   * Information about Venmo account used to complete a payment (if a Venmo account was used).
   */
  venmoAccount: {
      username: string;
  };
}

export interface BraintreePlugin {
  /**
   * --- Android Only ---
   * This updates the DropInClient in the plugin with a new auth token.
   *
   * This needs to be called before the DropInUi can be used.
   *
   * @param token The client token or tokenization key to use with the Braintree client.
   */
  setClientToken(options: TokenOptions): Promise<void>;

  /**
   * Used to configure Apple Pay on iOS
   *
   * @param options Apple Pay options.
   */
  setupApplePay(options?: ApplePayOptions): Promise<void>;

  /**
   * Shows Braintree's drop-in payment UI.
   *
   * @param options drop-in UI options.
   */
  presentDropInPaymentUI(options?: PaymentUIOptions): Promise<PaymentUIResult>;
}
