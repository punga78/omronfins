// OmronEthernetIP.ts

import { Socket } from 'net';
import * as dgram from 'dgram';
import * as crypto from 'crypto';
import { EncapsulationHeader, CIPMessage, SessionInfo, DeviceInfo } from './ethernetIpTypes';
import { ENCAPSULATION_COMMANDS, CIP_COMMON_SERVICES, CIP_OBJECT_CLASSES, ETHERNET_IP_PORTS } from './ethernetIpConstants';
import { OmronPLCInterface } from './OmronPLCInterface';

export class OmronEthernetIP implements OmronPLCInterface {
  private tcpSocket: Socket;
  private udpSocket: dgram.Socket;
  private sessionInfo: SessionInfo;
  private deviceInfo: DeviceInfo;

  constructor(private ipAddress: string) {
    this.tcpSocket = new Socket();
    this.udpSocket = dgram.createSocket('udp4');
    this.sessionInfo = {} as SessionInfo;
    this.deviceInfo = {} as DeviceInfo;
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tcpSocket.connect(ETHERNET_IP_PORTS.TCP, this.ipAddress, () => {
        this.registerSession()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async registerSession(): Promise<void> {
    const registerSessionRequest: EncapsulationHeader = {
      command: ENCAPSULATION_COMMANDS.REGISTER_SESSION,
      length: 4,
      sessionHandle: 0,
      status: 0,
      senderContext: new Uint8Array(8),
      options: 0
    };

    // Implementare la logica per inviare la richiesta e gestire la risposta
    // Impostare this.sessionInfo con le informazioni della sessione
  }

  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.tcpSocket.end(() => {
        this.udpSocket.close(() => {
          resolve();
        });
      });
    });
  }

  public async readMemoryArea(address: string, length: number): Promise<Buffer> {
    // Analizza l'indirizzo
    const { area, channel, bit } = this.parseAddress(address);
  
    // Costruisci il percorso CIP
    const path = this.buildMemoryAreaPath(area, channel, bit);
  
    // Costruisci il messaggio CIP
    const cipMessage: CIPMessage = {
      service: CIP_COMMON_SERVICES.READ_DATA,
      path: path,
      data: Buffer.alloc(2)
    };
  
    // Imposta la lunghezza dei dati da leggere
    //TODO:cipMessage.data!.writeUInt16LE(length, 0);
  
    // Invia la richiesta e ottieni la risposta
    const response = await this.sendRRData(cipMessage);
  
    // Verifica lo stato della risposta
    const status = response.readUInt16LE(0);
    if (status !== 0) {
      throw new Error(`CIP error: ${status}`);
    }
  
    // Estrai i dati dalla risposta
    return Buffer.from(response.subarray(2));
  }
  
  private parseAddress(address: string): { area: number, channel: number, bit?: number } {
    const match = address.match(/([A-Z]):(\d+)(\.(\d+))?/);
    if (!match) {
      throw new Error('Invalid address format');
    }
  
    const areaCode = match[1];
    const channel = parseInt(match[2], 10);
    const bit = match[4] ? parseInt(match[4], 10) : undefined;
  
    let area: number;
    switch (areaCode) {
      case 'C':
        area = 0x80; // CIO area
        break;
      case 'W':
        area = 0x81; // Work area
        break;
      case 'H':
        area = 0x82; // Holding area
        break;
      case 'A':
        area = 0xB0; // Auxiliary area
        break;
      case 'D':
        area = 0x83; // Data area
        break;
      default:
        throw new Error('Unknown memory area');
    }
  
    return { area, channel, bit };
  }
  
  private buildMemoryAreaPath(area: number, channel: number, bit?: number): Buffer {
    const path = Buffer.alloc(4);
    path.writeUInt8(0x91, 0); // Path segment for symbolic addressing
    path.writeUInt8(area, 1);
    path.writeUInt16LE(channel, 2);
    
    if (bit !== undefined) {
      const extendedPath = Buffer.alloc(6);
      path.copy(extendedPath);
      extendedPath.writeUInt16LE(bit, 4);
      return extendedPath;
    }
  
    return path;
  }
  
  public async writeMemoryArea(address: string, data: Buffer): Promise<void> {
    // Implementare la logica per scrivere nell'area di memoria
    throw new Error("Method not implemented.");
  }

  public async run(): Promise<void> {
    // Implementare la logica per avviare il PLC
    throw new Error("Method not implemented.");
  }

