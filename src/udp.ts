const UDP = require('dgram')

// ---------------------------

export class UdpClient {

  client = UDP.createSocket('udp4');
  hostname = 'localhost';

  port: number;
  
  constructor(port: number) {
    this.port = port;

    this.client.on('message', (message, info) => {
      // get the information about server address, port, and size of packet received.
      console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
      //read message from server
      console.log('Message from server', message.toString())
    })
    
  }

  sendMessage(name: string, characteristic: string, value: string) {

    const messageString: string = name + "|" + characteristic + "|" + value;

    const packet = Buffer.from(messageString);

    this.client.send(packet, this.port, this.hostname, (err) => {
      if (err) {
        console.error('Failed to send packet !!')
      } else {
        console.log('Packet send !!')
      }
    })


  }

}