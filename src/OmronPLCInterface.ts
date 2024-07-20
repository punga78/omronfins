import { Plcdata, PlcStatus } from "./omronConfig";

// OmronPLCInterface.ts
export interface OmronPLCInterface {
    close(): void;
    readMemoryArea(address: string, length: number): Promise<number[] | string>;
    writeMemoryArea(address: string, data: number[] | string): Promise<void>;
    run(): Promise<void>;
    stop(): Promise<void>;
    readControllerData(): Promise<Plcdata>;
    readControllerStatus(): Promise<PlcStatus>;
    readControllerDate(): Promise<Date>
    getStatistics();
  }