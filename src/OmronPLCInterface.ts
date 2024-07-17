// OmronPLCInterface.ts
export interface OmronPLCInterface {
    close(): void;
    readMemoryArea(address: string, length: number): Promise<number[]>;
    writeMemoryArea(address: string, data: number[]): Promise<void>;
    run(): Promise<void>;
    stop(): Promise<void>;
    readControllerData(): Promise<Buffer>;
    readControllerStatus(): Promise<Buffer>;
    getStatistics();
  }