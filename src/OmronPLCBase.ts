import { AddressDecoder } from './AddressDecoder';
import { BufferBuilder } from './BufferBuilder';
import { BufferConverter } from './BufferConverter';
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

export interface  OmronConfig{
  host?: string,
  port?: number,
  plcNodeNumber?: number,
  nodeNumber?: number,
  timeout?: number
}

export abstract class OmronPLCBase implements OmronPLCInterface {
  protected host: string;
  protected port: number;
  protected plcNode: number;
  protected pcNode: number;
  protected timeoutMs: number;
  protected currentSID: number = 0;
  protected baseHeader: Buffer;
  protected series: string = "C";
  protected requestMap: Map<number, PendingRequest>;
  private omronStatistic: OmronStatistic;
  private addressDecoder: AddressDecoder;
  private bufferBuilder: BufferBuilder;

  constructor(config: OmronConfig = {}) {
    this.host = config.host || omronConfig.DEFAULT_NETWORK_CONFIG.HOST,
    this.port = config.port || omronConfig.DEFAULT_NETWORK_CONFIG.PORT,
    this.plcNode = config.plcNodeNumber || omronConfig.DEFAULT_NETWORK_CONFIG.PLC_NODE_NUMBER;
    this.pcNode = config.nodeNumber || omronConfig.DEFAULT_NETWORK_CONFIG.NODE_NUMBER;
    this.timeoutMs = config.timeout || omronConfig.DEFAULT_TIMEOUT;
    this.requestMap = new Map();
    this.baseHeader = Buffer.from(omronConfig.DEFAULT_FINS_HEADER);
    this.baseHeader[omronConfig.FINS_HEADER_FIELDS.DA1] = this.plcNode;
    this.baseHeader[omronConfig.FINS_HEADER_FIELDS.SA1] = this.pcNode;
    this.omronStatistic = new OmronStatistic();
    this.addressDecoder = new AddressDecoder(this.series);
    this.bufferBuilder = new BufferBuilder();
  }

  protected generateSID(): number {
    this.currentSID = (this.currentSID + 1) % 255;
    return this.currentSID || 1;
  }

  protected abstract sendCommand(command: number[], params: Buffer, data?: Buffer): Promise<Buffer>;

  protected decodeAddress(address: string): { area: number, offset: number, nByte: number, bit: number, decodeType: string } {
    return this.addressDecoder.decodeAddress(address);
  }

  protected timeOut() {
    this.omronStatistic.addPacketLost();
  }


  async readMemoryArea(address: string, length: number): Promise<number[] | string> {
    const { area, offset: decodedAddress, bit, nByte, decodeType } = this.decodeAddress(address);
    const params = Buffer.from([
      area,
      (decodedAddress >> 8) & 0xFF, decodedAddress & 0xFF, bit,
      (length >> 8) & 0xFF, length & 0xFF
    ]);
    const resultBuffer = await this.sendCommand(omronConfig.FINS_COMMANDS.MEMORY_AREA_READ, params);
    const conv = new BufferConverter(resultBuffer);
    let result: string | number[] | undefined = undefined;
    switch (decodeType) {
      case 'S':
        result = conv.toAsciiBE() as string;
        break;
      case 'A':
        result = conv.toAscii() as string;
        break;
      case 'B':
        result = conv.toBCD(nByte as (1 | 2 | 4));
        break;
      case 'N':
        result = conv.toNumbersArray(nByte as (1 | 2 | 4));
        break;
      default:
        result = conv.toNumbersArray(nByte as (1 | 2 | 4));
    }
    return result;
  }

  async writeMemoryArea(address: string, data: number[] | string): Promise<void> {
    const { area, offset: decodedAddress, bit, nByte, decodeType } = this.decodeAddress(address);
    switch (decodeType) {
      case 'S': 
        this.bufferBuilder.fromAsciiBE(data as string);
        break;
      case 'A': 
        this.bufferBuilder.fromAscii(data as string);
        break;
      case 'B': 
        this.bufferBuilder.fromBCD(data as number[], nByte as (1 | 2 | 4));
        break;
      case 'N': 
        this.bufferBuilder.fromNumbers(data as number[], nByte as (1 | 2 | 4));
        break;
      default:
        this.bufferBuilder.fromNumbers(data as number[], nByte as (1 | 2 | 4));
    }
    const nElements = this.bufferBuilder.count() / nByte;
    const params = Buffer.from([
      area,
      (decodedAddress >> 8) & 0xFF, decodedAddress & 0xFF, bit,
      (nElements >> 8) & 0xFF, nElements & 0xFF
    ]);
    const bufferToWrite = this.bufferBuilder.build();
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

  async readControllerData(): Promise<omronConfig.Plcdata> {
    const buff = this.bufferBuilder.fromNumbers([0], 1).build();
    const resultBuffer = await this.sendCommand(omronConfig.FINS_COMMANDS.CONTROLLER_DATA_READ, buff);
    const cpuUnitModel = new BufferConverter(resultBuffer.subarray(0, 19));
    const cpuUnitinternalSytem = new BufferConverter(resultBuffer.subarray(10, 39));
    //  const altro = new BufferConverter(resultBuffer.subarray(10, 39));
    return { cpuUnitModel: cpuUnitModel.toAscii().trim(), cpuUnitinternalSytem: cpuUnitinternalSytem.toAscii().trim() };
  }

  async readControllerStatus(): Promise<omronConfig.PlcStatus> {
    const resultBuffer = await this.sendCommand(omronConfig.FINS_COMMANDS.CONTROLLER_STATUS_READ, Buffer.alloc(0));
    const conv = new BufferConverter(resultBuffer)
    const data = conv.toNumbersArray(1);
    return { run: (data[0] & 0x01) === 0x01, battery: (data[0] & 0x04) === 0x04, cpuStanby: (data[0] & 0x80) === 0x80, mode: omronConfig.getModeString(data[1]) };
  }

  async readControllerDate(): Promise<Date> {
    const resultBuffer = await this.sendCommand(omronConfig.FINS_COMMANDS.CLOCK_READ, Buffer.alloc(0));
    const conv = new BufferConverter(resultBuffer)
    const data = conv.toBCD(1);
    const year = data[0];
    const month = data[1];
    const day = data[2];
    const hour = data[3];
    const minute = data[4];
    const second = data[5];
    const dayOfWeek = data[6];
    return new Date(year + 2000, month - 1, day, hour, minute, second, 0);
  }

  getStatistics() {
    return this.omronStatistic.getStatistics();
  }

  abstract close(): void;
}