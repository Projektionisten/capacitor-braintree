import Foundation
import PassKit
import Braintree
import Capacitor

@objc(Braintree)
public class Braintree: CAPPlugin, PKPaymentAuthorizationViewControllerDelegate {

    private var braintreeClient: BTAPIClient?
    private var currentPluginCall: CAPPluginCall?

    /**
     * This updates the plugin with a new auth token.
	 * This needs to be called before the SDK can be used.
	 */
    @objc func setClientToken(_ call: CAPPluginCall) {
        if let token: String = call.getString("token") {
            self.braintreeClient = BTAPIClient(authorization: token)
            call.resolve()
        } else {
            call.reject("A token is required.")
            return
        }
    }

    /**
     * Starts a transaction with the paypal sdk. Will open a seperate browser window or similar to complete and
	 * return with information about the used account and the payment nonce
	 */
    @objc func startPaypalPayment(_ call: CAPPluginCall) {

        guard let braintreeClient = braintreeClient else {
            call.reject("No client token was provided or the client was not initialized. Call 'setClientToken' first")
            return
        }
        let payPalClient = BTPayPalClient(apiClient: braintreeClient)

        var flowType: String = "checkout"
        if let flowOption: String = call.getString("paymentFlow") {
            flowType = flowOption
        }

        let completionHandler: (BTPayPalAccountNonce?, Error?) -> Void = { (tokenizedPayPalAccount, error) in
            if let tokenizedPayPalAccount = tokenizedPayPalAccount {
                print("Got a nonce: \(tokenizedPayPalAccount.nonce)")
                // Send payment method nonce to your server to create a transaction
                call.resolve([
                    "nonce": tokenizedPayPalAccount.nonce,
                    "userCancelled": false
                ])
            } else if let error = error {
                call.reject("Error in paypal payment: " + error.localizedDescription)
            } else {
                // Buyer canceled payment approval
                call.resolve([
                    "userCancelled": true
                ])
            }
        }

        switch flowType {
        case "vault":
            let request = BTPayPalVaultRequest()
            if let description = call.getString("primaryDescription") {
                request.billingAgreementDescription = description
            }
            payPalClient.tokenize(request, completion: completionHandler)
        case "checkout":
            fallthrough
        default:
            if let price: String = call.getString("amount") {
                let request = BTPayPalCheckoutRequest(amount: price)
                payPalClient.tokenize(request, completion: completionHandler)
            } else {
                call.reject("Transaction amount must be set for checkout process")
                return
            }
        }
    }

    /**
     * Check if apple pay is available on this device
     */
    @objc func isApplePayReady(_ call: CAPPluginCall) {
        if PKPaymentAuthorizationViewController.canMakePayments(usingNetworks: [PKPaymentNetwork.visa, PKPaymentNetwork.masterCard, PKPaymentNetwork.maestro]) {
            call.resolve([
                "ready": true
            ])
        } else {
            call.resolve([
                "ready": false
            ])
        }
    }

    /**
     * Starts a transaction with the apple pay sdk. Will open a seperate browser window or similar to complete and
	 * return with information about the used account and the payment nonce
     */
    @objc func startApplePayPayment(_ call: CAPPluginCall) {
        if self.braintreeClient != nil {
            self.currentPluginCall = call

            self.setupApplePayPaymentRequest { (paymentRequest, error) in
                guard error == nil else {
                    call.reject("Error in setting up Apple Pay Request")
                    return
                }

                guard paymentRequest != nil else {
                    call.reject("Error in setting up Apple Pay Request")
                    return
                }

                // Promote PKPaymentAuthorizationViewController to optional so that we can verify
                // that our paymentRequest is valid. Otherwise, an invalid paymentRequest would crash our app.
                if let viewController = PKPaymentAuthorizationViewController(paymentRequest: paymentRequest!)
                {
                    viewController.delegate = self
                    self.bridge?.viewController?.present(viewController, animated: true, completion: nil)
                } else {
                    call.reject("Apple payment failed. No PaymentAuthorizationViewController could be created")
                }
            }
        } else {
            call.reject("No client token was provided or the client was not initialized. Call 'setClientToken' first")
        }
    }

    /**
     * Constructs a payment request to use for a new transaction
     */
    func setupApplePayPaymentRequest(completion: @escaping (PKPaymentRequest?, Error?) -> Void) {
        if let braintreeClient = braintreeClient {
            let applePayClient = BTApplePayClient(apiClient: braintreeClient)

            applePayClient.makePaymentRequest { (paymentRequest, error) in
                guard let paymentRequest = paymentRequest else {
                    completion(nil, error)
                    return
                }

                // Set other PKPaymentRequest properties here
                paymentRequest.merchantCapabilities = PKMerchantCapability.capability3DS
                completion(paymentRequest, nil)
            }

        } else {
            completion(nil, nil)
        }
    }

    /**
     * One of the events of PKPaymentAuthorizationViewControllerDelegate. When the user has finished the payment authorization in the apple pay overlay,
     * this gets called and we tokenize the payment to get the nonce for the frontend
     */
    public func paymentAuthorizationViewController(_ controller: PKPaymentAuthorizationViewController,
                                                   didAuthorizePayment payment: PKPayment,
                                                   handler completion: @escaping (PKPaymentAuthorizationResult) -> Void) {

        guard let braintreeClient = self.braintreeClient else {
             completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
             return
        }

        let applePayClient = BTApplePayClient(apiClient: braintreeClient)

        // Tokenize the Apple Pay payment
        applePayClient.tokenize(payment) { (token, error) in
            if let error = error {
                // Received an error from Braintree.
                self.currentPluginCall!.reject("Error in apple payment tokenization:" + error.localizedDescription)
                completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                return
            }

            if let token = token {
                // If requested, address information is accessible in 'payment' and may
                // also be sent to your server.

                // Then indicate success or failure based on the server side result of Transaction.sale
                // via the completion callback.
                // e.g. If the Transaction.sale was successful
                self.currentPluginCall!.resolve([
                    "nonce": token.nonce,
                    "userCancelled": false
                ])
                completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
            } else {
                self.currentPluginCall!.resolve([
                    "userCancelled": false
                ])
                completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                return
            }
        }
    }

    /**
     * One of the needed events of PKPaymentAuthorizationViewControllerDelegate. Used to just close the payment overlay.
     */
    public func paymentAuthorizationViewControllerDidFinish(_ controller: PKPaymentAuthorizationViewController) {
        controller.dismiss(animated: true)
    }
}
