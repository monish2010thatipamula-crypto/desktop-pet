# 🌟 Nova — 3D Interactive AI Desktop Pet & PC Companion

Nova is a stylized 3D companion that lives directly on your Windows desktop, floating transparently on your screen, responding to your voice and commands, and automating whatever you ask it to do on your laptop.

---

## 🚀 How to Launch Nova

You can launch Nova anytime by:
1. Double-clicking [start-pet.bat](file:///C:/Users/Monish/.gemini/antigravity/scratch/desktop-pet/start-pet.bat)
2. Or in terminal:
```bash
cd C:\Users\Monish\.gemini\antigravity\scratch\desktop-pet
npm start
```

---

## ✨ Features & Capabilities

### 🐾 1. 3D Companion Mechanics
- **Mouse Tracking**: Nova's head, floating antennae, and eyes actively track your cursor in real-time.
- **Expressive Animated Visor**: Dynamic digital eyes that blink, smile (`^ ^`), wink, get curious (`o O`), display holographic scan rings when working, and show hearts (`♥ ♥`) when praised!
- **Interactive**: Click Nova to pet it! It will bounce, chime, and respond playfully.
- **Draggable**: Grab Nova or click the `✥` drag button to move it anywhere on your desktop screen.
- **Sound & Voice**: Procedural retro/sci-fi chimes using Web Audio API and cheerful Text-to-Speech voice.
- **Global Summon Shortcut**: Press `Ctrl + Shift + Space` anywhere on your laptop to bring Nova into focus!

---

### 💻 2. Laptop Automation Commands ("Does Whatever You Say")

| Category | Voice or Text Command Examples | What Nova Does |
| :--- | :--- | :--- |
| **App Launching** | `open chrome`, `open vscode`, `open spotify`, `open discord`, `open notepad`, `open calculator`, `open task manager`, `open settings` | Automatically starts the Windows application |
| **Web & Search** | `search for quantum computing`, `google recipe for pasta` | Launches your browser with search results |
| **YouTube** | `play lofi hip hop on youtube`, `watch trailer` | Directly opens YouTube searching or playing the track |
| **Audio Controls** | `mute`, `unmute`, `volume up`, `volume down`, `louder` | Adjusts Windows master volume directly |
| **Media Playback** | `pause`, `play`, `next song`, `previous song` | Controls Windows media keys |
| **Screenshots** | `take screenshot`, `screenshot` | Captures your full screen, saves to `Pictures/Screenshots`, and opens it |
| **System Controls** | `lock laptop`, `minimize all`, `show desktop`, `battery level`, `empty recycle bin` | Executes Windows system utilities safely |
| **File Folders** | `open downloads`, `open documents`, `open desktop`, `open pictures` | Opens File Explorer to the target folder |
| **Quick Notes** | `note remember to buy groceries`, `save note check email` | Appends a timestamped note to `Desktop/Nova_Notes.txt` |
| **Timers & Alarms** | `timer 5 minutes`, `remind me in 10 minutes to stretch` | Sets a live countdown and alerts you with speech & sound |
| **Time & Date** | `what time is it`, `what's today's date` | Reads the current time or date |
| **Fun & Tricks** | `tell a joke`, `dance`, `spin`, `sleep`, `wake up`, `who are you`, `i love you` | Performs somersaults, animations, and tells jokes |
