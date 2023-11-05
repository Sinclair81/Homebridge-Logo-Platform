import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class SmokeSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Smoke Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private logging: number;
  private updateSmokeDetectedQueued: boolean;

  private sensStates = {
    SmokeDetected: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.errorCheck();

    this.service = new this.api.hap.Service.SmokeSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.SmokeDetected)
      .onGet(this.getSmokeDetected.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateSmokeDetectedQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateSmokeDetected();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.smoke) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getSmokeDetected(): Promise<CharacteristicValue> {
    
    const isSmokeDetected = this.sensStates.SmokeDetected;
    this.updateSmokeDetected();

    return isSmokeDetected;
  }

  updateSmokeDetected() {
    
    if (this.updateSmokeDetectedQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.smoke, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.SmokeDetected = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get SmokeDetected -> %i', this.device.name, this.sensStates.SmokeDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.SmokeDetected, this.sensStates.SmokeDetected);
      }

      this.updateSmokeDetectedQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateSmokeDetectedQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logIntegerValue(this.device.name, "SmokeDetected", this.sensStates.SmokeDetected);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }
    
  }

}
