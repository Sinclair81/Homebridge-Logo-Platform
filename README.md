<p align="center">
<img src="https://github.com/homebridge/branding/blob/latest/logos/homebridge-wordmark-logo-horizontal.png" width="300">
</p>

# Homebridge Logo Platform #

[![npm version](https://badge.fury.io/js/homebridge-logo-platform.svg)](https://badge.fury.io/js/homebridge-logo-platform)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://img.shields.io/npm/dt/homebridge-logo-platform.svg?label=downloads)](https://www.npmjs.com/package/homebridge-logo-platform)
[![donate](https://img.shields.io/badge/donate-PayPal-blue.svg)](https://www.paypal.me/Sinclair81)

<!-- markdownlint-disable MD033 -->
<img src="https://raw.githubusercontent.com/Sinclair81/Homebridge-Logo-Platform/master/Home.png" align="right" alt="Home" height="463" width="214">
<!-- markdownlint-enable MD033 -->

Use a Siemens LOGO! PLC for switch on whatever you want.  
Communicate with LOGO! over Snap7 or Modbus.  

__Type of Accessory:__

- [Switch](#switch-configuration)  
- [Lightbulb](#lightbulb-configuration)  
- [Blind](#blind-configuration)  
- [Window](#window-configuration)  
- [Garage Door](#garage-door-configuration)  
- [Thermostat](#thermostat-configuration)
- [Irrigation System](#irrigation-system-configuration)
- [Valve](#valve-configuration)
- [Fan](#fan-configuration)
- [Filter Maintenance](#filter-maintenance-configuration)
- [Outlet](#outlet-configuration)  

__Type of Sensor Accessory:__

- [Light Sensor](#light-sensor-configuration)
- [Motion Sensor](#motion-sensor-configuration)
- [Contact Sensor](#contact-sensor-configuration)
- [Smoke Sensor](#smoke-sensor-configuration)
- [Temperature Sensor](#temperature-sensor-configuration)
- [Humidity Sensor](#humidity-sensor-configuration)
- [Carbon Dioxide Sensor](#carbon-dioxide-sensor-configuration)
- [Air Quality Sensor](#air-quality-sensor-configuration)
- [Leak Sensor](#leak-sensor-configuration)

__Special Functions:__

- [Logging to InfluxDB or Eve App](#logging-to-influxdb-or-eve-app)

__Examples:__

- [Main Configuration](#main-configuration)

## Installation ##

1. Install homebridge using instruction from: [Homebridge WiKi](https://github.com/homebridge/homebridge/wiki)
2. Install this plugin in your homebridge
3. Update your configuration file with code like the sample below

## Thanks to ##

- [Tellicious](https://github.com/Tellicious) for Integrated valve as sub-accessory of IrrigationSystem and his Bugfix to avoid memory leak.

## Special thanks to ##  
  
- Davide Nardella for [Snap7](http://snap7.sourceforge.net)  
- Mathias Küsel for [Node-Snap7](https://github.com/mathiask88/node-snap7)  

## Known issues ##  

- The plugin does not work with Node.js v19.x and 20.x (node-snap7)
- The plugin cannot be configured with the Config UI. (The settings are too complex.)  
  
## Platform Main Configuration Parameters ##

Name              | Value                    | Required      | Notes
----------------- | ------------------------ | ------------- | ------------------------
`platform`        | "LogoPlatform"           | yes           | Must be set to "LogoPlatform".
`name`            | (custom)                 | yes           | Name of platform that will not appear in homekit app.
`interface`       | "modbus" or "snap7"      | no            | Interface for communication, default is: "modbus".
`ip`              | "10.0.0.100"             | yes           | Must be set to the IP of your LOGO!.
`port`            | 502                      | no (ModBus)   | Must be set to the Modbus Port of your LOGO!, default is: 502.
`logoType`        | "0BA7" or ...            | no (Snap7)    | Must be set to the [Type of your LOGO](#type-of-your-logo), default is: "0BA7".
`localTSAP`       | "0x1200"                 | no (Snap7)    | Must be set to the local TSAP of your LOGO!, default is: "0x1200".
`remoteTSAP`      | "0x2200"                 | no (Snap7)    | Must be set to the remote TSAP of your LOGO!, default is: "0x2200".
`queueInterval`   | 100 ... 1000             | no            | Interval to send queries from Plugin to LOGO!, in milliseconds, default is: 100.
`queueSize`       | 100 ... 1000             | no            | Number of items to be hold in send/receive queue, default is: 100.
`updateInterval`  | 0 ... ∞                  | no            | Auto Update Interval in milliseconds, 0 = Off
`debugMsgLog`     | 0 or 1                   | no            | Displays messages of all accessories in the log, default is: 0.
`retryCount`      | 0 ... ∞                  | no            | Retry count for sending the queries messages, default is: 5.
`pushButton`      | 0 or 1                   | no            | If e.g. the network input in the LOGO! a hardware button on the LOGO! simulated, default is: 0. (For all Accessories.)
`loggerType`      | "influxDB" or "fakegato" | no            | Activates Logging, default is: "none".  
`loggerInterval`  | 300000                   | no            | Logging Interval in milliseconds, default is: 300000 (5min)
`influxDBUrl`     | "<http://10.0.0.99:8086>"  | no (InfluxDB) | IP-Address and Port for InfluxDB  
`influxDBToken`   | "API Token",             | no (InfluxDB) | InfluxDB API token  
`influxDBOrg`     | "Org",                   | no (InfluxDB) | InfluxDB organization ID  
`influxDBBucket`  | "Bucket",                | no (InfluxDB) | InfluxDB bucket name  

## Device Main Configuration Parameters ##

Name                     | Value               | Required | Notes
------------------------ | ------------------- | -------- | ------------------------
`name`                   | (custom)            | yes      | Name of accessory that will appear in homekit app.
`type`                   | "switch" or ...     | yes      | Type of Accessory: "switch", "lightbulb", "blind", "window", "garagedoor", "thermostat", "irrigationSystem", "valve", "fan", "fanv2", "filterMaintenance", "outlet" or Type of Sensor Accessory: "lightSensor", "motionSensor", "contactSensor", "smokeSensor", "temperatureSensor", "humiditySensor", "carbonDioxideSensor", "airQualitySensor"
`debugMsgLog`            | 0 or 1              | no       | Displays messages of this accessory in the log, default is: 0.
`pushButton`             | 0 or 1              | no       | If e.g. the network input in the LOGO! a hardware button on the LOGO! simulated, default is: 0. (Only for this Accessory.)
`logging`                | 0 or 1              | no       | Activates Logging, default is: 0. (Only for this Accessory.)

```json
"platforms": [
    {
        "platform": "LogoPlatform",
        "name": "Logo 1",
        "ip": "10.0.0.100",
        "port": 505,
        "debugMsgLog": 1,
        "updateInterval": 10000,
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
    },
    {
        "platform": "LogoPlatform",
        "name": "Logo 2",
        "interface": "snap7",
        "ip": "10.0.0.200",
        "logoType": "0BA8",
        "localTSAP": "0x4200",
        "remoteTSAP": "0x4300",
        "debugMsgLog": 1,
        "updateInterval": 10000,
        "devices": [
            {
                "name": "Accessory Name 3",
                "type": "...",
                ...
            },
            {
                "name": "Accessory Name 4",
                "type": "...",
                ...
            }
        ]
    }
]
```  

## Switch Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`switchGet`              | "Q1"                | yes*     | "switch"   | Switch Get - Qn, Mn or Vn.n
`switchSetOn`            | "V1.0"              | yes*     | "switch"   | Switch Set On - Mn or Vn.n
`switchSetOff`           | "V1.1"              | yes*     | "switch"   | Switch Set Off - Mn or Vn.n  

```json
{
    "name": "Q1",
    "type": "switch",
    "switchGet": "Q1",
    "switchSetOn": "V1.0",
    "switchSetOff": "V1.1"
}
```  

## Lightbulb Configuration ##

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
`blindConvertValue`      | 0 or 1              | no*      | "blind"    | Convert LOGO! values in to HomeKit values.
  
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
`windowConvertValue`     | 0 or 1              | no*      | "window"   | Convert LOGO! values in to HomeKit values.
  
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
`garagedoorGetState`       | "VW40" or "M9"      | yes*     | "garagedoor" | Garagedoor Get State - </br>Analog AMn or VWn (0 = Open; 1 = Closed; 2 = Opening; 3 = Closing; 4 = Stopped) </br>Digital Mn or Vn.n (0 = Closed; 1 = Open)  
`garagedoorGetTargetState` | "VW40" or "M9"      | yes*     | "garagedoor" | Garagedoor Get Target State - </br>Analog AMn or VWn (0 = Open; 1 = Closed) </br>Digital Mn or Vn.n (0 = Closed; 1 = Open)  
`garagedoorSetTargetState` | "VW38"              | yes*     | "garagedoor" | Garagedoor Set Target State - AMn or VWn (0 = Open; 1 = Closed)  
`garagedoorObstruction`    | "V3.0"              | no*      | "garagedoor" | Garagedoor Obstruction Detected - Mn, Vn.n  

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
`thermostatGetTemp`          | "VW48"         | yes*     | "thermostat" | Thermostat Get Temperature - AMn or VWn - Current Temperature in °C (-270°C - 100°C!!)
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
`irrigationSystemGetActive`             | "V4.0"    | yes*     | "irrigationSystem" | Irrigation System Get Active - Mn or Vn.n
`irrigationSystemSetActiveOn`           | "V4.1"    | yes*     | "irrigationSystem" | Irrigation System Set Active to On - Mn or Vn.n
`irrigationSystemSetActiveOff`          | "V4.2"    | yes*     | "irrigationSystem" | Irrigation System Set Active to Off - Mn or Vn.n
`irrigationSystemGetProgramMode`        | "VW54"     | yes*    | "irrigationSystem" | Irrigation System Get Program Mode - AMn or VWn - (0 - No Program scheduled; 1 - Program scheduled; 2 - Program scheduled manual Mode)
`irrigationSystemGetInUse`              | "V4.3"    | yes*     | "irrigationSystem" | Irrigation System Get In Use - Mn or Vn.n
`irrigationSystemGetRemainingDuration`  | "VW56"    | no*      | "irrigationSystem" | Irrigation System Get Remaining Duration - AMn or VWn
`irrigationSystemGetWaterLevel`         | "VW58"    | no*      | "irrigationSystem" | Irrigation System Get Water Level % - AMn or VWn
`irrigationSystemAutoUpdate`            | 1         | no*      | "irrigationSystem" | Auto update of Irrigation System based on valves sub-accessories. If set `irrigationSystemGetActive` and `irrigationSystemGetInUse` are not necessary and can remain unset

```json
{
    "name": "Item-10",
    "type": "irrigationSystem",
    "irrigationSystemGetActive": "V4.0",
    "irrigationSystemSetActiveOn": "V4.1",
    "irrigationSystemSetActiveOff": "V4.2",
    "irrigationSystemGetProgramMode": "VW54",
    "irrigationSystemGetInUse": "V4.3",
    "irrigationSystemGetRemainingDuration": "VW56",
    "irrigationSystemGetWaterLevel": "VW58"
}

{
    "name": "Item-10",
    "type": "irrigationSystem",
    "irrigationSystemSetActiveOn": "V4.1",
    "irrigationSystemSetActiveOff": "V4.2",
    "irrigationSystemGetProgramMode": "VW54",
    "irrigationSystemGetRemainingDuration": "VW56",
    "irrigationSystemGetWaterLevel": "VW58",
    "irrigationSystemAutoUpdate": 1
}
```

## Valve Configuration ##

Name                            | Value     | Required | Option for | Notes
------------------------------- | --------- | -------- | ---------- | ------------------------
`valveGetActive`                | "V5.0"    | yes*     | "valve" | Valve Get Active - Mn or Vn.n
`valveSetActiveOn`              | "V5.1"    | yes*     | "valve" | Valve Set Active to On - Mn or Vn.n
`valveSetActiveOff`             | "V5.2"    | yes*     | "valve" | Valve Set Active to Off - Mn or Vn.n
`valveGetInUse`                 | "V5.3"    | yes*     | "valve" | Valve Get In Use - Mn or Vn.n
`valveType`                     | 0         | yes*     | "valve" | Valve Type - Generic Valve = 0, Irrigation = 1, Shower Head = 2, Water Faucet = 3. Defaults to 1 when `valveParentIrrigationSystem` is set  
`valveSetDuration`              | "VW56"    | no*      | "valve" | Valve Set Duration - AMn or VWn - Value in Seconds (0 - 3600 sec)
`valveGetDuration`              | "VW56"    | no*      | "valve" | Valve Get Duration - AMn or VWn - Value in Seconds (0 - 3600 sec)
`valveGetRemainingDuration`     | "VW58"    | no*      | "valve" | Valve Get Remaining Duration - AMn or VWn - Value in Seconds (0 - 3600 sec)
`valveSetIsConfiguredOn`        | "V5.4"    | no*      | "valve" | Valve Set Is Configured / Enabled On - Mn or Vn.n
`valveSetIsConfiguredOff`       | "V5.5"    | no*      | "valve" | Valve Set Is Configured / Enabled Off - Mn or Vn.n
`valveGetIsConfigured`          | "V5.6"    | no*      | "valve" | Valve Get Is Configured / Enabled - Mn or Vn.n
`valveParentIrrigationSystem`   | "Item-10" | no*      | "valve" | Valve parent Irrigation System accessory name, needed to create the valve as a sub-accessory of an Irrigation System
`valveZone`                     | 1         | no*      | "valve" | Valve zone, needed when valve is part of an Irrigation System accessory

- Item-11-A: Valve as child from a Irrigation System (Item-10)
- Item-11-B: Valve without `IsConfigured` characteristic
- Item-11-C: Valve with `IsConfigured` characteristic
- Item-11-D: Valve as minimum without `SetDuration` and `IsConfigured`

```json
{
    "name": "Item-11-A",
    "type": "valve",
    "valveGetActive": "V5.0",
    "valveSetActiveOn": "V5.1",
    "valveSetActiveOff": "V5.2",
    "valveGetInUse": "V5.3",
    "valveType": 1,
    "valveSetDuration": "VW56",
    "valveGetDuration": "VW56",
    "valveGetRemainingDuration": "VW58",
    "valveParentIrrigationSystem": "Item-10",
    "valveZone": 1
}
{
    "name": "Item-11-B",
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
{
    "name": "Item-11-C",
    "type": "valve",
    "valveGetActive": "V5.0",
    "valveSetActiveOn": "V5.1",
    "valveSetActiveOff": "V5.2",
    "valveGetInUse": "V5.3",
    "valveType": 1,
    "valveSetDuration": "VW56",
    "valveGetDuration": "VW56",
    "valveGetRemainingDuration": "VW58",
    "valveSetIsConfiguredOn": "V5.4",
    "valveSetIsConfiguredOff": "V5.5",
    "valveGetIsConfigured": "V5.6"
}
{
    "name": "Item-11-D",
    "type": "valve",
    "valveGetActive": "V5.3",
    "valveSetActiveOn": "V5.1",
    "valveSetActiveOff": "V5.1",
    "valveGetInUse": "V5.3",
    "valveType": 1,
    "pushButton": 0
}
```

## Fan Configuration ##

Name                     | Value             | Required | Option for | Notes
------------------------ | ----------------- | -------- | ---------- | ------------------------
`fanGet`                     | "V6.0"        | yes*     | "fan"      | Fan Get - Mn or Vn.n
`fanSetOn`                   | "V6.1"        | yes*     | "fan"      | Fan Set On - Mn or Vn.n
`fanSetOff`                  | "V6.2"        | yes*     | "fan"      | Fan Set Off - Mn or Vn.n
`fanGetRotationDirection`    | "V6.3"        | no*      | "fan"      | Fan Get Rotation Direction - Mn or Vn.n
`fanSetRotationDirectionCW`  | "V6.4"        | no*      | "fan"      | Fan Set Rotation Direction to Clockwise - Mn or Vn.n
`fanSetRotationDirectionCCW` | "V6.5"        | no*      | "fan"      | Fan Set Rotation Direction to Counter Clockwise - Mn or Vn.n
`fanGetRotationSpeed`        | "VW60"        | no*      | "fan"      | Fan Get Rotation Speed - AMn or VWn
`fanSetRotationSpeed`        | "VW62"        | no*      | "fan"      | Fan Set Rotation Speed - AMn or VWn

```json
{
    "name": "Item-12",
    "type": "fan",
    "fanGet": "V6.0",
    "fanSetOn": "V6.1",
    "fanSetOff": "V6.2",
    "fanGetRotationDirection": "V6.3",
    "fanSetRotationDirectionCW": "V6.4",
    "fanSetRotationDirectionCCW": "V6.5",
    "fanGetRotationSpeed": "VW60",
    "fanSetRotationSpeed": "VW62"
}
```

## Filter Maintenance Configuration ##

__The Home-App only supports this accessory as an additional feature of a dehumidifier, for example.__

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

## Outlet Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`outletGet`              | "Q1"                | yes*     | "outlet"   | Outlet Get - Qn, Mn or Vn.n
`outletSetOn`            | "V1.0"              | yes*     | "outlet"   | Outlet Set On - Mn or Vn.n
`outletSetOff`           | "V1.1"              | yes*     | "outlet"   | Outlet Set Off - Mn or Vn.n  
`outletGetInUse`         | "V1.2"              | yes*     | "outlet"   | Outlet Get In Use - Qn, Mn or Vn.n  

```json
{
    "name": "Q1",
    "type": "outlet",
    "outletGet": "Q1",
    "outletSetOn": "V1.0",
    "outletSetOff": "V1.1"
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

## Motion Sensor Configuration ##

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
`temperature`            | "VW68"              | yes*     | "temperatureSensor"   | Temperature Sensor for Current Temperature in °C (-270°C - 100°C!!)
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
  
## Logging to InfluxDB or Eve App ##

| Type                  | Characteristic             | InfluxDB  | Eve App |
| --------------------- | -------------------------- | --------- | ------- |
| Switch                | On                         | yes       | no      |
| Lightbulb             | On                         | yes       | no      |
| -                     | Brightness                 | yes       | no      |\
| Blind                 | CurrentPosition            | yes       | no      |
| -                     | PositionState              | yes       | no      |
| -                     | TargetPosition             | yes       | no      |
| Window                | CurrentPosition            | yes       | no      |
| ^^                    | PositionState              | yes       | no      |
| ^^                    | TargetPosition             | yes       | no      |
| Garage Door           | CurrentDoorState           | yes       | no      |
| ^^                    | TargetDoorState            | yes       | no      |
| ^^                    | ObstructionDetected        | yes       | no      |
| Thermostat            | CurrentHeatingCoolingState | yes       | no      |
| ^^                    | TargetHeatingCoolingState  | yes       | no      |
| ^^                    | CurrentTemperature         | yes       | no      |
| ^^                    | TargetTemperature          | yes       | no      |
| Irrigation System     | Active                     | yes       | no      |
| ^^                    | ProgramMode                | yes       | no      |
| ^^                    | InUse                      | yes       | no      |
| ^^                    | RemainingDuration          | yes       | no      |
| ^^                    | WaterLevel                 | yes       | no      |
| Valve                 | Active                     | yes       | no      |
| ^^                    | InUse                      | yes       | no      |
| ^^                    | RemainingDuration          | yes       | no      |
| ^^                    | SetDuration                | yes       | no      |
| ^^                    | IsConfigured               | yes       | no      |
| Fan                   | On                         | yes       | no      |
| ^^                    | RotationDirection          | yes       | no      |
| ^^                    | RotationSpeed              | yes       | no      |
| Filter Maintenance    | FilterChangeIndication     | yes       | no      |
| ^^                    | FilterLifeLevel            | yes       | no      |
| ^^                    | ResetFilterIndication      | yes       | no      |
| Outlet                | On                         | yes       | no      |
| ^^                    | InUse                      | yes       | no      |
| Light Sensor          | CurrentAmbientLightLevel   | yes       | no      |
| Motion Sensor         | MotionDetected             | yes       | no      |
| Contact Sensor        | ContactSensorState         | yes       | no      |
| Smoke Sensor          | SmokeDetected              | yes       | no      |
| Temperature Sensor    | CurrentTemperature         | yes       | yes     |
| Humidity Sensor       | CurrentRelativeHumidity    | yes       | no      |
| Carbon Dioxide Sensor | CarbonDioxideDetected      | yes       | no      |
| ^^                    | CarbonDioxideLevel         | yes       | no      |
| ^^                    | CarbonDioxidePeakLevel     | yes       | no      |
| Air Quality Sensor    | AirQuality                 | yes       | no      |
| Leak Sensor           | LeakDetected               | yes       | no      |
| ^^                    | WaterLevel                 | yes       | no      |

## Main Configuration ##  
  
```json
"platforms": [
        {
            "platform": "LogoPlatform",
            "name": "Logo 6",
            "ip": "10.0.0.100",
            "port": 502,
            "debugMsgLog": 1,
            "updateInterval": 30000,
            "loggerType": "influxDB",
            "loggerInterval": 30000,
            "influxDBUrl": "http://10.0.0.99:8086",
            "influxDBToken": "qwertzuiopasdfghjklyxcvbnm1234567890",
            "influxDBOrg": "Org-Name",
            "influxDBBucket": "Bucket-Name",
            "devices": [
                {
                    "name": "Logo 6 - Q1",
                    "type": "switch",
                    "switchGet": "Q1",
                    "switchSetOn": "V1.0",
                    "switchSetOff": "V1.1",
                    "logging": 1
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
                    "switchSetOff": "V1.5",
                    "logging": 1
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
                    "lightbulbGetBrightness": "VW22",
                    "logging": 1
                }
            ]
        },
        {
            "platform": "LogoPlatform",
            "name": "Logo 7",
            "interface": "snap7",
            "ip": "10.0.0.101",
            "logoType": "0BA7",
            "localTSAP": "0x2200",
            "remoteTSAP": "0x2100",
            "updateInterval": 10000,
            "debugMsgLog": 1,
            "retryCount": 5,
            "devices": [
                {
                    "name": "Logo 7 - Q1",
                    "type": "switch",
                    "switchGet": "Q1",
                    "switchSetOn": "V1.0",
                    "switchSetOff": "V1.1"
                },
                {
                    "name": "Logo 7 - Q2",
                    "type": "switch",
                    "switchGet": "Q2",
                    "switchSetOn": "V1.2",
                    "switchSetOff": "V1.3"
                },
                {
                    "name": "Logo 7 - Q3",
                    "type": "switch",
                    "switchGet": "Q3",
                    "switchSetOn": "V1.4",
                    "switchSetOff": "V1.5"
                },
                {
                    "name": "Logo 7 - M1",
                    "type": "switch",
                    "switchGet": "M1",
                    "switchSetOn": "V1.6",
                    "switchSetOff": "V1.7"
                },
                {
                    "name": "Logo 7 - Q4",
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
  
## Type of your LOGO ##

Type     | Snap7 | Webserver | ModBus | Cloud | MemoryLayout | LSC
-------- | ----- | --------- | ------ | ----- | ------------ | ------------------------
`"0BA7"` | yes   | no        | no     | no    | old          | 0BA7.Standard
`"0BA8"` | yes   | yes       | no     | no    | new          | LOGO! 8 (0BA8.Standard)
`"0BA0"` | yes   | yes       | yes    | no    | new          | LOGO! 8.1 & 8.2 (LOGO! 8.FS4)
`"0BA1"` | yes   | yes       | yes    | yes   | new          | LOGO! 8.3

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
