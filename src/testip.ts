import { ComplexDataType } from './ethernetIpConstants';
import { OmronEthernetIp } from './OmronEthernetIp';

async function main() {
  const omronEthernetIp = new OmronEthernetIp('192.168.0.1', 44818);

  try {
    // Connect to the PLC
    console.log('Connecting to PLC...');
    await omronEthernetIp.connect();
    console.log('Connected to PLC');

    // Read a variable
    console.log('Reading variable...');
    const readVariableResult = await omronEthernetIp.readVariable('variableName', 'dataType');
    console.log('Read variable result:', readVariableResult);

    // Write a variable
    console.log('Writing variable...');
    const writeVariableResult = await omronEthernetIp.writeVariable('variableName', 'dataType', 'value');
    console.log('Write variable result:', writeVariableResult);

    // Read an attribute
    console.log('Reading attribute...');
    const readAttributeResult = await omronEthernetIp.readAttribute(1, 1, 1);
    console.log('Read attribute result:', readAttributeResult);

    // Read memory area
    console.log('Reading memory area...');
    const readMemoryAreaResult = await omronEthernetIp.readMemoryArea('address', 10);
    console.log('Read memory area result:', readMemoryAreaResult);

    // Write memory area
    console.log('Writing memory area...');
    await omronEthernetIp.writeMemoryArea('address', [1, 2, 3, 4]);
    console.log('Write memory area result: Success');

    // Get assembly list
    console.log('Getting assembly list...');
    const assemblyList = await omronEthernetIp.getAssemblyList();
    console.log('Assembly list:', assemblyList);

    // Read device identity
    console.log('Reading device identity...');
    const deviceIdentity = await omronEthernetIp.readDeviceIdentity();
    console.log('Device identity:', deviceIdentity);

    // Configure assembly
    console.log('Configuring assembly...');
    await omronEthernetIp.configureAssembly(1, Buffer.from([0x00, 0x01, 0x02]));
    console.log('Configure assembly result: Success');

    // Read assembly data
    console.log('Reading assembly data...');
    const assemblyData = await omronEthernetIp.readAssemblyData(1);
    console.log('Assembly data:', assemblyData);

    // Establish IO connection
    console.log('Establishing IO connection...');
    const ioConnection = await omronEthernetIp.establishIOConnection(1, 1000, true);
    console.log('IO connection:', ioConnection);

    // Get symbol list
    console.log('Getting symbol list...');
    const symbolList = await omronEthernetIp.getSymbolList();
    console.log('Symbol list:', symbolList);

    // Read complex variable
    console.log('Reading complex variable...');
    const complexVariable = await omronEthernetIp.readComplexVariable('tagName', "INT");
    console.log('Complex variable:', complexVariable);

    // Send multiple service packet
    /*TODOconsole.log('Sending multiple service packet...');
    const servicePacket = await omronEthernetIp.sendMultipleServicePacket([
      { service: 'service1', path: Buffer.from([0x00]), data: Buffer.from([0x01]) }
    ]);
    console.log('Service packet result:', servicePacket);
    */
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the connection
    console.log('Closing connection to PLC...');
    await omronEthernetIp.close();
    console.log('Connection closed');
  }
}

main();
