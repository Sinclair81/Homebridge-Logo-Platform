// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

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
import { FilterMaintenancePlatformAccessory } from './filterMaintenancePlatformAccessory';

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

export class OutletPlatformAccessory implements AccessoryPlugin {

  private model: string = "Outlet";

  private api: API;
  private service: Service;
  private information: Service;

  private fakegatoService: any;
  private subs: any[];
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private inUseIsSet: boolean;
  private updateOnQueued: boolean;
  private updateInUseQueued: boolean;

  private accStates = {
    On: false,
    InUse: false,
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
    this.inUseIsSet = false;

    this.fakegatoService = [];
    this.subs = [];
    this.services = [];

    this.isParentAccessory = false;

    this.errorCheck();

    this.service = new this.api.hap.Service.Outlet(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onGet(this.getInUse.bind(this));

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

    this.updateOnQueued = false;
    this.updateInUseQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateOn();
        if (this.inUseIsSet) {
          this.updateInUse();
        }
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {

      if (this.platform.loggerType == LoggerType.Fakegato) {
        this.fakegatoService = new this.platform.FakeGatoHistoryService("custom", this, {storage: 'fs'});
        this.services.push(this.fakegatoService);
      }

      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.outletGet || !this.device.outletSetOn || !this.device.outletSetOff) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
    if (this.device.outletGetInUse) {
      this.inUseIsSet = true;
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.outletSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.outletSetOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  async getInUse(): Promise<CharacteristicValue> {
    
    let isInUse = this.inUseIsSet ? this.accStates.InUse : true;

    if (this.inUseIsSet) {
      this.updateInUse();
    }
    
    return isInUse;
  }

  updateOn() {

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.outletGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const on = value == 1 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);
      }

      this.updateOnQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    };

  }

  updateInUse() {
    
    if (this.updateInUseQueued){return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.outletGetInUse, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const inUse = value == 1 ? true : false;
        this.accStates.InUse = inUse;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get InUse -> %s', this.device.name, this.accStates.InUse);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.InUse, this.accStates.InUse);
      }

      this.updateInUseQueued = false;

    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateInUseQueued = true;
    }

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("On",    this.accStates.On,    InfluxDBFild.Bool));
      logItems.push(new InfluxDBLogItem("InUse", this.accStates.InUse, InfluxDBFild.Bool));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), status: this.accStates.On});

    }

  }

}
