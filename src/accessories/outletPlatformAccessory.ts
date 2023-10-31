// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class OutletPlatformAccessory implements AccessoryPlugin {

  private model: string = "Outlet";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private inUseIsSet: boolean;
  private updateOnQueued: boolean;
  private updateInUseQueued: boolean;

  private accStates = {
    On: false,
    InUse: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.inUseIsSet = false;

    this.errorCheck();

    this.service = new this.api.hap.Service.Outlet(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onGet(this.getInUse.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateOnQueued = false;
    this.updateInUseQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
        if (this.inUseIsSet) {
          this.updateInUse();
        }
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.outletGet || !this.device.outletSetOn || !this.device.outletSetOff) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
    if (this.device.outletGetInUse) {
      this.inUseIsSet = true;
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
      qItem = new QueueSendItem(this.device.outletSetOn, value, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.outletSetOff, value, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  async getInUse(): Promise<CharacteristicValue> {
    
    let isInUse = this.inUseIsSet ? this.accStates.InUse : true;

    if (this.inUseIsSet) {
      this.updateInUse();
    }
    
    return isInUse;
  }

  updateOn() {

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.outletGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const on = value == 1 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, on);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, on);
      }

      this.updateOnQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    };

  }

  updateInUse() {
    
    if (this.updateInUseQueued){return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.outletGetInUse, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const inUse = value == 1 ? true : false;
        this.accStates.InUse = inUse;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get InUse -> %s', this.device.name, inUse);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.InUse, inUse);

      }

      this.updateInUseQueued = false;

    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateInUseQueued = true;
    }

  }

}
