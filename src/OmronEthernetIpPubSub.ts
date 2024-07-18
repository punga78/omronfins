import dgram from 'dgram';
import { EventEmitter } from 'events';
import { OmronEthernetIp } from './OmronEthernetIp';

interface Connection {
  id: number;
  assemblyInstance: number;
  rpi: number;
  isProducer: boolean;
}

export class OmronEthernetIpPubSub extends EventEmitter {
  private connections: Map<number, Connection> = new Map();
  private udpSocket: dgram.Socket | null = null;
  private udpPort: number;
  private omronEthernetIp :OmronEthernetIp;

  constructor(omronEthernetIp :OmronEthernetIp, udpPort: number = 2222) {
    super();
    this.udpPort = udpPort;
    this.omronEthernetIp = omronEthernetIp;
  }

  public async setupSubscriber(assemblyInstance: number, rpi: number): Promise<number> {
    const connectionId = await this.setupConnection(assemblyInstance, rpi, false);
    this.startListening();
    return connectionId;
  }

  private async setupConnection(assemblyInstance: number, rpi: number, isProducer: boolean): Promise<number> {
    const connectionId = await this.omronEthernetIp.establishIOConnection(assemblyInstance, rpi, isProducer)
    this.connections.set(connectionId, { id: connectionId, assemblyInstance, rpi, isProducer });

    return connectionId;
  }


  private startListening(): void {
    if (this.udpSocket) return;

    this.udpSocket = dgram.createSocket('udp4');
    
    this.udpSocket.on('message', (msg, rinfo) => {
      for (const [connectionId, connection] of this.connections) {
        if (!connection.isProducer) {
          this.emit('data', connectionId, msg);
          break;
        }
      }
    });

    this.udpSocket.bind(this.udpPort);
  }

  public onSubscribedData(connectionId: number, callback: (data: Buffer) => void): void {
    this.on('data', (id, data) => {
      if (id === connectionId) {
        callback(data);
      }
    });
  }

  public close(): void {
    if (this.udpSocket) {
      this.udpSocket.close();
      this.udpSocket = null;
    }
    this.connections.clear();
  }
}