import { API, AccessoryPlugin, Service, Characteristic, StaticPlatformPlugin, Logging, PlatformConfig } from "homebridge";

import { ModBusLogo } from "./modbus-logo";
import { Queue, QueueItem } from "./queue";

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

import { LightSensorPlatformAccessory }       from './sensors/lightSensorPlatformAccessory';
import { MotionSensorPlatformAccessory }      from './sensors/motionSensorPlatformAccessory';
import { ContactSensorPlatformAccessory }     from './sensors/contactSensorPlatformAccessory';
import { SmokeSensorPlatformAccessory }       from './sensors/smokeSensorPlatformAccessory';
import { TemperatureSensorPlatformAccessory } from './sensors/temperatureSensorPlatformAccessory';
import { HumiditySensorPlatformAccessory }    from './sensors/humiditySensorPlatformAccessory';

const pjson = require('../package.json');

export class LogoHomebridgePlatform implements StaticPlatformPlugin {
  
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public logo:  ModBusLogo;
  public queue: Queue;
  public accessoriesArray: any[];
  public manufacturer:     string;
  public model:            string;
  public firmwareRevision: string;

  constructor(
    public readonly log:    Logging,
    public readonly config: PlatformConfig,
    public readonly api:    API,
  ) {
    // this.log.debug('Finished initializing platform:', this.config.name);

    this.logo  = new ModBusLogo(this.config.ip, this.config.port, this.config.debugMsgLog, this.log, (this.config.retryCount + 1));
    this.queue = new Queue();
    this.accessoriesArray = [];
    this.manufacturer     = pjson.author.name;
    this.model            = pjson.model;
    this.firmwareRevision = pjson.version;

    
    if (Array.isArray(this.config.devices)) {

      const configDevices = this.config.devices;

      for (const device of configDevices) {

        if (this.config.debugMsgLog == true) {
          this.log.info('Adding new accessory:', device.name);
        }

        switch (device.type) {
          case "switch":
            this.accessoriesArray.push( new SwitchPlatformAccessory(this.api, this, device) );
            break;
      
          case "lightbulb":
            this.accessoriesArray.push( new LightbulbPlatformAccessory(this.api, this, device) );
            break;

          case "blind":
            this.accessoriesArray.push( new BlindPlatformAccessory(this.api, this, device) );
            break;
          
          case "window":
            this.accessoriesArray.push( new WindowPlatformAccessory(this.api, this, device) );
            break;

          case "garagedoor":
            this.accessoriesArray.push( new GaragedoorPlatformAccessory(this.api, this, device) );
            break;

          case "thermostat":
            this.accessoriesArray.push( new ThermostatPlatformAccessory(this.api, this, device) );
            break;

          case "irrigationSystem":
            this.accessoriesArray.push( new IrrigationSystemPlatformAccessory(this.api, this, device) );
            break;

          case "valve":
            this.accessoriesArray.push( new ValvePlatformAccessory(this.api, this, device) );
            break;

          case "fan":
            this.accessoriesArray.push( new FanPlatformAccessory(this.api, this, device) );
            break;

          case "filterMaintenance":
            this.accessoriesArray.push( new FilterMaintenancePlatformAccessory(this.api, this, device) );
            break;

          case "lightSensor":
            this.accessoriesArray.push( new LightSensorPlatformAccessory(this.api, this, device) );
            break;

          case "motionSensor":
            this.accessoriesArray.push( new MotionSensorPlatformAccessory(this.api, this, device) );
            break;

          case "contactSensor":
            this.accessoriesArray.push( new ContactSensorPlatformAccessory(this.api, this, device) );
            break;

          case "smokeSensor":
            this.accessoriesArray.push( new SmokeSensorPlatformAccessory(this.api, this, device) );
            break;

          case "temperatureSensor":
            this.accessoriesArray.push( new TemperatureSensorPlatformAccessory(this.api, this, device) );
            break;

          case "humiditySensor":
            this.accessoriesArray.push( new HumiditySensorPlatformAccessory(this.api, this, device) );
            break;
        
          default:
            this.accessoriesArray.push( new SwitchPlatformAccessory(this.api, this, device) );
            break;
        }

      }
    }

    setInterval(() => {
      this.sendQueueItems();
    }, 100);

  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(this.accessoriesArray);
  }

  sendQueueItems() {

    if (this.queue.count() > 0) {
      
      const item: QueueItem = this.queue.dequeue();
      if (item.send) {
        this.logo.WriteLogo(item.address, item.value);
      } else {
        this.logo.ReadLogo(item.address, item.callBack);
      }

    }
  }
  
}