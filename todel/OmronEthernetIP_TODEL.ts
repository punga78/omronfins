import net from 'net';
import dgram from 'dgram';
import { AssemblyInfo, AssemblyType, CIPMessage, CIPService, DEFAULT_TCP_PORT, DEFAULT_UDP_PORT, DeviceIdentity, EtherNetIPPacket, Protocol } from "./ethernetIpConstants";
import { OmronPLCBase } from './OmronPLCBase';
//import { OmronPLCInterface } from "./OmronPLCInterface";

export class OmronPLCEthernetIp extends OmronPLCBase {
  private tcpPort: number;
  private udpPort: number;
  private protocol: Protocol;
  private tcpSocket: net.Socket | null = null;
  private udpSocket: dgram.Socket | null = null;
  private sessionHandle: number = 0;

  constructor(host: string, protocol: Protocol = Protocol.TCP, tcpPort: number = DEFAULT_TCP_PORT, udpPort: number = DEFAULT_UDP_PORT) {
    super(host, udpPort, 0, 0)
    this.protocol = protocol;
    this.tcpPort = tcpPort;
    this.udpPort = udpPort;
  }

  private async connect(): Promise<void> {
    if (this.protocol === Protocol.TCP) {
      return this.connectTCP();
    } else {
      return this.connectUDP();
    }
  }

