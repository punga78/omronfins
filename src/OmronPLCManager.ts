// OmronPLCManager.ts

import { OmronPLCInterface } from './OmronPLCInterface';
import { OmronPLCUDP } from './OmronPLCUDP';
import { OmronPLCTCP } from './OmronPLCTCP';
import { EventEmitter } from 'events';

interface MemoryArea {
  name: string;
  address: string;
  length: number;
  autoRead: boolean;
  lastValue?: number[];
}

interface OmronPLCManagerOptions {
  host: string;
  port: number;
  plcNode: number;
  pcNode?: number;
  protocol: 'udp' | 'tcp';
  pollingInterval: number;
}

export class OmronPLCManager extends EventEmitter {
  private plc: OmronPLCInterface;
  private memoryAreas: MemoryArea[] = [];
  private pollingInterval: number;
  private pollingTimer?: NodeJS.Timeout;

  constructor(options: OmronPLCManagerOptions) {
    super();
    this.pollingInterval = options.pollingInterval;

    if (options.protocol === 'udp') {
      this.plc = new OmronPLCUDP(options.host, options.port, options.plcNode, options.pcNode);
    } else {
      this.plc = new OmronPLCTCP(options.host, options.port, options.plcNode, options.pcNode);
    }
  }

  public addMemoryArea(name: string, address: string, length: number, autoRead: boolean = false): void {
    if (this.memoryAreas.some(area => area.name === name)) {
      throw new Error(`Memory area with name '${name}' already exists`);
    }
    this.memoryAreas.push({ name, address, length, autoRead });
    if (autoRead && !this.pollingTimer) {
      this.startPolling();
    }
  }

  public removeMemoryArea(name: string): void {
    const index = this.memoryAreas.findIndex(area => area.name === name);
    if (index !== -1) {
      this.memoryAreas.splice(index, 1);
    }
    if (this.memoryAreas.every(area => !area.autoRead)) {
      this.stopPolling();
    }
  }

  public async readMemoryArea(name: string): Promise<number[]> {
    const area = this.getMemoryArea(name);
    return this.plc.readMemoryArea(area.address, area.length);
  }

  public async writeMemoryArea(name: string, data: number[]): Promise<void> {
    const area = this.getMemoryArea(name);
    if (data.length !== area.length * 2) {  // 2 bytes per word
      throw new Error(`Data length mismatch for ${name}`);
    }
    await this.plc.writeMemoryArea(area.address, data);
  }

  public start(): void {
    this.startPolling();
  }

  public stop(): void {
    this.stopPolling();
    this.plc.close();
  }

  public printStatisic(): void {
    console.log(this.plc.getStatistics());
  }

  private getMemoryArea(name: string): MemoryArea {
    const area = this.memoryAreas.find(a => a.name === name);
    if (!area) {
      throw new Error(`Memory area '${name}' not found`);
    }
    return area;
  }

  private startPolling(): void {
    if (!this.pollingTimer) {
      this.pollingTimer = setInterval(() => this.pollMemoryAreas(), this.pollingInterval);
    }
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
  }

  private arraysAreEqual(arr1: number[], arr2: number[]) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  private async pollMemoryAreas(): Promise<void> {
    for (const area of this.memoryAreas) {
      if (area.autoRead) {
        try {
          const newValue = await this.plc.readMemoryArea(area.address, area.length);
          if (!area.lastValue || !this.arraysAreEqual(newValue,area.lastValue)) {
            area.lastValue = newValue;
            this.emit('dataChanged', area.name, newValue);
          }
        } catch (error) {
          this.emit('error', error, area.name);
        }
      }
    }
  }

  public setAutoRead(name: string, autoRead: boolean): void {
    const area = this.getMemoryArea(name);
    area.autoRead = autoRead;

    if (autoRead && !this.pollingTimer) {
      this.startPolling();
    } else if (!autoRead && this.memoryAreas.every(a => !a.autoRead)) {
      this.stopPolling();
    }
  }

  public async runPlc(): Promise<void> {
    return this.plc.run();
  }

  public async stopPlc(): Promise<void> {
    return this.plc.stop();
  }

  public async readControllerData(): Promise<Buffer> {
    return this.plc.readControllerData();
  }

  public async readControllerStatus(): Promise<Buffer> {
    return this.plc.readControllerStatus();
  }

  // Nuovo metodo per ottenere tutte le aree di memoria
  public getMemoryAreas(): ReadonlyArray<Omit<MemoryArea, 'lastValue'>> {
    return this.memoryAreas.map(({ name, address, length, autoRead }) => ({
      name,
      address,
      length,
      autoRead
    }));
  }
}