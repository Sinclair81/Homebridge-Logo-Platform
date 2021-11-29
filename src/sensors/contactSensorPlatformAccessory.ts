import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { md5 } from "../md5";

export class ContactSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Contact Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private sensStates = {
    ContactSensorState: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.errorCheck();

    this.service = new this.api.hap.Service.ContactSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
      .onGet(this.getContactSensorState.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateContactSensorState();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.contact) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getContactSensorState(): Promise<CharacteristicValue> {
    
    const isContactSensorState = this.sensStates.ContactSensorState;
    this.updateContactSensorState();

    return isContactSensorState;
  }

  updateContactSensorState() {
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.contact, async (value: number) => {

      if (value != -1) {

        this.sensStates.ContactSensorState = (value as number == 1 ? 0 : 1) ;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get ContactSensorState -> %i', this.device.name, this.sensStates.ContactSensorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.ContactSensorState, this.sensStates.ContactSensorState);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
