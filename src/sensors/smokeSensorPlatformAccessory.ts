import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class SmokeSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Smoke Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private sensStates = {
    SmokeDetected: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.service = new this.api.hap.Service.SmokeSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.SmokeDetected)
      .onGet(this.getSmokeDetected.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateSmokeDetected();
      }, this.platform.config.updateInterval);

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
    
    let qItem: QueueItem = new QueueItem(this.device.smoke, false, 0, async (value: number) => {

      if (value != -1) {

        this.sensStates.SmokeDetected = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get SmokeDetected -> %i', this.device.name, this.sensStates.SmokeDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.SmokeDetected, this.sensStates.SmokeDetected);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}