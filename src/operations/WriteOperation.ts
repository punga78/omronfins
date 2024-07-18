import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService } from '../ethernetIpConstants';

export class WriteOperation extends BaseOperation {
    private variable: string;
    private dataType: string;
    private value: number | boolean | string;

    constructor(sessionHandle: number, variable: string, dataType: string, value: number | boolean | string) {
        super(sessionHandle);
        this.variable = variable;
        this.dataType = dataType;
        this.value = value;
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
/*
    private convertValueToBuffer(): Buffer {
        const buffer = Buffer.alloc(this.getSizeOfType(this.dataType));
        switch (this.dataType) {
            case 'BOOL': buffer.writeUInt8(this.value ? 1 : 0, 0); break;
            case 'INT': buffer.writeInt16LE(this.value, 0); break;
            case 'DINT': buffer.writeInt32LE(this.value, 0); break;
            case 'REAL': buffer.writeFloatLE(this.value, 0); break;
            default: throw new Error(`Unsupported type: ${this.dataType}`);
        }
        return buffer;
    }

    private getSizeOfType(type: string): number {
        switch (type) {
            case 'BOOL': return 1;
            case 'INT': return 2;
            case 'DINT': return 4;
            case 'REAL': return 4;
            default: throw new Error(`Unsupported type: ${type}`);
        }
    }*/

    generatePacket(): CIPPacket {
        const path = this.createPathForTag(this.variable);
        const data = this.createDataForValue(this.value);
        return {
            service: CIPService.SET_ATTRIBUTE_SINGLE, // Esempio di servizio CIP per la scrittura
            path: path,
            data: data
        };
    }

    parseResponse(response: Buffer): any {
        if (response.length === 0 || response.readUInt8(0) !== 0) {
            throw new Error('Write operation failed');
        }
        return true;
    }
}
