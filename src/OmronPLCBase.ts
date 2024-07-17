import * as omronConfig from './omronConfig';
import { OmronError } from './OmronError';
import { OmronPLCInterface } from './OmronPLCInterface';
import { OmronStatistic } from './OmronStatistic';

export interface PendingRequest {
  resolve: Function;
  reject: Function;
  timeoutId: NodeJS.Timeout;
  startTime: number;
  dataSent: number;
  realByteSent: number;
  buffer: Buffer;
}

export abstract class OmronPLCBase implements OmronPLCInterface {
  protected currentSID: number = 0;
  protected baseHeader: Buffer;
  protected series: string = "C";
  protected requestMap: Map<number, PendingRequest>;
  private omronStatistic: OmronStatistic;

  constructor(protected host: string = omronConfig.DEFAULT_NETWORK_CONFIG.HOST,
    protected port: number = omronConfig.DEFAULT_NETWORK_CONFIG.PORT,
    protected plcNode: number = omronConfig.DEFAULT_NETWORK_CONFIG.PLC_NODE_NUMBER,
    protected pcNode: number = omronConfig.DEFAULT_NETWORK_CONFIG.NODE_NUMBER) {
    this.requestMap = new Map();
    this.baseHeader = Buffer.from(omronConfig.DEFAULT_FINS_HEADER);
    this.baseHeader[omronConfig.FINS_HEADER_FIELDS.DA1] = plcNode;
    this.baseHeader[omronConfig.FINS_HEADER_FIELDS.SA1] = pcNode;
    this.omronStatistic = new OmronStatistic();
  }

  protected generateSID(): number {
    this.currentSID = (this.currentSID + 1) % 255;
    return this.currentSID || 1;
  }

  protected abstract sendCommand(command: number[], params: Buffer, data?: Buffer): Promise<Buffer>;

  protected decodeAddress(address: string): { area: number, address: number, nByte: number, bit: number } {
    const match = address.match(/([A-Z]*)([0-9]*)\.?([0-9|x|X]*)/);

    if (!match || match.length < 3) {
      throw new Error(`'${address}' is not a valid FINS address`);
    }

    const [, areaCode, addressStr, sbit] = match;

    const addressNum = parseInt(addressStr, 10);
    const bit = parseInt(sbit || "0", 10);

    if (!['CV', 'C'].includes(this.series)) {
      throw new Error('Serie non valida. Usa "CV" o "C".');
    }
    let areatoSearch: string;
    switch (areaCode.toUpperCase()) {
      case 'D':
      case 'DM':
        areatoSearch = 'DM';
        break;
      case 'CIO':
      case 'IO':
        areatoSearch = 'CIO';
        break;
      case 'W':
      case 'WR':
        areatoSearch = 'WR';
        break;
      case 'H':
      case 'HR':
        areatoSearch = 'HR';
        break;
      case 'A':
      case 'AR':
        areatoSearch = 'AR';
        break;
      case 'TM':
      case 'TIMER':
      case 'TR':
        areatoSearch = 'TIMER';
        break;
      case 'CN':
      case 'COUNTER':
      case 'CT':
        areatoSearch = 'COUNTER';
        break;
      case 'EM':
      case 'EX':
      case 'E':
        areatoSearch = 'EM';
        break;
      default:
        throw new Error('Unsupported memory area');
    }
    areatoSearch = areatoSearch + (bit ? '_BIT' : '');
    const value = omronConfig.MEMORY_AREAS[this.series].find(area => area.name === areatoSearch);

    if (!value) {
      throw new Error(`Area di memoria "${areaCode}" non trovata per la serie ${this.series}.`);
    }

    const { memoryAreaCode, nByte, maxAddress } = value;

    if (addressNum > maxAddress) {
      throw new Error(`Area di memoria "${address}" fuori da limite.`);
    }

    return { area: memoryAreaCode, address: addressNum, nByte, bit };
  }

  protected timeOut() {
    this.omronStatistic.addPacketLost();
  }

  private bufferToNumbersArray(buffer: Buffer, bytesPerNumber: number = 2) {
    if (![1, 2, 4].includes(bytesPerNumber)) {
      throw new Error('bytesPerNumber must be 1, 2, or 4');
    }

    if (buffer.length % bytesPerNumber !== 0) {
      throw new Error('Buffer length must be a multiple of bytesPerNumber');
    }

    const numbers: number[] = [];

    for (let i = 0; i < buffer.length; i += bytesPerNumber) {
      let number;
      switch (bytesPerNumber) {
        case 1:
          number = buffer.readUInt8(i);
          break;
        case 2:
          number = buffer.readUInt16BE(i);
          break;
        case 4:
          number = buffer.readUInt32BE(i);
          break;
      }
      numbers.push(number);
    }

    return numbers;
  }
  
