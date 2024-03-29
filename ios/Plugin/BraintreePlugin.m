#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(Braintree, "Braintree",
    CAP_PLUGIN_METHOD(setClientToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startPaypalPayment, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isApplePayReady, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startApplePayPayment, CAPPluginReturnPromise);
)
