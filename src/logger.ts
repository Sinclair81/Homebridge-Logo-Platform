export class LoggerType {
  static None: string     = 'none';
  static InfluxDB: string = 'influxDB';
  static Fakegato: string = 'fakegato';
}

export class LoggerInterval {
  static T_30Sec: number = 30000;
  static T_5Min: number  = 300000;
}