/**
	micro:bit BLE driver for Chromium / WebBluetooth
	
	Through Web Bluetooth, you can easily use micro:bit sensors etc. from Chromium|Chrome which supported bluetooth.
	
	Supports Buttons, matrixLEDs, Accelerometer, Magnetometer, Thermometer
	Also supports WebGPIO APIs so this is a partial  CHIRIMEN ;)
	
	Programmed by Satoru Takagi
	
	Firmware/micro:bit is
		https://makecode.microbit.org/_YHtdtK9kt9Rz
		
		//// source code
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
		////
	
	History:
		2018/12/26 1st release
		2019/01/16 make closure : microBitBLE.*
		2019/02/05 Support IO PIN Service based on webGPIO
	
	Based on:
		https://qiita.com/yokmama/items/5522fabfb5b9623278e2
		https://koichii.github.io/microbit-web-bluetooth/
		https://lancaster-university.github.io/microbit-docs/ble/profile/ 
		https://lancaster-university.github.io/microbit-docs/resources/bluetooth/bluetooth_profile.html
		https://relativelayout.hatenablog.com/entry/2018/02/03/013251
		https://github.com/edrosten/bluez/blob/master/monitor/uuid.c (Huge Dicts!)
		https://qiita.com/bleach31/items/5c640eed27f0d9806035
	
	TBD:
		Support I2C based on webI2C (PIN19,20)
	
	ISSUES:
		Perhaps because the perfection of webBluetooth / chrome is low, there are various problems with each OS.
		Chrome/windows10: Since readValue () is not decent, it seems that get* APIs does not work.

**/

( function ( window , undefined ) {
	var document = window.document;
	var navigator = window.navigator;
	var location = window.location;

	var microBitDevice,LEDtext,LEDmatrix,accelerometer,magnetometer,temperature,buttonA,buttonB;
	var pinData,pinADconf,pinIOconf,pinPWMconf;

	var microBitBLE = ( function(){ 
		
		var microBitUUIDs = {
			//micro:bit BLE UUID
			/* BBC micro:bit Bluetooth Profiles */
			"MicroBit Accelerometer Service": "e95d0753-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Accelerometer Data": "e95dca4b-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Accelerometer Period": "e95dfb24-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Magnetometer Service": "e95df2d8-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Magnetometer Data": "e95dfb11-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Magnetometer Period": "e95d386c-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Magnetometer Bearing": "e95d9715-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Button Service": "e95d9882-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Button A State": "e95dda90-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Button B State": "e95dda91-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit IO PIN Service": "e95d127b-251d-470a-a062-fa1922dfa9a8",
			"MicroBit PIN Data": "e95d8d00-251d-470a-a062-fa1922dfa9a8", // e95d8d00251d470aa062fa1922dfa9a8
			"MicroBit PIN AD Configuration": "e95d5899-251d-470a-a062-fa1922dfa9a8", // e95d5899251d470aa062fa1922dfa9a8
			"MicroBit PIN IO Configuration": "e95db9fe-251d-470a-a062-fa1922dfa9a8", // e95db9fe251d470aa062fa1922dfa9a8
			"MicroBit PWM Control": "e95dd822-251d-470a-a062-fa1922dfa9a8", // e95dd822251d470aa062fa1922dfa9a8
			
			"MicroBit LED Service": "e95dd91d-251d-470a-a062-fa1922dfa9a8", 
			"MicroBit LED Matrix state": "e95d7b77-251d-470a-a062-fa1922dfa9a8",
			"MicroBit LED Text": "e95d93ee-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Scrolling Delay": "e95d0d2d-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Event Service": "e95d93af-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Requirements" : "e95db84c-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Event Data": "e95d9775-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Client Requirements": "e95d23c4-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Client Events": "e95d5404-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit DFU Control Service": "e95d93b0-251d-470a-a062-fa1922dfa9a8",
			"MicroBit DFU Control": "e95d93b1-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Temperature Service": "e95d6100-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Temperature Data": "e95d9250-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Temperature Period": "e95d1b25-251d-470a-a062-fa1922dfa9a8",
			/* Nordic UART Port Emulation */
			"Nordic UART Service": "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
			"Nordic UART TX": "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
			"Nordic UART RX": "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
		}
		
		var accelerometerCBF = null;
		var magnetometerCBF = null;
		var temperatureCBF = null;
		var buttonACBF = null;
		var buttonBCBF = null;
		
		var accelerometerGate = null;
		var magnetometerGate = null;
		var temperatureGate = null;
		var buttonAGate = null;
		var buttonBGate = null;
		var pinGate = null;
		
		var connected = false;
		
		async function connect(){
			// To be cleanuped
			accelerometerGate = onAccelerometerValueChanged;
			magnetometerGate = onMagnetometerValueChanged;
			temperatureGate = onTempChanged;
			buttonAGate = onBtnAChanged;
			buttonBGate = onBtnBChanged;
			
			pinGate = onPinChanged;
			
			
			await connectMicroBit();
			await configPin();
			connected = true;
			return ( true );
		}
		
		async function connectMicroBit(){
			// connect Accelerometer
			var characteristicSet = [];
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit Accelerometer Service"],
				dataUUID:microBitUUIDs["MicroBit Accelerometer Data"],
				callback:accelerometerGate
			});
			
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit Magnetometer Service"],
				dataUUID:microBitUUIDs["MicroBit Magnetometer Data"],
				callback:magnetometerGate
			});
			/**
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit Button Service"],
				dataUUID:microBitUUIDs["MicroBit Button A State"],
				callback:buttonAGate
			});
			
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit Button Service"],
				dataUUID:microBitUUIDs["MicroBit Button B State"],
				callback:buttonBGate
			});
			**/
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit Temperature Service"],
				dataUUID:microBitUUIDs["MicroBit Temperature Data"],
				callback:temperatureGate
			});
			
			// haracteristics[5]
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit LED Service"],
				dataUUID:microBitUUIDs["MicroBit LED Text"],
			});
			
			// haracteristics[6]
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit LED Service"],
				dataUUID:microBitUUIDs["MicroBit LED Matrix state"],
			});
			
			// Pin Services[7:data,8:ADconf,9:IOconf,10:PWMconf]
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PIN Data"],
				callback:pinGate
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PIN AD Configuration"],
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PIN IO Configuration"],
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PWM Control"],
			});
			
			var svi = 0;
			var microBotBLE = await connectBLE(characteristicSet);
