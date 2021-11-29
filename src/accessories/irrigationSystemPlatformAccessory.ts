import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { md5 } from "../md5";

export class IrrigationSystemPlatformAccessory implements AccessoryPlugin {

  private model: string = "IrrigationSystem";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;

  private accStates = {
    Active: 0,
    ProgramMode: 0,
    InUse: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = (this.device.pushButton ? 1 : 0) || this.platform.pushButton;

    this.errorCheck();

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

  errorCheck() {
    if (!this.device.irrigationSystemGetActive || !this.device.irrigationSystemSetActiveOn || 
        !this.device.irrigationSystemSetActiveOff || !this.device.irrigationSystemGetProgramMode || !this.device.irrigationSystemGetInUse) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
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

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.irrigationSystemSetActiveOn, 1, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.irrigationSystemSetActiveOff, 1, this.pushButton);
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
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.irrigationSystemGetActive, async (value: number) => {

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
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.irrigationSystemGetProgramMode, async (value: number) => {

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
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.irrigationSystemGetInUse, async (value: number) => {

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
