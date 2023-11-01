import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";
import { UdpClient } from '../udp';

export class WindowPlatformAccessory implements AccessoryPlugin {

  private model: string = "Window";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateCurrentPositionAndTargetPositionQueued: boolean;
  private updateCurrentPositionQueued: boolean;
  private updateTargetPositionQueued: boolean;
  private updatePositionStateQueued: boolean;

  private currentPositionIsTargetPositionInLogo: number;

  private udpClient: UdpClient;

  private accStates = {
    CurrentPosition: 0,
    PositionState: 0,   // 0 - DECREASING; 1 - INCREASING; 2 - STOPPED
    TargetPosition: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.udpClient = new UdpClient(this.platform, this.device);

    this.errorCheck();
    this.currentPositionIsTargetPositionInLogo = this.checkPosition();

    this.service = new this.api.hap.Service.Window(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getCurrentPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onSet(this.setTargetPosition.bind(this))
      .onGet(this.getTargetPosition.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateCurrentPositionAndTargetPositionQueued = false;
    this.updateCurrentPositionQueued = false;
    this.updateTargetPositionQueued = false;
    this.updatePositionStateQueued = false;
    
    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        if (this.currentPositionIsTargetPositionInLogo == 1) {
          this.updateCurrentPositionAndTargetPosition();
        } else {
          this.updateCurrentPosition();
          this.updateTargetPosition();
        }
        this.updatePositionState();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.windowSetTargetPos || !this.device.windowGetTargetPos || !this.device.windowGetPos || !this.device.windowGetState) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }
  checkPosition(): number {
    if (this.device.windowGetTargetPos == this.device.windowGetPos) {
      return 1;
    } else {
      return 0;
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setTargetPosition(value: CharacteristicValue) {
    
    this.accStates.TargetPosition = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set TargetPosition <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.windowSetTargetPos, this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue), 0);
    this.platform.queue.bequeue(qItem);

  }

  async getCurrentPosition(): Promise<CharacteristicValue> {
    
    const isCurrentPosition = this.accStates.CurrentPosition;
    this.updateCurrentPosition();

    return isCurrentPosition;
  }

  async getPositionState(): Promise<CharacteristicValue> {
    
    const isPositionState = this.accStates.PositionState;
    this.updatePositionState();

    return isPositionState;
  }

  async getTargetPosition(): Promise<CharacteristicValue> {
    
    const isTargetPosition = this.accStates.TargetPosition;
    this.updateTargetPosition();

    return isTargetPosition;
  }

  updateCurrentPosition() {

    if (this.updateCurrentPositionQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetPos, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentPosition = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentPosition -> %i', this.device.name, this.accStates.CurrentPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentPosition, this.accStates.CurrentPosition);

        if (this.logging) {
          this.udpClient.sendMessage("CurrentPosition", String(this.accStates.CurrentPosition));
        }
      }

      this.updateCurrentPositionQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentPositionQueued = true;
    };

  }

  updatePositionState() {

    if (this.updatePositionStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.PositionState = this.windowLogoStateToHomebridgeState(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get PositionState -> %i', this.device.name, this.accStates.PositionState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.PositionState, this.accStates.PositionState);

        if (this.logging) {
          this.udpClient.sendMessage("PositionState", String(this.accStates.PositionState));
        }
      }

      this.updatePositionStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updatePositionStateQueued = true;
    };

  }

  updateTargetPosition() {

    if (this.updateTargetPositionQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetTargetPos, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.TargetPosition = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get TargetPosition -> %i', this.device.name, this.accStates.TargetPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetPosition, this.accStates.TargetPosition);

        if (this.logging) {
          this.udpClient.sendMessage("TargetPosition", String(this.accStates.TargetPosition));
        }
      }

      this.updateTargetPositionQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetPositionQueued = true;
    };

  }

  updateCurrentPositionAndTargetPosition() {

    if (this.updateCurrentPositionAndTargetPositionQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.windowGetPos, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentPosition = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);
        this.accStates.TargetPosition  = this.windowLogoPosToHomebridgePos(value as number, this.device.windowConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentPosition and TargetPosition -> %i', this.device.name, this.accStates.CurrentPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentPosition, this.accStates.CurrentPosition);
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetPosition, this.accStates.TargetPosition);

        if (this.logging) {
          this.udpClient.sendMessage("CurrentPosition", String(this.accStates.CurrentPosition));
          this.udpClient.sendMessage("TargetPosition", String(this.accStates.TargetPosition));
        }
      }

      this.updateCurrentPositionAndTargetPositionQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentPositionAndTargetPositionQueued = true;
    };

  }

  windowLogoPosToHomebridgePos(value: number, convert: boolean): number {
    if (convert) {
      return (100 - value);
    } else {
      return value;
    }
  }

  windowLogoStateToHomebridgeState(value: number, convert: boolean): number {
    if (convert) {
      if (value == 0) {        // LOGO! Stop
        return 2;              // Homebridge STOPPED
      } else if (value == 1) { // LOGO! Up
        return 0;              // Homebridge DECREASING
      } else if (value == 2) { // LOGO! Down
        return 1;              // Homebridge INCREASING
      } else {
        return 2;              // Homebridge STOPPED
      }
    } else {
      return value;
    }
  }

}
