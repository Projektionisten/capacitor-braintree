import Foundation
import Capacitor
import BraintreeDropIn

@objc(BraintreePlugin)
public class BraintreePlugin: CAPPlugin {

    private var clientTokenOrTokenizationKey: String = ""

    @objc func canBraintree(_ call: CAPPluginCall) {
        call.resolve([
            "value": true
        ])
    }

    @objc func share(_ call: CAPPluginCall) {
        var items: [Any] = [Any]()

        if let text = call.getString("text") {
            items.append(text)
        }

        if let url = call.getString("url"), let urlObj = URL(string: url) {
            items.append(urlObj)
        }

        let title = call.getString("title")

        if let files = call.getArray("files") {
            files.forEach { file in
                if let url = file as? String, let fileUrl = URL(string: url) {
                    items.append(fileUrl)
                }
            }
        }

        if items.count == 0 {
            call.reject("Must provide at least url, text or files")
            return
        }

        DispatchQueue.main.async { [weak self] in
            let actionController = UIActivityViewController(activityItems: items, applicationActivities: nil)

            if title != nil {
                actionController.setValue(title, forKey: "subject")
            }

            actionController.completionWithItemsHandler = { (activityType, completed, _ returnedItems, activityError) in
                if activityError != nil {
                    call.reject("Error sharing item", nil, activityError)
                    return
                }

                if completed {
                    call.resolve([
                        "activityType": activityType?.rawValue ?? ""
                    ])
                } else {
                    call.reject("Braintree canceled")
                }

            }
            if self?.bridge?.viewController?.presentedViewController != nil {
                call.reject("Can't share while sharing is in progress")
                return
            }
            self?.setCenteredPopover(actionController)
            self?.bridge?.viewController?.present(actionController, animated: true, completion: nil)
        }
    }

     @objc func setClientToken(_ call: CAPPluginCall) {
        if let token: String = call.getString("token") {

            self.clientTokenOrTokenizationKey = token;
            call.resolve()

        } else {
            call.reject("A token is required.")
            return
        }
    }

     @objc func setupApplePay(_ call: CAPPluginCall) {

         if let merchantId = call.getString("merchantId"),
            let currencyCode = call.getString("currencyCode"),
            let countryCode = call.getString("countryCode") {

             // implementation.setupApplePay(merchantId: merchantId, currencyCode: currencyCode, countryCode: countryCode)
         }

        call.resolve([
            "value": true
        ])
    }

     @objc func presentDropInPaymentUI(_ call: CAPPluginCall) {

         if self.clientTokenOrTokenizationKey != "" {
             DispatchQueue.main.async {
                 let request =  BTDropInRequest()
                 let dropIn = BTDropInController(authorization: self.clientTokenOrTokenizationKey, request: request) { (controller, result, error) in
                     if (error != nil) {
                         print("ERROR")
                     } else if (result?.isCanceled == true) {
                         print("CANCELED")
                     } else if let result = result {
                         // Use the BTDropInResult properties to update your UI
                         // result.paymentMethodType
                         // result.paymentMethod
                         // result.paymentIcon
                         // result.paymentDescription
                         call.resolve([
                            "value": true
                         ])
                     }
                     controller.dismiss(animated: true, completion: nil)
                 }

                 if self.bridge?.viewController?.presentedViewController != nil {
                     call.reject("Dropin UI already present")
                     return
                 }
                 // self?.setCenteredPopover(actionController)
                 self.bridge?.viewController?.present(dropIn!, animated: true, completion: nil)
             }

         } else {
             call.reject("No paypal token was provided. Call 'setClientToken' first")
         }

    }
}
