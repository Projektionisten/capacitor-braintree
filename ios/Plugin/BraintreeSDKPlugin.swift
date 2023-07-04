import Foundation
import Braintree
import Capacitor

@objc(BraintreeSDK)
public class BraintreeSDK: CAPPlugin {

    private var braintreeClient: BTAPIClient!
    private var clientTokenOrTokenizationKey: String = ""


     @objc func setClientToken(_ call: CAPPluginCall) {
        if let token: String = call.getString("token") {

            self.braintreeClient = BTAPIClient(authorization: token);
            call.resolve()

        } else {
            call.reject("A token is required.")
            return
        }
    }

     @objc func startPaypalVaultPayment(_ call: CAPPluginCall) {

         if self.braintreeClient != nil {
             let payPalDriver = BTPayPalDriver(apiClient: self.braintreeClient);
             // Setup empty dictionary to contain the PaymentUIResults
             var paymentResult: Dictionary<String, Any> = [:]

             // Start the Vault flow
             let vaultRequest = BTPayPalVaultRequest();
             vaultRequest.billingAgreementDescription = call.getString("primaryDescription");

             payPalDriver.tokenizePayPalAccount(with: vaultRequest) { (tokenizedPayPalAccount, error) in
                 if let tokenizedPayPalAccount = tokenizedPayPalAccount {
                     print("Got a nonce: (tokenizedPayPalAccount.nonce)")
                     // Send payment method nonce to your server to create a transaction
                     paymentResult["nonce"] = tokenizedPayPalAccount.nonce
                     paymentResult["userCancelled"] = false
                 } else if let error = error {
                     call.reject("Error in paypal payment")
                 } else {
                     // Buyer canceled payment approval
                     call.resolve([
                        "userCancelled": true
                     ])
                 }
             }
         } else {
             call.reject("No client token was provided or the client was not initialized. Call 'setClientToken' first")
         }

    }
}
