import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class GaragedoorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Garagedoor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    CurrentDoorState: 1,
    TargetDoorState: 1,
    ObstructionDetected: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

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

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentDoorState();
        this.updateTargetDoorState();
        this.updateObstructionDetected();
      }, this.platform.config.updateInterval);

    }
    
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setTargetDoorState(value: CharacteristicValue) {
    
    this.accStates.TargetDoorState = value as number;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set TargetDoorState <- %i', this.device.name, value);
    }

    let qItem: QueueItem = new QueueItem(this.device.garagedoorSetTargetState, true, this.accStates.TargetDoorState);
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
    
    let qItem: QueueItem = new QueueItem(this.device.garagedoorGetState, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.CurrentDoorState = value as number;

        if (this.platform.config.debugMsgLog == true) {
          this.platform.log.info('[%s] Get CurrentDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateTargetDoorState() {
    
    let qItem: QueueItem = new QueueItem(this.device.garagedoorGetTargetState, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.TargetDoorState = value as number;

        if (this.platform.config.debugMsgLog == true) {
          this.platform.log.info('[%s] Get TargetDoorState -> %i', this.device.name, this.accStates.TargetDoorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateObstructionDetected() {

    if (this.device.garagedoorObstruction) {

      let qItem: QueueItem = new QueueItem(this.device.garagedoorObstruction, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.accStates.ObstructionDetected = (value == 1 ? true : false);
  
          if (this.platform.config.debugMsgLog == true) {
            this.platform.log.info('[%s] Get ObstructionDetected -> %s', this.device.name, this.accStates.ObstructionDetected);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.ObstructionDetected, this.accStates.ObstructionDetected);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);
      
    }
    
  }

}
