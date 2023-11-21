/* 
Homebridge Dev Device Pi 4:
  Homebridge v1.6.1 (HAP v0.11.1)
  NPM v9.2.0
  NODE v18.13.0

HDMI Pi:
  Homebridge v1.7.0 (HAP v0.11.1)
  NPM v10.2.3
  NODE v20.5.1 -> Homebridge requires Node.js version of ^18.15.0 || ^20.7.0 which does not satisfy the current Node.js version of v20.5.1. You may need to upgrade your installation of Node.js - see https://homebridge.io/w/JTKEF
  
  */

import { API, AccessoryPlugin, Service, Characteristic, StaticPlatformPlugin, Logging, PlatformConfig } from "homebridge";

import { ModBusLogo } from "./modbus-logo";
import { Snap7Logo }  from "./snap7-logo";
import { InfluxDBLogger } from './influxDB';
import { Queue, QueueSendItem, QueueReceiveItem } from "./queue";

import { ErrorNumber } from "./error";
import { LoggerType, LoggerInterval } from "./logger";
import { LogoType, LogoInterface, LogoDefault, Accessory } from "./logo";

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

const pjson = require('../package.json');

export class LogoHomebridgePlatform implements StaticPlatformPlugin {
  
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

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

  public loggerType: string;
  public loggerInterval: number;

  public influxDB: InfluxDBLogger;
  public FakeGatoHistoryService: any;

  constructor(
    public readonly log:    Logging,
    public readonly config: PlatformConfig,
    public readonly api:    API,
  ) {
    // this.log.debug('Finished initializing platform:', this.config.name);

    this.ip            =           this.config.ip;
    this.interface     =           this.config.interface        || LogoInterface.Modbus;
    this.port          =           this.config.port             || LogoDefault.Port;
    this.logoType      =           this.config.logoType         || LogoType.T_0BA7;
    this.local_TSAP    = parseInt( this.config.localTSAP,  16 ) || LogoDefault.LocalTSAP;
    this.remote_TSAP   = parseInt( this.config.remoteTSAP, 16 ) || LogoDefault.RemoteTSAP;
    this.debugMsgLog   =           this.config.debugMsgLog      || LogoDefault.DebugMsgLog;
    this.retryCount    =           this.config.retryCount       || LogoDefault.RetryCount;
    this.queueInterval =           this.config.queueInterval    || LogoDefault.QueueInterval;
    this.queueSize     =           this.config.queueSize        || LogoDefault.QueueSize;
    this.queueMinSize  =                                           LogoDefault.QueueMinSize;

    this.loggerType     = this.config.loggerType     || LoggerType.None;
    this.loggerInterval = this.config.loggerInterval || LoggerInterval.T_5Min;
    this.influxDB       = new InfluxDBLogger(this, this.config);
    this.FakeGatoHistoryService = require('fakegato-history')(this.api);

    if (this.interface == LogoInterface.Modbus) {
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

    
    if (Array.isArray(this.config.devices)) {

      const configDevices = this.config.devices;

      for (const device of configDevices) {

        if (this.config.debugMsgLog == true) {
          this.log.info('Adding new accessory:', device.name);
        }

        switch (device.type) {
          case Accessory.Switch:
            if (!(device.parentAccessory)){
              this.accessoriesArray.push( new SwitchPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;
      
          case Accessory.Lightbulb:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new LightbulbPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 2;
            break;

          case Accessory.Blind:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new BlindPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 3;
            break;
          
          case Accessory.Window:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new WindowPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 3;
            break;

          case Accessory.Garagedoor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new GaragedoorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 3;
            break;

          case Accessory.Thermostat:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new ThermostatPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 4;
            break;

          case Accessory.IrrigationSystem:
            this.accessoriesArray.push( new IrrigationSystemPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 5;
            break;

          case Accessory.Valve:
            if (!(device.valveParentIrrigationSystem)){
              this.accessoriesArray.push( new ValvePlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 5;
            break;

          case Accessory.Fan:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new FanPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 3;
            break;

          case Accessory.FilterMaintenance:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new FilterMaintenancePlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 2;
            break;

          case Accessory.Outlet:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new OutletPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.Other:
            this.accessoriesArray.push( new OtherPlatformAccessory(this.api, this, device) );
            this.queueMinSize += 1;
            break;

          case Accessory.LightSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new LightSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.MotionSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new MotionSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.ContactSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new ContactSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.SmokeSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new SmokeSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.TemperatureSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new TemperatureSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.HumiditySensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new HumiditySensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.CarbonDioxideSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new CarbonDioxideSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 3;
            break;

          case Accessory.AirQualitySensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new AirQualitySensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 1;
            break;

          case Accessory.LeakSensor:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new LeakSensorPlatformAccessory(this.api, this, device) );
            }
            this.queueMinSize += 2;
            break;
        
          default:
            if (!(device.parentAccessory)) {
              this.accessoriesArray.push( new SwitchPlatformAccessory(this.api, this, device) );
            }
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
