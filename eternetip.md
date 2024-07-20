### Struttura del protocollo EtherNet/IP

EtherNet/IP (Ethernet Industrial Protocol) è un protocollo di rete industriale che utilizza componenti Ethernet standard. È gestito dall'ODVA (Open DeviceNet Vendor Association) e segue specifiche open standard. Questo protocollo è utilizzato sia per la comunicazione tra controllori che come rete di campo. Ecco una panoramica della sua struttura e funzionalità basate sul documento fornito.

#### Componenti Principali

1. **Unità EtherNet/IP**
   - **CS1W-EIP21 per la serie CS**
   - **CJ1W-EIP21 per la serie CJ**
   - **Porta integrata EtherNet/IP nei moduli CPU CJ2H-CPU@@-EIP/CJ2M-CPU3@**

2. **Configurazione del Sistema EtherNet/IP**
   - **Collegamenti Ciclici (Tag Data Links)**: Permettono comunicazioni implicite ad alta velocità tra dispositivi EtherNet/IP. Supportano set di tag di alto volume per lo scambio dati tra PLC.
   - **Ciclo di Comunicazione**: I collegamenti ciclici possono operare a un periodo ciclico specificato per ogni applicazione, mantenendo la sincronicità dei dati anche con l'aumento del numero di nodi.

#### Specifiche di Comunicazione

- **Scambio di Dati ad Alta Velocità e Capacità**
  - Supporto per comunicazioni cicliche con set di tag ad alto volume (fino a 640 parole per CJ2M-EIP21 e fino a 184,832 parole per altre unità CPU).

- **Ciclo di Comunicazione dei Collegamenti Ciclici**
  - I collegamenti ciclici possono operare al ciclo di aggiornamento impostato per ciascuna connessione, garantendo che il ciclo di aggiornamento delle comunicazioni non aumenti con l'aumento dei nodi.

- **Servizi di Comunicazione**
  - **FINS/TCP e FINS/UDP**: Scambio flessibile di dati con altri dispositivi FA OMRON usando i comandi SEND, RECV, e CMND nel programma ladder.

#### Caratteristiche Aggiuntive

- **Server FTP Integrato**: Consente il trasferimento di file nel PLC da e verso un computer host senza bisogno di programmazione ladder aggiuntiva.
- **Regolazione Automatica dell'Orologio del PLC**: Gli orologi integrati nei PLC possono essere regolati automaticamente al tempo dell'orologio del server SNTP, permettendo un'analisi accurata delle storie di produzione.

#### Configurazione di Rete e Parametri

1. **Impostazioni TCP/IP**
   - **Indirizzo IP**: Impostato nella pagina TCP/IP del CX-Programmer.
   - **Maschera di Sottorete**: Supporta CIDR, con la possibilità di impostare la maschera di sottorete da 192.0.0.0 a 255.255.255.252.
   - **Gateway Predefinito**: Impostazione dell'indirizzo IP del gateway predefinito.
   - **DNS Preferito e Alternativo**: Indirizzi IP dei server DNS preferiti e alternativi per la risoluzione dei nomi host.
   - **Nome di Dominio**: Nome del dominio a cui appartiene l'unità EtherNet/IP.

2. **Configurazione del Collegamento Dati**
   - **Metodi di Conversione dell'Indirizzo IP**: Generazione automatica (dinamica o statica) o tabella degli indirizzi IP.
   - **Filtraggio dei Pacchetti Multicast**: Supporto per filtrare i pacchetti multicast non necessari utilizzando un hub di commutazione con IGMP snooping.

### Esempio di Configurazione

1. **Creazione della Configurazione**
   - Utilizzare il Network Configurator per creare e modificare la configurazione della rete, sia online che offline.
   - Caricare e monitorare le impostazioni di configurazione dei dispositivi e dei collegamenti dati.

2. **Impostazioni TCP/IP dal Network Configurator**
   - Connettere il Network Configurator online e utilizzare lo strumento di configurazione TCP/IP per impostare l'indirizzo IP e altri parametri TCP/IP dei dispositivi.

### Note Importanti

