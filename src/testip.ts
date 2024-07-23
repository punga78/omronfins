import { ComplexDataType } from './ethernetIpConstants';
import { OmronEthernetIp } from './OmronEthernetIp';

async function main() {
  const omronEthernetIp = new OmronEthernetIp('192.168.250.1', 44818);
  //const PLC = new Controller();
/*  const fooTag = new Tag("FITROON01"); 
  PLC.connect("192.168.250.1", 0).then(async () => {
    // Accepts a JS Date Type
    // Controller.writeWallClock([Date])
    await PLC.readTag(fooTag);
    console.log(fooTag.value);
  });*/

  try {
    // Connect to the PLC
    console.log('Connecting to PLC...');
    await omronEthernetIp.connect();
    console.log('Connected to PLC');

    console.log('Reading device listServices...');
    const listServices = await omronEthernetIp.listServices();
    console.log('listServices :', listServices);

    /*console.log('unRegisterSession...');
    await omronEthernetIp.unRegisterSession()
    console.log('unRegisterSession');*/

    // Read device identity
    console.log('Reading device identity...');
    const deviceIdentity = await omronEthernetIp.readDeviceIdentity();
    console.log('Device identity:', deviceIdentity);

    // Establish IO connection
    console.log('Establishing IO connection...');
    const ioConnection = await omronEthernetIp.establishIOConnection(1, true, 15000, true);
    console.log('IO connection:', ioConnection);

    // Get symbol list
    /*console.log('Getting symbol list...');
    const symbolList = await omronEthernetIp.getSymbolList();
    console.log('Symbol list:', symbolList);


    // Get assembly list
    console.log('Getting assembly list...');
    const assemblyList = await omronEthernetIp.getAssemblyList();
    console.log('Assembly list:', assemblyList);
*/

    // Read a variable
    console.log('Reading variable FITROON01...');
    const readVariableResult = await omronEthernetIp.readVariable('FITROON01.FITROON02.FITROON03', 'INT');
    console.log('Read variable FITROON01 result:', readVariableResult);

    // Read a variable
    console.log('Reading D1000...');
    const readVariableResult1 = await omronEthernetIp.readVariable('D1000', 'INT');
    console.log('Read D1000 result:', readVariableResult1);

   /* // Write a variable
    console.log('Writing variable...');
    const writeVariableResult = await omronEthernetIp.writeVariable('FITROON01', 'dataType', 'value');
    console.log('Write variable result:', writeVariableResult);
*/
    // Read an attribute
    console.log('Reading attribute...');
    const readAttributeResult = await omronEthernetIp.readAttribute(1, 1, 1);
    console.log('Read attribute result:', readAttributeResult);

    // Read memory area
    console.log('Reading memory area...');
    const readMemoryAreaResult = await omronEthernetIp.readMemoryArea('DM1000', 10);
    console.log('Read memory area result:', readMemoryAreaResult);

    // Write memory area
    /*console.log('Writing memory area...');
    await omronEthernetIp.writeMemoryArea('DM1000', [1, 2, 3, 4]);
    console.log('Write memory area result: Success');
*/

    // Configure assembly
    /*console.log('Configuring assembly...');
    await omronEthernetIp.configureAssembly(1, Buffer.from([0x00, 0x01, 0x02]));
    console.log('Configure assembly result: Success');
*/
    // Read assembly data
    console.log('Reading assembly data...');
    const assemblyData = await omronEthernetIp.readAssemblyData(1);
    console.log('Assembly data:', assemblyData);



    // Read complex variable
    /*console.log('Reading complex variable...');
    const complexVariable = await omronEthernetIp.readComplexVariable('tagName', "INT");
    console.log('Complex variable:', complexVariable);

    // Send multiple service packet
    TODOconsole.log('Sending multiple service packet...');
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
  //  await omronEthernetIp.close();
    console.log('Connection closed');
  }
}

main();
