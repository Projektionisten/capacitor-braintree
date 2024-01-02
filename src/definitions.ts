/**
 * Options for setting up payment tokens
 */
export interface TokenOptions {
	/**
	 * The token to be used
	 */
	token: string;

	/**
	 * Environment for the payment providers.
	 * Currently only used by the google pay client in the *WEBimplementation.
	 * When env is 'development', the google pay client will use the TEST config, accessing only the sandbox.
	 *
   @default 'production'
	 */
	env?: 'development' | 'production';
}

export enum PAYPAL_PAYMENT_FLOW {
	CHECKOUT = 'checkout',
	VAULT = 'vault',
}

export enum PAYPAL_USER_ACTION {
	CONTINUE_TO_CHECKOUT = 'continue',
	COMMIT = 'commit',
}

export enum CREDIT_CARD_NETWORK {
	UNKNOWN = 'BTCardNetworkUnknown',
	AMEX = 'BTCardNetworkAMEX',
	DINERS_CLUB = 'BTCardNetworkDinersClub',
	DISCOVER = 'BTCardNetworkDiscover',
	MASTER_CARD = 'BTCardNetworkMasterCard',
	VISA = 'BTCardNetworkVisa',
	JCB = 'BTCardNetworkJCB',
	LASER = 'BTCardNetworkLaser',
	MAESTRO = 'BTCardNetworkMaestro',
	UNION_PAY = 'BTCardNetworkUnionPay',
	SOLO = 'BTCardNetworkSolo',
	SWITCH = 'BTCardNetworkSwitch',
	UK_MAESTRO = 'BTCardNetworkUKMaestro'
}

/**
 * Options for the payment methods.
 */
export interface PaypalPaymentOptions {
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
	 * Type of payment flow. Either an one-time checkout or a vaulted payment, for easier transactions in the future
	 *
   @default PAYPAL_PAYMENT_FLOW.CHECKOUT
	 */
	paymentFlow?: PAYPAL_PAYMENT_FLOW;

	/**
	 * Defines the type of call to action button the user clicks to return to the shop.
	 * By default, the call to action button will imply that there is a checkout with a final price after the user authorization.
	 * Use PAYPAL_USER_ACTION.COMMIT if it should be a final "pay now" button.
	 *
   @default PAYPAL_USER_ACTION.CONTINUE_TO_CHECKOUT
	 */
	userAction?: PAYPAL_USER_ACTION;
}

/**
 * Options for the payment methods.
 */
export interface GooglePaymentOptions {
	/**
	 * Merchant ID to use for this transaction if it differs from the one in your braintree account
	 */
	merchantId?: string;
	/**
	 * The amount of the transaction to show in the drop-in UI on the
	 * summary row as well as the call to action button.
	 */
	amount: string;
	/**
	 * Is the price already the final one to be paid,
	 * or will potential sales taxes or shipping prices be added later in the checkout
	 *
	 * @default 'FINAL'
	 */
	amountStatus?: 'ESTIMATED' | 'FINAL';
	/**
	 *ISO 4217 code of the currency used, like 'EUR' or 'USD'
	 *
	 * @default 'EUR'
	 */
	currencyCode?: string;
}

/**
 * Options for the payment methods.
 */
export interface ApplePaymentOptions {
	/**
	 * The amount of the transaction to show in the drop-in UI on the
	 * summary row as well as the call to action button.
	 */
	amount: string;

	/**
	 * ISO 4217 code of the currency used, like 'EUR' or 'USD'
	 *
	 * @default 'EUR'
	 */
	currencyCode?: string;

	/**
	 * ISO 3166 code of the merchants country, like 'DE' or 'US'.
	 * Defaults to the settings in your braintree backend
	 */
	countryCode?: string;

	/**
  * The description of the transaction to show in the drop-in UI on the
  * summary row.
  */
	primaryDescription?: string;
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
		 */
		network: CREDIT_CARD_NETWORK;
	};

	/**
	 * Information about the PayPal account used to complete a payment (if a PayPal account was used).
	 */
	paypalAccount?: {
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
	 * Information about 3D Secure card used to complete a payment (if 3D Secure was used).
	 */
	threeDSecureCard?: {
		liabilityShifted: boolean;
		liabilityShiftPossible: boolean;
	};
}

/**
 * Result for a method that checks if a given payment method is ready to be used
 */
export interface PaymentMethodReadyResult {
	// Readyness result of the payment method
	ready: boolean;
}

export interface BraintreePlugin {
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
	startPaypalPayment(options: PaypalPaymentOptions): Promise<PaymentUIResult>;

	/**
	 * Starts a transaction with the apple pay sdk. Will open a seperate browser window or similar to complete and
	 * return with information about the used account and the payment nonce
	 *
	 * @param options
	 */
	startApplePayPayment(options: ApplePaymentOptions): Promise<PaymentUIResult>;

	/**
	 * Starts a transaction with the google pay sdk. Will open a seperate browser window or similar to complete and
	 * return with information about the used account and the payment nonce
	 *
	 *@param options
	 */
	startGooglePayPayment(
		options: GooglePaymentOptions,
	): Promise<PaymentUIResult>;

	/**
	 * Google pay specifically offers a method to wait for it to be ready to use. Returns a promise that resolves when it is ready.
	 */
	isGooglePayReady(): Promise<PaymentMethodReadyResult>;

	/**
	 * Check if apple pay is available on this device
	 */
	isApplePayReady(): Promise<PaymentMethodReadyResult>;
}
