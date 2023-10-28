import { API, AccessoryPlugin, Service, Characteristic, StaticPlatformPlugin, Logging, PlatformConfig } from "homebridge";

import { ModBusLogo } from "./modbus-logo";
import { Snap7Logo }  from "./snap7-logo";
import { Queue, QueueSendItem, QueueReceiveItem } from "./queue";

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

import { LightSensorPlatformAccessory }         from './sensors/lightSensorPlatformAccessory';
import { MotionSensorPlatformAccessory }        from './sensors/motionSensorPlatformAccessory';
import { ContactSensorPlatformAccessory }       from './sensors/contactSensorPlatformAccessory';
import { SmokeSensorPlatformAccessory }         from './sensors/smokeSensorPlatformAccessory';
import { TemperatureSensorPlatformAccessory }   from './sensors/temperatureSensorPlatformAccessory';
import { HumiditySensorPlatformAccessory }      from './sensors/humiditySensorPlatformAccessory';
import { CarbonDioxideSensorPlatformAccessory } from './sensors/carbonDioxideSensorPlatformAccessory';
import { AirQualitySensorPlatformAccessory }    from './sensors/airQualitySensorPlatformAccessory';
import { LeakSensorPlatformAccessory }          from './sensors/leakSensorPlatformAccessory';

const pjson = require('../package.json');

const modbusInterface: string = "modbus";
const snap7Interface: string  = "snap7";
const logoType0BA7: string    = "0BA7";
const logoType0BA8: string    = "0BA8";
const logoType0BA0: string    = "0BA0";
const logoType0BA1: string    = "0BA1";

export class LogoHomebridgePlatform_MB_S7 implements StaticPlatformPlugin {
  
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public FakeGatoHistoryService: any;
  
  public logo:  any;

  public ip: string;
  public interface: string;
  public port: number;
  public logoType: string;
  public local_TSAP: number;
  public remote_TSAP: number;
  public debugMsgLog: number;
  public retryCount: number;

  public queue: Queue;
  public queueInterval: number;
  public queueSize: number;
  public queueMinSize: number;
  public updateTimer: any;
  public accessoriesArray: any[];
  public manufacturer:     string;
  public model:            string;
  public firmwareRevision: string;
  public pushButton:       number;

