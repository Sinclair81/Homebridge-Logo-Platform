import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";
import { Accessory, SubAccessory } from '../logo';

import { SwitchPlatformAccessory }            from './switchPlatformAccessory';
import { LightbulbPlatformAccessory }         from './lightbulbPlatformAccessory';
import { BlindPlatformAccessory }             from './blindPlatformAccessory';
import { WindowPlatformAccessory }            from './windowPlatformAccessory';
import { GaragedoorPlatformAccessory }        from './garagedoorPlatformAccessory';
import { ThermostatPlatformAccessory }        from './thermostatPlatformAccessory';
import { FanPlatformAccessory }               from './fanPlatformAccessory';
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

export class FilterMaintenancePlatformAccessory implements AccessoryPlugin {

  private model: string = "Filter Maintenance";

  private api: API;
  private service: Service;
  private information: Service;

  private subs: any[];
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateFilterChangeIndicationQueued: boolean;
  private updateFilterLifeLevelQueued: boolean;

  private accStates = {
    FilterChangeIndication: 0,
    FilterLifeLevel: 0,
    ResetFilterIndication: 0,
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

    this.service = new this.api.hap.Service.FilterMaintenance(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
      .onGet(this.getFilterChangeIndication.bind(this));
    
    if (this.device.filterLifeLevel) {
      this.service.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
        .onGet(this.getFilterLifeLevel.bind(this));
    }

    if (this.device.filterResetFilterIndication) {
      this.service.getCharacteristic(this.platform.Characteristic.ResetFilterIndication)
        .onSet(this.setResetFilterIndication.bind(this));
    }
    
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
  
    this.updateFilterChangeIndicationQueued = false;
    this.updateFilterLifeLevelQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateFilterChangeIndication();
        this.updateFilterLifeLevel();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.filterChangeIndication) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async setResetFilterIndication(value: CharacteristicValue) {
    
    this.accStates.ResetFilterIndication = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set ResetFilterIndication <- %s', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.filterResetFilterIndication, this.accStates.ResetFilterIndication, 0);
      this.platform.queue.bequeue(qItem);

  }

  async getFilterChangeIndication(): Promise<CharacteristicValue> {
    
    const isFilterChangeIndication = this.accStates.FilterChangeIndication;
    this.updateFilterChangeIndication();

    return isFilterChangeIndication;
  }

  async getFilterLifeLevel(): Promise<CharacteristicValue> {
    
    const isFilterLifeLevel = this.accStates.FilterLifeLevel;
    this.updateFilterLifeLevel();

    return isFilterLifeLevel;
  }

  updateFilterChangeIndication() {
    
    if (this.updateFilterChangeIndicationQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.filterChangeIndication, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.FilterChangeIndication = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get FilterChangeIndication -> %s', this.device.name, this.accStates.FilterChangeIndication);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.FilterChangeIndication, this.accStates.FilterChangeIndication);
      }

      this.updateFilterChangeIndicationQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateFilterChangeIndicationQueued = true;
    };
  
  }

  updateFilterLifeLevel() {

    if (this.device.filterLifeLevel) {

      if (this.updateFilterLifeLevelQueued) {return;}

      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.filterLifeLevel, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.FilterLifeLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get FilterLifeLevel -> %i', this.device.name, this.accStates.FilterLifeLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.FilterLifeLevel, this.accStates.FilterLifeLevel);
        }

        this.updateFilterLifeLevelQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateFilterLifeLevelQueued = true;
      };
      
    }

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("FilterChangeIndication", this.accStates.FilterChangeIndication, InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("FilterLifeLevel",        this.accStates.FilterLifeLevel,        InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("ResetFilterIndication",  this.accStates.ResetFilterIndication,  InfluxDBFild.Int));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }

  }

}