  private numbersArrayToBuffer(numbers :number[], bytesPerNumber:number = 2) {
    if (![1, 2, 4].includes(bytesPerNumber)) {
      throw new Error('bytesPerNumber must be 1, 2, or 4');
    }
  
    const buffer = Buffer.alloc(numbers.length * bytesPerNumber);
  
    numbers.forEach((number, index) => {
      const offset = index * bytesPerNumber;
      switch (bytesPerNumber) {
        case 1:
          buffer.writeUInt8(number, offset);
          break;
        case 2:
          buffer.writeUInt16BE(number, offset);
          break;
        case 4:
          buffer.writeUInt32BE(number, offset);
          break;
      }
    });
  
    return buffer;
  }
  private bufferToBCD16Array(buffer: Buffer) {
    const bcd16Array: number[] = [];

    for (let i = 0; i < buffer.length; i += 2) {
      if (i + 1 < buffer.length) {
        let value = 0;
        for (let j = 0; j < 2; j++) {
          const byte = buffer[i + j];
          const high = (byte >> 4) & 0xF;
          const low = byte & 0xF;
          value = value * 100 + high * 10 + low;
        }
        bcd16Array.push(value);
      }
    }

    return bcd16Array;
  }

  async readMemoryArea(address: string, length: number): Promise<number[]> {
    const { area, address: decodedAddress, bit, nByte } = this.decodeAddress(address);
    const params = Buffer.from([
      area,
      (decodedAddress >> 8) & 0xFF, decodedAddress & 0xFF, bit,
      (length >> 8) & 0xFF, length & 0xFF
    ]);
    const resultBuffer = await this.sendCommand(omronConfig.FINS_COMMANDS.MEMORY_AREA_READ, params);
    return nByte === 2 ? this.bufferToNumbersArray(resultBuffer) : Array.from(resultBuffer);
  }

  async writeMemoryArea(address: string, data: number[]): Promise<void> {
    const { area, address: decodedAddress, bit, nByte } = this.decodeAddress(address);
    const nElements = data.length

    const params = Buffer.from([
      area,
      (decodedAddress >> 8) & 0xFF, decodedAddress & 0xFF, bit,
      (nElements >> 8) & 0xFF, nElements & 0xFF
    ]);
    const bufferToWrite = this.numbersArrayToBuffer(data);
    await this.sendCommand(omronConfig.FINS_COMMANDS.MEMORY_AREA_WRITE, params, bufferToWrite);
  }

  protected removeHeader(msg: Buffer): Buffer {
    return msg;
  }

  protected handleCompleteResponse(sid: number, request: PendingRequest): void {
    clearTimeout(request.timeoutId);
    this.requestMap.delete(sid);

    const response = this.removeHeader(request.buffer);
    const responseCode = response.subarray(12, 14);
    if (response.length < 14) {
      request.reject(new Error("lengh response error"));
      this.omronStatistic.addPacketLost();
      return;
    }
    if ((this.baseHeader[omronConfig.FINS_HEADER_FIELDS.DNA] !== response[omronConfig.FINS_HEADER_FIELDS.SNA])
      || (this.baseHeader[omronConfig.FINS_HEADER_FIELDS.DA2] !== response[omronConfig.FINS_HEADER_FIELDS.SA2])
      || (this.baseHeader[omronConfig.FINS_HEADER_FIELDS.DA1] !== response[omronConfig.FINS_HEADER_FIELDS.SA1])) {
      request.reject(new Error("illegal source address error"));
      this.omronStatistic.addPacketLost();
      return;
    }

    if (Buffer.compare(responseCode, Buffer.from(omronConfig.FINS_RESPONSES.NORMAL_COMPLETION)) === 0) {
      const data = response.subarray(14);
      this.omronStatistic.updateStatistics(request.realByteSent, request.startTime, data.length, request.dataSent, request.buffer.length)
      request.resolve(data);
    } else {
      //console.log(response);
      this.omronStatistic.addPacketLost();
      request.reject(new OmronError(responseCode[0], responseCode[1]));
    }
  }

  async run(): Promise<void> {
    await this.sendCommand(omronConfig.FINS_COMMANDS.RUN, Buffer.alloc(0));
  }

  async stop(): Promise<void> {
    await this.sendCommand(omronConfig.FINS_COMMANDS.STOP, Buffer.alloc(0));
  }

  async readControllerData(): Promise<Buffer> {
    return this.sendCommand(omronConfig.FINS_COMMANDS.CONTROLLER_DATA_READ, Buffer.alloc(0));
  }

  async readControllerStatus(): Promise<Buffer> {
    return this.sendCommand(omronConfig.FINS_COMMANDS.CONTROLLER_STATUS_READ, Buffer.alloc(0));
  }

  getStatistics() {
    return this.omronStatistic.getStatistics();
  }

  abstract close(): void;
}