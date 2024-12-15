import { AccessoryPlugin, API, StaticPlatformPlugin } from 'homebridge';

import { SwitchPlatformAccessory }            from './accessories/switchPlatformAccessory';
import { LightbulbPlatformAccessory }         from './accessories/lightbulbPlatformAccessory';
import { BlindPlatformAccessory }             from './accessories/blindPlatformAccessory';
import { WindowPlatformAccessory }            from './accessories/windowPlatformAccessory';
import { GaragedoorPlatformAccessory }        from './accessories/garagedoorPlatformAccessory';
import { ThermostatPlatformAccessory }        from './accessories/thermostatPlatformAccessory';
import { IrrigationSystemPlatformAccessory }  from './accessories/irrigationSystemPlatformAccessory';
import { ValvePlatformAccessory }             from './accessories/valvePlatformAccessory';
import { FanPlatformAccessory }               from './accessories/fanPlatformAccessory';
import { FilterMaintenancePlatformAccessory } from './accessories/filterMaintenancePlatformAccessory';
import { OutletPlatformAccessory }            from './accessories/outletPlatformAccessory';
import { OtherPlatformAccessory }             from './accessories/otherPlatformAccessory';

import { LightSensorPlatformAccessory }         from './sensors/lightSensorPlatformAccessory';
import { MotionSensorPlatformAccessory }        from './sensors/motionSensorPlatformAccessory';
import { ContactSensorPlatformAccessory }       from './sensors/contactSensorPlatformAccessory';
import { SmokeSensorPlatformAccessory }         from './sensors/smokeSensorPlatformAccessory';
import { TemperatureSensorPlatformAccessory }   from './sensors/temperatureSensorPlatformAccessory';
import { HumiditySensorPlatformAccessory }      from './sensors/humiditySensorPlatformAccessory';
import { CarbonDioxideSensorPlatformAccessory } from './sensors/carbonDioxideSensorPlatformAccessory';
import { AirQualitySensorPlatformAccessory }    from './sensors/airQualitySensorPlatformAccessory';
import { LeakSensorPlatformAccessory }          from './sensors/leakSensorPlatformAccessory';
import { WatchdogPlatformAccessory }            from './sensors/watchdogPlatformAccessory';

export class LogoType {
  static T_0BA7: string = "0BA7";
  static T_0BA8: string = "0BA8";
  static T_0BA0: string = "0BA0";
  static T_0BA1: string = "0BA1"; 
}
export class LogoInterface {
  static Modbus: string = "modbus";
  static Snap7: string  = "snap7";
}

export class LogoDefault {
  static Port: number          = 502;
  static LocalTSAP: number     = 0x1200;
  static RemoteTSAP: number    = 0x2200;
  static DebugMsgLog: number   = 0;
  static RetryCount: number    = 5;
  static QueueInterval: number = 100;
  static QueueSize: number     = 100;
  static QueueMinSize: number  = 0;
}

export class Accessory {
  static Switch: string              = "switch";
  static Lightbulb: string           = "lightbulb";
  static Blind: string               = "blind";
  static Window: string              = "window";
  static Garagedoor: string          = "garagedoor";
  static Thermostat: string          = "thermostat";
  static IrrigationSystem: string    = "irrigationSystem";
  static Valve: string               = "valve";
  static Fan: string                 = "fan";
  static FilterMaintenance: string   = "filterMaintenance";
  static Outlet: string              = "outlet";
  static Other: string               = "other";
  static LightSensor: string         = "lightSensor";
  static MotionSensor: string        = "motionSensor";
  static ContactSensor: string       = "contactSensor";
  static SmokeSensor: string         = "smokeSensor";
  static TemperatureSensor: string   = "temperatureSensor";
  static HumiditySensor: string      = "humiditySensor";
  static CarbonDioxideSensor: string = "carbonDioxideSensor";
  static AirQualitySensor: string    = "airQualitySensor";
  static LeakSensor: string          = "leakSensor";
  static Watchdog: string            = "watchdog";
}

export class SubAccessory {

  api:      API;
  platform: StaticPlatformPlugin;

  constructor (api: API, platform: StaticPlatformPlugin) {

    this.api      = api;
    this.platform = platform;

  }

  getNewAccessory(device:any, parent: any): SwitchPlatformAccessory | LightbulbPlatformAccessory | BlindPlatformAccessory | 
                                WindowPlatformAccessory | GaragedoorPlatformAccessory | ThermostatPlatformAccessory | 
                                IrrigationSystemPlatformAccessory | ValvePlatformAccessory | FanPlatformAccessory | 
                                FilterMaintenancePlatformAccessory | OutletPlatformAccessory | OtherPlatformAccessory | 
                                LightSensorPlatformAccessory | MotionSensorPlatformAccessory | ContactSensorPlatformAccessory | 
                                SmokeSensorPlatformAccessory | TemperatureSensorPlatformAccessory | HumiditySensorPlatformAccessory | 
                                CarbonDioxideSensorPlatformAccessory | AirQualitySensorPlatformAccessory | LeakSensorPlatformAccessory | 
                                AccessoryPlugin | WatchdogPlatformAccessory | undefined {

    switch (device.type) {
      case Accessory.Switch:
        return new SwitchPlatformAccessory(this.api, this.platform, device, parent);
        break;
  
      case Accessory.Lightbulb:
        return new LightbulbPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Blind:
        return new BlindPlatformAccessory(this.api, this.platform, device);
        break;
      
      case Accessory.Window:
        return new WindowPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Garagedoor:
        return new GaragedoorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Thermostat:
        return new ThermostatPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.IrrigationSystem:
        return new IrrigationSystemPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Valve:
        if (!(device.valveParentIrrigationSystem)){
          return new ValvePlatformAccessory(this.api, this.platform, device, parent);
        }
        break;

      case Accessory.Fan:
        return new FanPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.FilterMaintenance:
        return new FilterMaintenancePlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Outlet:
        return new OutletPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Other:
        return new OtherPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.LightSensor:
        return new LightSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.MotionSensor:
        return new MotionSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.ContactSensor:
        return new ContactSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.SmokeSensor:
        return new SmokeSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.TemperatureSensor:
        return new TemperatureSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.HumiditySensor:
        return new HumiditySensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.CarbonDioxideSensor:
        return new CarbonDioxideSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.AirQualitySensor:
        return new AirQualitySensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.LeakSensor:
        return new LeakSensorPlatformAccessory(this.api, this.platform, device);
        break;

      case Accessory.Watchdog:
        return new WatchdogPlatformAccessory(this.api, this.platform, device);
        break;
    
    }

  }

}