- **Ripristino dell'Unità**: Le nuove impostazioni TCP/IP richiedono il riavvio dell'unità EtherNet/IP per essere effettive. Assicurarsi che il riavvio dell'unità non causi problemi al sistema prima di procedere.
- **Compatibilità con Dispositivi di Altri Produttori**: Verificare che i dispositivi di altri produttori supportino lo standard Large Forward Open quando si utilizzano dimensioni di dati superiori a 505 byte.

### Struttura e Formazione dei Messaggi CIP in EtherNet/IP

EtherNet/IP utilizza il protocollo Common Industrial Protocol (CIP) per la comunicazione tra i dispositivi. CIP è un protocollo di livello applicativo che offre servizi per il controllo e il monitoraggio di dispositivi in una rete industriale. Ecco una panoramica dettagliata su come sono formati i messaggi CIP e il loro significato.

#### Formato dei Messaggi CIP

I messaggi CIP possono essere divisi in due categorie principali: messaggi impliciti e messaggi espliciti.

1. **Messaggi Impliciti**:
   - Sono utilizzati per lo scambio di dati I/O in tempo reale.
   - Utilizzano un meccanismo di comunicazione a bassa latenza e alta velocità.
   - Sono generalmente configurati tramite collegamenti ciclici (Tag Data Links).

2. **Messaggi Espliciti**:
   - Sono utilizzati per il controllo non in tempo reale e per lo scambio di dati diagnostici.
   - Utilizzano un meccanismo di richiesta/risposta, dove un dispositivo invia una richiesta e attende una risposta dal dispositivo di destinazione.

#### Formato dei Messaggi CIP Espliciti

Un messaggio esplicito CIP è costituito da vari campi, tra cui:

- **Service Code**: Indica il tipo di servizio richiesto, come la lettura di attributi, la scrittura di attributi, ecc.
- **Class ID**: Identifica la classe dell'oggetto a cui è indirizzato il messaggio.
- **Instance ID**: Specifica l'istanza dell'oggetto all'interno della classe.
- **Attribute ID**: Indica l'attributo specifico dell'oggetto.
- **Request Path**: Definisce il percorso per raggiungere l'oggetto di destinazione.
- **Data**: Contiene i dati associati alla richiesta.

#### Dettagli dei Messaggi CIP

**Esempio di Messaggio CIP per la Lettura di Attributi:**

- **Command Block**:
  ```
  0E  |  C4 (2F) | 00 | Attribute ID
  ```
  Dove:
  - `0E` è il codice di servizio per la lettura degli attributi.
  - `C4` (o `2F` per versioni precedenti) è l'ID di classe.
  - `00` è l'ID dell'istanza.
  - `Attribute ID` specifica l'attributo da leggere (es. 64 per il modo operativo della CPU, 65 per gli errori della CPU).

- **Response Block**:
  ```
  8E  |  Attribute Value
  ```
  Dove:
  - `8E` è il codice di servizio nella risposta (0E con il bit più alto settato).
  - `Attribute Value` contiene il valore dell'attributo richiesto.

**Esempio di Messaggio CIP per la Scrittura di Attributi:**

- **Command Block**:
  ```
  10  |  C4 (2F) | 00 | Attribute ID | Attribute Value
  ```
  Dove:
  - `10` è il codice di servizio per la scrittura degli attributi.
  - `C4` (o `2F` per versioni precedenti) è l'ID di classe.
  - `00` è l'ID dell'istanza.
  - `Attribute ID` specifica l'attributo da scrivere.
  - `Attribute Value` contiene il valore da scrivere.

- **Response Block**:
  ```
  90
  ```
  Dove:
  - `90` è il codice di servizio nella risposta (10 con il bit più alto settato).

#### Esempio di Utilizzo del Comando CIP UCMM

**Comando CIP UCMM MESSAGE SEND (28 10)**:

- **Command Block**:
  ```
  28 10 | Transport ID | Message monitoring time | Service code | Request path size | Request path | Request data
  ```

- **Response Block**:
  ```
  28 10 | Response code | No. of bytes received | Service response data
  ```

