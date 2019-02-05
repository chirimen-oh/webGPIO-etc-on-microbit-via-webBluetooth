# [webGPIO-etc-on-microbit-via-webBluetooth](http://chirimen.org/webGPIO-etc-on-microbit-via-webBluetooth/) #
 [micro:bit](https://ja.wikipedia.org/wiki/BBC_Micro:bit)内蔵のセンサーやLED、スイッチ、GPIOポートを、[web bluetooth](https://webbluetoothcg.github.io/web-bluetooth/)API経由でウェブアプリから使う。GPIOポートAPIは[webGPIO](https://rawgit.com/browserobo/WebGPIO/master/index.html)に準拠、拡張機能としてアナログ入力に対応。[CHIRIMEN for RPi3](https://chirimen.org/chirimen-raspi3/)のGPIO,I2Cとも同時利用可能。

[micro:bit](https://ja.wikipedia.org/wiki/BBC_Micro:bit)は、子供向けの教育用ボードコンピュータですが、Bluetooth搭載で、たくさんのセンサーや表示装置、さらにGPIO端子も載っています。コストパフォーマンスも入手性も良いと思いますので、Bluetoothを用いたIoTのプロトタイピングで、ワイヤレスのセンサーやアクチュエーターなどとして便利に活用できると思います。

## Code on micro:bit ##
* micro:bit側には以下のコードをロードします。
* [https://makecode.microbit.org/_YHtdtK9kt9Rz](https://makecode.microbit.org/_YHtdtK9kt9Rz)
* 上記をtypeScriptにしたソースを念のため置いておきます。[microbitFirmware.js](microbitFirmware.js)
* 癖があるjavascriptの環境ですが、CHIRIMENによるIoTの学習的には他の小型のボードコンピュータ上の開発言語よりは言語や開発環境の統一の面で良いと思います

## WebApps ##
* [ためしてみる](https://chirimen.org/webGPIO-etc-on-microbit-via-webBluetooth/example.html)
* 使い方は[example.htmlを参照](https://github.com/chirimen-oh/webGPIO-etc-on-microbit-via-webBluetooth/blob/master/example.html)してください
* [microBitBLE.js](microBitBLE.js)がmicro:bitのセンサなどをWebBluetooth経由で使うためのドライバライブラリです。
  * 使える内蔵デバイス: 3軸加速度, 3軸磁気, 温度, ボタンAB, マトリクスLED(文字・パターン)
  * GPIOピンはCHIRIMEN for RPi3と同じく、[webGPIO](https://rawgit.com/browserobo/WebGPIO/master/index.html)に準拠したAPIで操作します。
  * Pin(Port)0,1,2はWebGPIOのexport関数で"analogin"を指定することでアナログ入力(0-3V,8bit)も可能です。
  * ドライバライブラリ(microBitBLE.js)は[こちら](https://github.com/chirimen-oh/webGPIO-etc-on-microbit-via-webBluetooth/blob/master/microBitBLE.js)）
* CHIRIMEN for Raspberry Pi3環境で動作確認。CHIRIMEN for Raspberry Pi3上のGPIO、I2Cと同時利用可能です。
* Bluetoothインターフェースが載ったコンピュータでも動作すると思います。
  * ブラウザはChromeや Chromium。Web Bluetoothサポートブラウザが必要
  * MacやWindows, Linux PC (Windowsでは、データ取得系APIに動作不具合があるようです。ISSUES参照)
  * Androidスマホ、タブレット


## 回路図 ##
### GPIO(Pin)を使わない場合 ###
GPIO(Pin)を使わない場合は単純です。（example.htmlはこれでも動きます。電源は供給してください)
![GPIOを使わない場合の回路図](imgs/micro_bit.png)

### GPIO(Pin)を使う場合 ###
GPIO(Pin)を使う場合は、Pin0,1,2はワニ口クリップなどで結線できます。それ以外のピンは[micro:bitのブレークアウトボード](https://www.google.com/search?q=micro:bit+breakout&tbm=isch)を使ってピンヘッダ経由で配線します。
example.htmlは、以下の回路図で動くように組まれています。
![GPIOを使う場合の回路図](imgs/micro_bit_gpio.png)

## Notes ##
* webBluetoothは、セキュリティサンドボックス面で、結構ハマりポイントがある
  * https必須
  * requestDevice()では、optionalServicesの列挙が必須(ソース参照)
  * requestDevice()は、人による操作(buttonなど)を引き金にして呼び出される必要がある(らしい)（一回の操作から二回呼び出すのもNG）
  * UUIDはハイフンをしっかり入れる必要がある。

## ToDo, ISSUES ##
* micro:bitのI2Cを使いこなすコードは別途・・・　もちろん webI2C over webBluetoothにしたいですね。
* chrome/windows10では、microBitBLE.get* APIが全部うまく動いてない？(値が変わらない・・) WebBluetooth/Chrome/Windows10の実装がおかしい？ (CHIRIMEN RPi3(というよりraspbian(linux)上のchromium)ではうまく動いています)
