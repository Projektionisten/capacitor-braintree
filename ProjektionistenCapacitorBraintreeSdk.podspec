require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'ProjektionistenCapacitorBraintreeSdk'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = 'https://capacitorjs.com'
  s.author = package['author']
  s.source = { :git => 'https://bitbucket.org/projektionisten-developers/capacitor-braintree-sdk.git', :tag => package['name'] + '@' + package['version'] }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target  = '13.0'
  s.dependency 'Capacitor'
  s.dependency 'Braintree'
  s.dependency 'Braintree/ApplePay'

  s.swift_version = '5.1'
end
