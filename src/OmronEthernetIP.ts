import net from 'net';
import { AssemblyInfo, CIPService, CommandSpecificData, ComplexDataType, CONNECTION_ADDRESS_ITEM, 
        CONNECTION_DATA_ITEM, DataItem, DeviceIdentity, EtherNetIPCommand, EtherNetIPPacket, ListServicesData, NULL_ADDRESS_ITEM, RegisterSessionData, SendData, ServiceInfo, UNCONNECTED_DATA_ITEM } from './ethernetIpConstants';
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
import { OmronEthernetIpError } from './OmronEthernetIpError';

export class OmronEthernetIp {
    private host: string;
    private port: number;
    private socket: net.Socket | null = null;
    private sessionHandle: number = 0;
    private connectionID: number | null = null;

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
            command: EtherNetIPCommand.REGISTER_SESSION,
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

    public async unRegisterSession(): Promise<void> {
        const registerPacket: EtherNetIPPacket = {
            command: EtherNetIPCommand.UNREGISTER_SESSION,
            length: 0,
            sessionHandle: this.sessionHandle,
            status: 0,
            senderContext: Buffer.alloc(8),
            options: 0,
            data: Buffer.alloc(0)
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
        const headerSize = 24;
        let commandSpecificSize = 0;
        let commandSpecificBuffer = Buffer.alloc(0);

        if (packet.commandSpecificData) {
            commandSpecificBuffer = this.commandSpecificDataToBuffer(packet.command, packet.commandSpecificData);
            commandSpecificSize = commandSpecificBuffer.length;
        }

        const totalSize = headerSize + commandSpecificSize + packet.data.length;
        const buffer = Buffer.alloc(totalSize);

        let offset = 0;
        buffer.writeUInt16LE(packet.command, offset); offset += 2;
        buffer.writeUInt16LE(packet.length, offset); offset += 2;
        buffer.writeUInt32LE(packet.sessionHandle, offset); offset += 4;
        buffer.writeUInt32LE(packet.status, offset); offset += 4;
        packet.senderContext.copy(buffer, offset); offset += 8;
        buffer.writeUInt32LE(packet.options, offset); offset += 4;

        if (commandSpecificSize > 0) {
            commandSpecificBuffer.copy(buffer, offset);
            offset += commandSpecificSize;
        }

        packet.data.copy(buffer, offset);

        return buffer;
    }
    private commandSpecificDataToBuffer(command: number, data: CommandSpecificData): Buffer {
        switch (command) {
            case EtherNetIPCommand.LIST_SERVICES:
                return this.listServicesDataToBuffer(data as ListServicesData);
            case EtherNetIPCommand.REGISTER_SESSION:
                return this.registerSessionDataToBuffer(data as RegisterSessionData);
            case EtherNetIPCommand.SEND_RR_DATA:
            case EtherNetIPCommand.SEND_UNIT_DATA:
                return this.sendDataToBuffer(data as SendData);
            case EtherNetIPCommand.LIST_IDENTITY:
                return Buffer.alloc(0); // Typically empty for request
            default:
                throw new Error(`Unsupported command: ${command}`);
        }
    }

    private listServicesDataToBuffer(data: ListServicesData): Buffer {
        const buffer = Buffer.alloc(8);
        buffer.writeUInt32LE(data.interfaceHandle, 0);
        buffer.writeUInt16LE(data.timeout, 4);
        return buffer;
    }

    private registerSessionDataToBuffer(data: RegisterSessionData): Buffer {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt16LE(data.protocolVersion, 0);
        buffer.writeUInt16LE(data.optionFlags, 2);
        return buffer;
    }

    private sendDataToBuffer(data: SendData): Buffer {
        let buffer = Buffer.alloc(8);
        buffer.writeUInt32LE(data.interfaceHandle, 0);
        buffer.writeUInt16LE(data.timeout, 4);

        const itemBuffers = data.items.map(item => {
            const itemBuffer = Buffer.alloc(4 + item.data.length);
            itemBuffer.writeUInt16LE(item.type, 0);
            itemBuffer.writeUInt16LE(item.length, 2);
            if (item.data)
                item.data.copy(itemBuffer, 4);
            return itemBuffer;
        });

        buffer.writeUInt16LE(itemBuffers.length, 6);
        return Buffer.concat([buffer, ...itemBuffers]);
    }

    private getCommandSpecificDataSize(command: number, data: CommandSpecificData): number {
        if (data === null) return 0;

        switch (command) {
            case EtherNetIPCommand.LIST_SERVICES:
                return 0;
            case EtherNetIPCommand.REGISTER_SESSION:
                return 4; // 2 bytes for protocol version, 2 for option flags
            case EtherNetIPCommand.SEND_RR_DATA:
            case EtherNetIPCommand.SEND_UNIT_DATA:
                return 6 + (data as SendData).items.reduce((sum, item) => sum + 4 + item.data.length, 0);
            case EtherNetIPCommand.LIST_IDENTITY:
                return 0; // Typically empty for request
            default:
                throw new Error('Unknown CommandSpecificData type');
        }
    }

    private parseCommandSpecificData(command: number, data: Buffer): CommandSpecificData | null {
        if (data.length === 0)
            return null;

        switch (command) {
            case EtherNetIPCommand.LIST_SERVICES:
                return null;
            case EtherNetIPCommand.REGISTER_SESSION:
                return this.parseRegisterSessionData(data);
            case EtherNetIPCommand.SEND_RR_DATA:
            case EtherNetIPCommand.SEND_UNIT_DATA:
                return this.parseSendData(data);
            case EtherNetIPCommand.LIST_IDENTITY:
                return null;
            default:
                return null;
        }
    }

    private parseRegisterSessionData(data: Buffer): RegisterSessionData {
        return {
            protocolVersion: data.readUInt16LE(0),
            optionFlags: data.readUInt16LE(2)
        };
    }

    private parseSendData(data: Buffer): SendData {
        const result: SendData = {
            interfaceHandle: data.readUInt32LE(0),
            timeout: data.readUInt16LE(4),
            items: []
        };

        let offset = 6;
        const itemCount = data.readUInt16LE(offset);
        offset += 2;

        for (let i = 0; i < itemCount; i++) {
            const type = data.readUInt16LE(offset);
            offset += 2;
            const length = data.readUInt16LE(offset);
            offset += 2;
            const itemData = data.subarray(offset, offset + length);
            offset += length;

            result.items.push({ type, length, data: itemData });
        }

        return result;
    }

    private bufferToPacket(buffer: Buffer): EtherNetIPPacket {
        const packet: EtherNetIPPacket = {
            command: buffer.readUInt16LE(0),
            length: buffer.readUInt16LE(2),
            sessionHandle: buffer.readUInt32LE(4),
            status: buffer.readUInt32LE(8),
            senderContext: buffer.subarray(12, 20),
            options: buffer.readUInt32LE(20),
            data: buffer.subarray(24),
            commandSpecificData: null
        };
        const commandSpecificData = this.parseCommandSpecificData(packet.command, buffer.subarray(24));
        if (commandSpecificData) {
            packet.commandSpecificData = commandSpecificData;
            packet.data = buffer.subarray(24 + this.getCommandSpecificDataSize(packet.command, commandSpecificData));
        }
        return packet;
    }

    public async listServices(): Promise<ServiceInfo[]> {
        const packet: EtherNetIPPacket = {
            command: EtherNetIPCommand.LIST_SERVICES,
            length: 0,
            sessionHandle: this.sessionHandle,
            status: 0,
            senderContext: Buffer.alloc(8),
            options: 0,
            data: Buffer.alloc(0)
        };

        const response = await this.sendPacket(packet);

        if (response.status !== 0) {
            throw new Error(`List Services error: ${response.status}`);
        }

        return this.parseListServicesResponse(response.data);
    }

    private interpretCapabilityFlags(flags: number): string[] {
        const capabilities: string[] = [];
        if (flags & 0x0020) capabilities.push('TCP');
        if (flags & 0x0100) capabilities.push('UDP');
        return capabilities;
    }

    private parseListServicesResponse(data: Buffer): ServiceInfo[] {
        const services: ServiceInfo[] = [];
        let offset = 0;

        const serviceCount = data.readUInt16LE(offset);
        offset += 2;

        for (let i = 0; i < serviceCount; i++) {
            const serviceType = data.readUInt16LE(offset);
            offset += 2;

            const nameLength = data.readUInt16LE(offset);
            offset += 2;

            const protocolLength = data.readUInt16LE(offset);
            offset += 2;

            const capabilityFlags = data.readUInt16LE(offset);
            offset += 2;

            const serviceName = data.subarray(offset, offset + nameLength).toString('ascii');
            offset += nameLength;

            services.push({
                serviceType,
                serviceName,
                capabilities: this.interpretCapabilityFlags(capabilityFlags)
            });
        }

        return services;
    }
    private async sendCIPMessage(service: CIPService, path: Buffer, data: Buffer, useUnitData: boolean = false): Promise<Buffer> {
        // Determina il comando da usare
        const command = useUnitData ? EtherNetIPCommand.SEND_UNIT_DATA : EtherNetIPCommand.SEND_RR_DATA;
        
        // Costanti
        const timeout = 10; // Timeout in secondi (modificabile secondo necessità)
        const interfaceHandle = 0;
    
        // Calcola la lunghezza del path in word (16-bit)
        const pathLen = Math.ceil(path.length / 2);
        
        // Crea il messaggio CIP
        const serviceBuffer = Buffer.from([service, pathLen]);
        const cipMessage = Buffer.concat([serviceBuffer, path, data]);
    
        const connectionIDBuffer = Buffer.alloc(4);
        const isConnected = (useUnitData && this.connectionID);
        // Scrivere l'intero a 32 bit nel buffer, in formato Big Endian (puoi usare Little Endian con writeUInt32LE se necessario)
        if (this.connectionID)
            connectionIDBuffer.writeUInt32BE(this.connectionID);

        // Crea gli item di dati
        const dataItems: DataItem[] = [
            {
                type: isConnected ? CONNECTION_ADDRESS_ITEM : NULL_ADDRESS_ITEM,
                length: isConnected ? 4 : 0,
                data: isConnected ? connectionIDBuffer : Buffer.alloc(0)
            },
            {
                type: isConnected ? CONNECTION_DATA_ITEM : UNCONNECTED_DATA_ITEM,
                length: cipMessage.length,
                data: cipMessage
            }
        ];
    
        // Crea i dati specifici del comando
        const commandSpecificData: SendData = {
            interfaceHandle,
            timeout,
            items: dataItems
        };
    
        // Calcola la lunghezza totale dei dati
        const totalLength = dataItems.reduce((sum, item) => sum + item.length + 4, 0) + 8; // +4 per type e length di ogni item, +6 per interfaceHandle e timeout
    
        // Crea il pacchetto EtherNet/IP
        const packet: EtherNetIPPacket = {
            command: command,
            length: totalLength,
            sessionHandle: this.sessionHandle,
            status: 0,
            senderContext: Buffer.alloc(8),
            options: 0,
            data: Buffer.alloc(0), // Il campo data sarà gestito da commandSpecificData
            commandSpecificData: commandSpecificData
        };
    
        // Invia il pacchetto e attendi la risposta
        const response = await this.sendPacket(packet);
        
        if (response.status !== 0) {
            throw new OmronEthernetIpError(response.status);
        }
    
        // Estrai i dati dalla risposta
        if (response.commandSpecificData && 'items' in response.commandSpecificData) {
            // Assumiamo che il secondo item contenga i dati CIP
            const cipResponseData = response.commandSpecificData.items[1].data;
            // Rimuovi i primi due byte (status e size) dal payload CIP
            return cipResponseData.subarray(2);
        } else {
            throw new Error('Invalid response format');
        }
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

    public async establishIOConnection(assemblyInstance: number, large: boolean, rpi: number, isProducer: boolean): Promise<any> {
        const operation = new EstablishIOConnectionOperation(this.sessionHandle, large, assemblyInstance, rpi, isProducer);
        const { service, path, data } = operation.getPacket();
        const responseBuffer = await this.sendCIPMessage(service, path, data, false);
        this.connectionID = responseBuffer.readUint32BE(2);
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