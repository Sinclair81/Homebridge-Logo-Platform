import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class MotionSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Motion Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private sensStates = {
    MotionDetected: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.errorCheck();

    this.service = new this.api.hap.Service.MotionSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.MotionDetected)
      .onGet(this.getMotionDetected.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateMotionDetected();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.motion) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getMotionDetected(): Promise<CharacteristicValue> {
    
    const isMotionDetected = this.sensStates.MotionDetected;
    this.updateMotionDetected();

    return isMotionDetected;
  }

  updateMotionDetected() {
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.motion, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.MotionDetected = (value == 1 ? true : false) ;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get MotionDetected -> %s', this.device.name, this.sensStates.MotionDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.MotionDetected, this.sensStates.MotionDetected);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