  public async stop(): Promise<void> {
    // Implementare la logica per fermare il PLC
    throw new Error("Method not implemented.");
  }

  public async readControllerData(): Promise<Buffer> {
    // Implementare la logica per leggere i dati del controller
    throw new Error("Method not implemented.");
  }

  public async readControllerStatus(): Promise<Buffer> {
    // Implementare la logica per leggere lo stato del controller
    throw new Error("Method not implemented.");
  }

  private async sendRRData(cipMessage: CIPMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const interfaceHandle = 0;
      const timeout = 10; // secondi
  
      const encapsulationHeader: EncapsulationHeader = {
        command: ENCAPSULATION_COMMANDS.SEND_RR_DATA,
        length: 16 + cipMessage.path.length + (cipMessage.data ? cipMessage.data.length : 0),
        sessionHandle: this.sessionInfo.sessionHandle,
        status: 0,
        senderContext: crypto.randomBytes(8),
        options: 0
      };
  
      const buffer = Buffer.alloc(24 + encapsulationHeader.length);
      
      buffer.writeUInt16LE(encapsulationHeader.command, 0);
      buffer.writeUInt16LE(encapsulationHeader.length, 2);
      buffer.writeUInt32LE(encapsulationHeader.sessionHandle, 4);
      buffer.writeUInt32LE(encapsulationHeader.status, 8);
      buffer.set(encapsulationHeader.senderContext, 12);
      buffer.writeUInt32LE(encapsulationHeader.options, 20);
  
      buffer.writeUInt32LE(interfaceHandle, 24);
      buffer.writeUInt16LE(timeout, 28);
  
      buffer.writeUInt16LE(cipMessage.service, 30);
      buffer.writeUInt8(cipMessage.path.length / 2, 32);
      buffer.set(cipMessage.path, 33);
      
      if (cipMessage.data) {
        buffer.set(cipMessage.data, 33 + cipMessage.path.length);
      }
  
      this.tcpSocket.write(buffer, (err) => {
        if (err) {
          reject(err);
          return;
        }
  
        this.tcpSocket.once('data', (data) => {
          const status = data.readUInt32LE(8);
          if (status !== 0) {
            reject(new Error(`EtherNet/IP error: ${status}`));
            return;
          }
  
          const cipData = Buffer.from(data.subarray(30));
          resolve(cipData);
        });
      });
    });
  }
  
  private async sendUnitData(cipMessage: CIPMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      const interfaceHandle = 0;
  
      const encapsulationHeader: EncapsulationHeader = {
        command: ENCAPSULATION_COMMANDS.SEND_UNIT_DATA,
        length: 16 + cipMessage.path.length + (cipMessage.data ? cipMessage.data.length : 0),
        sessionHandle: this.sessionInfo.sessionHandle,
        status: 0,
        senderContext: crypto.randomBytes(8),
        options: 0
      };
  
      const buffer = Buffer.alloc(24 + encapsulationHeader.length);
      
      buffer.writeUInt16LE(encapsulationHeader.command, 0);
      buffer.writeUInt16LE(encapsulationHeader.length, 2);
      buffer.writeUInt32LE(encapsulationHeader.sessionHandle, 4);
      buffer.writeUInt32LE(encapsulationHeader.status, 8);
      buffer.set(encapsulationHeader.senderContext, 12);
      buffer.writeUInt32LE(encapsulationHeader.options, 20);
  
      buffer.writeUInt32LE(interfaceHandle, 24);
      buffer.writeUInt16LE(0, 28); // timeout not used for UDP
  
      buffer.writeUInt16LE(cipMessage.service, 30);
      buffer.writeUInt8(cipMessage.path.length / 2, 32);
      buffer.set(cipMessage.path, 33);
      
      if (cipMessage.data) {
        buffer.set(cipMessage.data, 33 + cipMessage.path.length);
      }
  
      this.udpSocket.send(buffer, ETHERNET_IP_PORTS.UDP, this.ipAddress, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async sendImplicitMessage(assemblyInstance: number, data: Buffer): Promise<void> {
    const cipMessage: CIPMessage = {
      service: CIP_COMMON_SERVICES.SET_ATTRIBUTE_ALL,
      path: Buffer.from([0x20, assemblyInstance]),
      data: data
    };

    return this.sendUnitData(cipMessage);
  }
}