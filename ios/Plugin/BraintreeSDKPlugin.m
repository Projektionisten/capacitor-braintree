#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(BraintreeSDK, "BraintreeSDK",
    CAP_PLUGIN_METHOD(setClientToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startPaypalVaultPayment, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isApplePayAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startApplePayPayment, CAPPluginReturnPromise);
)
