export class BufferConverter {
    private buffer: Buffer;
  
    constructor(buffer: Buffer) {
      if (!Buffer.isBuffer(buffer)) {
        throw new Error('Input must be a Buffer');
      }
      this.buffer = buffer;
    }
  
    toNumbersArray(bytesPerNumber: 1 | 2 | 4 = 2): number[] {
      const numbers: number[] = [];
      for (let i = 0; i < this.buffer.length; i += bytesPerNumber) {
        if (i + bytesPerNumber > this.buffer.length) break;
  
        switch (bytesPerNumber) {
          case 1:
            numbers.push(this.buffer.readUInt8(i));
            break;
          case 2:
            numbers.push(this.buffer.readUInt16BE(i));
            break;
          case 4:
            numbers.push(this.buffer.readUInt32BE(i));
            break;
        }
      }
      return numbers;
    }
  
    toString(format: 'hex' | 'dec' | 'oct' | 'bin' = 'hex', bytesPerGroup: 1 | 2 | 4 = 1): string {
      const result: string[] = [];
      for (let i = 0; i < this.buffer.length; i += bytesPerGroup) {
        if (i + bytesPerGroup > this.buffer.length) break;
  
        let value: number;
        switch (bytesPerGroup) {
          case 1:
            value = this.buffer.readUInt8(i);
            break;
          case 2:
            value = this.buffer.readUInt16BE(i);
            break;
          case 4:
            value = this.buffer.readUInt32BE(i);
            break;
        }
  
        switch (format) {
          case 'hex':
            result.push(value.toString(16).padStart(bytesPerGroup * 2, '0'));
            break;
          case 'dec':
            result.push(value.toString(10).padStart(bytesPerGroup * 3, '0'));
            break;
          case 'oct':
            result.push(value.toString(8).padStart(bytesPerGroup * 3, '0'));
            break;
          case 'bin':
            result.push(value.toString(2).padStart(bytesPerGroup * 8, '0'));
            break;
        }
      }
  
      return result.join(' ');
    }
  
    toBCD(bytesPerNumber: 1 | 2 | 4 = 2): number[] {
      const bcdArray: number[] = [];
      for (let i = 0; i < this.buffer.length; i += bytesPerNumber) {
        if (i + bytesPerNumber > this.buffer.length) break;
  
        let value = 0;
        for (let j = 0; j < bytesPerNumber; j++) {
          const byte = this.buffer[i + j];
          const high = (byte >> 4) & 0xF;
          const low = byte & 0xF;
          value = value * 100 + high * 10 + low;
        }
        bcdArray.push(value);
      }
  
      return bcdArray;
    }
  
    toAscii(): string {
      //console.log(this.buffer);
      const tempresult = this.buffer.reduce((acc, byte) => {
        return acc + (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' ');
      }, '');
      //console.log(tempresult);
      return  tempresult;
    }
    
    toAsciiBE(): string {
      const length = this.buffer.length;
      const swappedBuffer = Buffer.alloc(length);
    
      // Swappa i byte a due a due
      for (let i = 0; i < length; i += 2) {
        if (i + 1 < length) {
          swappedBuffer[i] = this.buffer[i + 1];
          swappedBuffer[i + 1] = this.buffer[i];
        } else {
          // Se la lunghezza del buffer è dispari, copia l'ultimo byte così com'è goige u anb lealg oinrta aids lo eefilic
          swappedBuffer[i] = this.buffer[i];
        }
      }
    
      // Converti il buffer swappato in una stringa ASCII leggibile
      return swappedBuffer.reduce((acc, byte) => {
        return acc + (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' ');
      }, '');
    }
  }
  
  /* // Esempi di utilizzo:
  const buffer = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64]);
  const converter = new BufferConverter(buffer);
  
  console.log(converter.toNumbersArray(2));          // [18533, 27756, 8295, 29295, 25708]
  console.log(converter.toString('hex', 2));         // "4865 6c6c 6f20 576f 726c 64"
  console.log(converter.toString('dec', 1));         // "072 101 108 108 111 032 087 111 114 108 100"
  console.log(converter.toBCD(2));                   // [4865, 6868, 6920, 5767, 7268]
  console.log(converter.toAscii());          */         // "Hello World"