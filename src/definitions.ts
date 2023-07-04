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
* Options for the payment methods.
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
  primaryDescription?: string;

  /**
   * The account email of the user for GooglePay, 3d secure etc
   */
  email?: string;

  /**
   * --- WEB ONLY ---
   * HTML Selector of the element the dropin should insert itself into
   */
  selector?: string;
}

/**
* Successful callback result for the payment methods.
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
  type?: string;

  /**
   * A description of the payment method (if a payment was completed).
   */
  localizedDescription?: string;

  /**
   * Information about the credit card used to complete a payment (if a credit card was used).
   */
  card?: {

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
  payPalAccount?: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      billingAddress?: string;
      shippingAddress?: string;
      clientMetadataId?: string;
      payerId?: string;
  };

  /**
   * Information about the Apple Pay card used to complete a payment (if Apple Pay was used).
   */
  applePaycard?: {
  };

  /**
   * Information about 3D Secure card used to complete a payment (if 3D Secure was used).
   */
  threeDSecureCard?: {
      liabilityShifted: boolean;
      liabilityShiftPossible: boolean;
  };

  /**
   * Information about Venmo account used to complete a payment (if a Venmo account was used).
   */
  venmoAccount?: {
      username: string;
  };
}

/**
 * Result for a method that checks if a given payment method is ready to be used
 */
export interface PaymentMethodReadyResult {
  // Readyness result of the payment method
  ready: boolean;
}

export interface BraintreeSDKPlugin {
  /**
   * This updates the plugin with a new auth token.
   *
   * This needs to be called before the SDK can be used.
   *
   * @param token The client token or tokenization key to use with the Braintree client.
   */
  setClientToken(options: TokenOptions): Promise<void>;

  /**
   * Starts a transaction with the paypal sdk. Will open a seperate browser window or similar to complete and
   * return with information about the used account and the payment nonce
   *
   * @param options
   */
  startPaypalVaultPayment(options: PaymentUIOptions): Promise<PaymentUIResult>;

  /**
   * Starts a transaction with the apple pay sdk. Will open a seperate browser window or similar to complete and
   * return with information about the used account and the payment nonce
   *
   * @param options
   */
  startApplePayPayment(options: PaymentUIOptions): Promise<PaymentUIResult>;

  /**
   * Starts a transaction with the google pay sdk. Will open a seperate browser window or similar to complete and
   * return with information about the used account and the payment nonce
   *
   * @param options
   */
  startGooglePayPayment(options: PaymentUIOptions): Promise<PaymentUIResult>;

  /**
   * Google pay specifically offers a method to wait for it to be ready to use. Returns a promise that resolves when it is ready.
   */
  isGooglePayReady(): Promise<PaymentMethodReadyResult>;

  // TODO Add unique method for web, to collect the nonce after the user interacted with the drop in
  // collectPaymentResults(): Promise<PaymentUIResult>
}
