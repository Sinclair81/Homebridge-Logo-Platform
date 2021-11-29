import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class BlindPlatformAccessory implements AccessoryPlugin {

  private model: string = "Blind";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    CurrentPosition: 0,
    PositionState: 0,   // 0 - DECREASING; 1 - INCREASING; 2 - STOPPED
    TargetPosition: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.errorCheck();

    this.service = new this.api.hap.Service.WindowCovering(this.device.name);

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

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentPosition();
        this.updatePositionState();
        this.updateTargetPosition();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.blindSetTargetPos || !this.device.blindGetTargetPos || !this.device.blindGetPos || !this.device.blindGetState) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
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

    let qItem: QueueItem = new QueueItem(this.device.blindSetTargetPos, true, this.blindLogoPosToHomebridgePos(value as number, this.device.blindConvertValue));
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
    
    let qItem: QueueItem = new QueueItem(this.device.blindGetPos, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.CurrentPosition = this.blindLogoPosToHomebridgePos(value as number, this.device.blindConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentPosition -> %i', this.device.name, this.accStates.CurrentPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentPosition, this.accStates.CurrentPosition);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updatePositionState() {
    
    let qItem: QueueItem = new QueueItem(this.device.blindGetState, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.PositionState = this.blindLogoStateToHomebridgeState(value as number, this.device.blindConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get PositionState -> %i', this.device.name, this.accStates.PositionState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.PositionState, this.accStates.PositionState);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateTargetPosition() {
    
    let qItem: QueueItem = new QueueItem(this.device.blindGetTargetPos, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.TargetPosition = this.blindLogoPosToHomebridgePos(value as number, this.device.blindConvertValue);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get TargetPosition -> %i', this.device.name, this.accStates.TargetPosition);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetPosition, this.accStates.TargetPosition);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  blindLogoPosToHomebridgePos(value: number, convert: boolean): number {
    if (convert) {
      return (100 - value);
    } else {
      return value;
    }
  }

  blindLogoStateToHomebridgeState(value: number, convert: boolean): number {
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