  private async connectTCP(): Promise<void> {
    if (this.tcpSocket && !this.tcpSocket.destroyed) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.tcpSocket = new net.Socket();
      this.tcpSocket.connect(this.tcpPort, this.host, () => {
        this.registerSession().then(resolve).catch(reject);
      });
      this.tcpSocket.on('error', reject);
    });
  }

  private async connectUDP(): Promise<void> {
    if (this.udpSocket) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.udpSocket = dgram.createSocket('udp4');
      this.udpSocket.on('error', reject);
      this.udpSocket.bind(() => {
        this.registerSession().then(resolve).catch(reject);
      });
    });
  }

  private async registerSession(): Promise<void> {
    const registerPacket: EtherNetIPPacket = {
      command: 0x65,
      length: 4,
      sessionHandle: 0,
      status: 0,
      senderContext: Buffer.alloc(8),
      options: 0,
      data: Buffer.from([1, 0, 0, 0])
    };

    const response = await this.sendPacket(registerPacket);
    this.sessionHandle = response.sessionHandle;
  }

  private async sendPacket(packet: EtherNetIPPacket): Promise<EtherNetIPPacket> {
    if (this.protocol === Protocol.TCP) {
      return this.sendPacketTCP(packet);
    } else {
      return this.sendPacketUDP(packet);
    }
  }

  private async sendPacketTCP(packet: EtherNetIPPacket): Promise<EtherNetIPPacket> {
    return new Promise((resolve, reject) => {
      if (!this.tcpSocket) {
        reject(new Error('TCP Socket not connected'));
        return;
      }

      const buffer = this.packetToBuffer(packet);
      this.tcpSocket.write(buffer);

      this.tcpSocket.once('data', (data) => {
        resolve(this.bufferToPacket(data));
      });
    });
  }

  private async sendPacketUDP(packet: EtherNetIPPacket): Promise<EtherNetIPPacket> {
    return new Promise((resolve, reject) => {
      if (!this.udpSocket) {
        reject(new Error('UDP Socket not connected'));
        return;
      }

      const buffer = this.packetToBuffer(packet);
      this.udpSocket.send(buffer, this.udpPort, this.host, (error) => {
        if (error) {
          reject(error);
        }
      });

      this.udpSocket.once('message', (data) => {
        resolve(this.bufferToPacket(data));
      });
    });
  }

  private packetToBuffer(packet: EtherNetIPPacket): Buffer {
    // Implementazione della conversione da pacchetto a buffer
    // ...
  }

  private bufferToPacket(buffer: Buffer): EtherNetIPPacket {
    // Implementazione della conversione da buffer a pacchetto
    // ...
  }

  private async sendCIPMessage(service: CIPService, path: Buffer, data: Buffer): Promise<Buffer> {
    const cipMessage: CIPMessage = { service, path, data };
    const packet: EtherNetIPPacket = {
      command: 0x6F,
      length: 2 + path.length + data.length,
      sessionHandle: this.sessionHandle,
      status: 0,
      senderContext: Buffer.alloc(8),
      options: 0,
      data: Buffer.concat([Buffer.from([service, path.length / 2]), path, data])
    };

    const response = await this.sendPacket(packet);
    if (response.status !== 0) {
      throw new Error(`CIP error: ${response.status}`);
    }

    return response.data.slice(2);  // Rimuovi i primi due byte (status e size) dal payload
  }

  public async readMemoryArea(address: string, length: number): Promise<number[]> {
    await this.connect();

    const { area, offset } = this.decodeAddress(address);
    const service = CIPService.GET_ATTRIBUTE_ALL;
    const path = Buffer.from([0x20, area, 0x24, ...this.numberToBuffer(offset, 2)]);
    const data = Buffer.from([...this.numberToBuffer(length, 2)]);

    const response = await this.sendCIPMessage(service, path, data);

    const result: number[] = [];
    for (let i = 0; i < response.length; i += 2) {
      result.push(response.readUInt16LE(i));
    }

    return result;
  }

  public async writeMemoryArea(address: string, data: number[]): Promise<void> {
    await this.connect();

    const { area, offset } = this.decodeAddress(address);
    const service = CIPService.SET_ATTRIBUTE_ALL;
    const path = Buffer.from([0x20, area, 0x24, ...this.numberToBuffer(offset, 2)]);
    const writeData = Buffer.alloc(data.length * 2);

    for (let i = 0; i < data.length; i++) {
      writeData.writeUInt16LE(data[i], i * 2);
    }

    await this.sendCIPMessage(service, path, writeData);
  }


  private numberToBuffer(num: number, length: number): Buffer {
    const buf = Buffer.alloc(length);
    buf.writeUIntLE(num, 0, length);
    return buf;
  }

  public close(): void {
    if (this.tcpSocket) {
      this.tcpSocket.destroy();
      this.tcpSocket = null;
    }
    if (this.udpSocket) {
      this.udpSocket.close();
      this.udpSocket = null;
    }
    this.sessionHandle = 0;
  }

  public async readVariable(tagName: string): Promise<number | boolean | string> {
    const service = CIPService.GET_ATTRIBUTE_SINGLE;
    const path = this.createPathForTag(tagName);
    const response = await this.sendCIPMessage(service, path, Buffer.alloc(0));
    
    return this.parseVariableResponse(response, tagName);
  }

  public async writeVariable(tagName: string, value: number | boolean | string): Promise<void> {
    const service = CIPService.SET_ATTRIBUTE_SINGLE;
    const path = this.createPathForTag(tagName);
    const data = this.createDataForValue(value);
    
    await this.sendCIPMessage(service, path, data);
  }

  private createPathForTag(tagName: string): Buffer {
    // Questa è una implementazione semplificata. La logica esatta dipenderà
    // da come sono configurate le variabili nel tuo PLC Omron.
    const segments = tagName.split('.');
    const path: number[] = [];

    segments.forEach(segment => {
      path.push(0x91); // Symbolic segment
      path.push(segment.length);
      segment.split('').forEach(char => {
        path.push(char.charCodeAt(0));
      });
      if (path.length % 2 !== 0) {
        path.push(0); // Padding
      }
    });

    return Buffer.from(path);
  }

  private createDataForValue(value: number | boolean | string): Buffer {
    if (typeof value === 'boolean') {
      const buffer = Buffer.alloc(1);
      buffer.writeUInt8(value ? 1 : 0, 0);
      return buffer;
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32LE(value, 0);
        return buffer;
      } else {
        const buffer = Buffer.alloc(4);
        buffer.writeFloatLE(value, 0);
        return buffer;
      }
    } else if (typeof value === 'string') {
      return Buffer.from(value, 'utf8');
    } else {
      throw new Error('Unsupported data type');
    }
  }

  private parseVariableResponse(response: Buffer, tagName: string): number | boolean | string {
    // La logica di parsing dipenderà dal tipo di dato della variabile
    // Questo è un esempio semplificato
    if (response.length === 1) {
      return response.readUInt8(0) !== 0; // Boolean
    } else if (response.length === 2) {
      return response.readInt16LE(0); // 16-bit integer
    } else if (response.length === 4) {
      return response.readFloatLE(0); // 32-bit float
    } else {
      return response.toString('utf8'); // String
    }
  }  

  public async getAssemblyList(): Promise<AssemblyInfo[]> {
    const service = CIPService.GET_ATTRIBUTE_ALL;
    const path = Buffer.from([0x20, 0x04, 0x24, 0x00]); // Assembly Object Class
    const response = await this.sendCIPMessage(service, path, Buffer.alloc(0));

    return this.parseAssemblyListResponse(response);
  }

  private parseAssemblyListResponse(response: Buffer): AssemblyInfo[] {
    const assemblies: AssemblyInfo[] = [];
    let offset = 0;

    // Saltiamo i primi 2 byte che indicano il numero di attributi
    offset += 2;

    while (offset < response.length) {
      const instanceId = response.readUInt16LE(offset);
      offset += 2;

      const size = response.readUInt16LE(offset);
      offset += 2;

      const type = this.getAssemblyType(instanceId);

      assemblies.push({
        instanceId,
        size,
        type
      });
    }

    return assemblies;
  }

  private getAssemblyType(instanceId: number): AssemblyType {
    // Questa è una semplificazione. La logica esatta dipenderà 
    // dal modello specifico del PLC Omron
    if (instanceId >= 100 && instanceId < 200) {
      return AssemblyType.INPUT;
    } else if (instanceId >= 200 && instanceId < 300) {
      return AssemblyType.OUTPUT;
    } else if (instanceId >= 300 && instanceId < 400) {
      return AssemblyType.CONFIG;
    } else {
      return AssemblyType.UNKNOWN;
    }
  }


  public async readDeviceIdentity(): Promise<DeviceIdentity> {
    const service = CIPService.GET_ATTRIBUTE_ALL;
    const path = Buffer.from([0x20, 0x01, 0x24, 0x01]); // Identity Object, Instance 1
    const response = await this.sendCIPMessage(service, path, Buffer.alloc(0));

    return this.parseIdentityResponse(response);
  }

  public async configureAssembly(assemblyInstance: number, data: Buffer): Promise<void> {
    const service = CIPService.SET_ATTRIBUTE_SINGLE;
    const path = Buffer.from([0x20, 0x04, 0x24, assemblyInstance, 0x30, 0x03]); // Assembly Object, specified instance, attribute 3
    await this.sendCIPMessage(service, path, data);
  }

  public async establishIOConnection(assemblyInstance: number, rpi: number, isProducer: boolean): Promise<number> {
    const service = CIPService.FORWARD_OPEN;
    const path = Buffer.from([0x20, 0x06, 0x24, 0x01]); // Connection Manager Object, Instance 1
    const connectionData = this.createConnectionRequestData(assemblyInstance, rpi, isProducer);
    const response = await this.sendCIPMessage(service, path, connectionData);

    return this.parseConnectionResponse(response);
  }

  private parseIdentityResponse(response: Buffer): DeviceIdentity {
    // Implementazione del parsing della risposta
  }

  public async setupPublisher(assemblyInstance: number, rpi: number): Promise<number> {
    const connectionId = await this.setupConnection(assemblyInstance, rpi, true);
    this.startPublishing(connectionId);
    return connectionId;
  }

  public async setupSubscriber(assemblyInstance: number, rpi: number): Promise<number> {
    const connectionId = await this.setupConnection(assemblyInstance, rpi, false);
    this.startListening();
    return connectionId;
  }

  private async setupConnection(assemblyInstance: number, rpi: number, isProducer: boolean): Promise<number> {
    const connectionPath = this.createConnectionPath(assemblyInstance);
    const connectionData = this.createConnectionRequestData(assemblyInstance, rpi, isProducer);
    
    const service = CIPService.FORWARD_OPEN;
    const path = Buffer.from([0x20, 0x06, 0x24, 0x01]); // Connection Manager Object, Instance 1
    
    const response = await this.sendCIPMessage(service, path, connectionData);
    const connectionId = this.parseConnectionResponse(response);

    this.connections.set(connectionId, { id: connectionId, assemblyInstance, rpi, isProducer });

    return connectionId;
  }

  private startPublishing(connectionId: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isProducer) return;

    setInterval(async () => {
      const data = await this.readAssemblyData(connection.assemblyInstance);
      this.publishData(connectionId, data);
    }, connection.rpi);
  }

  private async readAssemblyData(assemblyInstance: number): Promise<Buffer> {
    // Implementa la lettura dei dati dall'assembly
    // Questo è un esempio semplificato
    const service = CIPService.GET_ATTRIBUTE_ALL;
    const path = Buffer.from([0x20, 0x04, 0x24, assemblyInstance]);
    return this.sendCIPMessage(service, path, Buffer.alloc(0));
  }

  private publishData(connectionId: number, data: Buffer): void {
    // Invia i dati tramite UDP
    if (!this.udpSocket) {
      this.udpSocket = dgram.createSocket('udp4');
    }
    
    // Assumiamo che il target sia configurato per ricevere su una porta specifica
    // Nella pratica, questo dovrebbe essere configurato correttamente
    const targetPort = 2222;
    const targetIp = '255.255.255.255'; // Broadcast, in realtà dovresti usare l'IP corretto

    this.udpSocket.send(data, targetPort, targetIp);
  }

  private startListening(): void {
    if (this.udpSocket) return;

    this.udpSocket = dgram.createSocket('udp4');
    
    this.udpSocket.on('message', (msg, rinfo) => {
      // Trova la connessione corrispondente basata sui dati ricevuti
      // Questo è un esempio semplificato, nella pratica dovresti
      // implementare una logica più robusta per identificare la connessione
      for (const [connectionId, connection] of this.connections) {
        if (!connection.isProducer) {
          this.emit('data', connectionId, msg);
          break;
        }
      }
    });

    // Assumiamo che il subscriber ascolti sulla porta 2222
    // Nella pratica, questo dovrebbe essere configurato correttamente
    this.udpSocket.bind(2222);
  }

  public async updatePublishedData(connectionId: number, data: Buffer): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isProducer) throw new Error('Invalid connection');

    const service = CIPService.SET_ATTRIBUTE_ALL;
    const path = Buffer.from([0x20, 0x04, 0x24, connection.assemblyInstance]);
    await this.sendCIPMessage(service, path, data);
  }

  public onSubscribedData(connectionId: number, callback: (data: Buffer) => void): void {
    this.on('data', (id, data) => {
      if (id === connectionId) {
        callback(data);
      }
    });
  }

  private createConnectionPath(assemblyInstance: number): Buffer {
    return Buffer.from([0x20, 0x04, 0x24, assemblyInstance]); // Assembly Object, Instance
  }

  private createConnectionRequestData(assemblyInstance: number, rpi: number, isProducer: boolean): Buffer {
    // Questa è una versione semplificata. La struttura reale è più complessa.
    const data = Buffer.alloc(30); // La dimensione reale dipende dai parametri di connessione
    
    data.writeUInt16LE(0x0100, 0); // Priority/TimeOut ticks
    data.writeUInt32LE(0, 2);      // O->T Network Connection ID
    data.writeUInt32LE(0, 6);      // T->O Network Connection ID
    data.writeUInt16LE(0x4200, 10); // Connection Serial Number
    data.writeUInt16LE(0x4200, 12); // Originator Vendor ID
    data.writeUInt32LE(0, 14);     // Originator Serial Number
    data.writeUInt32LE(4 * rpi, 18); // O->T RPI
    data.writeUInt32LE(4 * rpi, 22); // T->O RPI
    data.writeUInt8(isProducer ? 0x01 : 0x00, 26); // Transport Type/Trigger
    
    return data;
  }

  private parseConnectionResponse(response: Buffer): number {
    // Implementazione del parsing della risposta
    // Ritorna l'ID della connessione
    return response.readUInt32LE(0);
  }

  public async closeConnection(connectionId: number): Promise<void> {
    const service = CIPService.FORWARD_CLOSE;
    const path = Buffer.from([0x20, 0x06, 0x24, 0x01]); // Connection Manager Object, Instance 1
    const data = Buffer.alloc(6);
    data.writeUInt16LE(0x4200, 0); // Connection Serial Number
    data.writeUInt16LE(0x4200, 2); // Originator Vendor ID
    data.writeUInt32LE(0, 4);     // Originator Serial Number
    
    await this.sendCIPMessage(service, path, data);
  }  

}
