# Homebridge-Logo-Platform #

[![npm version](https://badge.fury.io/js/homebridge-logo-platform.svg)](https://badge.fury.io/js/homebridge-logo-platform)
[![donate](https://img.shields.io/badge/donate-PayPal-blue.svg)](https://www.paypal.me/Sinclair81)

<!-- markdownlint-disable MD033 -->
<img src="https://raw.githubusercontent.com/Sinclair81/Homebridge-Logo-Platform/master/Standardraum.png" align="right" alt="Standardraum" height="448" width="207">
<!-- markdownlint-enable MD033 -->

Use a Siemens LOGO! PLC for switch on whatever you want.  
Communicate with LOGO! 8.SF4 over Modbus.  

__Type of Accessory:__

- [Switch](#switch-configuration)  
- [Lightbulb](#lightbulb-configuration)  
- [Blind](#blind-configuration)  
- *[Window](#window-configuration)  
- *[Garage Door](#garage-door-configuration)  
- *[Thermostat](#thermostat-configuration)
- *[Irrigation System](#irrigation-system-configuration)
- *[Valve](#valve-configuration)
- *[Fan](#fan-configuration)
- *[Filter Maintenance](#filter-maintenance-configuration)

__Type of Sensor Accessory:__

- *[Light Sensor](#light-sensor-configuration)
- *[Motion Sensor](#motion-sensor-configuration)
- *[Contact Sensor](#contact-sensor-configuration)
- *[Smoke Sensor](#smoke-sensor-configuration)
- *[Temperature Sensor](#temperature-sensor-configuration)
- *[Humidity Sensor](#humidity-sensor-configuration)
- *[Carbon Dioxide Sensor](#carbon-dioxide-sensor-configuration)
- *[Air Quality Sensor](#air-quality-sensor-configuration)
- *[Leak Sensor](#leak-sensor-configuration)

## Installation ##

1. Install homebridge using: `sudo npm install -g --unsafe-perm homebridge`
2. Install homebridge-config-ui-x using: `sudo npm install -g --unsafe-perm homebridge-config-ui-x`
3. Update your configuration file with this guide: [smartapfel.de](https://smartapfel.de/homebridge/plugins-installieren/)
4. Install homebridge-logo-platform using: homebridge-config-ui-x's Webserver (Homebridge must be started with sudo for the installation.)
5. Update your configuration file with code like the sample below

## Main differences to Homebridge-Logo-TS ##

- No Snap7 support!
- no `pushButton` parameter for any accessory, the program in the logo must reset the network input to `0` itself.
- no `buttonValue` parameter for any accessory, `1` is always sent.
- `retryCount` default value change to `0`

## Platform Main Configuration Parameters ##

Name                     | Value               | Required | Notes
------------------------ | ------------------- | -------- | ------------------------
`platform`               | "LogoPlatform"      | yes      | Must be set to "LogoPlatform".
`name`                   | (custom)            | yes      | Name of platform that will not appear in homekit app.
`ip`                     | "10.0.0.100"        | yes      | Must be set to the IP of your LOGO! PLC.
`port`                   | 502                 | yes      | Must be set to the Modbus Port of your LOGO! PLC.
`updateInterval`         | 0                   | no       | Auto Update Interval in milliseconds, 0 = Off
`debugMsgLog`            | 0                   | no       | 1 - Displays messages of accessories in the log.
`retryCount`             | 0                   | no       | Retry count for sending the ModBus Message, default is: 0.

## Device Main Configuration Parameters ##

Name                     | Value               | Required | Notes
------------------------ | ------------------- | -------- | ------------------------
`name`                   | (custom)            | yes      | Name of accessory that will appear in homekit app.
`type`                   | "switch" or ...     | yes      | Type of Accessory: "switch", "lightbulb", "blind", "window", "garagedoor", "thermostat", "irrigationSystem", "valve", "fan", "fanv2", "filterMaintenance", "ventilation" or Type of Sensor Accessory: "lightSensor", "motionSensor", "contactSensor", "smokeSensor", "temperatureSensor", "humiditySensor", "carbonDioxideSensor", "airQualitySensor"

```json
"platforms": [
    {
        "platform": "LogoPlatform",
        "name": "Logo 1",
        "ip": "10.0.0.100",
        "port": 502,
        "debugMsgLog": 1,
        "updateInterval": 30000,
        "devices": [
            {
                "name": "Accessory Name 1",
                "type": "...",
                ...
            },
            {
                "name": "Accessory Name 2",
                "type": "...",
                ...
            }
        ]
    }
]
```  

## Switch Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`switchGet`              | "Q1"                | yes*     | "switch"   | Switch Get - Qn, Mn or Vn.n
`switchSetOn`            | "V2.0"              | yes*     | "switch"   | Switch Set On - Mn or Vn.n
`switchSetOff`           | "V3.0"              | yes*     | "switch"   | Switch Set Off - Mn or Vn.n  

```json
{
    "name": "Q1",
    "type": "switch",
    "switchGet": "Q1",
    "switchSetOn": "V2.0",
    "switchSetOff": "V3.1"
}
```  

## Lightbulb Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`lightbulbGet`           | "Q4"                | yes*     | "lightbulb" | lightbulb Get - Qn, Mn or Vn.n
`lightbulbSetOn`         | "V7.0"              | yes*     | "lightbulb" | Lightbulb Set On - Mn or Vn.n
`lightbulbSetOff`        | "V7.1"              | yes*     | "lightbulb" | Lightbulb Set Off - Mn or Vn.n
`lightbulbSetBrightness` | "VW70"              | yes*     | "lightbulb" | Lightbulb Set Brightness - AMn or VWn
`lightbulbGetBrightness` | "VW72"              | yes*     | "lightbulb" | Lightbulb Get Brightness - AMn or VWn

```json
{
    "name": "Q4",
    "type": "lightbulb",
    "lightbulbGet": "Q4",
    "lightbulbSetOn": "V7.0",
    "lightbulbSetOff": "V7.1",
    "lightbulbSetBrightness": "VW70",
    "lightbulbGetBrightness": "VW72"
}
```

## Blind Configuration ##
  
Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`blindSetTargetPos`      | "VW26"              | yes*     | "blind"    | Blind Set Target Pos - AMn or VWn
`blindGetTargetPos`      | "VW28"              | yes*     | "blind"    | Blind Get Target Pos - AMn or VWn
`blindGetPos`            | "VW28"              | yes*     | "blind"    | Blind Get Pos - AMn or VWn
`blindGetState`          | "VW30"              | yes*     | "blind"    | Blind Get State - AMn or VWn
`blindConvertValue`      | 0 or 1              | no*      | "blind"    | Convert LOGO! values in to HomeKit values, default is: 1.  
  
```json
{
    "name": "Item-6",
    "type": "blind",
    "blindConvertValue": 1,
    "blindSetTargetPos": "VW26",
    "blindGetTargetPos": "VW28",
    "blindGetPos": "VW28",
    "blindGetState": "VW30"
}
```  

## Window Configuration ##
  
Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`windowSetTargetPos`     | "VW32"              | yes*     | "window"   | Window Set Target Pos - AMn or VWn
`windowGetTargetPos`     | "VW34"              | yes*     | "window"   | Window Get Target Pos - AMn or VWn
`windowGetPos`           | "VW34"              | yes*     | "window"   | Window Get Pos - AMn or VWn
`windowSetState`         | "VW36"              | yes*     | "window"   | Window Get State - AMn or VWn
`windowConvertValue`     | 0 or 1              | no*      | "window"   | Convert LOGO! values in to HomeKit values, default is: 1.  
  
```json
{
    "name": "Item-7",
    "type": "window",
    "windowConvertValue": 1,
    "windowSetTargetPos": "VW32",
    "windowGetTargetPos": "VW34",
    "windowGetPos": "VW34",
    "windowGetState": "VW36"
}
```  

## Garage Door Configuration ##

Name                       | Value               | Required | Option for   | Notes
-------------------------- | ------------------- | -------- | ------------ | ------------------------
`garagedoorGetState`       | "VW40"              | yes*     | "garagedoor" | Garagedoor Get State - AMn or VWn (0 = Open; 1 = Closed; 2 = Opening; 3 = Closing; 4 = Stopped)
`garagedoorGetTargetState` | "VW40"              | yes*     | "garagedoor" | Garagedoor Get Target State - AMn or VWn (0 = Open; 1 = Closed)
`garagedoorSetTargetState` | "VW38"              | yes*     | "garagedoor" | Garagedoor Set Target State - AMn or VWn (0 = Open; 1 = Closed)
`garagedoorObstruction`    | "V3.0"              | no*      | "garagedoor" | Garagedoor Obstruction Detected - Mn or Vn.n

```json
{
    "name": "Item-8",
    "type": "garagedoor",
    "garagedoorGetState": "VW40",
    "garagedoorGetTargetState": "VW40",
    "garagedoorSetTargetState": "VW38",
    "garagedoorObstruction": "V3.0"
}
```

## Thermostat Configuration ##

Name                     | Value              | Required | Option for | Notes
------------------------ | ------------------ | -------- | ---------- | ------------------------
`thermostatGetHCState`       | "VW42"         | yes*     | "thermostat" | Thermostat Get Heating Cooling State - AMn or VWn
`thermostatGetTargetHCState` | "VW44"         | yes*     | "thermostat" | Thermostat Get Target Heating Cooling State - AMn or VWn
`thermostatSetTargetHCState` | "VW46"         | yes*     | "thermostat" | Thermostat Set Target Heating Cooling State - AMn or VWn
`thermostatGetTemp`          | "VW48"         | yes*     | "thermostat" | Thermostat Get Temperature - AMn or VWn - Current Temperature in °C (0°C - 100°C!!)
`thermostatGetTargetTemp`    | "VW50"         | yes*     | "thermostat" | Thermostat Get Target Temperature - AMn or VWn - Current Temperature in °C (10°C - 38°C!!)
`thermostatSetTargetTemp`    | "VW52"         | yes*     | "thermostat" | Thermostat Set Target Temperature - AMn or VWn
`thermostatTempDisplayUnits` | 0 or 1         | yes*     | "thermostat" | Temperature Display Units - Celsius = 0; Fahrenheit = 1;
`thermostatConvertValue`     | 0 or 1         | no*      | "thermostat" | Convert Int in Float, default is: 0. (235 / 10 == 23.5°C)  

```json
{
    "name": "Item-9",
    "type": "thermostat",
    "thermostatGetHCState": "VW42",
    "thermostatGetTargetHCState": "VW44",
    "thermostatSetTargetHCState": "VW46",
    "thermostatGetTemp": "VW48",
    "thermostatGetTargetTemp": "VW50",
    "thermostatSetTargetTemp": "VW52",
    "thermostatTempDisplayUnits": 0,
    "thermostatConvertValue": 1
}
```

## Irrigation System Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`irrigationSystemGetActive`      | "V4.0"    | yes*     | "irrigationSystem" | Irrigation System Get Active - Mn or Vn.n
`irrigationSystemSetActiveOn`    | "V4.1"    | yes*     | "irrigationSystem" | Irrigation System Set Active to On - Mn or Vn.n
`irrigationSystemSetActiveOff`   | "V4.2"    | yes*     | "irrigationSystem" | Irrigation System Set Active to Off - Mn or Vn.n
`irrigationSystemGetProgramMode` | "VW54"     | yes*     | "irrigationSystem" | Irrigation System Get Program Mode - AMn or VWn - (0 - No Program scheduled; 1 - Program scheduled; 2 - Program scheduled manual Mode)
`irrigationSystemGetInUse`       | "V4.3"    | yes*     | "irrigationSystem" | Irrigation System Get In Use - Mn or Vn.n

```json
{
    "name": "Item-10",
    "type": "irrigationSystem",
    "irrigationSystemGetActive": "V4.0",
    "irrigationSystemSetActiveOn": "V4.1",
    "irrigationSystemSetActiveOff": "V4.2",
    "irrigationSystemGetProgramMode": "VW54",
    "irrigationSystemGetInUse": "V4.3"
}
```

## Valve Configuration ##

Name                        | Value       | Required | Option for | Notes
--------------------------- | ----------- | -------- | ---------- | ------------------------
`valveGetActive`            | "V5.0"      | yes*     | "valve" | Valve Get Active - Mn or Vn.n
`valveSetActiveOn`          | "V5.1"      | yes*     | "valve" | Valve Set Active to On - Mn or Vn.n
`valveSetActiveOff`         | "V5.2"      | yes*     | "valve" | Valve Set Active to Off - Mn or Vn.n
`valveGetInUse`             | "V5.3"      | yes*     | "valve" | Valve Get In Use - Mn or Vn.n
`valveType`                 | 0           | yes*     | "valve" | Valve Type - Generic Valve = 0, Irrigation = 1, Shower Head = 2, Water Faucet = 3,
`valveSetDuration`          | "VW56"      | no*      | "valve" | Valve Set Duration - AMn or VWn - Value in Seconds (0 - 3600 sec)
`valveGetDuration`          | "VW56"      | no*      | "valve" | Valve Get Duration - AMn or VWn - Value in Seconds (0 - 3600 sec)
`valveGetRemainingDuration` | "VW58"      | no*      | "valve" | Valve Get Remaining Duration - AMn or VWn - Value in Seconds (0 - 3600 sec)

```json
{
    "name": "Item-11",
    "type": "valve",
    "valveGetActive": "V5.0",
    "valveSetActiveOn": "V5.1",
    "valveSetActiveOff": "V5.2",
    "valveGetInUse": "V5.3",
    "valveType": 1,
    "valveSetDuration": "VW56",
    "valveGetDuration": "VW56",
    "valveGetRemainingDuration": "VW58"
}
```

## Fan Configuration ##

Name                     | Value             | Required | Option for | Notes
------------------------ | ----------------- | -------- | ---------- | ------------------------
`fanGetActive`               | "V6.0"        | yes*     | "fan"      | Fan Get Active - Mn or Vn.n
`fanSetActiveOn`             | "V6.1"        | yes*     | "fan"      | Fan Set Active to On - Mn or Vn.n
`fanSetActiveOff`            | "V6.2"        | yes*     | "fan"      | Fan Set Active to Off - Mn or Vn.n
`fanGetRotationDirection`    | "V6.3"        | no*      | "fan"      | Fan Get Rotation Direction - Mn or Vn.n
`fanSetRotationDirectionCW`  | "V6.4"        | no*      | "fan"      | Fan Set Rotation Direction to Clockwise - Mn or Vn.n
`fanSetRotationDirectionCCW` | "V6.5"        | no*      | "fan"      | Fan Set Rotation Direction to Counter Clockwise - Mn or Vn.n
`fanGetRotationSpeed`        | "VW60"        | no*      | "fan"      | Fan Get Rotation Speed - AMn or VWn
`fanSetRotationSpeed`        | "VW62"        | no*      | "fan"      | Fan Set Rotation Speed - AMn or VWn

```json
{
    "name": "Item-12",
    "type": "fan",
    "fanGetActive": "V6.0",
    "fanSetActiveOn": "V6.1",
    "fanSetActiveOff": "V6.2",
    "fanGetRotationDirection": "V6.3",
    "fanSetRotationDirectionCW": "V6.4",
    "fanSetRotationDirectionCCW": "V6.5",
    "fanGetRotationSpeed": "VW60",
    "fanSetRotationSpeed": "VW62"
}
```

## Filter Maintenance Configuration ##

__:construction: In HomeKit Accessory Protocol Specification available but currently not supported by the Home-App!__

Name                     | Value             | Required | Option for | Notes
------------------------ | ----------------- | -------- | ---------- | ------------------------
`filterChangeIndication`      | "V7.0"       | yes*     | "filterMaintenance" | Filter Maintenance Get Filter Change Indication - Mn or Vn.n
`filterLifeLevel`             | "VW64"       | no*      | "filterMaintenance" | Filter Maintenance Get Filter Life Level - AMn or VWn
`filterResetFilterIndication` | "V7.1"       | no*      | "filterMaintenance" | Filter Maintenance Set Reset Filter Indication - Mn or Vn.n

```json
{
    "name": "Item-13",
    "type": "filterMaintenance",
    "filterChangeIndication": "V7.0",
    "filterLifeLevel": "VW64",
    "filterResetFilterIndication": "V7.1"
}
```

## Light Sensor Configuration ##

Name                | Value      | Required | Option for | Notes
------------------- | ---------- | -------- | ---------- | ------------------------
`light`             | "VW66"     | yes*     | "lightSensor" | Light Sensor for Current Ambient Light Level in Lux

```json
{
    "name": "Sensor-1",
    "type": "lightSensor",
    "light": "VW66"
}
```

## Motion Sensor Accessory Configuration ##

Name             | Value               | Required | Option for | Notes
---------------- | ------------------- | -------- | ---------- | ------------------------
`motion`         | "V8.0"              | yes*     | "motionSensor"        | Motion Sensor

```json
{
    "name": "Sensor-2",
    "type": "motionSensor",
    "motion": "V8.0"
}
```

## Contact Sensor Configuration ##

Name             | Value               | Required | Option for | Notes
---------------- | ------------------- | -------- | ---------- | ------------------------
`contact`        | "V8.1"              | yes*     | "contactSensor"       | Contact Sensor

```json
{
    "name": "Sensor-3",
    "type": "contactSensor",
    "contact": "V8.1"
}
```

## Smoke Sensor Configuration ##

Name             | Value               | Required | Option for | Notes
---------------- | ------------------- | -------- | ---------- | ------------------------
`smoke`          | "V8.2"              | yes*     | "smokeSensor"         | Smoke Sensor

```json
{
    "name": "Sensor-4",
    "type": "smokeSensor",
    "smoke": "V8.2"
}
```

## Temperature Sensor Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`temperature`            | "VW68"              | yes*     | "temperatureSensor"   | Temperature Sensor for Current Temperature in °C (0°C - 100°C!!)
`convertValue`           | 0 or 1              | no*      | "temperatureSensor"   | Convert Int in Float, default is: 0. (235 / 10 == 23.5°C)  

```json
{
    "name": "Sensor-5",
    "type": "temperatureSensor",
    "convertValue": 1,
    "temperature": "VW68"
}
```

## Humidity Sensor Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`humidity`               | "VW70"              | yes*     | "humiditySensor"      | Humidity Sensor for Current Relative Humidity in %
`convertValue`           | 0 or 1              | no*      | "humiditySensor"      | Convert Int in Float, default is: 0.   (456 / 10 == 45.6%rH => 46%rH in Home App)

```json
{
    "name": "Sensor-6",
    "type": "humiditySensor",
    "convertValue": 1,
    "humidity": "VW70"
}
```

## Carbon Dioxide Sensor Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`carbonDioxide`          | "V9.0"              | yes*     | "carbonDioxideSensor" | Carbon Dioxide
`carbonDioxideLevel`     | "VW72"              | no*      | "carbonDioxideSensor" | Carbon Dioxide Level in ppm
`carbonDioxidePeakLevel` | "VW74"              | no*      | "carbonDioxideSensor" | Carbon Dioxide Peak Level in ppm

```json
{
    "name": "Sensor-7",
    "type": "carbonDioxideSensor",
    "carbonDioxide": "V9.0",
    "carbonDioxideLevel": "VW72",
    "carbonDioxidePeakLevel": "VW74"
}
```

## Air Quality Sensor Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`airQuality`             | "VW76"              | yes*     | "airQualitySensor"    | Air Quality (0 - 5)

- 0 - Unknown  
- 1 - Excellent - CO2 < 800ppm (IDA 1)  
- 2 - Good - CO2 = 800 - 1000ppm (IDA 2)  
- 3 - Fair - CO2 = 1000 - 1400ppm (IDA 3)  
- 4 - Inferior - CO2 = 1400 - 1800ppm (IDA 4)  
- 5 - Poor - CO2 > 1800ppm  

```json
{
    "name": "Sensor-8",
    "type": "airQualitySensor",
    "airQuality": "VW76"
}
```

## Leak Sensor Configuration ##

Name             | Value               | Required | Option for | Notes
---------------- | ------------------- | -------- | ---------- | ------------------------
`leak`           | "V9.1"              | yes*     | "leakSensor"  | Leak Sensor
`waterLevel`     | "VW78"              | no*      | "leakSensor"  | Water Level in %

```json
{
    "name": "Sensor-9",
    "type": "leakSensor",
    "leak": "V9.1",
    "waterLevel": "VW78"
}
```
  
## Example Configuration ##  
  
```json
"platforms": [
        {
            "platform": "LogoPlatform",
            "name": "Logo 6",
            "ip": "10.0.0.100",
            "port": 502,
            "debugMsgLog": 1,
            "updateInterval": 30000,
            "devices": [
                {
                    "name": "Logo 6 - Q1",
                    "type": "switch",
                    "switchGet": "Q1",
                    "switchSetOn": "V1.0",
                    "switchSetOff": "V1.1"
                },
                {
                    "name": "Logo 6 - Q2",
                    "type": "switch",
                    "switchGet": "Q2",
                    "switchSetOn": "V1.2",
                    "switchSetOff": "V1.3"
                },
                {
                    "name": "Logo 6 - Q3",
                    "type": "switch",
                    "switchGet": "Q3",
                    "switchSetOn": "V1.4",
                    "switchSetOff": "V1.5"
                },
                {
                    "name": "Logo 6 - M1",
                    "type": "switch",
                    "switchGet": "M1",
                    "switchSetOn": "V1.6",
                    "switchSetOff": "V1.7"
                },
                {
                    "name": "Logo 6 - Q4",
                    "type": "lightbulb",
                    "lightbulbGet": "Q4",
                    "lightbulbSetOn": "V2.0",
                    "lightbulbSetOff": "V2.1",
                    "lightbulbSetBrightness": "VW20",
                    "lightbulbGetBrightness": "VW22"
                }
            ]
        },
        {
            "platform": "LogoPlatform",
            "name": "Logo 8",
            "ip": "10.0.0.101",
            "port": 502,
            "debugMsgLog": 1,
            "updateInterval": 30000,
            "devices": [
                {
                    "name": "Logo 8 - Q1",
                    "type": "switch",
                    "switchGet": "Q1",
                    "switchSetOn": "V1.0",
                    "switchSetOff": "V1.1"
                },
                {
                    "name": "Logo 8 - Q2",
                    "type": "switch",
                    "switchGet": "Q2",
                    "switchSetOn": "V1.2",
                    "switchSetOff": "V1.3"
                },
                {
                    "name": "Logo 8 - Q3",
                    "type": "switch",
                    "switchGet": "Q3",
                    "switchSetOn": "V1.4",
                    "switchSetOff": "V1.5"
                },
                {
                    "name": "Logo 8 - M1",
                    "type": "switch",
                    "switchGet": "M1",
                    "switchSetOn": "V1.6",
                    "switchSetOff": "V1.7"
                },
                {
                    "name": "Logo 8 - Q4",
                    "type": "lightbulb",
                    "lightbulbGet": "Q4",
                    "lightbulbSetOn": "V2.0",
                    "lightbulbSetOff": "V2.1",
                    "lightbulbSetBrightness": "VW20",
                    "lightbulbGetBrightness": "VW22"
                }
            ]
        }
    ]
```  
  
<!-- markdownlint-disable MD020 MD024 -->
##  ##

__Required: yes* - means that this parameter is only required for this particular accessory!__  
__Required: no* - means if no valid LOGO address is specified for this parameter, this characteristic returns the specified value or is deactivated in the accessory!__  

##  ##
<!-- markdownlint-enable MD020 MD024 -->

## Test Homebridge-Logo-Platform ##

1. Download or clone Homebridge-Logo-Platform.
2. Install: `$ npm install`
3. Build:   `$ npm run build`
4. Run:     `$ /usr/local/bin/homebridge -D -P ~/Homebridge-Logo-Platform/`