In questo comando:
- `28 10` è il codice di comando per l'invio di un messaggio UCMM.
- `Transport ID` identifica il comando.
- `Message monitoring time` specifica il tempo di monitoraggio.
- `Service code` è il codice del servizio richiesto.
- `Request path size` specifica la dimensione del percorso di richiesta.
- `Request path` e `Request data` contengono i dettagli della richiesta.

**Esempio di Formato di Comando:**

- **Richiesta**: Lettura di attributi dell'oggetto Identità
  ```
  28 10 | 00 00 | 05 DC | 52 02 | 20 06 24 01 | 0A 0C 06 00 | 01 02 20 24 01 | 08 00 12 0D | 31 39 32 2E 31 36 38 2E 32 35 30 2E 32 00
  ```

- **Risposta**:
  ```
  28 10 | 00 00 | 00 1D | 8E 00 00 | 30 00 53 03 00 11 0A 43 53 31 57 2D 45 49 50 32 31 00
  ```

### Lista dei "Service Code" CIP con Valore e Spiegazione

Ecco una lista dei codici di servizio (Service Code) utilizzati nei messaggi CIP (Common Industrial Protocol) all'interno del protocollo EtherNet/IP, con il valore esadecimale e una spiegazione del loro utilizzo.

1. **0E Hex (14 Dec) - CPU Information Read**
   - **Descrizione**: Legge le informazioni dell'unità CPU, incluso il modo operativo, gli errori fatali/non fatali e il modello della CPU.

2. **10 Hex (16 Dec) - CPU Unit Write**
   - **Descrizione**: Scrive informazioni nell'unità CPU, incluso il cambio del modo operativo e la cancellazione degli errori.

3. **40 Hex (64 Dec) - CPU Unit Status Read**
   - **Descrizione**: Legge lo stato dettagliato dell'unità CPU, inclusi lo stato operativo, il modo operativo, informazioni sugli errori fatali e non fatali, messaggi ed errori.

4. **1C Hex (28 Dec) - Byte Data Read**
   - **Descrizione**: Legge i dati in byte dell'area di memoria specificata della CPU.

5. **1D Hex (29 Dec) - Word Data Read**
   - **Descrizione**: Legge i dati in word dell'area di memoria specificata della CPU.

6. **1E Hex (30 Dec) - Byte Data Write**
   - **Descrizione**: Scrive i dati in byte nell'area di memoria specificata della CPU.

7. **1F Hex (31 Dec) - Word Data Write**
   - **Descrizione**: Scrive i dati in word nell'area di memoria specificata della CPU.

#### Codici di Servizio Aggiuntivi e Descrizioni Generali

8. **52 Hex (82 Dec) - Unconnected Send**
   - **Descrizione**: Invio di un messaggio senza connessione, utilizzato per la comunicazione UCMM (Unconnected Message Manager).

9. **4B Hex (75 Dec) - Forward Open**
   - **Descrizione**: Apre una connessione per la comunicazione implicita.

10. **4C Hex (76 Dec) - Forward Close**
    - **Descrizione**: Chiude una connessione aperta precedentemente per la comunicazione implicita.

11. **0A Hex (10 Dec) - Get Attribute Single**
    - **Descrizione**: Recupera il valore di un singolo attributo di un oggetto specificato.

12. **0B Hex (11 Dec) - Set Attribute Single**
    - **Descrizione**: Imposta il valore di un singolo attributo di un oggetto specificato.

13. **32 Hex (50 Dec) - Reset**
    - **Descrizione**: Resetta un dispositivo specificato.

14. **33 Hex (51 Dec) - Start**
    - **Descrizione**: Avvia un dispositivo specificato.

15. **34 Hex (52 Dec) - Stop**
    - **Descrizione**: Ferma un dispositivo specificato.

16. **4D Hex (77 Dec) - Get Connection Data**
    - **Descrizione**: Recupera i dati di una connessione specificata.

### Spiegazioni e Note Aggiuntive

- **Command Block**: Struttura che contiene il codice di servizio, l'ID di classe, l'ID di istanza e i dati della richiesta.
- **Response Block**: Struttura che contiene il codice di servizio nella risposta, i dati di risposta e eventuali codici di errore.

