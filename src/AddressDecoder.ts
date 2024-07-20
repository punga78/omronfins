import * as omronConfig from './omronConfig';

export class AddressDecoder {
  private series: string;

  constructor(series: string = "C") {
    this.series = series;
  }

  public decodeAddress(address: string): { area: number, offset: number, nByte: number, bit: number, isBit: boolean, decodeType :string} {
    let match: RegExpMatchArray | null;
    if (address.includes('_'))
      match = address.match(/([a-zA-Z0-9]+)_([0-9]+)\.?([0-9|x|X]*)(,([SBA]))?/);    
    else
      match = address.match(/([a-zA-Z]+)([0-9]+)\.?([0-9|x|X]*)(,([SBA]))?/);    
    

    if (!match || match.length < 3) {
      throw new Error(`'${address}' is not a valid FINS address`);
    }

    const [, areaCode, addressStr, sbit, , decodeType] = match;

    const addressNum = parseInt(addressStr, 10);
    const isBit = sbit ? true : false;
    const bit = parseInt(sbit || "0", 10);

    if (!['CV', 'C'].includes(this.series)) {
      throw new Error(`Series '${this.series}' is not supported`);
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
      case 'DR':
      case 'R':
        areatoSearch = 'DR';
        break;
      case 'I':
      case 'IR':
        areatoSearch = 'IR';
        break;
      case 'TM':
      case 'TIMER':
      case 'TR':
      case 'T':
        areatoSearch = 'TIMER';
        break;
      /*       case 'CN':
            case 'COUNTER':
            case 'CT':
            case 'C':
              areatoSearch = 'COUNTER';
              break; */
      case 'EM':
      case 'EX':
      case 'E0':
        areatoSearch = 'EM';
        break;
      default:
        throw new Error('Unsupported memory area');
    }
    areatoSearch = areatoSearch + (isBit ? '_BIT' : '');

    const series = omronConfig.MEMORY_AREAS[this.series];
    const memoryArea = series.find(area => area.name === areatoSearch);

    if (!memoryArea) {
      throw new Error(`Memory area '${areaCode}' is not supported`);
    }

    return {
      area: memoryArea.memoryAreaCode,
      offset: addressNum,
      nByte: memoryArea.nByte,
      bit: bit,
      isBit,
      decodeType: (decodeType || 'N').toUpperCase()
    };
  }
}
