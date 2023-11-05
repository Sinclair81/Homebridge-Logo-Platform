import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class GaragedoorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Garagedoor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateCurrentDoorStateAndTargetDoorStateQueued: boolean;
  private updateCurrentDoorStateQueued: boolean;
  private updateTargetDoorStateQueued: boolean;
  private updateObstructionDetectedQueued: boolean;

  private currentDoorStateIsTargetDoorStateInLogo: number;

  private accStates = {
    CurrentDoorState: 1,
    TargetDoorState: 1,
    ObstructionDetected: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.errorCheck();
    this.currentDoorStateIsTargetDoorStateInLogo = this.checkDoorState();

    this.service = new this.api.hap.Service.GarageDoorOpener(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .onGet(this.getCurrentDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onSet(this.setTargetDoorState.bind(this))
      .onGet(this.getTargetDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getObstructionDetected.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateCurrentDoorStateAndTargetDoorStateQueued = false;
    this.updateCurrentDoorStateQueued = false;
    this.updateTargetDoorStateQueued = false;
    this.updateObstructionDetectedQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        if (this.currentDoorStateIsTargetDoorStateInLogo == 1) {
          this.updateCurrentDoorStateAndTargetDoorState();
        } else {
          this.updateCurrentDoorState();
          this.updateTargetDoorState();
        }
        this.updateObstructionDetected();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.garagedoorGetState || !this.device.garagedoorGetTargetState || !this.device.garagedoorSetTargetState) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }
  checkDoorState(): number {
    if (this.device.garagedoorGetState == this.device.garagedoorGetTargetState) {
      return 1;
    } else {
      return 0;
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setTargetDoorState(value: CharacteristicValue) {
    
    this.accStates.TargetDoorState = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set TargetDoorState <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.garagedoorSetTargetState, this.accStates.TargetDoorState, 0);
    this.platform.queue.bequeue(qItem);

  }

  async getCurrentDoorState(): Promise<CharacteristicValue> {
    
    const isCurrentDoorState = this.accStates.CurrentDoorState;
    this.updateCurrentDoorState();

    return isCurrentDoorState;
  }

  async getTargetDoorState(): Promise<CharacteristicValue> {
    
    const isTargetDoorState = this.accStates.TargetDoorState;
    this.updateTargetDoorState();

    return isTargetDoorState;
  }

  async getObstructionDetected(): Promise<CharacteristicValue> {
    
    const isObstructionDetected = this.accStates.ObstructionDetected;
    this.updateObstructionDetected();

    return isObstructionDetected;
  }

  updateCurrentDoorState() {
    if (this.platform.isAnalogLogoAddress(this.device.garagedoorGetState)) {
      this.updateAnalogCurrentDoorState();
    } else {
      this.updateDigitalCurrentDoorState();
    }
  }

  updateTargetDoorState() {
    if (this.platform.isAnalogLogoAddress(this.device.garagedoorGetTargetState)) {
      this.updateAnalogTargetDoorState();
    } else {
      this.updateDigitalTargetDoorState();
    }
  }

  updateCurrentDoorStateAndTargetDoorState() {
    if (this.platform.isAnalogLogoAddress(this.device.garagedoorGetState)) {
      this.updateAnalogCurrentDoorStateAndTargetDoorState();
    } else {
      this.updateDigitalCurrentDoorStateAndTargetDoorState();
    }
  }

  updateObstructionDetected() {

    if (this.device.garagedoorObstruction) {

      if (this.updateObstructionDetectedQueued) {return;}

      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorObstruction, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.ObstructionDetected = (value == 1 ? true : false);
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get ObstructionDetected -> %s', this.device.name, this.accStates.ObstructionDetected);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.ObstructionDetected, this.accStates.ObstructionDetected);
        }

        this.updateObstructionDetectedQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateObstructionDetectedQueued = true;
      };
      
    }
    
  }

  updateAnalogCurrentDoorState() {
    
    if (this.updateCurrentDoorStateQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Analog CurrentDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
      }

      this.updateCurrentDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateQueued = true;
    };

  }

  updateAnalogTargetDoorState() {

    if (this.updateTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetTargetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.TargetDoorState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Analog TargetDoorState -> %i', this.device.name, this.accStates.TargetDoorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetDoorStateQueued = true;
    };

  }

  updateAnalogCurrentDoorStateAndTargetDoorState() {

    if (this.updateCurrentDoorStateAndTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = value as number;
        this.accStates.TargetDoorState  = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Analog CurrentDoorState and TargetDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateCurrentDoorStateAndTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateAndTargetDoorStateQueued = true;
    };

  }

  updateDigitalCurrentDoorState() {

    if (this.updateCurrentDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {
      // Logo return 1 for open !!
      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = (value as number == 1 ? 0 : 1);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Digital CurrentDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
      }

      this.updateCurrentDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateQueued = true;
    };

  }

  updateDigitalTargetDoorState() {

    if (this.updateTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetTargetState, async (value: number) => {
      // Logo return 1 for open !!
      if (value != ErrorNumber.noData) {

        this.accStates.TargetDoorState = (value as number == 1 ? 0 : 1);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Digital TargetDoorState -> %i', this.device.name, this.accStates.TargetDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetDoorStateQueued = true;
    };

  }

  updateDigitalCurrentDoorStateAndTargetDoorState() {

    if (this.updateCurrentDoorStateAndTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {
      // Logo return 1 for open !!
      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = (value as number == 1 ? 0 : 1);
        this.accStates.TargetDoorState  = (value as number == 1 ? 0 : 1);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Digital CurrentDoorState and TargetDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateCurrentDoorStateAndTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateAndTargetDoorStateQueued = true;
    };

  }

}