### Lista delle "Class ID" CIP e la loro Spiegazione

In EtherNet/IP, le "Class ID" identificano le classi di oggetti che possono essere indirizzate per la comunicazione CIP. Ecco una lista delle principali "Class ID" standard utilizzate nel protocollo CIP, con una spiegazione del loro utilizzo.

1. **Class ID: 0x01 - Identity Object**
   - **Descrizione**: Contiene informazioni identificative del dispositivo come il vendor ID, device type, product code, versione del firmware, e altri attributi identificativi.

2. **Class ID: 0x02 - Message Router Object**
   - **Descrizione**: Gestisce il routing dei messaggi tra diversi oggetti e istanze all'interno del dispositivo.

3. **Class ID: 0x04 - Assembly Object**
   - **Descrizione**: Gestisce la raccolta di attributi da altri oggetti in un unico punto per scopi di I/O. Viene utilizzato per l'aggregazione e la gestione dei dati di ingresso e uscita.

4. **Class ID: 0x06 - Connection Manager Object**
   - **Descrizione**: Gestisce le connessioni CIP, inclusa la configurazione e la manutenzione delle connessioni implicite ed esplicite.

5. **Class ID: 0x08 - QoS (Quality of Service) Object**
   - **Descrizione**: Definisce i parametri per la gestione della qualità del servizio nella rete, come priorità dei messaggi e larghezza di banda.

6. **Class ID: 0x0F - Parameter Object**
   - **Descrizione**: Gestisce i parametri del dispositivo, inclusi i parametri di configurazione che possono essere letti o scritti.

7. **Class ID: 0x2C - TCP/IP Interface Object**
   - **Descrizione**: Fornisce le informazioni e le funzionalità necessarie per la gestione dell'interfaccia di rete TCP/IP del dispositivo.

8. **Class ID: 0x2D - Ethernet Link Object**
   - **Descrizione**: Gestisce i collegamenti Ethernet, inclusi lo stato del collegamento, la velocità e altre statistiche di rete.

9. **Class ID: 0x30 - File Object**
   - **Descrizione**: Gestisce i file nel dispositivo, inclusa la lettura e la scrittura dei file.

10. **Class ID: 0xC4 (0x2F per versioni precedenti) - PLC Object**
    - **Descrizione**: Utilizzato per l'interazione con i PLC, inclusa la lettura e la scrittura dello stato e della memoria del PLC.

#### Esempio di Attributi e Utilizzo delle Class ID

**Esempio di Messaggio per Identity Object (Class ID: 0x01)**:
- **Request**: Richiesta di lettura dell'attributo di vendor ID
  ```
  Service Code: 0x0E (Get_Attribute_Single)
  Class ID: 0x01
  Instance ID: 0x01 (Istanza dell'Identity Object)
  Attribute ID: 0x01 (Vendor ID)
  ```
- **Response**: Risposta contenente il vendor ID del dispositivo

**Esempio di Messaggio per Assembly Object (Class ID: 0x04)**:
- **Request**: Richiesta di lettura dei dati di ingresso
  ```
  Service Code: 0x0E (Get_Attribute_Single)
  Class ID: 0x04
  Instance ID: 0x64 (Istanza dell'Assembly Object per I/O)
  Attribute ID: 0x03 (Dati di ingresso)
  ```
- **Response**: Risposta contenente i dati di ingresso aggregati

### Lista delle "Instance ID" CIP e la loro Spiegazione

In EtherNet/IP, gli "Instance ID" identificano istanze specifiche degli oggetti CIP all'interno di una classe. Ecco una lista dei principali "Instance ID" utilizzati nel protocollo CIP, con una spiegazione del loro utilizzo basato sui documenti forniti.

#### Identity Object (Class ID: 0x01)
1. **Instance ID: 0x01**
   - **Descrizione**: Rappresenta l'istanza principale dell'oggetto Identity. Contiene informazioni identificative del dispositivo come il vendor ID, device type, product code, versione del firmware, e altri attributi identificativi.

#### Assembly Object (Class ID: 0x04)
1. **Instance ID: 0x64**
   - **Descrizione**: Tipicamente utilizzato per l'aggregazione dei dati di ingresso (input).

