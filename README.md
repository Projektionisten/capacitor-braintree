# @projektionisten/capacitor-braintree

The Braintree Drop-in UI is a self contained overlay for using different types of payment providers in your app.

## Install

```bash
yarn add @projektionisten/capacitor-braintree
npx cap sync
```
## Android

For the paypal browser flow to work, you need to add this overload to the MainActivity of your android project

```java
@Override
protected void onNewIntent(Intent newIntent) {
    super.onNewIntent(newIntent);

    setIntent(newIntent);
}
```

Also, an intent-filter for the jump back into the app needs to be defined. The `${applicationId}` does not need to be replaced by anything, it automatically inserts the package name of the application

``` xml
<intent-filter >
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data android:scheme="${applicationId}.braintree" />
</intent-filter>
```



If you want to enable GooglePay, you also need to add this meta tag to the application element in your Manifest file

```xml
<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="true"/>
```

## API

<docgen-index>

* [`setClientToken(...)`](#setclienttoken)
* [`startPaypalPayment(...)`](#startpaypalpayment)
* [`startApplePayPayment(...)`](#startapplepaypayment)
* [`startGooglePayPayment(...)`](#startgooglepaypayment)
* [`isGooglePayReady()`](#isgooglepayready)
* [`isApplePayReady()`](#isapplepayready)
* [Interfaces](#interfaces)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### setClientToken(...)

```typescript
setClientToken(options: TokenOptions) => Promise<void>
```

This updates the plugin with a new auth token.

This needs to be called before the SDK can be used.

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#tokenoptions">TokenOptions</a></code> |

--------------------


### startPaypalPayment(...)

```typescript
startPaypalPayment(options: PaypalPaymentOptions) => Promise<PaymentUIResult>
```

Starts a transaction with the paypal sdk. Will open a seperate browser window or similar to complete and
return with information about the used account and the payment nonce

| Param         | Type                                                                  |
| ------------- | --------------------------------------------------------------------- |
| **`options`** | <code><a href="#paypalpaymentoptions">PaypalPaymentOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#paymentuiresult">PaymentUIResult</a>&gt;</code>

--------------------


### startApplePayPayment(...)

```typescript
startApplePayPayment(options: ApplePaymentOptions) => Promise<PaymentUIResult>
```

Starts a transaction with the apple pay sdk. Will open a seperate browser window or similar to complete and
return with information about the used account and the payment nonce

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#applepaymentoptions">ApplePaymentOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#paymentuiresult">PaymentUIResult</a>&gt;</code>

--------------------


### startGooglePayPayment(...)

```typescript
startGooglePayPayment(options: GooglePaymentOptions) => Promise<PaymentUIResult>
```

Starts a transaction with the google pay sdk. Will open a seperate browser window or similar to complete and
return with information about the used account and the payment nonce

| Param         | Type                                                                  |
| ------------- | --------------------------------------------------------------------- |
| **`options`** | <code><a href="#googlepaymentoptions">GooglePaymentOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#paymentuiresult">PaymentUIResult</a>&gt;</code>

--------------------


### isGooglePayReady()

```typescript
isGooglePayReady() => Promise<PaymentMethodReadyResult>
```

Google pay specifically offers a method to wait for it to be ready to use. Returns a promise that resolves when it is ready.

**Returns:** <code>Promise&lt;<a href="#paymentmethodreadyresult">PaymentMethodReadyResult</a>&gt;</code>

--------------------


### isApplePayReady()

```typescript
isApplePayReady() => Promise<PaymentMethodReadyResult>
```

Check if apple pay is available on this device

**Returns:** <code>Promise&lt;<a href="#paymentmethodreadyresult">PaymentMethodReadyResult</a>&gt;</code>

--------------------


### Interfaces


#### TokenOptions

Options for setting up payment tokens

| Prop        | Type                                       | Description                                                                                                                                                                                                             | Default                   |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **`token`** | <code>string</code>                        | The token to be used                                                                                                                                                                                                    |                           |
| **`env`**   | <code>'development' \| 'production'</code> | Environment for the payment providers. Currently only used by the google pay client in the *WEB* implementation. When env is 'development', the google pay client will use the TEST config, accessing only the sandbox. | <code>'production'</code> |


#### PaymentUIResult

Successful callback result for the payment methods.

| Prop                       | Type                                                                                                                                                                                   | Description                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **`userCancelled`**        | <code>boolean</code>                                                                                                                                                                   | Indicates if the user used the cancel button to close the dialog without completing the payment. |
| **`nonce`**                | <code>string</code>                                                                                                                                                                    | The nonce for the payment transaction (if a payment was completed).                              |
| **`type`**                 | <code>string</code>                                                                                                                                                                    | The payment type (if a payment was completed).                                                   |
| **`localizedDescription`** | <code>string</code>                                                                                                                                                                    | A description of the payment method (if a payment was completed).                                |
| **`card`**                 | <code>{ lastTwo: string; network: string; }</code>                                                                                                                                     | Information about the credit card used to complete a payment (if a credit card was used).        |
| **`paypalAccount`**        | <code>{ email: string; firstName?: string; lastName?: string; phone?: string; billingAddress?: string; shippingAddress?: string; clientMetadataId?: string; payerId?: string; }</code> | Information about the PayPal account used to complete a payment (if a PayPal account was used).  |
| **`threeDSecureCard`**     | <code>{ liabilityShifted: boolean; liabilityShiftPossible: boolean; }</code>                                                                                                           | Information about 3D Secure card used to complete a payment (if 3D Secure was used).             |


#### PaypalPaymentOptions

Options for the payment methods.

| Prop                     | Type                                                                | Description                                                                                                      |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`amount`**             | <code>string</code>                                                 | The amount of the transaction to show in the drop-in UI on the summary row as well as the call to action button. |
| **`primaryDescription`** | <code>string</code>                                                 | The description of the transaction to show in the drop-in UI on the summary row.                                 |
| **`paymentFlow`**        | <code><a href="#paypal_payment_flow">PAYPAL_PAYMENT_FLOW</a></code> | Type of payment flow. Either an one-time checkout or a vaulted payment, for easier transactions in the future    |
| **`userAction`**         | <code><a href="#paypal_user_action">PAYPAL_USER_ACTION</a></code>   | Defines the type of call to action button the user clicks to return to the shop                                  |


#### ApplePaymentOptions

Options for the payment methods.

| Prop                     | Type                | Description                                                                                                      |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`amount`**             | <code>string</code> | The amount of the transaction to show in the drop-in UI on the summary row as well as the call to action button. |
| **`primaryDescription`** | <code>string</code> | The description of the transaction to show in the drop-in UI on the summary row.                                 |


#### GooglePaymentOptions

Options for the payment methods.

| Prop         | Type                | Description                                                                                                      |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`amount`** | <code>string</code> | The amount of the transaction to show in the drop-in UI on the summary row as well as the call to action button. |


#### PaymentMethodReadyResult

Result for a method that checks if a given payment method is ready to be used

| Prop        | Type                 |
| ----------- | -------------------- |
| **`ready`** | <code>boolean</code> |


### Enums


#### PAYPAL_PAYMENT_FLOW

| Members        | Value                   |
| -------------- | ----------------------- |
| **`CHECKOUT`** | <code>'checkout'</code> |
| **`VAULT`**    | <code>'vault'</code>    |


#### PAYPAL_USER_ACTION

| Members                    | Value                   |
| -------------------------- | ----------------------- |
| **`CONTINUE_TO_CHECKOUT`** | <code>'continue'</code> |
| **`COMMIT`**               | <code>'commit'</code>   |

</docgen-api>
