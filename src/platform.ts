import { API, AccessoryPlugin, Service, Characteristic, StaticPlatformPlugin, Logging, PlatformConfig } from "homebridge";

import { ModBusLogo } from "./modbus-logo";
import { Queue, QueueItem } from "./queue";

import { SwitchPlatformAccessory }     from './accessories/switchPlatformAccessory';
import { LightbulbPlatformAccessory }  from './accessories/lightbulbPlatformAccessory';
import { BlindPlatformAccessory }      from './accessories/blindPlatformAccessory';
import { WindowPlatformAccessory }     from './accessories/windowPlatformAccessory';
import { GaragedoorPlatformAccessory } from './accessories/garagedoorPlatformAccessory';
import { ThermostatPlatformAccessory } from './accessories/thermostatPlatformAccessory';

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