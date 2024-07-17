import { OmronPLCManager } from './OmronPLCManager';

async function example() {
  const manager = new OmronPLCManager({
    host: '192.168.11.58',
    port: 9600,
    protocol: 'tcp',
    plcNode : 58,
    pcNode: 53,
    pollingInterval: 200  // 1 secondo
  });

  // Aggiungi aree di memoria
  manager.addMemoryArea('Ing_Bin_Pid_1', 'D578', 10, false);  // Inizialmente non in autoread
  manager.addMemoryArea('M1_A', 'D678', 10, true);   // Inizialmente in autoread
  //manager.addMemoryArea('M1_AB', 'D678.1', 1, true);   // Inizialmente in autoread

  // Gestisci eventi
  manager.on('dataChanged', (name, newValue) => {
    console.log(`Data changed for ${name}:`, newValue);
  });

  manager.on('error', (error, name) => {
    console.error(`Error reading ${name}:`, error);
  });

  // Avvia il manager
  manager.start();

  // Dopo un po', cambia l'impostazione di autoread
  setTimeout(() => {
    manager.setAutoRead('Ing_Bin_Pid_1', true);
    console.log('Enabled autoread for temperature sensors');
  }, 5000);  // Dopo 5 secondi

  // Più tardi, disabilita l'autoread per il contatore di produzione
  setTimeout(() => {
    manager.setAutoRead('M1_A', false);
    console.log('Disabled autoread for production counter');
  }, 25000);  // Dopo 15 secondi

  // Lettura manuale dopo aver disabilitato l'autoread
  setTimeout(async () => {
    try {
      const counterData = await manager.readMemoryArea('M1_A');
      console.log('Production counter data (manual read):', counterData);
    } catch (error) {
      console.error('Error reading production counter:', error);
    }
  }, 20000);  // Dopo 20 secondi

  // Ferma il manager dopo un certo tempo
  setTimeout(() => {
    manager.printStatisic();
    manager.stop();
    console.log('Manager stopped');
  }, 60000);  // Dopo 60 secondi
}

example();