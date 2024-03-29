package de.projektionisten.plugins.braintree;

import android.util.Log;
import androidx.annotation.NonNull;
import com.braintreepayments.api.BraintreeClient;
import com.braintreepayments.api.GooglePayClient;
import com.braintreepayments.api.GooglePayListener;
import com.braintreepayments.api.GooglePayRequest;
import com.braintreepayments.api.PayPalAccountNonce;
import com.braintreepayments.api.PayPalCheckoutRequest;
import com.braintreepayments.api.PayPalClient;
import com.braintreepayments.api.PayPalListener;
import com.braintreepayments.api.PayPalVaultRequest;
import com.braintreepayments.api.PaymentMethodNonce;
import com.braintreepayments.api.UserCanceledException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.wallet.TransactionInfo;
import com.google.android.gms.wallet.WalletConstants;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONException;

@CapacitorPlugin(name = "Braintree")
public class BraintreePlugin extends Plugin implements PayPalListener, GooglePayListener {

    private static final String TAG = "BraintreePlugin";

    private BraintreeClient braintreeClient;
    private PayPalClient payPalClient;
    private GooglePayClient googlePayClient;
    private TokenProvider tokenProvider;

    private PluginCall _call;

    @Override
    public void load() {
        // Instantiate token provider to later hold the token from the app
        tokenProvider = new TokenProvider();

        // RUN ON UI THREAD
        this.getActivity()
            .runOnUiThread(
                () -> {
                    // BraintreeClient is instantiated with a token provider that returns the token from the app when it is available
                    braintreeClient = new BraintreeClient(this.getActivity(), tokenProvider);
                    payPalClient = new PayPalClient(this.getActivity(), braintreeClient);
                    payPalClient.setListener(this);
                    googlePayClient = new GooglePayClient(this.getActivity(), braintreeClient);
                    googlePayClient.setListener(this);
                }
            );
    }

    /**
     * Sets the client token from the braintree backend in the token provider instance.
     * The Braintree Client automatically fetches the token from the provider when it needs it.
     * @param call Plugin callback object from capacitor
     */
    @PluginMethod
    public synchronized void setClientToken(PluginCall call) {
        // Obtain the token argument
        String token = call.getString("token");

        if (token == null || token.isEmpty()) {
            call.reject("A token is required.");
            return;
        }

        // Supply the token via the token provider for later
        this.tokenProvider.setClientToken(token);
        // return a success
        call.resolve();
    }

    /**
     * Initiates a payment via paypal vault and returns the result, when the user completes or aborts the flow
     * @param call Plugin callback object from capacitor
     */
    @PluginMethod
    public synchronized void startPaypalPayment(PluginCall call) throws JSONException {
        try {
            String description = call.getString("primaryDescription");
            String flowType = call.getString("paymentFlow");
            String price = call.getString("amount");

            // make checkout the default flow, if no flowType was provided
            if (flowType == null || flowType.isEmpty()) {
                flowType = "checkout";
            }

            if ((price == null || price.isEmpty()) && flowType.equals("checkout")) {
                call.reject("Transaction amount must be set for checkout process");
                return;
            }

            switch (flowType) {
                case "vault":
                    this.tokenizePayPalAccountWithVaultMethod(description);
                    break;
                case "checkout":
                default:
                    this.tokenizePayPalAccountWithCheckoutMethod(description, price);
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "startPaypalPayment failed with error ===> " + e.getMessage());
            call.reject(TAG + ": startPaypalPayment failed with error ===> " + e.getMessage());
        }

        // Keep a reference to the callback object
        _call = call;
    }

    /**
     * Initiates a payment via google pay and returns the result, when the user completes or aborts the flow
     * @param call Plugin callback object from capacitor
     */
    @PluginMethod
    public synchronized void startGooglePayPayment(PluginCall call) throws JSONException {
        String price = call.getString("amount");
        try {
            this.initiateGooglePay(price);
        } catch (Exception e) {
            Log.e(TAG, "startGooglePayPayment failed with error ===> " + e.getMessage());
            call.reject(TAG + ": startGooglePayPayment failed with error ===> " + e.getMessage());
        }

        _call = call;
    }

    /**
     * Checks if google pay is configured and ready to be used on this device.
     */
    @PluginMethod
    public synchronized void isGooglePayReady(PluginCall call) throws JSONException {
        try {
            googlePayClient.isReadyToPay(
                this.getActivity(),
                (isReadyToPay, error) -> {
                    JSObject JSResult = new JSObject();
                    JSResult.put("ready", isReadyToPay);
                    call.resolve(JSResult);
                }
            );
        } catch (Exception e) {
            Log.e(TAG, "isGooglePayReady failed with error ===> " + e.getMessage());
            call.reject(TAG + ": isGooglePayReady failed with error ===> " + e.getMessage());
        }
    }

    /**
     * Success handler for paypal payment. Sends result back to the app
     */
    @Override
    public void onPayPalSuccess(@NonNull PayPalAccountNonce payPalAccountNonce) {
        JSObject JSResult = this.getPaymentUINonceResult(payPalAccountNonce);
        // use saved reference of callback object to complete the call of the app
        _call.resolve(JSResult);
    }

