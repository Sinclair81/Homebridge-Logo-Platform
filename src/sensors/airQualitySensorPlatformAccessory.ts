import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class AirQualitySensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Air Quality Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  public services: Service[];

  private platform: any;
  private device: any;
  private logging: number;
  private updateAirQualityQueued: boolean;

  private sensStates = {
    AirQuality: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any, parent?: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.services = [];

    this.errorCheck();

    this.service = new this.api.hap.Service.AirQualitySensor(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.api.hap.Characteristic.AirQuality)
      .onGet(this.getAirQuality.bind(this));

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

    this.updateAirQualityQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateAirQuality();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.airQuality) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async getAirQuality(): Promise<CharacteristicValue> {
    
    const isAirQuality = this.sensStates.AirQuality;
    this.updateAirQuality();

    return isAirQuality;
  }

  updateAirQuality() {

    if (this.updateAirQualityQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.airQuality, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.AirQuality = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get AirQuality -> %i', this.device.name, this.sensStates.AirQuality);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.AirQuality, this.sensStates.AirQuality);
      }

      this.updateAirQualityQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateAirQualityQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logIntegerValue(this.device.name, "AirQuality", this.sensStates.AirQuality);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }
    
  }

}
