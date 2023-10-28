import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class FanPlatformAccessory implements AccessoryPlugin {

  private model: string = "Fan";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private updateOnQueued: boolean;
  private updateRotationDirectionQueued: boolean;
  private updateRotationSpeedQueued: boolean;

  private accStates = {
    On: false,
    RotationDirection: 0, // CW = 0 / CCW = 1
    RotationSpeed: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = (this.device.pushButton ? 1 : 0) || this.platform.pushButton;

    this.errorCheck();

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

    this.updateOnQueued = false;
    this.updateRotationDirectionQueued = false;
    this.updateRotationSpeedQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
        this.updateRotationDirection();
        this.updateRotationSpeed();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.fanGet || !this.device.fanSetOn || !this.device.fanSetOff) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
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

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.fanSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.fanSetOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async setRotationDirection(value: CharacteristicValue) {

    if (this.device.fanSetRotationDirectionCW && this.device.fanSetRotationDirectionCCW) {

      this.accStates.RotationDirection = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set RotationDirection <- %i', this.device.name, value);
      }

      let qItem: QueueSendItem;
      if (value) {
        qItem = new QueueSendItem(this.device.fanSetRotationDirectionCW, value as number, this.pushButton);
      } else {
        qItem = new QueueSendItem(this.device.fanSetRotationDirectionCCW, value as number, this.pushButton);
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

      let qItem: QueueSendItem = new QueueSendItem(this.device.fanSetRotationSpeed, this.accStates.RotationSpeed, 0);
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

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.fanGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.On = (value == 1 ? true : false);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);
      }

      this.updateOnQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    };
  
  }

  updateRotationDirection() {

    if (this.device.fanGetRotationDirection) {

      if (this.updateRotationDirectionQueued) {return;}

      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.fanGetRotationDirection, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.RotationDirection = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RotationDirection -> %i', this.device.name, this.accStates.RotationDirection);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RotationDirection, this.accStates.RotationDirection);
        }

        this.updateRotationDirectionQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateRotationDirectionQueued = true;
      };
      
    }

  }

  updateRotationSpeed() {
    
    if (this.device.fanGetRotationSpeed) {

      if (this.updateRotationSpeedQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.fanGetRotationSpeed, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.RotationSpeed = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RotationSpeed -> %i', this.device.name, this.accStates.RotationSpeed);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RotationSpeed, this.accStates.RotationSpeed);
        }

        this.updateRotationSpeedQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateRotationSpeedQueued = true;
      };

    }

  }

}
