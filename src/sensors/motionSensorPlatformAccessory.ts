import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class MotionSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Motion Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private fakegatoService: any;
  public services: Service[];

  private platform: any;
  private device: any;
  private logging: number;
  private updateMotionDetectedQueued: boolean;

  private sensStates = {
    MotionDetected: false,
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

    this.service = new this.api.hap.Service.MotionSensor(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.api.hap.Characteristic.MotionDetected)
      .onGet(this.getMotionDetected.bind(this));

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

    this.updateMotionDetectedQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateMotionDetected();
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
    if (!this.device.motion) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async getMotionDetected(): Promise<CharacteristicValue> {
    
    const isMotionDetected = this.sensStates.MotionDetected;
    this.updateMotionDetected();

    return isMotionDetected;
  }

  updateMotionDetected() {
    
    if (this.updateMotionDetectedQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.motion, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.MotionDetected = (value == 1 ? true : false) ;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get MotionDetected -> %s', this.device.name, this.sensStates.MotionDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.MotionDetected, this.sensStates.MotionDetected);
      }

      this.updateMotionDetectedQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateMotionDetectedQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logBooleanValue(this.device.name, "MotionDetected", this.sensStates.MotionDetected);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), motion: this.sensStates.MotionDetected});

    }
    
  }

}
