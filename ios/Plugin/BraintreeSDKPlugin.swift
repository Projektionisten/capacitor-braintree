import Foundation
import Braintree
import Capacitor

@objc(BraintreeSDK)
public class BraintreeSDK: CAPPlugin, PKPaymentAuthorizationViewControllerDelegate {
    
    private var braintreeClient: BTAPIClient!
    private var clientTokenOrTokenizationKey: String = ""
    private var currentPluginCall: CAPPluginCall!;


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

             // Start the Vault flow
             let vaultRequest = BTPayPalVaultRequest();
             vaultRequest.billingAgreementDescription = call.getString("primaryDescription");

             payPalDriver.tokenizePayPalAccount(with: vaultRequest) { (tokenizedPayPalAccount, error) in
                 if let tokenizedPayPalAccount = tokenizedPayPalAccount {
                     print("Got a nonce: (tokenizedPayPalAccount.nonce)")
                     // Send payment method nonce to your server to create a transaction
                     call.resolve([
                        "nonce": tokenizedPayPalAccount.nonce,
                        "userCancelled": false
                     ])
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

    @objc func isApplePayAvailable(_ call: CAPPluginCall) {
        if PKPaymentAuthorizationViewController.canMakePayments(usingNetworks: [PKPaymentNetwork.visa, PKPaymentNetwork.masterCard, PKPaymentNetwork.maestro]) {
            call.resolve([
                "ready": true
            ]);

        } else {
            call.resolve([
                "ready": false
            ]);
        }
    }
    
    @objc func startApplePayPayment(_ call: CAPPluginCall) {
        if self.braintreeClient != nil {
            self.currentPluginCall = call;

            self.setupApplePayPaymentRequest { (paymentRequest, error) in
                guard error == nil else {
                    call.reject("Error in setting up Apple Pay Request")
                    return
                }
                
                guard paymentRequest != nil else {
                    call.reject("Error in setting up Apple Pay Request")
                    return
                }
                
                // Example: Promote PKPaymentAuthorizationViewController to optional so that we can verify
                // that our paymentRequest is valid. Otherwise, an invalid paymentRequest would crash our app.
                if let vc = PKPaymentAuthorizationViewController(paymentRequest: paymentRequest!)
                    as PKPaymentAuthorizationViewController?
                {
                    vc.delegate = self
                    self.bridge?.viewController?.present(vc, animated: true, completion: nil)
                } else {
                    print("Error: Payment request is invalid.")
                }
            }
        } else {
            call.reject("No client token was provided or the client was not initialized. Call 'setClientToken' first")
        }
    }
    
    func setupApplePayPaymentRequest(completion: @escaping (PKPaymentRequest?, Error?) -> Void) {
        if self.braintreeClient != nil {
            let applePayClient = BTApplePayClient(apiClient: self.braintreeClient)

            applePayClient.paymentRequest { (paymentRequest, error) in
                guard let paymentRequest = paymentRequest else {
                    completion(nil, error)
                    return
                }

                // Set other PKPaymentRequest properties here
                paymentRequest.merchantCapabilities = .capability3DS
                completion(paymentRequest, nil)
            }
            
        } else {
            completion(nil, nil)
        }
    }
    
    
    public func paymentAuthorizationViewController(_ controller: PKPaymentAuthorizationViewController,
                             didAuthorizePayment payment: PKPayment,
                                      handler completion: @escaping (PKPaymentAuthorizationResult) -> Void) {
        
        let applePayClient = BTApplePayClient(apiClient: self.braintreeClient)
        // Tokenize the Apple Pay payment
        applePayClient.tokenizeApplePay(payment) { (token, error) in
            if error != nil {
                // Received an error from Braintree.
                self.currentPluginCall.reject("Error in apple payment tokenization:" + error!.localizedDescription)
                completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                return
            }
            
            if token == nil {
                self.currentPluginCall.resolve([
                    "userCancelled": false
                ])
                completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                return
            }

            // TODO: On success, send nonce to your server for processing.
            // If requested, address information is accessible in 'payment' and may
            // also be sent to your server.

            // Then indicate success or failure based on the server side result of Transaction.sale
            // via the completion callback.
            // e.g. If the Transaction.sale was successful
            self.currentPluginCall.resolve([
                "nonce": token!.nonce,
                "userCancelled": false
            ])
            completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
        }
    }
    
    public func paymentAuthorizationViewControllerDidFinish(_ controller: PKPaymentAuthorizationViewController) {
        controller.dismiss(animated: true)
    }

}
