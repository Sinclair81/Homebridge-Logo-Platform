import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class FanPlatformAccessory implements AccessoryPlugin {

  private model: string = "Fan";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    On: false,
    RotationDirection: 0, // CW = 0 / CCW = 1
    RotationSpeed: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.service = new this.api.hap.Service.Fan(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
    
    if (this.device.fanGetRotationDirection && this.device.fanSetRotationDirectionCW && this.device.fanSetRotationDirectionCCW) {
      this.service.getCharacteristic(this.platform.Characteristic.RotationDirection)
        .onSet(this.setRotationDirection.bind(this))
        .onGet(this.getRotationDirection.bind(this));
    }

    if (this.device.fanGetRotationSpeed && this.device.fanSetRotationSpeed) {
      this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .onSet(this.setRotationSpeed.bind(this))
        .onGet(this.getRotationSpeed.bind(this));
    }
    
    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
        this.updateRotationDirection();
        this.updateRotationSpeed();
      }, this.platform.config.updateInterval);

    }
    
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueItem;
    if (value) {
      qItem = new QueueItem(this.device.fanSetOn, true, 1);
    } else {
      qItem = new QueueItem(this.device.fanSetOff, true, 1);
    }
    this.platform.queue.bequeue(qItem);

  }

  async setRotationDirection(value: CharacteristicValue) {

    if (this.device.fanSetRotationDirectionCW && this.device.fanSetRotationDirectionCCW) {

      this.accStates.RotationDirection = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set RotationDirection <- %i', this.device.name, value);
      }

      let qItem: QueueItem;
      if (value) {
        qItem = new QueueItem(this.device.fanSetRotationDirectionCW, true, 1);
      } else {
        qItem = new QueueItem(this.device.fanSetRotationDirectionCCW, true, 1);
      }
      this.platform.queue.bequeue(qItem);
      
    }

  }

  async setRotationSpeed(value: CharacteristicValue) {

    if (this.device.fanSetRotationSpeed) {

      this.accStates.RotationSpeed = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set RotationSpeed <- %i', this.device.name, value);
      }

      let qItem: QueueItem = new QueueItem(this.device.fanSetRotationSpeed, true, this.accStates.RotationSpeed);
      this.platform.queue.bequeue(qItem);
      
    }

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  async getRotationDirection(): Promise<CharacteristicValue> {
    
    const isRotationDirection = this.accStates.RotationDirection;
    this.updateRotationDirection();

    return isRotationDirection;
  }

  async getRotationSpeed(): Promise<CharacteristicValue> {
    
    const isRotationSpeed = this.accStates.RotationSpeed;
    this.updateRotationSpeed();

    return isRotationSpeed;
  }

  updateOn() {
    
    let qItem: QueueItem = new QueueItem(this.device.fanGet, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.On = (value == 1 ? true : false);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);
      }

    });

    this.platform.queue.enqueue(qItem);
  
  }

  updateRotationDirection() {

    if (this.device.fanGetRotationDirection) {

      let qItem: QueueItem = new QueueItem(this.device.fanGetRotationDirection, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.accStates.RotationDirection = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RotationDirection -> %i', this.device.name, this.accStates.RotationDirection);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RotationDirection, this.accStates.RotationDirection);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);
      
    }

  }

  updateRotationSpeed() {
    
    if (this.device.fanGetRotationSpeed) {
      
      let qItem: QueueItem = new QueueItem(this.device.fanGetRotationSpeed, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.accStates.RotationSpeed = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RotationSpeed -> %i', this.device.name, this.accStates.RotationSpeed);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RotationSpeed, this.accStates.RotationSpeed);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);

    }

  }

}
