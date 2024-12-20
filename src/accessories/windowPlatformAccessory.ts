import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";
import { Accessory, SubAccessory } from '../logo';

import { SwitchPlatformAccessory }            from './switchPlatformAccessory';
import { LightbulbPlatformAccessory }         from './lightbulbPlatformAccessory';
import { BlindPlatformAccessory }             from './blindPlatformAccessory';
import { GaragedoorPlatformAccessory }        from './garagedoorPlatformAccessory';
import { ThermostatPlatformAccessory }        from './thermostatPlatformAccessory';
import { FanPlatformAccessory }               from './fanPlatformAccessory';
import { FilterMaintenancePlatformAccessory } from './filterMaintenancePlatformAccessory';
import { OutletPlatformAccessory }            from './outletPlatformAccessory';

import { LightSensorPlatformAccessory }         from '../sensors/lightSensorPlatformAccessory';
import { MotionSensorPlatformAccessory }        from '../sensors/motionSensorPlatformAccessory';
import { ContactSensorPlatformAccessory }       from '../sensors/contactSensorPlatformAccessory';
import { SmokeSensorPlatformAccessory }         from '../sensors/smokeSensorPlatformAccessory';
import { TemperatureSensorPlatformAccessory }   from '../sensors/temperatureSensorPlatformAccessory';
import { HumiditySensorPlatformAccessory }      from '../sensors/humiditySensorPlatformAccessory';
import { CarbonDioxideSensorPlatformAccessory } from '../sensors/carbonDioxideSensorPlatformAccessory';
import { AirQualitySensorPlatformAccessory }    from '../sensors/airQualitySensorPlatformAccessory';
import { LeakSensorPlatformAccessory }          from '../sensors/leakSensorPlatformAccessory';
import { WatchdogPlatformAccessory }            from '../sensors/watchdogPlatformAccessory';

export class WindowPlatformAccessory implements AccessoryPlugin {

  private model: string = "Window";

  private api: API;
  private service: Service;
  private information: Service;

  private subs: any[];
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateCurrentPositionAndTargetPositionQueued: boolean;
  private updateCurrentPositionQueued: boolean;
  private updateTargetPositionQueued: boolean;
  private updatePositionStateQueued: boolean;

  private currentPositionIsTargetPositionInLogo: number;

  private accStates = {
    CurrentPosition: 0,
    PositionState: 0,   // 0 - DECREASING; 1 - INCREASING; 2 - STOPPED
    TargetPosition: 0,
    HoldPosition: false,
  };

  name: string;
  isParentAccessory: boolean;

