const UDP = require('dgram')

export class UdpClient {

  client = UDP.createSocket('udp4');

  private platform: any;
  private device: any;
  
  constructor(platform: any, device: any) {

    this.platform = platform;
    this.device   = device;

    this.client.on('message', (message, info) => {
      // this.platform.log.info('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] [LOG] ACK <- %s', this.device.name, message.toString());
      }
    });
    
  }

  sendMessage(characteristic: string, value: string) {

    const messageString: string = this.device.name + "|" + characteristic + "|" + value;
    const packet = Buffer.from(messageString);

    this.client.send(packet, this.platform.loggingPort, this.platform.loggingIP, (err) => {
      if (err) {
        this.platform.log.error('[%s] [LOG] Failed to send packet -> %s', this.device.name, messageString);
      } else {
        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] [LOG] Packet send -> %s', this.device.name, messageString);
        }
      }
    });

  }

}