import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class TemperatureSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Temperature Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private fakegatoService: any;
  public services: Service[];

  private platform: any;
  private device: any;
  private logging: number;
  private updateCurrentTemperatureQueued: boolean;

  private sensStates = {
    CurrentTemperature: 0,
    MinTemperature: -270,
    MaxTemperature: 100,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.fakegatoService = [];
    this.services = [];

    this.errorCheck();

    this.service = new this.api.hap.Service.TemperatureSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .setProps({minValue: -100})  
      .onGet(this.getCurrentTemperature.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.services.push(this.service, this.information);

    this.updateCurrentTemperatureQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateCurrentTemperature();
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
    if (!this.device.temperature) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    
    const isCurrentTemperature = this.sensStates.CurrentTemperature;
    this.updateCurrentTemperature();

    return isCurrentTemperature;
  }

  updateCurrentTemperature() {
    
    if (this.updateCurrentTemperatureQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.temperature, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.CurrentTemperature = value as number;
        if (this.device.convertValue) {
          this.sensStates.CurrentTemperature = (value as number / 10);
        }
        if (this.sensStates.CurrentTemperature < this.sensStates.MinTemperature) {
          this.sensStates.CurrentTemperature = this.sensStates.MinTemperature;
        }
        if (this.sensStates.CurrentTemperature > this.sensStates.MaxTemperature) {
          this.sensStates.CurrentTemperature = this.sensStates.MaxTemperature;
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentTemperature -> %f', this.device.name, this.sensStates.CurrentTemperature);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentTemperature, this.sensStates.CurrentTemperature);
      }

      this.updateCurrentTemperatureQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentTemperatureQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logFloatValue(this.device.name, "CurrentTemperature", this.sensStates.CurrentTemperature);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }
    
  }

}
