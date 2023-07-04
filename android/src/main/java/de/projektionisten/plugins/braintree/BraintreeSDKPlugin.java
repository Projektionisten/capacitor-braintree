package de.projektionisten.plugins.braintree;

import android.util.Log;

import androidx.annotation.NonNull;

import com.braintreepayments.api.BraintreeClient;
import com.braintreepayments.api.GooglePayClient;
import com.braintreepayments.api.GooglePayListener;
import com.braintreepayments.api.GooglePayRequest;
import com.braintreepayments.api.PayPalAccountNonce;
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

import org.json.JSONException;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "BraintreeSDK")
public class BraintreeSDKPlugin extends Plugin implements PayPalListener, GooglePayListener {
    private static final String TAG = "BraintreeSDKPlugin";

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
        this.getActivity().runOnUiThread(() -> {
            // BraintreeClient is instantiated with a token provider that returns the token from the app when it is available
            braintreeClient = new BraintreeClient(this.getActivity(), tokenProvider);
            payPalClient = new PayPalClient(this.getActivity(), braintreeClient);
            payPalClient.setListener(this);
            googlePayClient = new GooglePayClient(this.getActivity(), braintreeClient);
            googlePayClient.setListener(this);
        });
    }

    @PluginMethod
    public synchronized void setClientToken(PluginCall call) {
        // Obtain the token argument
        String token = call.getString("token");

        if (token == null || token.isEmpty()) {
            call.reject("A token is required.");
            return;
        }

        this.tokenProvider.setClientToken(token);
        call.resolve();
    }

    @PluginMethod
    public synchronized void startPaypalVaultPayment(PluginCall call)
            throws JSONException {
        try {
            String description = call.getString("primaryDescription");
            this.tokenizePayPalAccountWithVaultMethod(description);
        } catch (Exception e) {
            Log.e(TAG, "startPaypalVaultPayment failed with error ===> " + e.getMessage());
            call.reject(TAG + ": startPaypalVaultPayment failed with error ===> " + e.getMessage());
        }

        _call = call;
    }
    @PluginMethod
    public synchronized void startGooglePayPayment(PluginCall call)
            throws JSONException {
        String price = call.getString("amount");
        try {
            this.initiateGooglePay(price);
        } catch (Exception e) {
            Log.e(TAG, "startGooglePayPayment failed with error ===> " + e.getMessage());
            call.reject(TAG + ": startGooglePayPayment failed with error ===> " + e.getMessage());
        }

        _call = call;
    }

    @PluginMethod
    public synchronized void isGooglePayReady(PluginCall call)
            throws JSONException {
        try {
            googlePayClient.isReadyToPay(this.getActivity(), (isReadyToPay, error) -> {
                JSObject JSResult = new JSObject();
                JSResult.put("ready", isReadyToPay);
                call.resolve(JSResult);
            });
        } catch (Exception e) {
            Log.e(TAG, "isGooglePayReady failed with error ===> " + e.getMessage());
            call.reject(TAG + ": isGooglePayReady failed with error ===> " + e.getMessage());
        }

    }

    @Override
    public void onPayPalSuccess(@NonNull PayPalAccountNonce payPalAccountNonce) {
        Log.i(TAG, "Paypal Vault Result: paymentMethodNonce = " + payPalAccountNonce);
        JSObject JSResult = this.getPaymentUINonceResult(payPalAccountNonce);
        _call.resolve(JSResult);

    }

    @Override
    public void onPayPalFailure(@NonNull Exception error) {
        Log.e(TAG, "Caught error from BraintreeSDK: " + error.getMessage());

        if (error instanceof UserCanceledException && ((UserCanceledException) error).isExplicitCancelation()) {
            JSObject JSResult = new JSObject();
            JSResult.put("userCancelled", true);
            if (_call != null) {
                _call.resolve(JSResult);
            }
        } else {
            if (_call != null) {
                _call.reject("Error in paypal request");
            }
        }
    }
    @Override
    public void onGooglePaySuccess(@NonNull PaymentMethodNonce paymentMethodNonce) {
        Log.i(TAG, "GooglePay Result: paymentMethodNonce = " + paymentMethodNonce);
        JSObject JSResult = this.getPaymentUINonceResult(paymentMethodNonce);
        _call.resolve(JSResult);
    }

    @Override
    public void onGooglePayFailure(@NonNull Exception error) {
        Log.e(TAG, "Caught error from BraintreeSDK: " + error.getMessage());

        if (error instanceof UserCanceledException && ((UserCanceledException) error).isExplicitCancelation()) {
            JSObject JSResult = new JSObject();
            JSResult.put("userCancelled", true);
            if (_call != null) {
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
        if (paymentMethodNonce instanceof PayPalAccountNonce payPalAccountNonce) {

            Map<String, Object> innerMap = new HashMap<>();
            resultMap.put("email", payPalAccountNonce.getEmail());
            resultMap.put("firstName", payPalAccountNonce.getFirstName());
            resultMap.put("lastName", payPalAccountNonce.getLastName());
            resultMap.put("phone", payPalAccountNonce.getPhone());
            resultMap.put("clientMetadataId", payPalAccountNonce.getClientMetadataId());
            resultMap.put("payerId", payPalAccountNonce.getPayerId());

            resultMap.put("paypalAccount", innerMap);
        }

        return resultMap;
    }

    private void tokenizePayPalAccountWithVaultMethod(String description) {
        PayPalVaultRequest request = new PayPalVaultRequest();

        if (description != null) {
            request.setBillingAgreementDescription(description);
        }

        payPalClient.tokenizePayPalAccount(this.getActivity(), request);
    }

    private void initiateGooglePay(String price) {
        GooglePayRequest googlePayRequest = new GooglePayRequest();
        googlePayRequest.setTransactionInfo(TransactionInfo.newBuilder()
                .setTotalPrice(price)
                .setTotalPriceStatus(WalletConstants.TOTAL_PRICE_STATUS_FINAL)
                .setCurrencyCode("EUR")
                .build());
        googlePayClient.requestPayment(this.getActivity(), googlePayRequest);
    }
}
