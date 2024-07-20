export class BufferBuilder {
    private data: number[] = [];
  
    constructor() {}
  
    fromNumbers(numbers: number[], bytesPerNumber: 1 | 2 | 4 = 2): this {
      this.data = [];
      numbers.forEach(number => {
        switch (bytesPerNumber) {
          case 1:
            this.data.push(number & 0xFF);
            break;
          case 2:
            this.data.push((number >> 8) & 0xFF, number & 0xFF);
            break;
          case 4:
            this.data.push(
              (number >> 24) & 0xFF,
              (number >> 16) & 0xFF,
              (number >> 8) & 0xFF,
              number & 0xFF
            );
            break;
        }
      });
      return this;
    }
  
    fromString(str: string, format: 'hex' | 'dec' | 'oct' | 'bin' = 'hex', bytesPerGroup: 1 | 2 | 4 = 1): this {
      this.data = [];
      const groups = str.split(/\s+/);
      groups.forEach(group => {
        let value: number;
        switch (format) {
          case 'hex':
            value = parseInt(group, 16);
            break;
          case 'dec':
            value = parseInt(group, 10);
            break;
          case 'oct':
            value = parseInt(group, 8);
            break;
          case 'bin':
            value = parseInt(group, 2);
            break;
        }
        this.fromNumbers([value], bytesPerGroup);
      });
      return this;
    }
  
    fromBCD(numbers: number[], bytesPerNumber: 1 | 2 | 4 = 2): this {
      this.data = [];
      numbers.forEach(number => {
        let bcdValue = 0;
        for (let i = 0; i < bytesPerNumber * 2; i++) {
          const digit = Math.floor(number / Math.pow(10, bytesPerNumber * 2 - 1 - i)) % 10;
          bcdValue = (bcdValue << 4) | digit;
        }
        this.fromNumbers([bcdValue], bytesPerNumber);
      });
      return this;
    }
  
    fromAscii(str: string): this {
      this.data = [];
      for (let i = 0; i < str.length; i++) {
        this.data.push(str.charCodeAt(i));
      }
      return this;
    }

    fromAsciiBE(str: string): this {
      this.data = [];
      const length = str.length;
      // Converte la stringa in un array di codici ASCII e swappa i byte a due a due
      for (let i = 0; i < length; i += 2) {
        if (i + 1 < length) {
          this.data.push(str.charCodeAt(i + 1));
          this.data.push(str.charCodeAt(i));
        } else {
          // Se la lunghezza della stringa è dispari, aggiungi l'ultimo carattere così com'è
          this.data.push(str.charCodeAt(i));
        }
      }
      return this;
    }
  
    count(): number {
      return this.data.length;
    }
  
    build(): Buffer {
      return Buffer.from(this.data);
    }
  
  }
  
/*   // Esempi di utilizzo:
  const builder = new BufferBuilder();
  
  // Costruire da numeri
  const buffer1 = builder
    .fromNumbers([0x1234, 0x5678], 2)
    .build();
  console.log(buffer1); // <Buffer 12 34 56 78>
  
  builder.clear();
  
  // Costruire da stringa esadecimale
  const buffer2 = builder
    .fromString('12 34 56 78', 'hex', 1)
    .build();
  console.log(buffer2); // <Buffer 12 34 56 78>
  
  builder.clear();
  
  // Costruire da BCD
  const buffer3 = builder
    .fromBCD([1234, 5678], 2)
    .build();
  console.log(buffer3); // <Buffer 12 34 56 78>
  
  builder.clear();
  
  // Costruire da ASCII
  const buffer4 = builder
    .fromAscii('Hello')
    .build();
  console.log(buffer4); // <Buffer 48 65 6c 6c 6f>
  
  builder.clear();
  
  // Combinare diversi metodi
  const buffer5 = builder
    .fromNumbers([0x1234])
    .fromString('5678', 'hex')
    .fromBCD([9012])
    .fromAscii('AB')
    .build();
  console.log(buffer5); // <Buffer 12 34 56 78 90 12 41 42> */