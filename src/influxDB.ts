
import { InfluxDB, Point } from '@influxdata/influxdb-client';

import { LoggerType } from "./logger";

export class InfluxDBLogger {

  private platform: any;
  private url: any;
  private token: any;
  private org: any;
  private bucket: any;

  private influxDB: any;

  public isConfigured: boolean;

  constructor(platform: any, config: any) {

    this.platform     = platform;
    this.url          = config.influxDBUrl;
    this.token        = config.influxDBToken;
    this.org          = config.influxDBOrg;
    this.bucket       = config.influxDBBucket;
    this.isConfigured = true;

    this.errorCheck();

    if (this.isConfigured) {
      const url     = this.url;
      const token   = this.token;
      this.influxDB = new InfluxDB({ url, token });
    }
    
  }

  errorCheck() {
    if (this.platform.loggerType != LoggerType.InfluxDB) {
      this.isConfigured = false;
    } else {
      if (!this.url || !this.token || !this.org || !this.bucket) {
        this.platform.log.error('[Logger] One or more config items are not correct!');
        this.isConfigured = false;
      }
    }
  }

  logBooleanValue(name: string, characteristic: string, value: boolean) {

    if (this.platform.config.debugMsgLog) {
      this.platform.log.info('[%s] LOG Characteristic %s -> %s', name, characteristic, value);
    }

    const writeApi = this.influxDB.getWriteApi(this.org, this.bucket);
    writeApi.useDefaultTags({ device: String(this.platform.config.name) });

    const point1 = new Point(name)
      .intField(characteristic, this.boolToNumber(value));

    writeApi.writePoint(point1);
    writeApi.close().then(() => {
      if (this.platform.config.debugMsgLog) {
        this.platform.log.info('[%s] LOG WRITE FINISHED', name);
      }
    });

  }

  logIntegerValue(name: string, characteristic: string, value: number) {

    if (this.platform.config.debugMsgLog) {
      this.platform.log.info('[%s] LOG Characteristic %s -> %i', name, characteristic, value);
    }

    const writeApi = this.influxDB.getWriteApi(this.org, this.bucket);
    writeApi.useDefaultTags({ device: String(this.platform.config.name) });

    const point1 = new Point(name)
      .intField(characteristic, value);

    writeApi.writePoint(point1);
    writeApi.close().then(() => {
      if (this.platform.config.debugMsgLog) {
        this.platform.log.info('[%s] LOG WRITE FINISHED', name);
      }
    });

  }

  logFloatValue(name: string, characteristic: string, value: number) {

    if (this.platform.config.debugMsgLog) {
      this.platform.log.info('[%s] LOG Characteristic %s -> %f', name, characteristic, value);
    }

    const writeApi = this.influxDB.getWriteApi(this.org, this.bucket);
    writeApi.useDefaultTags({ device: String(this.platform.config.name) });

    const point1 = new Point(name)
      .floatField(characteristic, value);

    writeApi.writePoint(point1);
    writeApi.close().then(() => {
      if (this.platform.config.debugMsgLog) {
        this.platform.log.info('[%s] LOG WRITE FINISHED', name);
      }
    });

  }

  boolToNumber(bool: boolean): number {
    if (String(bool) === 'true') {
      return 1;
    }
    if (String(bool) === '1') {
      return 1;
    }
    return 0;
  }

}