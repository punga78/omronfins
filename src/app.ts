import { OmronPLCManager } from './OmronPLCManager';

async function example() {
  const manager = new OmronPLCManager({
    host: '192.168.250.1',
    port: 9600,
    protocol: 'tcp',
    plcNode: 1,
    pcNode: 10,
    pollingInterval: 1200  // 1 secondo
  });

  try {

    // Aggiungi aree di memoria
    manager.addMemoryArea('CIO100', 'CIO100', 10, true);   // Inizialmente in autoread
    manager.addMemoryArea('CIO102', 'CIO102.0', 16, true);   // Inizialmente in autoread
    manager.addMemoryArea('A0040', 'A0040', 10, true);   // Inizialmente in autoread
    manager.addMemoryArea('A47', 'a47.0', 16, true);   // Inizialmente in autoread
    manager.addMemoryArea('T0', 'T0', 10, true);   // Inizialmente in autoread
    manager.addMemoryArea('T0COM', 'T0.0', 10, true);   // Inizialmente in autoread
    manager.addMemoryArea('D200', 'D200', 40, true);   // Inizialmente in autoread
    manager.addMemoryArea('D0000221', 'D0000221.0', 32, true);   // Inizialmente in autoread
    //manager.addMemoryArea('E0_000221', 'E0_000221.0,S', 32, true);   // Inizialmente in autoread
    manager.addMemoryArea('OGGI', 'D16270,A', 60, true);   // Inizialmente in autoread


    manager.addMemoryArea('H1BIT', 'H1.0', 16, true);   // Inizialmente in autoread
    manager.addMemoryArea('H0BIT', 'H0.0', 16, true);   // Inizialmente in autoread
    manager.addMemoryArea('H0', 'H0', 10, true);   // Inizialmente in autoread
    manager.addMemoryArea('H3', 'H3', 10, true);   // Inizialmente in autoread

    manager.addMemoryArea('W1BIT', 'W1.0', 16, true);   // Inizialmente in autoread
    manager.addMemoryArea('W0', 'W0', 10, true);   // Inizialmente in autoread
    //manager.addMemoryArea('IR0', 'I0', 1, true);   // Inizialmente in autoread
    //manager.addMemoryArea('DR0', 'R0', 1, true);   // Inizialmente in autoread

    const controllerStatus = await manager.readControllerStatus();
    console.log(`readControllerStatus`, controllerStatus);

    const controllerData = await manager.readControllerData();
    console.log(`controllerData`, controllerData);

    const date = await manager.readControllerDate();
    console.log(`Date controller`, date);


    // Gestisci eventi
    manager.on('dataChanged', (name, newValue) => {
      console.log(`Data changed for ${name}:`, newValue);
    });

    manager.on('error', (error, name) => {
      console.error(`Error reading ${name}:`, error);
    });

    // Avvia il manager
    manager.start();


    // Più tardi, disabilita l'autoread per il contatore di produzione
    /*  setTimeout(() => {
        manager.setAutoRead('A0', true);
        console.log('Enable autoread for production counter');
      }, 15000);  // Dopo 15 secondi
    */
//     setTimeout(async () => {
//       try {
//         manager.writeMemoryArea("OGGI", "oggi e una bella giornata di sole sono velice la parola d'ordine è FELICIà");
// //        manager.writeMemoryArea("H0BIT", [1, 1, 0, 0, 1]);
//         manager.writeMemoryArea("H0", [0]);
//         manager.writeMemoryArea("H3", [0]);
//         console.log("Write");
//       } catch (error) {
//         console.error('Error reading production counter:', error);
//       }
//     }, 5000);  // Dopo 20 secondi

    setTimeout(async () => {
      try {
        // manager.stopPlc();
        console.log("plc in STOP");
      } catch (error) {
        console.error('Error reading production counter:', error);
      }
    }, 20000);  // Dopo 20 secondi

    setTimeout(async () => {
      try {
       // manager.runPlc();
        console.log("plc in RUN");
      } catch (error) {
        console.error('Error reading production counter:', error);
      }
    }, 21000);  // Dopo 20 secondi
    // Ferma il manager dopo un certo tempo
    setTimeout(() => {
      manager.printStatisic();
      manager.stop();
      console.log('Manager stopped');
    }, 180000);  // Dopo 60 secondi
  } catch (error) {
    manager.stop();
    console.log('Manager stopped', error);
  }

}

example();