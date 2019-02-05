# webGPIO-etc-on-microbit-via-webBluetooth #
 micro:bit内蔵のセンサーやLED、スイッチ、GPIOポートを、web bluetooth経由で使う。GPIOポートはwebGPIOにほぼ準拠

[micro:bit](https://ja.wikipedia.org/wiki/BBC_Micro:bit)は、子供向けの教育用ボードコンピュータですが、Bluetooth搭載で、たくさんのセンサーや表示装置も載っています。コストパフォーマンスも入手性も良いと思いますので、Bluetoothを用いたIoTのプロトタイピングで、ワイヤレスのセンサーなどとして便利に活用できると思います。

## Code on micro:bit ##
* micro:bit側には以下のコードをロードします。
* https://makecode.microbit.org/_YHtdtK9kt9Rz
* 上記のtypeScriptにしたソースを念のため置いておきます。[microbitSource.js](microbitSource.js)
* 癖があるjavascriptの環境ですが、CHIRIMENによるIoTの学習的には他の小型のボードコンピュータ上の開発言語よりは言語や開発環境の統一の面で良いと思います

## WebApps ##
* [ためしてみる](https://svg2.mbsrv.net/chirimen/bt/index.html)
* 使い方はhtmlを参照してください
* [microBitBLE.js](microBitBLE.js)がmicro:bitのセンサなどをWebBluetooth経由で使うためのドライバライブラリです。GPIOピンはwebGPIOに準拠したAPIで操作します。
* CHIRIMEN for Raspberry Pi3環境で動作確認。CHIRIMEN for Raspberry Pi3上のGPIO、I2Cと同時利用可能です。
* Bluetoothインターフェースが載ったコンピュータでも動作すると思います。
  * ブラウザはChromeや Chromiumなど、Web Bluetoothサポートブラウザが必要
  * MacやWindows, Linux PC
  * Androidスマホ、タブレット
* セキュリティサンドボックス面で、結構ハマりポイントがある
  * https必須
  * requestDevice()では、optionalServicesの列挙が必須(ソース参照)
  * requestDevice()は、人による操作(buttonなど)を引き金にして呼び出される必要がある(らしい)（一回の操作から二回呼び出すのもNG）
  * UUIDはハイフンをしっかり入れる必要がある。

## 回路図 ##
### GPIO(Pin)を使わない場合 ###
GPIO(Pin)を使わない場合は単純です。（example.htmlはこれでも動きます。電源は供給してください)
![GPIOを使わない場合の回路図](imgs/micro_bit.png)

### GPIO(Pin)を使う場合 ###
GPIO(Pin)を使う場合は[micro:bitのブレークアウトボード](https://www.google.com/search?q=micro:bit+breakout&tbm=isch)を使ってピンヘッダ経由で配線します。
![GPIOを使う場合の回路図](imgs/micro_bit_gpio.png)

## ToDo, ISSUES ##
* micro:bitのI2Cを使いこなすコードは別途・・・　もちろん webI2C over webBluetoothにしたいですね。
* chrome/windows10では、microBitBLE.get* APIが全部うまく動いてない？(値が変わらない・・) WebBluetooth/Chrome/Windows10の実装がおかしい？ (CHIRIMEN RPi3(というよりraspbian(linux)上のchromium)ではうまく動いています)
