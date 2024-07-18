import net from 'net';
import { AssemblyInfo, CIPService, ComplexDataType, DeviceIdentity, EtherNetIPPacket } from './ethernetIpConstants';
import { ReadOperation } from './operations/ReadOperation';
import { WriteOperation } from './operations/WriteOperation';
import { ReadAttributeOperation } from './operations/ReadAttributeOperation';
import { ReadComplexVariableOperation } from './operations/ReadComplexVariableOperation';
import { EstablishIOConnectionOperation } from './operations/EstablishIOConnectionOperation';
import { GetAssemblyListOperation } from './operations/GetAssemblyListOperation';
import { ReadDeviceIdentityOperation } from './operations/ReadDeviceIdentityOperation';
import { GetSymbolListOperation } from './operations/GetSymbolListOperation';
import { ReadAssemblyDataOperation } from './operations/ReadAssemblyDataOperation';
import { ConfigureAssemblyOperation } from './operations/ConfigureAssemblyOperation';
import { WriteMemoryAreaOperation } from './operations/WriteMemoryAreaOperation';
import { ReadMemoryAreaOperation } from './operations/ReadMemoryAreaOperation';

export class OmronEthernetIp {
    private host: string;
    private port: number;
    private socket: net.Socket | null = null;
    private sessionHandle: number = 0;

    constructor(host: string, port: number = 44818) {
        this.host = host;
        this.port = port;
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            this.socket.connect(this.port, this.host, () => {
                this.registerSession().then(resolve).catch(reject);
            });
            this.socket.on('error', reject);
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
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            const buffer = this.packetToBuffer(packet);
            this.socket.write(buffer);

            this.socket.once('data', (data) => {
                resolve(this.bufferToPacket(data));
            });
        });
    }


    private packetToBuffer(packet: EtherNetIPPacket): Buffer {
        const headerSize = 24; // Size of the EtherNet/IP encapsulation header
        const totalSize = headerSize + packet.data.length;

        const buffer = Buffer.alloc(totalSize);

        // Write header
        buffer.writeUInt16LE(packet.command, 0);
        buffer.writeUInt16LE(packet.length, 2);
        buffer.writeUInt32LE(packet.sessionHandle, 4);
        buffer.writeUInt32LE(packet.status, 8);
        packet.senderContext.copy(buffer, 12, 0, 8); // Copy 8 bytes of sender context
        buffer.writeUInt32LE(packet.options, 20);

        // Write data
        packet.data.copy(buffer, headerSize);

        return buffer;
    }

    private bufferToPacket(buffer: Buffer): EtherNetIPPacket {
        const packet: EtherNetIPPacket = {
            command: buffer.readUInt16LE(0),
            length: buffer.readUInt16LE(2),
            sessionHandle: buffer.readUInt32LE(4),
            status: buffer.readUInt32LE(8),
            senderContext: buffer.subarray(12, 20),
            options: buffer.readUInt32LE(20),
            data: buffer.subarray(24)
        };

        return packet;
    }

    private async sendCIPMessage(service: CIPService, path: Buffer, data: Buffer): Promise<Buffer> {
        const cipMessage = { service, path, data };
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

        return response.data.subarray(2);
    }

    public async readVariable(variable: string, dataType: string): Promise<any> {
        const operation = new ReadOperation(this.sessionHandle, variable, dataType);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async writeVariable(variable: string, dataType: string, value: any): Promise<any> {
        const operation = new WriteOperation(this.sessionHandle, variable, dataType, value);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async readAttribute(classId: number, instanceId: number, attributeId: number): Promise<any> {
        const operation = new ReadAttributeOperation(this.sessionHandle, classId, instanceId, attributeId);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async readMemoryArea(address: string, length: number): Promise<number[]> {
        const operation = new ReadMemoryAreaOperation(this.sessionHandle, address, length);
        const { service, path, data: readData } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, readData);
        return operation.parseResponse(responseBuffer);
    }

    public async writeMemoryArea(address: string, data: number[]): Promise<void> {
        const operation = new WriteMemoryAreaOperation(this.sessionHandle, address, data);
        const { service, path, data: writeData } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, writeData);
        return operation.parseResponse(responseBuffer);
    }

    public async getAssemblyList(): Promise<AssemblyInfo[]> {
        const operation = new GetAssemblyListOperation(this.sessionHandle);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async readDeviceIdentity(): Promise<DeviceIdentity> {
        const operation = new ReadDeviceIdentityOperation(this.sessionHandle);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async configureAssembly(assemblyInstanceId: number, configurationData: Buffer): Promise<void> {
        const operation = new ConfigureAssemblyOperation(this.sessionHandle, assemblyInstanceId, configurationData);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async readAssemblyData(assemblyInstanceId: number): Promise<Buffer> {
        const operation = new ReadAssemblyDataOperation(this.sessionHandle, assemblyInstanceId);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async establishIOConnection(assemblyInstance: number, rpi: number, isProducer: boolean): Promise<any> {
        const operation = new EstablishIOConnectionOperation(this.sessionHandle, assemblyInstance, rpi, isProducer);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public close(): void {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.sessionHandle = 0;
    }

    public async getSymbolList(): Promise<string[]> {

        const operation = new GetSymbolListOperation(this.sessionHandle);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async readComplexVariable(tagName: string, dataType: ComplexDataType): Promise<any> {
        const operation = new ReadComplexVariableOperation(this.sessionHandle, tagName, dataType);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data);
        return operation.parseResponse(responseBuffer);
    }

    public async sendMultipleServicePacket(services: Array<{ service: CIPService, path: Buffer, data: Buffer }>): Promise<Buffer[]> {
        const multipleServiceData = Buffer.concat(
            services.map(s => Buffer.concat([
                Buffer.from([s.service, s.path.length / 2]),
                s.path,
                s.data
            ]))
        );

        const response = await this.sendCIPMessage(CIPService.MULTIPLE_SERVICE_PACKET, Buffer.alloc(0), multipleServiceData);

        // Parse the response and return an array of individual service responses
        const results: Buffer[] = [];
        let offset = 2; // Skip the first two bytes (number of services)
        while (offset < response.length) {
            const serviceResponseLength = response.readUInt16LE(offset);
            results.push(response.subarray(offset + 2, offset + 2 + serviceResponseLength));
            offset += 2 + serviceResponseLength;
        }

        return results;
    }

}