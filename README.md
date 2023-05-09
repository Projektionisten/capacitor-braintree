# @projektionisten/capacitor-braintree

The Braintree Drop-in UI is a self contained overlay for using different types of payment providers in your app.

## Install

```bash
yarn add @projektionisten/capacitor-braintree
npx cap sync
```
## Android

The Braintree SDK depends on the Cardinal SDK, which can only be installed via a custom repository. This repo must be declared in your *project* level `build.gradle`


```gradle
allprojects {
    repositories {
        ...
        maven {
            url "https://cardinalcommerceprod.jfrog.io/artifactory/android"
            credentials {
                username 'braintree_team_sdk'
                password 'AKCp8jQcoDy2hxSWhDAUQKXLDPDx6NYRkqrgFLRc3qDrayg6rrCbJpsKKyMwaykVL8FWusJpp'
            }
        }
    }
}
```

If you want to enable GooglePay, you also need to add this meta tag to the application element in your Manifest file

```xml
<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="true"/>
```

## API

<docgen-index>

* [`initialize(...)`](#initialize)
* [`setClientToken(...)`](#setClientToken)
* [`setupApplePay(...)`](#setupapplepay)
* [`presentDropInPaymentUI(...)`](#presentdropinpaymentui)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### initialize(...)

```typescript
initialize(options: TokenOptions) => Promise<void>
```

--- iOS Only ---
Used to initialize the Braintree client.

The client must be initialized before other methods can be used.

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#tokenoptions">TokenOptions</a></code> |

--------------------


### setClientToken(...)

```typescript
setClientToken(options: TokenOptions) => Promise<void>
```

--- Android Only ---
This updates the DropInClient in the plugin with a new auth token.

This needs to be called before the DropInUi can be used.

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#tokenoptions">TokenOptions</a></code> |

--------------------


### setupApplePay(...)

```typescript
setupApplePay(options?: ApplePayOptions | undefined) => Promise<void>
```

Used to configure Apple Pay on iOS

| Param         | Type                                                        | Description        |
| ------------- | ----------------------------------------------------------- | ------------------ |
| **`options`** | <code><a href="#applepayoptions">ApplePayOptions</a></code> | Apple Pay options. |

--------------------


### presentDropInPaymentUI(...)

```typescript
presentDropInPaymentUI(options?: PaymentUIOptions | undefined) => Promise<PaymentUIResult>
```

Shows Braintree's drop-in payment UI.

| Param         | Type                                                          | Description         |
| ------------- | ------------------------------------------------------------- | ------------------- |
| **`options`** | <code><a href="#paymentuioptions">PaymentUIOptions</a></code> | drop-in UI options. |

**Returns:** <code>Promise&lt;<a href="#paymentuiresult">PaymentUIResult</a>&gt;</code>

--------------------


### Interfaces


#### TokenOptions

Options for setting up payment tokens

| Prop        | Type                | Description          |
| ----------- | ------------------- | -------------------- |
| **`token`** | <code>string</code> | The token to be used |


#### ApplePayOptions

Options for the setupApplePay method.

| Prop               | Type                | Description                                   |
| ------------------ | ------------------- | --------------------------------------------- |
| **`merchantId`**   | <code>string</code> | Apple Merchant ID can be obtained from Apple. |
| **`currencyCode`** | <code>string</code> | 3 letter currency code ISO 4217               |
| **`countryCode`**  | <code>string</code> | 2 letter country code ISO 3166-1              |


#### PaymentUIResult

Successful callback result for the presentDropInPaymentUI method.

| Prop                       | Type                                                                                                                                                                            | Description                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **`userCancelled`**        | <code>boolean</code>                                                                                                                                                            | Indicates if the user used the cancel button to close the dialog without completing the payment. |
| **`nonce`**                | <code>string</code>                                                                                                                                                             | The nonce for the payment transaction (if a payment was completed).                              |
| **`type`**                 | <code>string</code>                                                                                                                                                             | The payment type (if a payment was completed).                                                   |
| **`localizedDescription`** | <code>string</code>                                                                                                                                                             | A description of the payment method (if a payment was completed).                                |
| **`card`**                 | <code>{ lastTwo: string; network: string; }</code>                                                                                                                              | Information about the credit card used to complete a payment (if a credit card was used).        |
| **`payPalAccount`**        | <code>{ email: string; firstName: string; lastName: string; phone: string; billingAddress: string; shippingAddress: string; clientMetadataId: string; payerId: string; }</code> | Information about the PayPal account used to complete a payment (if a PayPal account was used).  |
| **`applePaycard`**         | <code>{}</code>                                                                                                                                                                 | Information about the Apple Pay card used to complete a payment (if Apple Pay was used).         |
| **`threeDSecureCard`**     | <code>{ liabilityShifted: boolean; liabilityShiftPossible: boolean; }</code>                                                                                                    | Information about 3D Secure card used to complete a payment (if 3D Secure was used).             |
| **`venmoAccount`**         | <code>{ username: string; }</code>                                                                                                                                              | Information about Venmo account used to complete a payment (if a Venmo account was used).        |


#### PaymentUIOptions

Options for the presentDropInPaymentUI method.

| Prop                     | Type                | Description                                                                                                      |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`amount`**             | <code>string</code> | The amount of the transaction to show in the drop-in UI on the summary row as well as the call to action button. |
| **`primaryDescription`** | <code>string</code> | The description of the transaction to show in the drop-in UI on the summary row.                                 |
| **`email`**              | <code>string</code> | The account email of the user for GooglePay, 3d secure etc                                                       |

</docgen-api>
