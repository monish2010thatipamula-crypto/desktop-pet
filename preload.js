const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (mouseX, mouseY) => ipcRenderer.send('window-move', { mouseX, mouseY }),
  startVoiceRecognition: () => ipcRenderer.invoke('start-voice-recognition'),
  onVoiceListeningStart: (callback) => ipcRenderer.on('voice-listening-start', () => callback()),
  speak: (text) => ipcRenderer.send('speak', text),
});
