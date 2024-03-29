import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class LightSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Light Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private fakegatoService: any;
  public services: Service[];

  private platform: any;
  private device: any;
  private logging: number;
  private updateCurrentAmbientLightLevelQueued: boolean;

  private sensStates = {
    MinAmbientLightLevel:     0.0001,
    MaxAmbientLightLevel:     100000,
    CurrentAmbientLightLevel: 0.0001,
  };

  name: string;

  constructor( api: API, platform: any, device: any, parent?: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.fakegatoService = [];
    this.services = [];

    this.errorCheck();

    this.service = new this.api.hap.Service.LightSensor(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentAmbientLightLevel)
      .onGet(this.getCurrentAmbientLightLevel.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.services.push(this.service, this.information);

    if (parent) {
      parent.service.addLinkedService(this.service);
      parent.services.push(this.service);
    }

    this.updateCurrentAmbientLightLevelQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateCurrentAmbientLightLevel();
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
    if (!this.device.light) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async getCurrentAmbientLightLevel(): Promise<CharacteristicValue> {
    
    const isCurrentAmbientLightLevel = this.sensStates.CurrentAmbientLightLevel;
    this.updateCurrentAmbientLightLevel();

    return isCurrentAmbientLightLevel;
  }

  updateCurrentAmbientLightLevel() {
    
    if (this.updateCurrentAmbientLightLevelQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.light, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.CurrentAmbientLightLevel = value as number;
        if (this.sensStates.CurrentAmbientLightLevel < this.sensStates.MinAmbientLightLevel) {
          this.sensStates.CurrentAmbientLightLevel = this.sensStates.MinAmbientLightLevel
        }
        if (this.sensStates.CurrentAmbientLightLevel > this.sensStates.MaxAmbientLightLevel) {
          this.sensStates.CurrentAmbientLightLevel = this.sensStates.MaxAmbientLightLevel
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentAmbientLightLevel -> %f', this.device.name, this.sensStates.CurrentAmbientLightLevel);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentAmbientLightLevel, this.sensStates.CurrentAmbientLightLevel);
      }

      this.updateCurrentAmbientLightLevelQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentAmbientLightLevelQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logFloatValue(this.device.name, "CurrentAmbientLightLevel", this.sensStates.CurrentAmbientLightLevel);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), lux: this.sensStates.CurrentAmbientLightLevel});

    }
    
  }

}
