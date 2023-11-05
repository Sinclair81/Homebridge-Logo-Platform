export class LoggerType {
  static None: string     = 'none';
  static InfluxDB: string = 'influxDB';
  static Fakegato: string = 'fakegato';
}

export class LoggerInterval {
  static T_30Sec: number = 30000;
  static T_5Min: number  = 300000;
}

export class InfluxDBFild {
  static Bool: number = 0;
  static Int: number = 1;
  static Float: number = 2;
}

export class InfluxDBLogItem {
  constructor(
    public characteristic: string,
    public value: any,
    public type: InfluxDBFild
) {}
}