  constructor( api: API, platform: any, device: any, parent?: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.subs = [];
    this.services = [];

    this.isParentAccessory = false;

    this.errorCheck();
    this.currentPositionIsTargetPositionInLogo = this.checkPosition();

    this.service = new this.api.hap.Service.Window(this.device.name);
    
    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getCurrentPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onSet(this.setTargetPosition.bind(this))
      .onGet(this.getTargetPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.HoldPosition)
      .onSet(this.setHoldPosition.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    const configDevices = this.platform.config.devices;
    for (const dev of configDevices) {

      if (dev.parentAccessory == this.name) {
        this.isParentAccessory = true;

        switch (dev.type) {
          case Accessory.Switch:
            this.subs.push( new SwitchPlatformAccessory(api, platform, dev, this) );
            break;
        
          case Accessory.Lightbulb:
            this.subs.push( new LightbulbPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Blind:
            this.subs.push( new BlindPlatformAccessory(api, platform, dev, this) );
            break;
          
          case Accessory.Window:
            this.subs.push( new WindowPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Garagedoor:
            this.subs.push( new GaragedoorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Thermostat:
            this.subs.push( new ThermostatPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Fan:
            this.subs.push( new FanPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.FilterMaintenance:
            this.subs.push( new FilterMaintenancePlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Outlet:
            this.subs.push( new OutletPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.LightSensor:
            this.subs.push( new LightSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.MotionSensor:
            this.subs.push( new MotionSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.ContactSensor:
            this.subs.push( new ContactSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.SmokeSensor:
            this.subs.push( new SmokeSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.TemperatureSensor:
            this.subs.push( new TemperatureSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.HumiditySensor:
            this.subs.push( new HumiditySensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.CarbonDioxideSensor:
            this.subs.push( new CarbonDioxideSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.AirQualitySensor:
            this.subs.push( new AirQualitySensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.LeakSensor:
            this.subs.push( new LeakSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Watchdog:
            this.subs.push( new WatchdogPlatformAccessory(api, platform, dev, this) );
            break;
        }
      }
    }

    if (this.isParentAccessory == true) {
      this.service.subtype = 'main-' + this.model + "-" + this.name.replace(" ", "-");
    }
    
    this.services.push(this.service, this.information);

    if (parent) {
      parent.service.addLinkedService(this.service);
      parent.services.push(this.service);
    }

    this.updateCurrentPositionAndTargetPositionQueued = false;
    this.updateCurrentPositionQueued = false;
    this.updateTargetPositionQueued = false;
    this.updatePositionStateQueued = false;
    
    if (this.platform.config.updateInterval) {
      setInterval(() => {
        if (this.currentPositionIsTargetPositionInLogo == 1) {
          this.updateCurrentPositionAndTargetPosition();
        } else {
          this.updateCurrentPosition();
          this.updateTargetPosition();
        }
        this.updatePositionState();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.windowSetTargetPos || !this.device.windowGetTargetPos || !this.device.windowGetPos || !this.device.windowGetState) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }
  checkPosition(): number {
    if (this.device.windowGetTargetPos == this.device.windowGetPos) {
      return 1;
    } else {
      return 0;
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async setTargetPosition(value: CharacteristicValue) {
    
    this.accStates.TargetPosition = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set TargetPosition <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.windowSetTargetPos, this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue), 0);
    this.platform.queue.bequeue(qItem);

  }

  async setHoldPosition(value: CharacteristicValue) {
    
    this.accStates.HoldPosition = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set HoldPosition <- %s', this.device.name, value);
    }

    //  HomeKit -> 2 - STOPPED
    if (value == true) {
      this.setTargetPosition(2);
    }
    
  }

  async getCurrentPosition(): Promise<CharacteristicValue> {
    
    const isCurrentPosition = this.accStates.CurrentPosition;
    this.updateCurrentPosition();

    return isCurrentPosition;
  }

  async getPositionState(): Promise<CharacteristicValue> {
    
    const isPositionState = this.accStates.PositionState;
    this.updatePositionState();

    return isPositionState;
  }

  async getTargetPosition(): Promise<CharacteristicValue> {
    
    const isTargetPosition = this.accStates.TargetPosition;
    this.updateTargetPosition();

    return isTargetPosition;
  }

  updateCurrentPosition() {

    if (this.updateCurrentPositionQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetPos, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentPosition = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentPosition -> %i', this.device.name, this.accStates.CurrentPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentPosition, this.accStates.CurrentPosition);
      }

      this.updateCurrentPositionQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentPositionQueued = true;
    };

  }

  updatePositionState() {

    if (this.updatePositionStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.PositionState = this.windowLogoStateToHomebridgeState(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get PositionState -> %i', this.device.name, this.accStates.PositionState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.PositionState, this.accStates.PositionState);
      }

      this.updatePositionStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updatePositionStateQueued = true;
    };

  }

  updateTargetPosition() {

    if (this.updateTargetPositionQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetTargetPos, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.TargetPosition = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get TargetPosition -> %i', this.device.name, this.accStates.TargetPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetPosition, this.accStates.TargetPosition);
      }

      this.updateTargetPositionQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetPositionQueued = true;
    };

  }

  updateCurrentPositionAndTargetPosition() {

    if (this.updateCurrentPositionAndTargetPositionQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetPos, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentPosition = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);
        this.accStates.TargetPosition  = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentPosition and TargetPosition -> %i', this.device.name, this.accStates.CurrentPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentPosition, this.accStates.CurrentPosition);
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetPosition, this.accStates.TargetPosition);
      }

      this.updateCurrentPositionAndTargetPositionQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentPositionAndTargetPositionQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {
      
      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("CurrentPosition", this.accStates.CurrentPosition, InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("PositionState",   this.accStates.PositionState,   InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("TargetPosition",  this.accStates.TargetPosition,  InfluxDBFild.Int));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }
  
  }

  windowLogoPosToHomebridgePos(value: number, convert: boolean): number {
    if (convert) {
      return (100 - value);
    } else {
      return value;
    }
  }

  windowLogoStateToHomebridgeState(value: number, convert: boolean): number {
    /*
     * LOGO!
     * 0 - STOPP
     * 1 - UP   -> more open  -> 0%
     * 2 - DOWN -> more close -> 100%
     * Value 100 == 100% closed
     * 
     * HomeKit
     * 0 - DECREASING -> - -> more closed -> 0%
     * 1 - INCREASING -> + -> more open   -> 100%
     * 2 - STOPPED
     * Value 100 == 100% open
     */ 
    if (convert) {
      let newValue;
      switch (value) {
        case 0:         // LOGO! Stop
          newValue = 2; // Homebridge STOPPED
          break;
        case 1:         // LOGO! Up
          newValue = 1; // Homebridge INCREASING
          break;
        case 2:         // LOGO! Down
          newValue = 0; // Homebridge DECREASING
          break;
        default:
          newValue = 2; // Homebridge STOPPED
          break;
      }
      return newValue;
    } else {
      return value;
    }
  }

}
