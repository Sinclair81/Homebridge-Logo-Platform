// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { md5 } from "../md5";

export class OtherPlatformAccessory implements AccessoryPlugin {

  private model: string = "Other";

  private api: API;
  private service: Service;
  private information: Service;

  public services: Service[];

  private platform: any;
  private device: any;

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;

    this.services = [];

    this.errorCheck();

    this.service = new this.api.hap.Service.Other(this.device.name);

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.services.push(this.service, this.information);

  }

  errorCheck() {

  }

  getServices(): Service[] {
    return this.services;
  }

}
