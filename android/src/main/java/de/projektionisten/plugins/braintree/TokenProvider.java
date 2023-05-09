package de.projektionisten.plugins.braintree;

import androidx.annotation.NonNull;

import com.braintreepayments.api.ClientTokenCallback;
import com.braintreepayments.api.ClientTokenProvider;

public class TokenProvider implements ClientTokenProvider {
    private String clientToken;

    public void setClientToken(String clientToken) {
        this.clientToken = clientToken;
    }

    @Override
    public void getClientToken(@NonNull ClientTokenCallback callback) {
        if (clientToken != null && !clientToken.isEmpty()) {
            callback.onSuccess(clientToken);
        } else {
            callback.onFailure(new Exception("DropInUi - clientToken empty"));
        }
    }
}