    /**
     * Failure handler for paypal payment. Sends result back to the app.
     * Can be either an error, or the user just aborting the process
     */
    @Override
    public void onPayPalFailure(@NonNull Exception error) {
        Log.e(TAG, "Caught error from BraintreeSDK: " + error.getMessage());

        if (error instanceof UserCanceledException && ((UserCanceledException) error).isExplicitCancelation()) {
            JSObject JSResult = new JSObject();
            JSResult.put("userCancelled", true);
            if (_call != null) {
                // use saved reference of callback object to complete the call of the app
                _call.resolve(JSResult);
            }
        } else {
            if (_call != null) {
                _call.reject("Error in paypal request");
            }
        }
    }

    /**
     * Success handler for google payment. Sends result back to the app
     */
    @Override
    public void onGooglePaySuccess(@NonNull PaymentMethodNonce paymentMethodNonce) {
        JSObject JSResult = this.getPaymentUINonceResult(paymentMethodNonce);
        // use saved reference of callback object to complete the call of the app
        _call.resolve(JSResult);
    }

    /**
     * Failure handler for google payment. Sends result back to the app.
     * Can be either an error, or the user just aborting the process
     */
    @Override
    public void onGooglePayFailure(@NonNull Exception error) {
        Log.e(TAG, "Caught error from BraintreeSDK: " + error.getMessage());

        if (error instanceof UserCanceledException && ((UserCanceledException) error).isExplicitCancelation()) {
            JSObject JSResult = new JSObject();
            JSResult.put("userCancelled", true);
            if (_call != null) {
                // use saved reference of callback object to complete the call of the app
                _call.resolve(JSResult);
            }
        } else {
            if (_call != null) {
                _call.reject("Error in google pay request");
            }
        }
    }

    // Results

    /**
     * Helper used to return a dictionary of values from the given payment method
     * nonce. Handles several different types of nonces (eg for cards, PayPal, etc).
     *
     * @param paymentMethodNonce The nonce used to build a dictionary of data from.
     * @return The dictionary of data populated via the given payment method nonce.
     */
    private JSObject getPaymentUINonceResult(PaymentMethodNonce paymentMethodNonce) {
        JSObject resultMap = new JSObject();
        resultMap.put("userCancelled", false);
        resultMap.put("nonce", paymentMethodNonce.getString());

        // PayPal
        if (paymentMethodNonce instanceof PayPalAccountNonce) {
            Map<String, Object> innerMap = new HashMap<>();
            innerMap.put("email", ((PayPalAccountNonce) paymentMethodNonce).getEmail());
            innerMap.put("firstName", ((PayPalAccountNonce) paymentMethodNonce).getFirstName());
            innerMap.put("lastName", ((PayPalAccountNonce) paymentMethodNonce).getLastName());
            innerMap.put("phone", ((PayPalAccountNonce) paymentMethodNonce).getPhone());
            innerMap.put("clientMetadataId", ((PayPalAccountNonce) paymentMethodNonce).getClientMetadataId());
            innerMap.put("payerId", ((PayPalAccountNonce) paymentMethodNonce).getPayerId());

            resultMap.put("paypalAccount", innerMap);
        }

        return resultMap;
    }

    /**
     * Constructs the paypal (vault) request and starts the UI for the user to authorize the payment
     */
    private void tokenizePayPalAccountWithVaultMethod(String description) {
        PayPalVaultRequest request = new PayPalVaultRequest();

        if (description != null) {
            request.setBillingAgreementDescription(description);
        }

        // starts the process of guiding the user through the vault flow
        // and will end up calling either `onPayPalSuccess` or `onPayPalFailure`
        payPalClient.tokenizePayPalAccount(this.getActivity(), request);
    }

    /**
     * Constructs the paypal (checkout) request and starts the UI for the user to authorize the payment
     */
    private void tokenizePayPalAccountWithCheckoutMethod(String description, String price) {
        PayPalCheckoutRequest request = new PayPalCheckoutRequest(price);
        request.setCurrencyCode("EUR");

        if (description != null) {
            request.setBillingAgreementDescription(description);
        }

        // starts the process of guiding the user through the checkout flow
        // and will end up calling either `onPayPalSuccess` or `onPayPalFailure`
        payPalClient.tokenizePayPalAccount(this.getActivity(), request);
    }

    /**
     * Constructs the google pay request and starts the UI for the user to authorize the payment
     */
    private void initiateGooglePay(String price) {
        GooglePayRequest googlePayRequest = new GooglePayRequest();
        googlePayRequest.setTransactionInfo(
            TransactionInfo
                .newBuilder()
                .setTotalPrice(price)
                .setTotalPriceStatus(WalletConstants.TOTAL_PRICE_STATUS_FINAL)
                .setCurrencyCode("EUR")
                .build()
        );
        googlePayClient.requestPayment(this.getActivity(), googlePayRequest);
    }
}