//			console.log("microBotBLE:",microBotBLE);
			accelerometer = microBotBLE.characteristics[svi];
			magnetometer = microBotBLE.characteristics[++svi];
//			buttonA = microBotBLE.characteristics[++svi];
//			buttonB = microBotBLE.characteristics[++svi];
			temperature = microBotBLE.characteristics[++svi];
			LEDtext = microBotBLE.characteristics[++svi];
			LEDmatrix = microBotBLE.characteristics[++svi];
			
			// PinChrs
			pinData    = microBotBLE.characteristics[++svi];
			pinADconf  = microBotBLE.characteristics[++svi];
			pinIOconf  = microBotBLE.characteristics[++svi];
			pinPWMconf = microBotBLE.characteristics[++svi];
			microBitDevice = microBotBLE.device;
//			console.log("LED chara:",LEDtext, LEDmatrix);
			console.log("Complete microBotBLE connection.");
		}

		async function connectBLE(characteristicSet ) {
			// characteristicSet = [{serviceUUID:serviceUUID, dataUUID:dataUUID, callBack:callBackFunc},...]
			// というデータ構造を作って、投入する。
			// 生成された.deviceおよび、上記に対応するcharacteristicが入った.characteristics配列が、返却される
			
			// If requestDevice() is called without HM interaction (input button event etc) then throw exception 
			// If you already get device then set device option , for bypassing requestDevice()
			
			var optionalServicesArray = [];
			for ( var i = 0 ; i < characteristicSet.length ; i++ ){
				optionalServicesArray.push(characteristicSet[i].serviceUUID);
			}
			
			try{
				var device = await navigator.bluetooth.requestDevice({
					filters: [{
						namePrefix: 'BBC micro:bit',
					}],
					optionalServices: optionalServicesArray // Trap!!!: This option is mandatory
				});
				console.log("Get micro:bit device : ", device);
				var server = await (async function(device){
					return device.gatt.connect();
				})(device);
				console.log("Get micro:bit server : ", server)
				
				var characteristics = [];
				
				for ( var i = 0 ; i < characteristicSet.length ; i++ ){
					var service = await (async function(server){
						return server.getPrimaryService(characteristicSet[i].serviceUUID);
					})(server);
//					console.log("service No:",i," : ", service)
					
					var chara =  await (async function(service){
						return service.getCharacteristic(characteristicSet[i].dataUUID);
					})(service);
//					console.log("chara:", chara)
					
					await (async function(chara){
						//    alert("BLE接続が完了しました。");
//						console.log("callBack?:",characteristicSet[i].callback, characteristicSet[i]);
						if ( characteristicSet[i].callback ){
//							console.log("SET CALLVACK : : : ",characteristicSet[i].callback);
							chara.startNotifications();
							chara.addEventListener('characteristicvaluechanged',characteristicSet[i].callback);  
						} else {
//							console.log("NO CALLBACK, no NOTIFICATION");
//							chara.addEventListener('characteristicvaluechanged',function(ev){console.log("no NOTIF:",ev)});  
						}
					})(chara);
					characteristics.push(chara);
				}
				
				return ( {device:device,characteristics:characteristics});
			} catch(error){
				alert("Connection Failed : ",error);
				console.log(error);
			}
		}

		function onAccelerometerValueChanged(event) {
			if ( accelerometerCBF ){
				var AcceleratorX = event.target.value.getInt16(0,true)/1000.0;
				var AcceleratorY = event.target.value.getInt16(2,true)/1000.0;
				var AcceleratorZ = event.target.value.getInt16(4,true)/1000.0;
				accelerometerCBF({x:AcceleratorX, y:AcceleratorY, z:AcceleratorZ});
			}
		} 
		
		function onMagnetometerValueChanged(event) {
			if ( magnetometerCBF ){
				var MagnetometerX = event.target.value.getInt16(0,true)/1000.0;
				var MagnetometerY = event.target.value.getInt16(2,true)/1000.0;
				var MagnetometerZ = event.target.value.getInt16(4,true)/1000.0;
				magnetometerCBF({x:MagnetometerX, y:MagnetometerY, z:MagnetometerZ});
			}
		} 
		
		function onBtnAChanged(event){ 
			if ( buttonACBF ){
				var bA = event.target.value.getInt8();
				buttonACBF( bA );
			}
		}
		function onBtnBChanged(event){ 
			if ( buttonBCBF ){
				var bB = event.target.value.getInt8();
				buttonBCBF( bB );
			}
		}
		
		function onTempChanged(event){
			if ( temperatureCBF ){
				var temperature = event.target.value.getInt8();
				temperatureCBF( temperature );
			}
		}
		
		function onPinChanged(event){
			var pin = event.target.value;
			var portNumb = pin.getUint8(0);
			var portVal =  pin.getUint8(1);
			if ( portNumb == 5 && buttonACBF ){
				buttonACBF((portVal === 1) ? 0 : 1);
			} else if ( portNumb == 11 && buttonBCBF ){
				buttonBCBF((portVal === 1) ? 0 : 1);
			}
//			console.log(GPIOPortMap,GPIOPortMap.get(portNumb));
			if ( GPIOPortMap && GPIOPortMap.get(portNumb) && GPIOPortMap.get(portNumb).OnChangeFunc ){
				GPIOPortMap.get(portNumb).OnChangeFunc(portVal);
			}
//			console.log(portNumb,":",portVal);
		}

		function disconnect() {
			if (microBitDevice && microBitDevice.gatt.connected){
				microBitDevice.gatt.disconnect();
			}
			connected = false;
//			alert("Connection closed");
		}

		function sleep(ms) {
			return new Promise(function(resolve) {
				setTimeout(resolve, ms);
			});
		}

		function string_to_buffer(src) {
		  return (new Uint8Array([].map.call(src, function(c) {
		    return c.charCodeAt(0)
		  }))).buffer;
		}

		async function setLEDtext(ptext){
			console.log(ptext);
			var msg = string_to_buffer(ptext);
			await LEDtext.writeValue(msg);
		}

		async function setLEDmatrix( matrixData ){
			await LEDmatrix.writeValue(matrixData);
		}
		
		async function getAccelerometer(){
			if ( accelerometer ){
				var val = await accelerometer.readValue();
				console.log("called getAccelerometer:",val, accelerometer.value);
				return {
					x: val.getInt16(0,true)/1000.0,
					y: val.getInt16(2,true)/1000.0,
					z: val.getInt16(4,true)/1000.0,
				}
			} else { return{x:-1,y:-1,z:-1}}
		}
		async function getMagnetometer(){
			if ( magnetometer ){
				var val = await magnetometer.readValue();
				return {
					x: val.getInt16(0,true)/1000.0,
					y: val.getInt16(2,true)/1000.0,
					z: val.getInt16(4,true)/1000.0,
				}
			} else { return{x:-1,y:-1,z:-1}}
		}
		async function getButtonA(){
			if ( buttonA ){
				var val = await buttonA.readValue();
				return ( val.getInt8() );
			} else { return(-1)}
		}
		
		async function getButtonB(){
			if ( buttonB ){
				var val = await buttonB.readValue();
				return ( val.getInt8() );
			} else { return(-1)}
		}
		
		async function getTemperature(){
			if ( temperature ){
				var val = await temperature.readValue();
				return ( val.getInt8() );
			} else { return(-1)}
		}
		
		var adc = new Uint32Array(1);
		var ioc = new Uint32Array(1);
		
		async function setPinMode(pinNumb, out, analogIn ){
			if ( availablePorts[pinNumb]==0){
				throw Error("Not available port : "+ pinNumb);
			}
			if ( out && analogIn ){
				throw Error("Analog is input only.");
			}
			
			if ( out && canOutPorts[pinNumb] == 0 ){
				throw Error("Not out available port : "+ pinNumb);
			}
			if ( analogIn && canAnalogInPorts[pinNumb] == 0 ){
				throw Error("Not AnalogIn available port : "+ pinNumb);
			}
			
			var inMode = out ? false : true; 
			adc[0] = setBit(adc[0],pinNumb,analogIn);
			ioc[0] = setBit(ioc[0],pinNumb,inMode);
//			console.log("set pin mode");
//			console.log("AD:",(adc[0]>>>0).toString(2));
//			console.log("IO:",(ioc[0]>>>0).toString(2));
			await pinIOconf.writeValue(ioc);
			await pinADconf.writeValue(adc);
//			console.log("end set pin mode");
		}
		
		function setBit(orig,bitNumb,bitVal){
			var cBit = 1 << bitNumb;
			if (bitVal){
				orig |= cBit;
			} else {
				orig &= ~cBit;
			}
			return ( orig );
		}
		
		async function configPin( ){
//			IOPINS:0b-----------SS--DDDDRBLLDLLBLLAAA
//			adc[0]=0b00000000000000000000000000000111;
			adc[0]=0b00000000000000000000000000000000;
			
//			A:Analog/Digital, L:LEDCol, B:Button(xx?), D:Digital, R:Reserved, -:N/A, S:I2C, 
//			IOPINS:0b-----------SS--DDDDRBLLDLLBLLAAA
//			ioc[0]=0b00000000000000011110000100000111; // all digital in
			ioc[0]=0b00000000000000011110100100100111; // all digital in  (1:in 0:out)
			ioc[0]=0b00000000000000000000100000100110; // in:BtnAB and port1,2  out:others
			ioc[0]=0b00000000000000011110100100100110; // all digital in except port0
			await pinIOconf.writeValue(ioc);
			await pinADconf.writeValue(adc);
			console.log("end config pin");
		}
		
		async function getPin(){
			var val = await pinData.readValue();
			var str = "";
			var ans = new Map();
			for ( var i = 0 ; i < val.byteLength / 2 ; i++ ){
				var pinNumb = val.getUint8(i*2);
				var pinVal  = val.getUint8(i*2+1);
				str += pinNumb + ":"+pinVal+", ";
				ans.set(pinNumb,pinVal);
			}
//			console.log("PIN:",str);
			return ( ans );
		}
		
		async function setPin(portNumb,val){ // 一気に書き込みもできるらしいが・・
			if (( val == 1 || val == 0 )){
				var gpio = new Uint8Array([portNumb,val]);
				var val = await pinData.writeValue(gpio);
			}
		}
		
		// GPIO: https://lancaster-university.github.io/microbit-docs/ble/iopin-service/
		// webGPIO implementation (https://rawgit.com/browserobo/WebGPIO/master/index.html)
		
		//					    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6
		var availablePorts 	= [1,1,1,0,0,1,0,0,1,0,0,1,0,1,1,1,1]; // LED matrix ports are unavailable
