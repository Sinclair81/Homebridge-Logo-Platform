# Homebridge-Logo-Platform #

[![npm version](https://badge.fury.io/js/homebridge-logo-platform.svg)](https://badge.fury.io/js/homebridge-logo-platform)
[![donate](https://img.shields.io/badge/donate-PayPal-blue.svg)](https://www.paypal.me/Sinclair81)

<!-- markdownlint-disable MD033 -->
<img src="https://raw.githubusercontent.com/Sinclair81/Homebridge-Logo-Platform/master/Standardraum.png" align="right" alt="Standardraum" height="448" width="207">
<!-- markdownlint-enable MD033 -->

Use a Siemens LOGO! PLC for switch on whatever you want.  
Communicate with LOGO! 8.SF4 over Modbus.  

__Type of Accessory:__

- [Switch](#switch-accessory-configuration)
- *[Blind](#blind-accessory-configuration)
- *[Window](#window-accessory-configuration)
- *[Garage Door](#garage-door-accessory-configuration)
- *[Lightbulb](#lightbulb-accessory-configuration)
- *[Thermostat](#thermostat-accessory-configuration)
- *[Irrigation System](#irrigation-system-accessory-configuration)
- *[Valve](#valve-accessory-configuration)
- *[Fan](#fan-accessory-configuration)
- *[Fan v2](#fan-v2-accessory-configuration)
- *[Filter Maintenance](#filter-maintenance-accessory-configuration)
- *[Ventilation](#ventilation-accessory-configuration)

__Type of Sensor Accessory:__

- *[Light Sensor](#light-sensor-accessory-configuration)
- *[Motion Sensor](#motion-sensor-accessory-configuration)
- *[Contact Sensor](#contact-sensor-accessory-configuration)
- *[Smoke Sensor](#smoke-sensor-accessory-configuration)
- *[Temperature Sensor](#temperature-sensor-accessory-configuration)
- *[Humidity Sensor](#humidity-sensor-accessory-configuration)
- *[Carbon Dioxide Sensor](#carbon-dioxide-sensor-accessory-configuration)
- *[Air Quality Sensor](#air-quality-sensor-accessory-configuration)

## Installation ##

1. Install homebridge using: `sudo npm install -g --unsafe-perm homebridge`
2. Install homebridge-config-ui-x using: `sudo npm install -g --unsafe-perm homebridge-config-ui-x`
3. Update your configuration file with this guide: [smartapfel.de](https://smartapfel.de/homebridge/plugins-installieren/)
4. Install homebridge-logo-platform using: homebridge-config-ui-x's Webserver (Homebridge must be started with sudo for the installation.)
5. Update your configuration file with code like the sample below

## Known Issues ##

- No Snap7 support!

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
`type`                   | "switch" or ...     | yes      | Type of Accessory: "switch", "blind", "window", "garagedoor", "lightbulb", "thermostat", "irrigationSystem", "valve", "fan", "fanv2", "filterMaintenance", "ventilation" or Type of Sensor Accessory: "lightSensor", "motionSensor", "contactSensor", "smokeSensor", "temperatureSensor", "humiditySensor", "carbonDioxideSensor", "airQualitySensor"

## Switch Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`switchGet`              | "Q1"                | yes*     | "switch"   | Switch Get - Qn, Mn or Vn.n
`switchSetOn`            | "V2.0"              | yes*     | "switch"   | Switch Set On - Mn or Vn.n
`switchSetOff`           | "V3.0"              | yes*     | "switch"   | Switch Set Off - Mn or Vn.n  

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
                "name": "Switch for Q1",
                "type": "switch",
                "switchGet": "Q1",
                "switchSetOn": "V2.0",
                "switchSetOff": "V3.1"
            }
        ]
    }
]
```  

## Blind Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`blindSetPos`            | "VW50"              | yes*     | "blind"    | Blind Set Pos - AMn or VWn - (Analog Control)
`blindGetPos`            | "VW52"              | yes*     | "blind"    | Blind Get Pos - AMn or VWn - (Analog Control)
`blindSetState`          | "VW54"              | yes*     | "blind"    | Blind Get State - AMn or VWn - (Analog Control)
`blindDigital`           | 0                   | no       | "blind"    | 0 for Analog Control, 1 for Button Control
`blindSetUp`             | "V5.0"              | no       | "blind"    | Blind Set Up - Mn or Vn.n - (Button Control)
`blindSetDown`           | "V5.1"              | no       | "blind"    | Blind Set Down - Mn or Vn.n - (Button Control)
`blindGetUpDown`         | "V5.2"              | no       | "blind"    | Blind Up or Down - Mn or Vn.n - Return 1 for Up or 0 for Down - (Button Control)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Blind ModBus Analog",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "blind",
            "blindSetPos": "VW50",
            "blindGetPos": "VW52",
            "blindGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Blind Snap7 Analog",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "blind",
            "blindSetPos": "VW50",
            "blindGetPos": "VW52",
            "blindGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Blind ModBus Digital",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "blind",
            "blindDigital": 1,
            "blindSetUp": "V5.0",
            "blindSetDown": "V5.1",
            "blindGetUpDown": "V5.2"
        },
        {
            "accessory": "Logo-TS",
            "name": "Blind Snap7 Digital",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "blind",
            "blindDigital": 1,
            "blindSetUp": "V5.0",
            "blindSetDown": "V5.1",
            "blindGetUpDown": "V5.2"
        }
    ]
```

## Window Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`windowSetPos`           | "VW50"              | yes*     | "window"   | Window Set Pos - AMn or VWn - (Analog Control)
`windowGetPos`           | "VW52"              | yes*     | "window"   | Window Get Pos - AMn or VWn - (Analog Control)
`windowSetState`         | "VW54"              | yes*     | "window"   | Window Get State - AMn or VWn - (Analog Control)
`windowDigital`          | 0                   | no       | "window"   | 0 for Analog Control, 1 for Button Control
`windowSetUp`            | "V5.0"              | no       | "window"   | Window Set Up - Mn or Vn.n - (Button Control)
`windowSetDown`          | "V5.1"              | no       | "window"   | Window Set Down - Mn or Vn.n - (Button Control)
`windowGetUpDown`        | "V5.2"              | no       | "window"   | Window Up or Down - Return 1 for Up or 0 for Down - (Button Control)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Window ModBus Analog",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "window",
            "windowSetPos": "VW50",
            "windowGetPos": "VW52",
            "windowGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Window Snap7 Analog",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "window",
            "windowSetPos": "VW50",
            "windowGetPos": "VW52",
            "windowGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Window ModBus Digital",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "window",
            "windowDigital": 1,
            "windowSetUp": "V5.0",
            "windowSetDown": "V5.1",
            "windowGetUpDown": "V5.2"
        },
        {
            "accessory": "Logo-TS",
            "name": "Window Snap7 Digital",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "window",
            "windowDigital": 1,
            "windowSetUp": "V5.0",
            "windowSetDown": "V5.1",
            "windowGetUpDown": "V5.2"
        }
    ]
```

## Garage Door Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`garagedoorOpen`         | "V401.0"            | yes*     | "garagedoor" | Garagedoor Open - Mn or Vn.n
`garagedoorClose`        | "V401.1"            | yes*     | "garagedoor" | Garagedoor Close - Mn or Vn.n
`garagedoorState`        | "V401.2"            | yes*     | "garagedoor" | Garagedoor State - Mn or Vn.n
`garagedoorObstruction`  | "false"             | no*      | "garagedoor" | Garagedoor Obstruction Detected - `"false"` or a valid LOGO! Address (Mn or Vn.n)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "GarageDoor ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 120000,
            "type": "garagedoor",
            "garagedoorOpen": "V401.0",
            "garagedoorClose": "V401.1",
            "garagedoorState": "V401.2",
            "garagedoorObstruction": "false"
        },
        {
            "accessory": "Logo-TS",
            "name": "GarageDoor Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "updateInterval": 120000,
            "type": "garagedoor",
            "garagedoorOpen": "V401.0",
            "garagedoorClose": "V401.1",
            "garagedoorState": "V401.2",
            "garagedoorObstruction": "false"
        }
    ]
```

## Lightbulb Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`lightbulbSetOn`         | "V7.0"              | yes*     | "lightbulb" | Lightbulb Set On - Mn or Vn.n
`lightbulbSetOff`        | "V7.1"              | yes*     | "lightbulb" | Lightbulb Set Off - Mn or Vn.n
`lightbulbSetBrightness` | "VW70"              | yes*     | "lightbulb" | Lightbulb Set Brightness - AMn or VWn
`lightbulbGetBrightness` | "VW72"              | yes*     | "lightbulb" | Lightbulb Get Brightness - AMn or VWn

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Lightbulb ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "lightbulb",
            "lightbulbSetOn": "V7.0",
            "lightbulbSetOff": "V7.1",
            "lightbulbSetBrightness": "VW70",
            "lightbulbGetBrightness": "VW72"
        },
        {
            "accessory": "Logo-TS",
            "name": "Lightbulb Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "lightbulb",
            "lightbulbSetOn": "V7.0",
            "lightbulbSetOff": "V7.1",
            "lightbulbSetBrightness": "VW70",
            "lightbulbGetBrightness": "VW72"
        }
    ]
```

## Thermostat Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`thermostatGetHCState`   | "VW210"             | yes*     | "thermostat" | Thermostat Get Heating Cooling State - AMn or VWn
`thermostatSetHCState`   | "VW200"             | yes*     | "thermostat" | Thermostat Set Heating Cooling State - AMn or VWn
`thermostatGetTemp`      | "VW212"             | yes*     | "thermostat" | Thermostat Get Temperature - AMn or VWn - Current Temperature in °C (0°C - 100°C!!, a value of 105 is 10.5°C)
`thermostatGetTargetTemp`    | "VW214"         | yes*     | "thermostat" | Thermostat Get Target Temperature - AMn or VWn - Current Temperature in °C (10°C - 38°C!!, a value of 105 is 10.5°C)
`thermostatSetTargetTemp`    | "VW202"         | yes*     | "thermostat" | Thermostat Set Target Temperature - AMn or VWn
`thermostatTempDisplayUnits` | 0               | yes*     | "thermostat" | Temperature Display Units - Celsius = 0; Fahrenheit = 1;

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Thermostat ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "thermostat",
            "thermostatGetHCState": "VW210",
            "thermostatSetHCState": "VW200",
            "thermostatGetTemp": "VW212",
            "thermostatGetTargetTemp": "VW214",
            "thermostatSetTargetTemp": "VW202",
            "thermostatTempDisplayUnits": 0
        },
        {
            "accessory": "Logo-TS",
            "name": "Thermostat Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "thermostat",
            "thermostatGetHCState": "VW210",
            "thermostatSetHCState": "VW200",
            "thermostatGetTemp": "VW212",
            "thermostatGetTargetTemp": "VW214",
            "thermostatSetTargetTemp": "VW202",
            "thermostatTempDisplayUnits": 0
        }
    ]
```

## Irrigation System Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`irrigationSystemGetActive`      | "V400.0"    | yes*     | "irrigationSystem" | Irrigation System Get Active - Mn or Vn.n
`irrigationSystemSetActiveOn`    | "V400.1"    | yes*     | "irrigationSystem" | Irrigation System Set Active to On - Mn or Vn.n
`irrigationSystemSetActiveOff`   | "V400.2"    | yes*     | "irrigationSystem" | Irrigation System Set Active to Off - Mn or Vn.n
`irrigationSystemGetProgramMode` | "VW402"     | yes*     | "irrigationSystem" | Irrigation System Get Program Mode - AMn or VWn - (0 - No Program scheduled; 1 - Program scheduled; 2 - Program scheduled manual Mode)
`irrigationSystemGetInUse`       | "V400.3"    | yes*     | "irrigationSystem" | Irrigation System Get In Use - Mn or Vn.n

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Irrigation System ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "irrigationSystem",
            "irrigationSystemGetActive": "V400.0",
            "irrigationSystemSetActiveOn": "V400.1",
            "irrigationSystemSetActiveOff": "V400.2",
            "irrigationSystemGetProgramMode": "VW402",
            "irrigationSystemGetInUse": "V400.3"
        },
        {
            "accessory": "Logo-TS",
            "name": "Irrigation System Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "irrigationSystem",
            "irrigationSystemGetActive": "V400.0",
            "irrigationSystemSetActiveOn": "V400.1",
            "irrigationSystemSetActiveOff": "V400.2",
            "irrigationSystemGetProgramMode": "VW402",
            "irrigationSystemGetInUse": "V400.3"
        }
    ]
```

## Valve Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`valveGetActive`         | "V400.0"    | yes*     | "valve" | Valve Get Active - Mn or Vn.n
`valveSetActiveOn`       | "V400.1"    | yes*     | "valve" | Valve Set Active to On - Mn or Vn.n
`valveSetActiveOff`      | "V400.2"    | yes*     | "valve" | Valve Set Active to Off - Mn or Vn.n
`valveGetInUse`          | "V400.3"    | yes*     | "valve" | Valve Get In Use - Mn or Vn.n
`valveType`              | 0           | yes*     | "valve" | Valve Type - Generic Valve = 0, Irrigation = 1, Shower Head = 2, Water Faucet = 3,
`valveSetDuration`       | "0"         | no*      | "valve" | Valve Set Duration - `"0"` or a valid LOGO! Address (AMn or VWn) - Value in Seconds (0 - 3600 sec)
`valveGetDuration`       | "0"         | no*      | "valve" | Valve Get Remaining Duration - `"0"` or a valid LOGO! Address (AMn or VWn) - Value in Seconds (0 - 3600 sec)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Valve ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "valve",
            "valveGetActive": "V400.0",
            "valveSetActiveOn": "V400.1",
            "valveSetActiveOff": "V400.2",
            "valveGetInUse": "V400.3",
            "valveType": 1,
            "valveSetDuration": "0",
            "valveGetDuration": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Valve Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "valve",
            "valveGetActive": "V400.0",
            "valveSetActiveOn": "V400.1",
            "valveSetActiveOff": "V400.2",
            "valveGetInUse": "V400.3",
            "valveType": 1,
            "valveSetDuration": "0",
            "valveGetDuration": "0"
        }
    ]
```

## Fan Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`fanGetOn`                   | "V130.0"        | yes*     | "fan"      | Fan Get On - Mn or Vn.n
`fanSetOn`                   | "V130.1"        | yes*     | "fan"      | Fan Set On to On - Mn or Vn.n
`fanSetOff`                  | "V130.2"        | yes*     | "fan"      | Fan Set On to Off - Mn or Vn.n
`fanGetRotationDirection`    | "0"             | no*      | "fan"      | Fan Get Rotation Direction - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanSetRotationDirectionCW`  | "0"             | no*      | "fan"      | Fan Set Rotation Direction to Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanSetRotationDirectionCCW` | "0"             | no*      | "fan"      | Fan Set Rotation Direction to Counter Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanGetRotationSpeed`        | "0"             | no*      | "fan"      | Fan Get Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)
`fanSetRotationSpeed`        | "0"             | no*      | "fan"      | Fan Set Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Fan ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "fan",
            "fanGetOn": "V130.0",
            "fanSetOn": "V130.1",
            "fanSetOff": "V130.2",
            "fanGetRotationDirection": "0",
            "fanSetRotationDirectionCW": "0",
            "fanSetRotationDirectionCCW": "0",
            "fanGetRotationSpeed": "0",
            "fanSetRotationSpeed": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Fan Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "fan",
            "fanGetOn": "V130.0",
            "fanSetOn": "V130.1",
            "fanSetOff": "V130.2",
            "fanGetRotationDirection": "0",
            "fanSetRotationDirectionCW": "0",
            "fanSetRotationDirectionCCW": "0",
            "fanGetRotationSpeed": "0",
            "fanSetRotationSpeed": "0"
        }
    ]
```

## Fan v2 Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`fanv2GetActive`               | "V130.0"        | yes*     | "fanv2"      | Fan v2 Get Active - Mn or Vn.n
`fanv2SetActiveOn`             | "V130.1"        | yes*     | "fanv2"      | Fan v2 Set Active to On - Mn or Vn.n
`fanv2SetActiveOff`            | "V130.2"        | yes*     | "fanv2"      | Fan v2 Set Active to Off - Mn or Vn.n
`fanv2GetCurrentFanState`      | "0"             | no*      | "fanv2"      | Fan v2 Get Current Fan State (0 = Inactive, 1 = Idle, 2 = Blowing Air) - `"0"` or a valid LOGO! Address (AMn or VWn)
`fanv2SetTargetFanStateAuto`   | "0"             | no*      | "fanv2"      | Fan v2 Set Target Fan State to Auto - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2SetTargetFanStateManual` | "0"             | no*      | "fanv2"      | Fan v2 Set Target Fan State to Manual - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2GetRotationDirection`    | "0"             | no*      | "fanv2"      | Fan v2 Get Rotation Direction - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2SetRotationDirectionCW`  | "0"             | no*      | "fanv2"      | Fan v2 Set Rotation Direction to Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2SetRotationDirectionCCW` | "0"             | no*      | "fanv2"      | Fan v2 Set Rotation Direction to Counter Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2GetRotationSpeed`        | "0"             | no*      | "fanv2"      | Fan v2 Get Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)
`fanv2SetRotationSpeed`        | "0"             | no*      | "fanv2"      | Fan v2 Set Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Fan v2 ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "fanv2",
            "fanv2GetActive": "V130.0",
            "fanv2SetActiveOn": "V130.1",
            "fanv2SetActiveOff": "V130.2",
            "fanv2GetCurrentFanState": "0",
            "fanv2SetTargetFanStateAuto": "0",
            "fanv2SetTargetFanStateManual": "0",
            "fanv2GetRotationDirection": "0",
            "fanv2SetRotationDirectionCW": "0",
            "fanv2SetRotationDirectionCCW": "0",
            "fanv2GetRotationSpeed": "0",
            "fanv2SetRotationSpeed": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Fan v2 Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "fanv2",
            "fanv2GetActive": "V130.0",
            "fanv2SetActiveOn": "V130.1",
            "fanv2SetActiveOff": "V130.2",
            "fanv2GetCurrentFanState": "0",
            "fanv2SetTargetFanStateAuto": "0",
            "fanv2SetTargetFanStateManual": "0",
            "fanv2GetRotationDirection": "0",
            "fanv2SetRotationDirectionCW": "0",
            "fanv2SetRotationDirectionCCW": "0",
            "fanv2GetRotationSpeed": "0",
            "fanv2SetRotationSpeed": "0"
        }
    ]
```

## Filter Maintenance Accessory Configuration ##

__:construction: In HomeKit Accessory Protocol Specification available but currently not supported by the Home-App!__

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`filterChangeIndication`      | "V120.0"       | yes*     | "filterMaintenance" | Filter Maintenance Get Filter Change Indication - Mn or Vn.n
`filterLifeLevel`             | "0"            | no*      | "filterMaintenance" | Filter Maintenance Get Filter Life Level - `"0"` or a valid LOGO! Address (AMn or VWn)
`filterResetFilterIndication` | "0"            | no*      | "filterMaintenance" | Filter Maintenance Set Reset Filter Indication - `"0"` or a valid LOGO! Address (Mn or Vn.n)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Filter Maintenance ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "filterMaintenance",
            "filterChangeIndication": "V120.0",
            "filterLifeLevel": "0",
            "filterResetFilterIndication": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Filter Maintenance Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "filterMaintenance",
            "filterChangeIndication": "V120.0",
            "filterLifeLevel": "0",
            "filterResetFilterIndication": "0"
        }
    ]
```

## Ventilation Accessory Configuration ##

__:zap: Fan Accessory + Filter Maintenance Accessory__  
__:sunglasses: Not in HomeKit Accessory Protocol Specification available but supported by the Home-App!__  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`ventilationGetOn`                   | "V130.0"        | yes*     | "ventilation"      | Ventilation Get On - Mn or Vn.n
`ventilationSetOn`                   | "V130.1"        | yes*     | "ventilation"      | Ventilation Set On to On - Mn or Vn.n
`ventilationSetOff`                  | "V130.2"        | yes*     | "ventilation"      | Ventilation Set On to Off - Mn or Vn.n
`ventilationGetRotationDirection`    | "0"             | no*      | "ventilation"      | Ventilation Get Rotation Direction - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`ventilationSetRotationDirectionCW`  | "0"             | no*      | "ventilation"      | Ventilation Set Rotation Direction to Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`ventilationSetRotationDirectionCCW` | "0"             | no*      | "ventilation"      | Ventilation Set Rotation Direction to Counter Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`ventilationGetRotationSpeed`        | "0"             | no*      | "ventilation"      | Ventilation Get Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)
`ventilationSetRotationSpeed`        | "0"             | no*      | "ventilation"      | Ventilation Set Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)
`ventilationGetFilterChangeIndication` | "V120.0"      | yes*     | "ventilation"      | Ventilation Get Filter Change Indication - Mn or Vn.n
`ventilationGetFilterLifeLevel`        | "0"           | no*      | "ventilation"      | Ventilation Get Filter Life Level - `"0"` or a valid LOGO! Address (AMn or VWn)
`ventilationSetResetFilterIndication`  | "0"           | no*      | "ventilation"      | Ventilation Set Reset Filter Indication - `"0"` or a valid LOGO! Address (Mn or Vn.n)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Ventilation ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "ventilation",
            "ventilationGetOn": "V130.0",
            "ventilationSetOn": "V130.1",
            "ventilationSetOff": "V130.2",
            "ventilationGetRotationDirection": "0",
            "ventilationSetRotationDirectionCW": "0",
            "ventilationSetRotationDirectionCCW": "0",
            "ventilationGetRotationSpeed": "0",
            "ventilationSetRotationSpeed": "0",
            "ventilationGetFilterChangeIndication": "V120.0",
            "ventilationGetFilterLifeLevel": "0",
            "ventilationSetResetFilterIndication": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Ventilation Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "ventilation",
            "ventilationGetOn": "V130.0",
            "ventilationSetOn": "V130.1",
            "ventilationSetOff": "V130.2",
            "ventilationGetRotationDirection": "0",
            "ventilationSetRotationDirectionCW": "0",
            "ventilationSetRotationDirectionCCW": "0",
            "ventilationGetRotationSpeed": "0",
            "ventilationSetRotationSpeed": "0",
            "ventilationGetFilterChangeIndication": "V120.0",
            "ventilationGetFilterLifeLevel": "0",
            "ventilationSetResetFilterIndication": "0"
        }
    ]
```

## Light Sensor Accessory Configuration ##

Name                     | Value      | Required | Option for | Notes
------------------------ | ---------- | -------- | ---------- | ------------------------
`lightLevel`             | "AM3"      | yes*     | "lightSensor" | Light Sensor for Current Ambient Light Level in Lux
`lightAsLux`             | 0          | no       | "lightSensor" | Light Level As Lux, `1` for calculat level from `lightAsLuxIn...` and `lightAsLuxOut...`
`lightLDRLevel`          | 0          | no       | "lightSensor" | Light Level As LDR Level, `1` for calculat level from `lightLDRLevelParts`
`lightAsLuxInMin`        | 0          | no       | "lightSensor" | Min Light Sensor Level from LOGO!
`lightAsLuxInMax`        | 1000       | no       | "lightSensor" | Max Light Sensor Level from LOGO!
`lightAsLuxOutMin`       | 0          | no       | "lightSensor" | Min Lux Level to display
`lightAsLuxOutMax`       | 65535      | no       | "lightSensor" | Max Lux Level to display
`lightLDRLevelParts`     | 3          | no       | "lightSensor" | Indicates how many formula parts the lux value is calculated. [1, 2, 3] [more information about the light sensor](src/util/accessories/LightSensor/LightSensor.md)
  
If `lightAsLux` is `0` and `lightLDRLevel` is `0` than this Light Sensor Accessory simply shows the value of the LOGO!

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Light Sensor (directly)",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "lightSensor",
            "lightLevel": "AM3"
        },
        {
            "accessory": "Logo-TS",
            "name": "Light Sensor (0-10V lux sensor)",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "lightSensor",
            "lightLevel": "AM3",
            "lightAsLux": 1
        },
        {
            "accessory": "Logo-TS",
            "name": "Light Sensor (0-10V LDR sensor)",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "lightSensor",
            "lightLevel": "AM3",
            "lightLDRLevel": 1
        }
    ]
```

## Motion Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`motionDetected`         | "M9"                | yes*     | "motionSensor"        | Motion Sensor

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Motion Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "motionSensor",
            "motionDetected": "M9"
        }
    ]
```

## Contact Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`contactDetected`        | "M15"               | yes*     | "contactSensor"       | Contact Sensor

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Contact Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "contactSensor",
            "contactDetected": "M15"
        }
    ]
```

## Smoke Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`smokeDetected`          | "M12"               | yes*     | "smokeSensor"         | Smoke Sensor

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Smoke Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "smokeSensor",
            "smokeDetected": "M12"
        }
    ]
```

## Temperature Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`temperature`            | "AM2"               | yes*     | "temperatureSensor"   | Temperature Sensor for Current Temperature in °C (0°C - 100°C!!, a value of 105 is 10.5°C)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Temperature Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "temperatureSensor",
            "temperature": "AM2"
        }
    ]
```

## Humidity Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`humidity`               | "AM1"               | yes*     | "humiditySensor"      | Humidity Sensor for Current Relative Humidity in %

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Humidity Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "humiditySensor",
            "humidity": "AM1"
        }
    ]
```

## Carbon Dioxide Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`carbonDioxideLevel`     | "AM3"               | yes*     | "carbonDioxideSensor" | Carbon Dioxide Sensor for Carbon Dioxide Level in ppm
`carbonDioxideLimit`     | 1000                | yes*     | "carbonDioxideSensor" | Carbon Dioxide Sensor for Carbon Dioxide Peak Level in ppm

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Carbon Dioxide Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "carbonDioxideSensor",
            "carbonDioxideLevel": "AM3",
            "carbonDioxideLimit": 1000
        }
    ]
```

## Air Quality Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`carbonDioxideLevel`     | "AM3"               | yes*     | "airQualitySensor"    | Air Quality Sensor for Air Quality (Carbon Dioxide Level in ppm)

```json
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Air Quality Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "type": "airQualitySensor",
            "carbonDioxideLevel": "AM3"
        }
    ]
```

<!-- markdownlint-disable MD020 MD024 -->
##  ##

__Required: yes* - means that this parameter is only required for this particular accessory!__  
__Required: no* - means if no valid LOGO address is specified for this parameter, this characteristic returns the specified value or is deactivated in the accessory!__  

##  ##
<!-- markdownlint-enable MD020 MD024 -->

The plugin that this one is based on: [homebridge-tesla](https://github.com/nfarina/homebridge-tesla).  
You can also view the [full list of supported HomeKit Services and Characteristics in the HAP-NodeJS protocol repository](https://github.com/KhaosT/HAP-NodeJS/blob/master/src/lib/gen/HomeKit.ts).  

## Test Homebridge-Logo-TS ##

1. Download or clone Homebridge-Logo-TS.
2. Install: `$ npm install`
3. Build:   `$ npm run build`
4. Run:     `$ /usr/local/bin/homebridge -D -P ~/Homebridge-Logo-TS/`
