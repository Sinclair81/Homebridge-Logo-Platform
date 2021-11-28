import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class TemperatureSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Temperature Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

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

    this.service = new this.api.hap.Service.TemperatureSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentTemperature();
      }, this.platform.config.updateInterval);

    }
    
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    
    const isCurrentTemperature = this.sensStates.CurrentTemperature;
    this.updateCurrentTemperature();

    return isCurrentTemperature;
  }

  updateCurrentTemperature() {
    
    let qItem: QueueItem = new QueueItem(this.device.temperature, false, 0, async (value: number) => {

      if (value != -1) {

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
          this.platform.log.info('[%s] Get CurrentTemperature -> %i', this.device.name, this.sensStates.CurrentTemperature);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentTemperature, this.sensStates.CurrentTemperature);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
