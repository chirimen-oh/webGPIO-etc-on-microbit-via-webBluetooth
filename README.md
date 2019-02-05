# webGPIO-etc-on-microbit-via-webBluetooth #
 micro:bit内蔵のセンサーやLED、スイッチ、GPIOポートを、web bluetooth経由で使う。GPIOポートはwebGPIOにほぼ準拠

[micro:bit](https://ja.wikipedia.org/wiki/BBC_Micro:bit)は、子供向けの教育用ボードコンピュータですが、Bluetooth搭載で、たくさんのセンサーや表示装置も載っています。コストパフォーマンスも入手性も良いと思いますので、Bluetoothを用いたIoTのプロトタイピングで、ワイヤレスのセンサーなどとして便利に活用できると思います。

## Code on micro:bit ##
* https://makecode.microbit.org/_YHtdtK9kt9Rz
* 癖があるjavascriptの環境ですが、CHIRIMENによるIoTの学習的には他の小型のボードコンピュータ上の開発言語よりは言語や開発環境の統一の面で良いと思います

## WebApps ##
* [ためしてみる](https://svg2.mbsrv.net/chirimen/bt/index.html)
* 使い方はhtmlを参照してください
* [microBitBLE.js](microBitBLE.js)がmicro:bitのセンサなどをWebBluetooth経由で使うためのドライバライブラリです。
* CHIRIMEN for Raspberry Pi3環境で動作確認
* Bluetoothインターフェースが載ったコンピュータでも動作すると思います。
  * ブラウザはChromeや Chromiumなど、Web Bluetoothサポートブラウザが必要
  * MacやWindows, Linux PC
  * Androidスマホ、タブレット
* セキュリティサンドボックス面で、結構ハマりポイントがある
  * https必須
  * requestDevice()では、optionalServicesの列挙が必須(ソース参照)
  * requestDevice()は、人による操作(buttonなど)を引き金にして呼び出される必要がある(らしい)（一回の操作から二回呼び出すのもNG）
  * UUIDはハイフンをしっかり入れる必要がある。

## ToDo, ISSUES ##
* micro:bitのI2Cを使いこなすコードは別途・・・　もちろん webI2C over webBluetoothにしたいですね。
* chrome/windows10では、microBitBLE.get* APIが全部うまく動いてない？(値が変わらない・・) WebBluetooth/Chrome/Windows10の実装がおかしい？ (CHIRIMEN RPi3(というよりraspbian(linux)上のchromium)ではうまく動いています)