2. **Instance ID: 0x65**
   - **Descrizione**: Tipicamente utilizzato per l'aggregazione dei dati di uscita (output).

#### TCP/IP Interface Object (Class ID: 0x2C)
1. **Instance ID: 0x01**
   - **Descrizione**: Rappresenta l'interfaccia principale TCP/IP del dispositivo. Gestisce la configurazione e lo stato dell'interfaccia di rete TCP/IP.

#### Ethernet Link Object (Class ID: 0x2D)
1. **Instance ID: 0x01**
   - **Descrizione**: Rappresenta il collegamento Ethernet principale del dispositivo. Gestisce lo stato del collegamento, la velocità, e altre statistiche di rete.

#### PLC Object (Class ID: 0xC4 o 0x2F per versioni precedenti)
1. **Instance ID: 0x00**
   - **Descrizione**: Utilizzato per l'interazione con i PLC, inclusa la lettura e la scrittura dello stato e della memoria del PLC.

#### CPU Unit Memory Areas (per Class ID: 0xC4 o 0x2F per versioni precedenti)
1. **Instance ID: 0x01**
   - **Descrizione**: Area di memoria CIO (Central I/O Memory).

2. **Instance ID: 0x03**
   - **Descrizione**: Area di memoria DM (Data Memory).

3. **Instance ID: 0x04**
   - **Descrizione**: Area di memoria WR (Work Memory).

4. **Instance ID: 0x05**
   - **Descrizione**: Area di memoria HR (Holding Relay Memory).

5. **Instance ID: 0x08 - 0x20**
   - **Descrizione**: Aree di memoria EM (Extended Memory), da EM bank 0 a EM bank 18.

### Esempio di Utilizzo degli Instance ID

**Esempio di Messaggio per Identity Object (Class ID: 0x01, Instance ID: 0x01)**:
- **Request**: Richiesta di lettura dell'attributo di vendor ID
  ```
  Service Code: 0x0E (Get_Attribute_Single)
  Class ID: 0x01
  Instance ID: 0x01 (Istanza dell'Identity Object)
  Attribute ID: 0x01 (Vendor ID)
  ```
- **Response**: Risposta contenente il vendor ID del dispositivo

**Esempio di Messaggio per Assembly Object (Class ID: 0x04, Instance ID: 0x64)**:
- **Request**: Richiesta di lettura dei dati di ingresso
  ```
  Service Code: 0x0E (Get_Attribute_Single)
  Class ID: 0x04
  Instance ID: 0x64 (Istanza dell'Assembly Object per I/O)
  Attribute ID: 0x03 (Dati di ingresso)
  ```
- **Response**: Risposta contenente i dati di ingresso aggregati

### Lista degli "Attribute ID" CIP con relativa Descrizione e Parametri

Ecco una lista dei principali "Attribute ID" utilizzati nel protocollo CIP, con una spiegazione del loro utilizzo e i parametri associati.

#### Identity Object (Class ID: 0x01)
1. **Attribute ID: 0x01 - Vendor ID**
   - **Descrizione**: Identifica il produttore del dispositivo.
   - **Tipo di Dato**: UINT
   - **Dimensione**: 2 byte

2. **Attribute ID: 0x02 - Device Type**
   - **Descrizione**: Specifica il tipo di dispositivo.
   - **Tipo di Dato**: UINT
   - **Dimensione**: 2 byte

3. **Attribute ID: 0x03 - Product Code**
   - **Descrizione**: Codice prodotto univoco per il dispositivo.
   - **Tipo di Dato**: UINT
   - **Dimensione**: 2 byte

4. **Attribute ID: 0x04 - Revision**
   - **Descrizione**: Versione del firmware del dispositivo.
   - **Tipo di Dato**: STRUCT (Major, Minor)
   - **Dimensione**: 2 byte

5. **Attribute ID: 0x05 - Status**
   - **Descrizione**: Stato operativo del dispositivo.
   - **Tipo di Dato**: WORD
   - **Dimensione**: 2 byte

