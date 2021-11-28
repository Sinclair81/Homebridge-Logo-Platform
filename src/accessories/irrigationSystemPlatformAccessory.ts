import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class IrrigationSystemPlatformAccessory implements AccessoryPlugin {

  private model: string = "IrrigationSystem";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    Active: 0,
    ProgramMode: 0,
    InUse: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.service = new this.api.hap.Service.IrrigationSystem(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setActive.bind(this))
      .onGet(this.getActive.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ProgramMode)
      .onGet(this.getProgramMode.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onGet(this.getInUse.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateActive();
        this.updateProgramMode();
        this.updateInUse();
      }, this.platform.config.updateInterval);

    }
    
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setActive(value: CharacteristicValue) {
    
    this.accStates.Active = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set Active <- %i', this.device.name, value);
    }

    let qItem: QueueItem;
    if (value) {
      qItem = new QueueItem(this.device.irrigationSystemSetActiveOn, true, 1);
    } else {
      qItem = new QueueItem(this.device.irrigationSystemSetActiveOff, true, 1);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getActive(): Promise<CharacteristicValue> {
    
    const isActive = this.accStates.Active;
    this.updateActive();

    return isActive;
  }

  async getProgramMode(): Promise<CharacteristicValue> {
    
    const isProgramMode = this.accStates.ProgramMode;
    this.updateProgramMode();

    return isProgramMode;
  }

  async getInUse(): Promise<CharacteristicValue> {
    
    const isInUse = this.accStates.InUse;
    this.updateInUse();

    return isInUse;
  }

  updateActive() {
    
    let qItem: QueueItem = new QueueItem(this.device.irrigationSystemGetActive, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.Active = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Active -> %i', this.device.name, this.accStates.Active);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.Active, this.accStates.Active);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateProgramMode() {
    
    let qItem: QueueItem = new QueueItem(this.device.irrigationSystemGetProgramMode, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.ProgramMode = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get ProgramMode -> %i', this.device.name, this.accStates.ProgramMode);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.ProgramMode, this.accStates.ProgramMode);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateInUse() {
    
    let qItem: QueueItem = new QueueItem(this.device.irrigationSystemGetInUse, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.InUse = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get InUse -> %i', this.device.name, this.accStates.InUse);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.InUse, this.accStates.InUse);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
