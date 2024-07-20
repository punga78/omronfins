import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService } from '../ethernetIpConstants';

interface ComplexDataType {
  type: string;
  members?: { [key: string]: string | ComplexDataType };
  length?: number;
  elementType?: string | ComplexDataType;
}

export class ReadComplexVariableOperation extends BaseOperation {
  private variable: string;
  private dataType: ComplexDataType;

  constructor(sessionHandle: number, variable: string, dataType: ComplexDataType) {
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
      service: CIPService.GET_ATTRIBUTE_SINGLE,
      path: path,
      data: Buffer.alloc(0) // Dati vuoti per l'operazione di lettura
    };
  }

  parseResponse(response: Buffer): any {
    return this.parseComplexVariableResponse(response, this.dataType);
  }

  private parseComplexVariableResponse(response: Buffer, dataType: ComplexDataType): any {
    if (dataType.type === 'struct') {
      const result: any = {};
      let offset = 0;
      for (const [key, type] of Object.entries(dataType.members!)) {
        if (typeof type === 'string') {
          result[key] = this.parsePrimitiveType(response.subarray(offset), type);
          offset += this.getSizeOfType(type);
        } else {
          result[key] = this.parseComplexVariableResponse(response.subarray(offset), type);
          offset += this.getSizeOfComplexType(type);
        }
      }
      return result;
    } else if (dataType.type === 'array') {
      const result : (number | boolean)[] = [];
      let offset = 0;
      for (let i = 0; i < dataType.length!; i++) {
        if (typeof dataType.elementType === 'string') {
          result.push(this.parsePrimitiveType(response.subarray(offset), dataType.elementType));
          offset += this.getSizeOfType(dataType.elementType);
        } else {
          result.push(this.parseComplexVariableResponse(response.subarray(offset), dataType.elementType as ComplexDataType));
          offset += this.getSizeOfComplexType(dataType.elementType as ComplexDataType);
        }
      }
      return result;
    }
  }

  private parsePrimitiveType(data: Buffer, type: string): number | boolean {
    switch (type) {
      case 'BOOL': return data.readUInt8(0) !== 0;
      case 'INT': return data.readInt16LE(0);
      case 'DINT': return data.readInt32LE(0);
      case 'REAL': return data.readFloatLE(0);
      default: throw new Error(`Unsupported type: ${type}`);
    }
  }

  private getSizeOfType(type: string): number {
    switch (type) {
      case 'BOOL': return 1;
      case 'INT': return 2;
      case 'DINT':
      case 'REAL': return 4;
      default: throw new Error(`Unsupported type: ${type}`);
    }
  }

  private getSizeOfComplexType(type: ComplexDataType): number {
    if (type.type === 'struct') {
      return Object.values(type.members!).reduce((sum, t) =>
        sum + (typeof t === 'string' ? this.getSizeOfType(t) : this.getSizeOfComplexType(t)), 0);
    } else if (type.type === 'array') {
      return type.length! * (typeof type.elementType === 'string' ?
        this.getSizeOfType(type.elementType) : this.getSizeOfComplexType(type.elementType as ComplexDataType));
    }
    throw new Error('Invalid complex type');
  }
}
