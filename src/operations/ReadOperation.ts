import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService } from '../ethernetIpConstants';

export class ReadOperation extends BaseOperation {
  private variable: string;
  private dataType: string;

  constructor(sessionHandle: number, variable: string, dataType: string) {
    super(sessionHandle);
    this.variable = variable;
    this.dataType = dataType;
  }

  private createPathForTag(tagName: string): Buffer {
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

  generatePacket(): CIPPacket {
    const path = this.createPathForTag(this.variable);
    return {
      service: CIPService.GET_ATTRIBUTE_SINGLE, // Esempio di servizio CIP per la lettura
      path: path,
      data: Buffer.alloc(0) // Dati vuoti per l'operazione di lettura
    };
  }

  parseResponse(response: Buffer): any {
    if (response.length === 1) {
        return response.readUInt8(0) !== 0; // Boolean
    } else if (response.length === 2) {
        return response.readInt16LE(0); // 16-bit integer
    } else if (response.length === 4) {
        return response.readFloatLE(0); // 32-bit float
    } else {
        return response.toString('utf8'); // String
    }


/*    switch (this.dataType) {
      case 'BOOL': return response.readUInt8(0) !== 0;
      case 'INT': return response.readInt16LE(0);
      case 'DINT': return response.readInt32LE(0);
      case 'REAL': return response.readFloatLE(0);
      default: throw new Error(`Unsupported type: ${this.dataType}`);
    }*/
  }
}