//		var buttonPorts 		= [0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0]; // 1:BtnA, 2:BtnB  ThesePorts are Digital In only
		var canOutPorts 		= [1,1,1,0,0,0,0,0,1,0,0,0,0,1,1,1,1]; // 
		var canAnalogInPorts	= [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0]; //
		
		function getGPIOPort(portNumb){
			var direction ="";
			var exported = false;
			var pNumber = portNumb;
			var out = true;
			var ain = false;
			
			async function export_port( mode ){ // mode: "in", "out", "analogin", (TBD"pwmout") case insensitive
//				console.log("export_port",mode);
				if ( exported ){
					throw Error("Already exported. Use unexport().");
				}
				direction = mode.toLowerCase();
				exported = true;
				switch (direction){
				case "in":
					out = false;
					ain = false;
					break;
				case "out":
					if ( canOutPorts[pNumber] == 0 ){
						throw Error("This port is not supported digital out");
					}
					out = true;
					ain = false;
					break;
				case "analogin":
					if ( canAnalogInPorts[pNumber] == 0 ){
						throw Error("This port is not supported analog in");
					}
					out = false;
					ain = true;
					break;
				case "pwmout":
					throw Error("PWM out is Under development...");
					// TBD
					break;
				default :
					throw Error("NOT SUPPORTED MODE");
					direction = "";
					exported = false;
				}
				await setPinMode(pNumber, out, ain );
//				console.log("setPin num,out,ain: ",pNumber, out, ain);
			}
			async function unexport(){
				exported = false;
				direction ="";
			}
			
			async function read(){
				if ( !out ){
					var ans = await getPin();
					return ( ans.get(pNumber));
				} else {
					throw Error("Can't read. This port's mode is " + direction);
				}
			}
			
			async function write(value){ // uint8
//				console.log("write",value);
				if ( out ){
					await setPin(pNumber, value);
					return ( true );
				} else {
					throw Error("Can't write. This port's mode is " + direction);
				}
			}
			
			var onChangeFunc = null;
			
			/** 下記返り値:これにしたほうがいい?
			var obj = {}; 
			Object.defineProperty(obj, "prop", { 
				value: "test", 
				writable: false 
			}); 
			**/
			return {
				// read only props
				get portNumber(){ return portNumb},
				get portName(){ return String(portNumb)},
				get pinName(){ return String(portNumb)},
				get direction(){ return direction },
				get exported(){ return exported},
				export : export_port,
				unexport: unexport,
				read: read,
				write: write,
				// setter props
				set onchange(value){ 
//					console.log("called setter: onchange:",value);
					onChangeFunc = value 
				},
				get OnChangeFunc(){ return  onChangeFunc},
			}
		}
		
		var GPIOPortMap;
		function makeGPIOPortMap(){
			var pm = new Map();
			for ( var i = 0 ; i < availablePorts.length ; i++ ){
				if ( availablePorts[i] == 1 ){
					pm.set( i , getGPIOPort(i));
				}
			}
			GPIOPortMap = pm;
		}
		
		async function requestGPIOAccess(){
			if ( !connected ){
				throw Error("ERR: micro:bit is not connected. Call microBitBLE.connect() first.");
			}
			makeGPIOPortMap();
//			console.log("GPIOPortMap:",GPIOPortMap);
			return {
				ports: GPIOPortMap,
				unexportAll: async function(){},
			};
		}
		
		return { // Exposed APIs for microBitBLE.*
			connect: connect,
			disconnect : disconnect,
			setLEDtext : setLEDtext,
			setLEDmatrix : setLEDmatrix,
			getAccelerometer : getAccelerometer,
			getMagnetometer : getMagnetometer,
			getButtonA : getButtonA,
			getButtonB : getButtonB,
			getTemperature : getTemperature,
			sleep: sleep,
//			getPin: getPin,
//			setPin: setPin,
			set onThermometerChange(cbf){
				temperatureCBF = cbf;
			},
			set onMagnetometerChange(cbf){
				magnetometerCBF = cbf;
			},
			set onAccelerometerChange(cbf){
				accelerometerCBF = cbf;
			},
			set onButtonAChange(cbf){
				buttonACBF = cbf;
			},
			set onButtonBChange(cbf){
				buttonBCBF = cbf;
			},
			requestGPIOAccess: requestGPIOAccess, // webGPIO like API for micro:bit
		}
	})();
	window.microBitBLE = microBitBLE;
	if ( !navigator.requestGPIOAccess){
		navigator.requestGPIOAccess = microBitBLE.requestGPIOAccess;
	}
})( window );

