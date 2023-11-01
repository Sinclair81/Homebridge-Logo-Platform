import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";
import { UdpClient } from '../udp';

export class MotionSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Motion Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private logging: number;
  private updateMotionDetectedQueued: boolean;

  private udpClient: UdpClient;

  private sensStates = {
    MotionDetected: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.udpClient = new UdpClient(this.platform, this.device);

    this.errorCheck();

    this.service = new this.api.hap.Service.MotionSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.MotionDetected)
      .onGet(this.getMotionDetected.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateMotionDetectedQueued = false;

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
    
    if (this.updateMotionDetectedQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.motion, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.MotionDetected = (value == 1 ? true : false) ;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get MotionDetected -> %s', this.device.name, this.sensStates.MotionDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.MotionDetected, this.sensStates.MotionDetected);

        if (this.logging) {
          this.udpClient.sendMessage("MotionDetected", String(this.sensStates.MotionDetected));
        }
      }

      this.updateMotionDetectedQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateMotionDetectedQueued = true;
    };

  }

}