6. **Attribute ID: 0x06 - Serial Number**
   - **Descrizione**: Numero di serie del dispositivo.
   - **Tipo di Dato**: UDINT
   - **Dimensione**: 4 byte

7. **Attribute ID: 0x07 - Product Name**
   - **Descrizione**: Nome del prodotto.
   - **Tipo di Dato**: SHORT_STRING
   - **Dimensione**: Variabile

#### Assembly Object (Class ID: 0x04)
1. **Attribute ID: 0x03 - Data**
   - **Descrizione**: Contiene i dati di I/O aggregati.
   - **Tipo di Dato**: ARRAY
   - **Dimensione**: Variabile

#### TCP/IP Interface Object (Class ID: 0x2C)
1. **Attribute ID: 0x01 - Status**
   - **Descrizione**: Stato dell'interfaccia TCP/IP.
   - **Tipo di Dato**: DWORD
   - **Dimensione**: 4 byte

2. **Attribute ID: 0x02 - Configuration Capability**
   - **Descrizione**: Capacità di configurazione dell'interfaccia TCP/IP.
   - **Tipo di Dato**: DWORD
   - **Dimensione**: 4 byte

3. **Attribute ID: 0x03 - Configuration Control**
   - **Descrizione**: Controllo di configurazione dell'interfaccia TCP/IP.
   - **Tipo di Dato**: DWORD
   - **Dimensione**: 4 byte

4. **Attribute ID: 0x04 - Physical Link Object**
   - **Descrizione**: Riferimento all'oggetto link fisico associato.
   - **Tipo di Dato**: EPATH
   - **Dimensione**: Variabile

5. **Attribute ID: 0x05 - Interface Configuration**
   - **Descrizione**: Configurazione dell'interfaccia TCP/IP, inclusi indirizzo IP, maschera di sottorete e gateway.
   - **Tipo di Dato**: STRUCT (IP Address, Subnet Mask, Gateway)
   - **Dimensione**: 16 byte

6. **Attribute ID: 0x06 - Host Name**
   - **Descrizione**: Nome host del dispositivo.
   - **Tipo di Dato**: STRING
   - **Dimensione**: Variabile

#### Ethernet Link Object (Class ID: 0x2D)
1. **Attribute ID: 0x01 - Interface Speed**
   - **Descrizione**: Velocità dell'interfaccia Ethernet.
   - **Tipo di Dato**: DWORD
   - **Dimensione**: 4 byte

2. **Attribute ID: 0x02 - Interface Flags**
   - **Descrizione**: Flag di stato dell'interfaccia Ethernet.
   - **Tipo di Dato**: DWORD
   - **Dimensione**: 4 byte

3. **Attribute ID: 0x03 - Physical Address**
   - **Descrizione**: Indirizzo fisico (MAC) dell'interfaccia Ethernet.
   - **Tipo di Dato**: ARRAY
   - **Dimensione**: 6 byte

4. **Attribute ID: 0x04 - Interface Counters**
   - **Descrizione**: Contatori di statistica dell'interfaccia Ethernet.
   - **Tipo di Dato**: STRUCT (Rx Counters, Tx Counters)
   - **Dimensione**: Variabile

### Esempi di Utilizzo degli Attribute ID

**Esempio di Messaggio per Identity Object (Class ID: 0x01, Instance ID: 0x01, Attribute ID: 0x01 - Vendor ID)**:
- **Request**: Richiesta di lettura dell'attributo Vendor ID
  ```
  Service Code: 0x0E (Get_Attribute_Single)
  Class ID: 0x01
  Instance ID: 0x01
  Attribute ID: 0x01
  ```
- **Response**: Risposta contenente il Vendor ID del dispositivo

**Esempio di Messaggio per Ethernet Link Object (Class ID: 0x2D, Instance ID: 0x01, Attribute ID: 0x03 - Physical Address)**:
- **Request**: Richiesta di lettura dell'indirizzo fisico
  ```
  Service Code: 0x0E (Get_Attribute_Single)
  Class ID: 0x2D
  Instance ID: 0x01
  Attribute ID: 0x03
  ```
- **Response**: Risposta contenente l'indirizzo MAC dell'interfaccia Ethernet
