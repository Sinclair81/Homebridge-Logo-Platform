// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";
import { UdpClient } from '../udp';

import { LogSwitchPlatformAccessory } from '../logging/logSwitchPlatformAccessory'; // <-- Logger

export class SwitchPlatformAccessory implements AccessoryPlugin {

  private model: string = "Switch";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateOnQueued: boolean;

  private udpClient: UdpClient;

  private logger: any[]; // <-- Logger
  public services: Service[]; // <-- Logger

  private accStates = {
    On: false,
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

    this.logger = []; // <-- Logger
    this.services = []; // <-- Logger

    this.errorCheck();

    this.service = new this.api.hap.Service.Switch(this.device.name);

    this.service.subtype = 'main';

    this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.services.push(this.service, this.information); // <-- Logger

    this.updateOnQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
      }, this.platform.config.updateInterval);

    }

    // ------------------------------------------------------------------------
    /* im Übergeortneten Accessory:
    private valveAccessories: any[];
    public services: Service[];
    this.valveAccessories = [];
    const configDevices = this.platform.config.devices;
    for (const dev of configDevices) {
    this.valveAccessories.push(new ValvePlatformAccessory(api, platform, dev, this)); <-- this == parent !!!!
    this.services.push(this.service, this.information);
    getServices(): Service[] {
      return this.services;
    }
    }
    for (const dev of this.valveAccessories) {
      isInUse |= dev.getInUse();
    }
    // ------------------------------------------------------------------------
    /* im untergeortneten Accessory:
    this.service = new this.api.hap.Service.Valve(this.device.name, this.device.valveZone); <-- geht eventuel nur bei Valve !?!
    this.service.setCharacteristic(this.platform.Characteristic.ServiceLabelIndex, this.device.valveZone);
    parent.service.addLinkedService(this.service);
    parent.services.push(this.service);
    */

    // --> Logger
    // multiple switches for InfluxDB, Fagato, ...
    this.platform.log.error('-1-');
    this.logger.push(new LogSwitchPlatformAccessory(api, platform, device, this));

  }

  errorCheck() {
    if (!this.device.switchGet || !this.device.switchSetOn || !this.device.switchSetOff) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    // return [ this.information, this.service ];
    return this.services; // <-- Logger
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.switchSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.switchSetOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  updateOn() {

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.switchGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const on = value == 1 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);

        if (this.logging) {
          this.udpClient.sendMessage("On", String(this.accStates.On));
        }
      }

      this.updateOnQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    };

  }

}