  constructor(
    public readonly log:    Logging,
    public readonly config: PlatformConfig,
    public readonly api:    API,
  ) {
    // this.log.debug('Finished initializing platform:', this.config.name);

    this.ip            =           this.config.ip;
    this.interface     =           this.config.interface        || modbusInterface;
    this.port          =           this.config.port             || 502;
    this.logoType      =           this.config.logoType         || logoType0BA7;
    this.local_TSAP    = parseInt( this.config.localTSAP,  16 ) || 0x1200;
    this.remote_TSAP   = parseInt( this.config.remoteTSAP, 16 ) || 0x2200;
    this.debugMsgLog   =           this.config.debugMsgLog      || 0;
    this.retryCount    =           this.config.retryCount       || 0;
    this.queueInterval =           this.config.queueInterval    || 100;
    this.queueSize     =           this.config.queueSize        || 100;
    this.queueMinSize  =           0;

    if (this.interface == modbusInterface) {
      this.logo = new ModBusLogo(this.ip, this.port, this.debugMsgLog, this.log, (this.retryCount + 1));
    } else {
      this.logo = new Snap7Logo(this.logoType, this.ip, this.local_TSAP, this.remote_TSAP, this.debugMsgLog, this.log, (this.retryCount + 1));
    }

    this.queue            = new Queue(this.queueSize);
    this.accessoriesArray = [];
    this.manufacturer     = pjson.author.name;
    this.model            = pjson.model;
    this.firmwareRevision = pjson.version;
    this.pushButton       = (this.config.pushButton ? 1 : 0);

    this.FakeGatoHistoryService = require('fakegato-history')(this.api);
    
    if (Array.isArray(this.config.devices)) {

      const configDevices = this.config.devices;

      for (const device of configDevices) {

        if (this.config.debugMsgLog == true) {
          this.log.info('Adding new accessory:', device.name);
        }

        switch (device.type) {
          case "switch":
            this.accessoriesArray.push( new SwitchPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;
      
          case "lightbulb":
            this.accessoriesArray.push( new LightbulbPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 2;
            break;

          case "blind":
            this.accessoriesArray.push( new BlindPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 3;
            break;
          
          case "window":
            this.accessoriesArray.push( new WindowPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 3;
            break;

          case "garagedoor":
            this.accessoriesArray.push( new GaragedoorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 3;
            break;

          case "thermostat":
            this.accessoriesArray.push( new ThermostatPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 4;
            break;

          case "irrigationSystem":
            this.accessoriesArray.push( new IrrigationSystemPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 4;
            break;

          case "valve":
            if (!(device.valveParentIrrigationSystem)){
              this.accessoriesArray.push( new ValvePlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 5;
            break;

          case "fan":
            this.accessoriesArray.push( new FanPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 3;
            break;

          case "filterMaintenance":
            this.accessoriesArray.push( new FilterMaintenancePlatformAccessory(this.api, this, device) );
            this.queueMinSize += 2;
            break;

          case "lightSensor":
            this.accessoriesArray.push( new LightSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "motionSensor":
            this.accessoriesArray.push( new MotionSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "contactSensor":
            this.accessoriesArray.push( new ContactSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "smokeSensor":
            this.accessoriesArray.push( new SmokeSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "temperatureSensor":
            this.accessoriesArray.push( new TemperatureSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "humiditySensor":
            this.accessoriesArray.push( new HumiditySensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "carbonDioxideSensor":
            this.accessoriesArray.push( new CarbonDioxideSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 3;
            break;

          case "airQualitySensor":
            this.accessoriesArray.push( new AirQualitySensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case "leakSensor":
            this.accessoriesArray.push( new LeakSensorPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 2;
            break;

          case "outlet":
            this.accessoriesArray.push( new OutletPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;
        
          default:
            this.accessoriesArray.push( new SwitchPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;
        }

      }
    }

    if (this.queueMinSize > this.queueSize) {
      this.log.warn('Queue size is to small! Minimum size for all accessories and sensors is:', this.queueMinSize);
    }
    
    this.startUpdateTimer();

  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(this.accessoriesArray);
  }

  sendQueueItems() {

    if (this.queue.count() > 0) {

      // for logging Queue Size: add in Platform Main Configuration Parameters "debugMsgLogQueueSize": 1
      if (this.config.debugMsgLogQueueSize == true) {
        this.log.info('Queue size: ', this.queue.count());
      }

      // ### Timer OFF ####
      this.stopUpdateTimer();
      // ##################

      const item: any = this.queue.dequeue();
      if (item instanceof QueueSendItem) {
        if (item.pushButton == 1) {
          this.logo.WriteLogo(item.address, 1);
          const pbItem: QueueSendItem = new QueueSendItem(item.address, 0, 0);
          this.queue.bequeue(pbItem);
        } else {
          this.logo.WriteLogo(item.address, item.value);
        }
      } else {
        this.logo.ReadLogo(item.address, item.callBack);
      }

      // ### Timer ON ####
      this.startUpdateTimer();
      // #################

    }

  }

  isAnalogLogoAddress(addr: string): boolean {
    return this.logo.isAnalogLogoAddress(addr);
  }

  startUpdateTimer() {
    this.updateTimer = setInterval(() => {
      this.sendQueueItems();
    }, this.queueInterval );
  }
  stopUpdateTimer() {
    clearInterval(this.updateTimer);
    this.updateTimer = 0;
  }
  
}
// https://developers.homebridge.io/#/config-schema#enabling-support-for-your-plugin