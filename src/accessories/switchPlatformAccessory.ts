// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";
import { Accessory, SubAccessory } from '../logo';

import { LightbulbPlatformAccessory }         from './lightbulbPlatformAccessory';
import { BlindPlatformAccessory }             from './blindPlatformAccessory';
import { WindowPlatformAccessory }            from './windowPlatformAccessory';
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

export class SwitchPlatformAccessory implements AccessoryPlugin {

  private model: string = "Switch";

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
  private updateOnQueued: boolean;

  private accStates = {
    On: false,
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

    this.fakegatoService = [];
    this.subs = [];
    this.services = [];

    this.isParentAccessory = false;

    this.errorCheck();

    this.service = new this.api.hap.Service.Switch(this.device.name);
    
    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-"); 
    }
      
    this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (!parent) {
      
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

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateOn();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

  }

  errorCheck() {

    if (this.platform.loggerType == LoggerType.Fakegato) {
      this.fakegatoService = new this.platform.FakeGatoHistoryService("switch", this, {storage: 'fs'});
      this.services.push(this.fakegatoService);
    }

    if (!this.device.switchGet || !this.device.switchSetOn || !this.device.switchSetOff) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
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
      qItem = new QueueSendItem(this.device.switchSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.switchSetOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  updateOn() {

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.switchGet, async (value: number) => {

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

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logBooleanValue(this.device.name, "On", this.accStates.On);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), status: this.accStates.On});

    }
    
  }

}
