// This is the typescript code that should be set on the micro: bit side for use with microBitBLE.js. Let's load it with makecode.
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Target)
})
bluetooth.onBluetoothDisconnected(function () {
    basic.showIcon(IconNames.No)
})
pins.setPull(DigitalPin.P5, PinPullMode.PullUp)
pins.setPull(DigitalPin.P11, PinPullMode.PullUp)
bluetooth.startAccelerometerService()
bluetooth.startLEDService()
bluetooth.startMagnetometerService()
bluetooth.startIOPinService()
bluetooth.startTemperatureService()
basic.showIcon(IconNames.Heart)
