package de.projektionisten.plugins.braintree;

import android.util.Log;

import androidx.annotation.NonNull;

import com.braintreepayments.api.CardNonce;
import com.braintreepayments.api.DropInClient;
import com.braintreepayments.api.DropInListener;
import com.braintreepayments.api.DropInRequest;
import com.braintreepayments.api.DropInResult;
import com.braintreepayments.api.GooglePayRequest;
import com.braintreepayments.api.PayPalAccountNonce;
import com.braintreepayments.api.PayPalVaultRequest;
import com.braintreepayments.api.PaymentMethodNonce;
import com.braintreepayments.api.ThreeDSecureInfo;
import com.braintreepayments.api.ThreeDSecureRequest;
import com.braintreepayments.api.VenmoAccountNonce;
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

@CapacitorPlugin(name = "Braintree")
public class BraintreePlugin extends Plugin implements DropInListener {
    private static final String TAG = "BraintreePlugin";

    private DropInClient dropInClient;
    private TokenProvider tokenProvider;

    private PluginCall _call;

    @Override
    public void load() {
        // Instantiate token provider to later hold the token from the app
        tokenProvider = new TokenProvider();

        // RUN ON UI THREAD
        this.getActivity().runOnUiThread(() -> {
            // DropInClient is instantiated with a token provider that returns the token from the app when it is available
            dropInClient = new DropInClient(this.getActivity(), tokenProvider);
            dropInClient.setListener(BraintreePlugin.this);
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
    public synchronized void presentDropInPaymentUI(PluginCall call)
            throws JSONException {

        // Obtain the arguments.
        String amount = call.getString("amount");
        String email = call.getString("email");
        String primaryDescription = call.getString("primaryDescription");
        if (amount == null || email == null || primaryDescription == null) {
            call.reject("Missing parameters for payment");
            return;
        }

        GooglePayRequest newGoogleRequest = new GooglePayRequest();
        TransactionInfo googleTransactionInfo = TransactionInfo.newBuilder()
                .setTotalPrice(amount)
                .setTotalPriceStatus(WalletConstants.TOTAL_PRICE_STATUS_FINAL)
                .setCurrencyCode("EUR")
                .build();

        newGoogleRequest.setCountryCode("DE");
        newGoogleRequest.setTransactionInfo(googleTransactionInfo);

        DropInRequest dropInRequest = new DropInRequest();
        dropInRequest.setVaultManagerEnabled(true);
        dropInRequest.setGooglePayRequest(newGoogleRequest);

        try {
            dropInClient.launchDropIn(dropInRequest);
        } catch (Exception e) {
            Log.e(TAG, "presentDropInPaymentUI failed with error ===> " + e.getMessage());
            call.reject(TAG + ": presentDropInPaymentUI failed with error ===> " + e.getMessage());
        }

        _call = call;
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

        // Card
        if (paymentMethodNonce instanceof CardNonce cardNonce) {

            Map<String, Object> innerMap = new HashMap<>();
            innerMap.put("lastTwo", cardNonce.getLastTwo());
            innerMap.put("network", cardNonce.getCardType());

            resultMap.put("card", innerMap);
        }

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

        // 3D Secure
        if (paymentMethodNonce instanceof CardNonce cardNonce) {
            ThreeDSecureInfo threeDSecureInfo = cardNonce.getThreeDSecureInfo();

            Map<String, Object> innerMap = new HashMap<>();
            innerMap.put("liabilityShifted", threeDSecureInfo.isLiabilityShifted());
            innerMap.put("liabilityShiftPossible", threeDSecureInfo.isLiabilityShiftPossible());
            innerMap.put("enrolled", threeDSecureInfo.getEnrolled());
            resultMap.put("threeDSecureCard", innerMap);
        }

        // Venmo
        if (paymentMethodNonce instanceof VenmoAccountNonce venmoAccountNonce) {

            Map<String, Object> innerMap = new HashMap<>();
            innerMap.put("username", venmoAccountNonce.getUsername());

            resultMap.put("venmoAccount", innerMap);
        }
        return resultMap;
    }

    public void onDropInSuccess(@NonNull DropInResult dropInResult) {
        PaymentMethodNonce paymentMethodNonce = dropInResult.getPaymentMethodNonce();

        Log.i(TAG, "DropIn Activity Result: paymentMethodNonce = " + paymentMethodNonce);

        if (paymentMethodNonce != null) {
            JSObject JSResult = this.getPaymentUINonceResult(paymentMethodNonce);
            _call.resolve(JSResult);
        } else {
            JSObject JSResult = new JSObject();
            JSResult.put("userCancelled", false);
            _call.resolve(JSResult);
        }

    }

    @Override
    public void onDropInFailure(@NonNull Exception error) {
        Log.e(TAG, "Caught error from BraintreeSDK: " + error.getMessage());

        String errorMessage = error.getMessage();
        if (errorMessage != null && errorMessage.contains("User canceled DropIn")) {
            JSObject JSResult = new JSObject();
            JSResult.put("userCancelled", true);
            if (_call != null) {
                _call.resolve(JSResult);
            }
        } else {
            if (_call != null) {
                _call.reject("Error in drop ui");
            }
        }


    }
}
