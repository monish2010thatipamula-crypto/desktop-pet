const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let activeListener = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Micro floating pet - strictly locked dimensions
  const winWidth = 65;
  const winHeight = 70;

  const winX = Math.max(10, width - winWidth - 20);
  const winY = Math.max(10, height - winHeight - 45);

  mainWindow = new BrowserWindow({
    title: "Nova Desktop Pet",
    width: winWidth,
    height: winHeight,
    minWidth: winWidth,
    maxWidth: winWidth,
    minHeight: winHeight,
    maxHeight: winHeight,
    x: winX,
    y: winY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    useContentSize: true,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.setAlwaysOnTop(true, 'normal');
  mainWindow.setVisibleOnAllWorkspaces(true);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Window Dragging with strict dimension locking
ipcMain.on('window-move', (event, { mouseX, mouseY }) => {
  if (!mainWindow) return;
  const { x, y } = screen.getCursorScreenPoint();
  mainWindow.setBounds({
    x: x - mouseX,
    y: y - mouseY,
    width: 65,
    height: 70
  });
});

// Text to Speech using Python voice bridge (pyttsx3)
function speakText(text) {
  if (!text) return;
  const scriptPath = path.join(__dirname, 'voice_bridge.py');
  const py = spawn('python', [scriptPath, 'speak', text], {
    windowsHide: true,
    stdio: 'ignore'
  });
  py.unref();
}

ipcMain.on('speak', (event, text) => {
  speakText(text);
});

// Execute action on laptop
function executeLaptopAction(text) {
  const raw = text.toLowerCase().trim();
  console.log(`[Nova Action]: "${raw}"`);

  // 1. APPS
  if (/chrome/i.test(raw)) {
    exec('cmd.exe /c "start chrome || start msedge"', { windowsHide: true });
    speakText("Opening Chrome!");
    return "Opening Chrome";
  }
  if (/edge/i.test(raw)) {
    exec('cmd.exe /c "start msedge"', { windowsHide: true });
    speakText("Opening Edge!");
    return "Opening Edge";
  }
  if (/notepad/i.test(raw)) {
    exec('cmd.exe /c "start notepad"', { windowsHide: true });
    speakText("Opening Notepad!");
    return "Opening Notepad";
  }
  if (/calc|calculator/i.test(raw)) {
    exec('cmd.exe /c "start calc"', { windowsHide: true });
    speakText("Opening Calculator!");
    return "Opening Calculator";
  }
  if (/spotify/i.test(raw)) {
    exec('cmd.exe /c "start spotify"', { windowsHide: true });
    speakText("Opening Spotify!");
    return "Opening Spotify";
  }
  if (/discord/i.test(raw)) {
    exec('cmd.exe /c "start discord"', { windowsHide: true });
    speakText("Opening Discord!");
    return "Opening Discord";
  }
  if (/vs\s*code|code/i.test(raw) && !raw.includes("play")) {
    exec('cmd.exe /c "start code"', { windowsHide: true });
    speakText("Opening Visual Studio Code!");
    return "Opening VS Code";
  }
  if (/paint/i.test(raw)) {
    exec('cmd.exe /c "start mspaint"', { windowsHide: true });
    speakText("Opening Paint!");
    return "Opening Paint";
  }
  if (/task manager|taskmgr/i.test(raw)) {
    exec('cmd.exe /c "start taskmgr"', { windowsHide: true });
    speakText("Opening Task Manager!");
    return "Task Manager";
  }
  if (/settings/i.test(raw)) {
    exec('cmd.exe /c "start ms-settings:"', { windowsHide: true });
    speakText("Opening Settings!");
    return "Settings";
  }
  if (/terminal|cmd|powershell/i.test(raw)) {
    exec('cmd.exe /c "start wt || start cmd"', { windowsHide: true });
    speakText("Opening Terminal!");
    return "Terminal";
  }

  // 2. FOLDERS
  if (/downloads/i.test(raw)) {
    exec('cmd.exe /c "start \"\" \"%USERPROFILE%\\Downloads\""', { windowsHide: true });
    speakText("Opening Downloads folder!");
    return "Downloads";
  }
  if (/documents/i.test(raw)) {
    exec('cmd.exe /c "start \"\" \"%USERPROFILE%\\Documents\""', { windowsHide: true });
    speakText("Opening Documents folder!");
    return "Documents";
  }
  if (/desktop/i.test(raw) && !raw.includes("show") && !raw.includes("minimize")) {
    exec('cmd.exe /c "start \"\" \"%USERPROFILE%\\Desktop\""', { windowsHide: true });
    speakText("Opening Desktop folder!");
    return "Desktop Folder";
  }

  // 3. VOLUME & MEDIA
  if (/volume up|louder|turn it up/i.test(raw)) {
    const scriptPath = path.join(__dirname, 'actions.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Action volume-up`, { windowsHide: true });
    speakText("Volume up!");
    return "Volume Up";
  }
  if (/volume down|quieter|lower volume|turn it down/i.test(raw)) {
    const scriptPath = path.join(__dirname, 'actions.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Action volume-down`, { windowsHide: true });
    speakText("Volume down!");
    return "Volume Down";
  }
  if (/mute|unmute|silence/i.test(raw)) {
    const scriptPath = path.join(__dirname, 'actions.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Action volume-mute`, { windowsHide: true });
    speakText("Volume toggled!");
    return "Mute Toggled";
  }
  if (/pause|resume|play music|pause music/i.test(raw)) {
    const scriptPath = path.join(__dirname, 'actions.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Action media-play`, { windowsHide: true });
    speakText("Toggled playback!");
    return "Media Play/Pause";
  }
  if (/next song|skip/i.test(raw)) {
    const scriptPath = path.join(__dirname, 'actions.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Action media-next`, { windowsHide: true });
    speakText("Next song!");
    return "Next Track";
  }

  // 4. SYSTEM ACTIONS
  if (/screenshot|capture screen/i.test(raw)) {
    const homeDir = process.env.USERPROFILE || 'C:\\';
    const scDir = path.join(homeDir, 'Pictures', 'Screenshots');
    if (!fs.existsSync(scDir)) fs.mkdirSync(scDir, { recursive: true });
    const filePath = path.join(scDir, `Screenshot_${Date.now()}.png`);
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms;
      Add-Type -AssemblyName System.Drawing;
      $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
      $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height;
      $g = [System.Drawing.Graphics]::FromImage($bmp);
      $g.CopyFromScreen($b.X, $b.Y, 0, 0, $bmp.Size);
      $bmp.Save('${filePath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png);
      $g.Dispose(); $bmp.Dispose();
    `;
    exec(`powershell.exe -NoProfile -Command "${ps.replace(/\n/g, ' ')}"`, { windowsHide: true }, () => {
      shell.showItemInFolder(filePath);
    });
    speakText("Screenshot captured!");
    return "Screenshot Saved";
  }

  if (/lock laptop|lock screen|lock pc/i.test(raw)) {
    speakText("Locking your laptop!");
    exec('rundll32.exe user32.dll,LockWorkStation', { windowsHide: true });
    return "Locked Laptop";
  }

  if (/minimize all|show desktop|hide windows/i.test(raw)) {
    exec('powershell.exe -NoProfile -Command "(New-Object -ComObject Shell.Application).MinimizeAll()"', { windowsHide: true });
    speakText("Showing desktop!");
    return "Desktop";
  }

  if (/battery/i.test(raw)) {
    exec('powershell.exe -NoProfile -Command "Get-CimInstance Win32_Battery | Select-Object -ExpandProperty EstimatedChargeRemaining"', (err, stdout) => {
      const charge = stdout.trim() || "100";
      speakText(`Your battery is at ${charge} percent!`);
    });
    return "Checking Battery...";
  }

  if (/recycle bin|empty trash/i.test(raw)) {
    exec('powershell.exe -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"', { windowsHide: true });
    speakText("Recycle bin emptied!");
    return "Cleaned Recycle Bin";
  }

  // 5. YOUTUBE & MUSIC
  if (/youtube/i.test(raw) || (raw.startsWith('play ') && !raw.includes('game'))) {
    const q = encodeURIComponent(raw.replace(/^(play|search|watch)\s+/i, '').replace(/\s+on\s+youtube/i, '').trim());
    shell.openExternal(`https://www.youtube.com/results?search_query=${q}`);
    speakText("Opening YouTube!");
    return `Playing on YouTube`;
  }

  // 6. GOOGLE / WEB SEARCH
  if (/search|google|look up|find/i.test(raw)) {
    const q = encodeURIComponent(raw.replace(/^(search|google|look up|find)\s+(for\s+)?/i, '').trim());
    shell.openExternal(`https://www.google.com/search?q=${q}`);
    speakText("Searching Google!");
    return `Searching Google`;
  }

  // 7. FUN / CONVERSATION
  if (/joke/i.test(raw)) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "Why did the computer keep freezing? It left its Windows open!",
      "What is an astronaut's favorite key on a keyboard? The Space bar!",
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    speakText(joke);
    return joke;
  }

  if (/dance|spin|somersault/i.test(raw)) {
    speakText("Wheee! Watch this!");
    return "Dancing!";
  }

  if (/who are you|hello|hi/i.test(raw)) {
    speakText("Hi! I am Nova, your laptop pet! Tell me what to do anytime.");
    return "Hi, I'm Nova! ✨";
  }

  // Fallback: search web for whatever was said
  shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(raw)}`);
  speakText(`Searching for ${raw}`);
  return `Searching "${raw}"`;
}

// Voice Recognition & Universal Laptop Control via Python bridge
ipcMain.handle('start-voice-recognition', () => {
  return new Promise((resolve) => {
    if (activeListener) {
      try { activeListener.kill(); } catch (e) {}
      activeListener = null;
    }

    const scriptPath = path.join(__dirname, 'voice_bridge.py');
    const py = spawn('python', [scriptPath, 'listen']);
    activeListener = py;
    let resultFound = false;
    let pillMessage = 'Action completed!';

    py.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Bridge Output]:', output.trim());

      if (output.includes('LISTENING_START')) {
        if (mainWindow) mainWindow.webContents.send('voice-listening-start');
      }

      if (output.includes('PILL:')) {
        const match = output.match(/PILL:(.+)/);
        if (match) pillMessage = match[1].trim();
      }

      if (output.includes('RESULT:')) {
        resultFound = true;
        const match = output.match(/RESULT:(.+)/);
        const text = match ? match[1].trim() : '';
        resolve({ success: true, text, actionResult: pillMessage });
      }

      if (output.includes('ERROR:')) {
        const match = output.match(/ERROR:(.+)/);
        const errMsg = match ? match[1].trim() : 'No speech';
        if (!resultFound) {
          resolve({ success: false, error: errMsg });
        }
      }
    });

    py.on('close', () => {
      activeListener = null;
      if (!resultFound) {
        resolve({ success: false, error: 'Timeout' });
      }
    });

    py.on('error', (err) => {
      activeListener = null;
      resolve({ success: false, error: err.message });
    });
  });
});
