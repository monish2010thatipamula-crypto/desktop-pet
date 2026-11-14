import os
import sys
import re
import glob
import time
import ctypes
import shutil
import socket
import webbrowser
import subprocess
import requests
import pyperclip
import difflib
from datetime import datetime

# Windows Virtual Key Codes
VK_LBUTTON = 0x01
VK_RBUTTON = 0x02
VK_MBUTTON = 0x04
VK_BACK = 0x08
VK_TAB = 0x09
VK_RETURN = 0x0D
VK_SHIFT = 0x10
VK_CONTROL = 0x11
VK_MENU = 0x12  # ALT
VK_PAUSE = 0x13
VK_CAPITAL = 0x14
VK_ESCAPE = 0x1B
VK_SPACE = 0x20
VK_PRIOR = 0x21  # Page Up
VK_NEXT = 0x22   # Page Down
VK_END = 0x23
VK_HOME = 0x24
VK_LEFT = 0x25
VK_UP = 0x26
VK_RIGHT = 0x27
VK_DOWN = 0x28
VK_SNAPSHOT = 0x2C  # Print Screen
VK_INSERT = 0x2D
VK_DELETE = 0x2E
VK_LWIN = 0x5B
VK_RWIN = 0x5C
VK_F1 = 0x70
VK_F2 = 0x71
VK_F3 = 0x72
VK_F4 = 0x73
VK_F5 = 0x74
VK_F6 = 0x75
VK_F7 = 0x76
VK_F8 = 0x77
VK_F9 = 0x78
VK_F10 = 0x79
VK_F11 = 0x7A
VK_F12 = 0x7B
VK_VOLUME_MUTE = 0xAD
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_UP = 0xAF
VK_MEDIA_NEXT_TRACK = 0xB0
VK_MEDIA_PREV_TRACK = 0xB1
VK_MEDIA_STOP = 0xB2
VK_MEDIA_PLAY_PAUSE = 0xB3
VK_OEM_PLUS = 0xBB
VK_OEM_COMMA = 0xBC
VK_OEM_MINUS = 0xBD
VK_OEM_PERIOD = 0xBE
KEYEVENTF_KEYUP = 0x0002

def press_key(vk):
    ctypes.windll.user32.keybd_event(vk, 0, 0, 0)
    ctypes.windll.user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)

def send_combo(*keys):
    for k in keys:
        ctypes.windll.user32.keybd_event(k, 0, 0, 0)
    time.sleep(0.04)
    for k in reversed(keys):
        ctypes.windll.user32.keybd_event(k, 0, KEYEVENTF_KEYUP, 0)

def mouse_click(btn='left'):
    if btn == 'left':
        ctypes.windll.user32.mouse_event(0x0002, 0, 0, 0, 0)
        ctypes.windll.user32.mouse_event(0x0004, 0, 0, 0, 0)
    elif btn == 'right':
        ctypes.windll.user32.mouse_event(0x0008, 0, 0, 0, 0)
        ctypes.windll.user32.mouse_event(0x0010, 0, 0, 0, 0)
    elif btn == 'middle':
        ctypes.windll.user32.mouse_event(0x0020, 0, 0, 0, 0)
        ctypes.windll.user32.mouse_event(0x0040, 0, 0, 0, 0)
    elif btn == 'double':
        ctypes.windll.user32.mouse_event(0x0002, 0, 0, 0, 0)
        ctypes.windll.user32.mouse_event(0x0004, 0, 0, 0, 0)
        time.sleep(0.05)
        ctypes.windll.user32.mouse_event(0x0002, 0, 0, 0, 0)
        ctypes.windll.user32.mouse_event(0x0004, 0, 0, 0, 0)

def mouse_scroll(delta):
    ctypes.windll.user32.mouse_event(0x0800, 0, 0, delta, 0)

def set_volume_percent(pct):
    pct = max(0, min(100, int(pct)))
    for _ in range(50):
        press_key(VK_VOLUME_DOWN)
    steps = int(pct / 2)
    for _ in range(steps):
        press_key(VK_VOLUME_UP)
    return pct

def set_brightness(val):
    val = max(10, min(100, int(val)))
    cmd = f'powershell -NoProfile -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {val})"'
    subprocess.call(cmd, shell=True)
    return val

def get_brightness():
    try:
        out = subprocess.check_output(
            'powershell -NoProfile -Command "(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness).CurrentBrightness"',
            shell=True
        ).decode().strip()
        return int(out)
    except Exception:
        return 70

def get_battery_info():
    try:
        cmd = 'powershell -NoProfile -Command "$b = Get-CimInstance Win32_Battery; Write-Output \"$($b.EstimatedChargeRemaining)% (Status: $($b.BatteryStatus))\""'
        out = subprocess.check_output(cmd, shell=True).decode().strip()
        return out if out else "Normal"
    except Exception:
        return "Normal"

def get_ram_load():
    class MEMORYSTATUSEX(ctypes.Structure):
        _fields_ = [
            ('dwLength', ctypes.c_ulong),
            ('dwMemoryLoad', ctypes.c_ulong),
            ('ullTotalPhys', ctypes.c_ulonglong),
            ('ullAvailPhys', ctypes.c_ulonglong),
            ('ullTotalPageFile', ctypes.c_ulonglong),
            ('ullAvailPageFile', ctypes.c_ulonglong),
            ('ullTotalVirtual', ctypes.c_ulonglong),
            ('ullAvailVirtual', ctypes.c_ulonglong),
            ('sullAvailExtendedVirtual', ctypes.c_ulonglong),
        ]
    stat = MEMORYSTATUSEX()
    stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
    total_gb = round(stat.ullTotalPhys / (1024**3), 1)
    used_gb = round((stat.ullTotalPhys - stat.ullAvailPhys) / (1024**3), 1)
    return stat.dwMemoryLoad, used_gb, total_gb

def get_disk_info():
    total, used, free = shutil.disk_usage("C:\\")
    free_gb = free // (2**30)
    total_gb = total // (2**30)
    return free_gb, total_gb

def normalize_name(text):
    clean = re.sub(r'[^a-zA-Z0-9\+]', ' ', text.lower())
    return " ".join(clean.split())

def find_laptop_desktop_shortcut(query):
    desktop_dirs = [
        os.path.expandvars(r'%USERPROFILE%\OneDrive\Desktop'),
        os.path.expandvars(r'%USERPROFILE%\Desktop'),
        os.path.expandvars(r'%PUBLIC%\Desktop')
    ]
    shortcuts = {}
    for d in desktop_dirs:
        if os.path.exists(d):
            for f in os.listdir(d):
                base = os.path.splitext(f)[0]
                clean = normalize_name(base)
                shortcuts[clean] = (f, os.path.join(d, f))
    
    q = normalize_name(re.sub(r'^(?:open|launch|start|run|play)\s+', '', query))
    if not q:
        return None
    
    # 1. Exact match
    if q in shortcuts:
        return shortcuts[q]
    
    # 2. Substring match
    for name, data in shortcuts.items():
        if q == name or q in name or name in q:
            return data
    
    # 3. Word overlap match
    q_words = set(q.split())
    for name, data in shortcuts.items():
        name_words = set(name.split())
        if q_words and q_words.issubset(name_words):
            return data

    # 4. Fuzzy match for typos/misheard words (e.g. aspalk -> asphalt)
    close = difflib.get_close_matches(q, shortcuts.keys(), n=1, cutoff=0.55)
    if close:
        return shortcuts[close[0]]
            
    return None

def get_installed_apps():
    apps = {}
    search_dirs = [
        os.path.expandvars(r'%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs'),
        os.path.expandvars(r'%APPDATA%\Microsoft\Windows\Start Menu\Programs')
    ]
    for d in search_dirs:
        if os.path.exists(d):
            for root, _, files in os.walk(d):
                for f in files:
                    if f.lower().endswith('.lnk'):
                        clean_name = f[:-4].lower().strip()
                        clean_name = re.sub(r'\s*-\s*shortcut.*$', '', clean_name)
                        apps[clean_name] = os.path.join(root, f)
    
    built_ins = {
        'chrome': 'chrome',
        'google chrome': 'chrome',
        'edge': 'msedge',
        'microsoft edge': 'msedge',
        'notepad': 'notepad.exe',
        'calculator': 'calc.exe',
        'calc': 'calc.exe',
        'paint': 'mspaint.exe',
        'task manager': 'taskmgr.exe',
        'taskmgr': 'taskmgr.exe',
        'settings': 'ms-settings:',
        'control panel': 'control.exe',
        'command prompt': 'cmd.exe',
        'cmd': 'cmd.exe',
        'powershell': 'powershell.exe',
        'terminal': 'wt.exe',
        'file explorer': 'explorer.exe',
        'explorer': 'explorer.exe',
        'device manager': 'devmgmt.msc',
        'registry editor': 'regedit.exe',
        'word': 'winword.exe',
        'excel': 'excel.exe',
        'powerpoint': 'powerpnt.exe',
        'spotify': 'spotify.exe',
        'discord': 'discord.exe',
        'vs code': 'code.cmd',
        'vscode': 'code.cmd',
        'code': 'code.cmd',
    }
    return apps, built_ins

# Universal Dynamic Process Terminator (handles ANY game or app, including UWP/Asphalt)
def kill_application(app_query):
    raw = app_query.lower().strip()
    # Normalize common phonetics / misspellings
    if 'aspalk' in raw or 'asfalt' in raw or 'asphalt' in raw:
        raw = 'asphalt'
    elif 'fort night' in raw or 'fortnight' in raw:
        raw = 'fortnite'

    # Direct taskkill for popular names
    proc_map = {
        'chrome': 'chrome.exe',
        'google chrome': 'chrome.exe',
        'edge': 'msedge.exe',
        'spotify': 'spotify.exe',
        'discord': 'discord.exe',
        'notepad': 'notepad.exe',
        'calculator': 'calc.exe',
        'calc': 'calc.exe',
        'word': 'winword.exe',
        'excel': 'excel.exe',
        'powerpoint': 'powerpnt.exe',
        'code': 'code.exe',
        'vs code': 'code.exe',
        'vscode': 'code.exe',
        'paint': 'mspaint.exe',
        'steam': 'steam.exe',
        'roblox': 'RobloxPlayerBeta.exe',
        'fortnite': 'FortniteClient-Win64-Shipping.exe',
        'asphalt': 'Asphalt9_w8.exe',
    }
    
    if raw in proc_map:
        subprocess.call(f'taskkill /im "{proc_map[raw]}" /f', shell=True)

    # Universal wildcard search across all active Windows processes & window titles
    ps_cmd = f'''
    Get-Process | Where-Object {{
        $_.Name -like "*{raw}*" -or $_.MainWindowTitle -like "*{raw}*"
    }} | Stop-Process -Force -ErrorAction SilentlyContinue
    '''
    subprocess.call(f'powershell -NoProfile -Command "{ps_cmd.replace(chr(10), " ")}"', shell=True)
    return True, raw.title()

def evaluate_math(expr_text):
    clean = expr_text.lower()
    clean = clean.replace('what is', '').replace('calculate', '').replace('how much is', '')
    clean = clean.replace('times', '*').replace('multiplied by', '*').replace('x', '*')
    clean = clean.replace('divided by', '/').replace('over', '/')
    clean = clean.replace('plus', '+').replace('add', '+')
    clean = clean.replace('minus', '-').replace('subtract', '-')
    pct_match = re.search(r'(\d+)\s*(?:%|percent)\s+of\s+(\d+)', clean)
    if pct_match:
        pct_val = float(pct_match.group(1))
        base_val = float(pct_match.group(2))
        return f"{(pct_val / 100.0) * base_val:g}"
    allowed = re.sub(r'[^0-9\+\-\*\/\.\(\)\s]', '', clean).strip()
    if allowed:
        try:
            ans = eval(allowed, {"__builtins__": None}, {})
            if isinstance(ans, (int, float)):
                return f"{ans:g}"
        except Exception:
            pass
    return None

# ================= UNIVERSAL ROUTER =================
def execute_command(command_text):
    text = command_text.lower().strip()
    print(f"[Master Engine] Processing: '{text}'")

    # ================= 0. UNIVERSAL PROCESS KILLER / CLOSE BY NAME =================
    kill_match = re.search(r'(?:close|kill|terminate|stop|quit|exit)\s+([a-z0-9_\-\s]+)', text)
    if kill_match:
        app_target = kill_match.group(1).replace('in the background', '').replace('in background', '').strip()
        if app_target not in ['window', 'this', 'it', 'tab', 'the game']:
            success, app_name = kill_application(app_target)
            return f"Closed {app_name}!", f"Closed {app_name}"

    if 'close the game' in text or 'close game' in text:
        # Common games on Monish's laptop
        for g in ['Asphalt9_w8.exe', 'FortniteClient-Win64-Shipping.exe', 'RobloxPlayerBeta.exe']:
            subprocess.call(f'taskkill /im "{g}" /f', shell=True)
        return "Closed background games!", "Closed Games"

    # Close active window
    if any(k in text for k in ['close window', 'close this', 'close current window', 'quit app']):
        send_combo(VK_MENU, VK_F4)
        return "Closed the active window!", "Closed Window"

    # ================= 1. ASUS TUF GAMING LAPTOP HARDWARE =================
    if any(k in text for k in ['armoury crate', 'armory crate']):
        tuf_app = find_laptop_desktop_shortcut('armoury crate')
        if tuf_app:
            os.startfile(tuf_app[1])
            return "Opening ASUS Armoury Crate!", "Armoury Crate"

    if any(k in text for k in ['fan mode', 'turbo mode', 'performance mode', 'silent mode']):
        press_key(VK_F5)
        return "Toggled ASUS Fan & Performance profile!", "Fan Profile (Fn+F5)"

    if any(k in text for k in ['touchpad lock', 'lock touchpad', 'disable touchpad', 'enable touchpad']):
        press_key(VK_F10)
        return "Toggled touchpad lock!", "Touchpad (Fn+F10)"

    if any(k in text for k in ['mute mic', 'unmute mic', 'microphone mute']):
        press_key(VK_F4)
        return "Toggled microphone mute!", "Mic Mute (Fn+F4)"

    # ================= 2. DESKTOP SHORTCUTS ON THIS LAPTOP =================
    laptop_sc = find_laptop_desktop_shortcut(command_text)
    if laptop_sc and not any(k in text for k in ['screenshot', 'volume', 'brightness', 'scroll', 'zoom', 'tab', 'select all', 'copy', 'paste', 'what', 'how']):
        display_name, full_path = laptop_sc
        clean_title = os.path.splitext(display_name)[0]
        try:
            os.startfile(full_path)
            return f"Opening {clean_title}!", f"Opened {clean_title}"
        except Exception as e:
            print(f"Error launching shortcut: {e}")

    # ================= 3. TOUCHPAD & MOUSE GESTURES =================
    if any(k in text for k in ['swipe up', 'task view', 'three finger swipe up', 'show all windows', 'taskview']):
        send_combo(VK_LWIN, VK_TAB)
        return "Task View opened!", "Task View"

    if any(k in text for k in ['swipe down', 'three finger swipe down', 'show desktop', 'minimize all', 'hide windows']):
        send_combo(VK_LWIN, ord('D'))
        return "Showing desktop!", "Desktop"

    if any(k in text for k in ['swipe right', 'three finger swipe right', 'next app']):
        send_combo(VK_MENU, VK_TAB)
        return "Switched to next app!", "Next App"

    if any(k in text for k in ['swipe left', 'three finger swipe left', 'previous app']):
        send_combo(VK_MENU, VK_SHIFT, VK_TAB)
        return "Switched to previous app!", "Prev App"

    if any(k in text for k in ['next desktop', 'next virtual desktop', 'switch desktop']):
        send_combo(VK_LWIN, VK_CONTROL, VK_RIGHT)
        return "Switched to next desktop!", "Next Desktop"

    if any(k in text for k in ['previous desktop', 'prev desktop', 'prev virtual desktop']):
        send_combo(VK_LWIN, VK_CONTROL, VK_LEFT)
        return "Switched to previous desktop!", "Prev Desktop"

    if any(k in text for k in ['zoom in', 'pinch out', 'enlarge', 'make bigger']):
        send_combo(VK_CONTROL, VK_OEM_PLUS)
        return "Zoomed in!", "Zoom In"

    if any(k in text for k in ['zoom out', 'pinch in', 'shrink', 'make smaller']):
        send_combo(VK_CONTROL, VK_OEM_MINUS)
        return "Zoomed out!", "Zoom Out"

    if any(k in text for k in ['reset zoom', 'actual size', 'normal zoom']):
        send_combo(VK_CONTROL, ord('0'))
        return "Zoom reset to 100%!", "Zoom 100%"

    if any(k in text for k in ['scroll down', 'page down', 'scroll downward']):
        mouse_scroll(-650)
        return "Scrolled down!", "Scroll Down"

    if any(k in text for k in ['scroll up', 'page up', 'scroll upward']):
        mouse_scroll(650)
        return "Scrolled up!", "Scroll Up"

    if text in ['right click', 'context menu']:
        mouse_click('right')
        return "Right-clicked!", "Right Click"

    if text in ['click', 'left click']:
        mouse_click('left')
        return "Clicked!", "Click"

    if text in ['double click']:
        mouse_click('double')
        return "Double-clicked!", "Double Click"

    # ================= 4. WINDOW SNAPPING =================
    if any(k in text for k in ['snap left', 'half screen left', 'dock left']):
        send_combo(VK_LWIN, VK_LEFT)
        return "Snapped left!", "Snap Left"

    if any(k in text for k in ['snap right', 'half screen right', 'dock right']):
        send_combo(VK_LWIN, VK_RIGHT)
        return "Snapped right!", "Snap Right"

    if any(k in text for k in ['maximize', 'maximize window', 'full window']):
        send_combo(VK_LWIN, VK_UP)
        return "Window maximized!", "Maximize"

    if any(k in text for k in ['minimize', 'minimize window']):
        send_combo(VK_LWIN, VK_DOWN)
        return "Window minimized!", "Minimize"

    # ================= 5. SYSTEM SHORTCUTS =================
    if any(k in text for k in ['clipboard history', 'show clipboard']):
        send_combo(VK_LWIN, ord('V'))
        return "Opened Clipboard History!", "Clipboard (Win+V)"

    if any(k in text for k in ['emoji picker', 'emojis', 'symbols']):
        send_combo(VK_LWIN, VK_OEM_PERIOD)
        return "Opened Emoji Picker!", "Emojis (Win+.)"

    if any(k in text for k in ['snipping tool', 'snip', 'screenshot tool']):
        send_combo(VK_LWIN, VK_SHIFT, ord('S'))
        return "Activated Snipping Tool!", "Snip"

    if any(k in text for k in ['task manager']):
        send_combo(VK_CONTROL, VK_SHIFT, VK_ESCAPE)
        return "Opened Task Manager!", "Task Manager"

    if any(k in text for k in ['quick settings', 'action center']):
        send_combo(VK_LWIN, ord('A'))
        return "Opened Quick Settings!", "Quick Settings"

    if any(k in text for k in ['notifications']):
        send_combo(VK_LWIN, ord('N'))
        return "Opened Notification Center!", "Notifications"

    # ================= 6. BROWSER TABS =================
    if any(k in text for k in ['new tab', 'open tab']):
        send_combo(VK_CONTROL, ord('T'))
        return "Opened new tab!", "New Tab"

    if any(k in text for k in ['close tab']):
        send_combo(VK_CONTROL, ord('W'))
        return "Closed tab!", "Close Tab"

    if any(k in text for k in ['reopen tab', 'restore tab']):
        send_combo(VK_CONTROL, VK_SHIFT, ord('T'))
        return "Reopened tab!", "Restore Tab"

    if any(k in text for k in ['next tab']):
        send_combo(VK_CONTROL, VK_TAB)
        return "Next tab!", "Next Tab"

    if any(k in text for k in ['previous tab', 'prev tab']):
        send_combo(VK_CONTROL, VK_SHIFT, VK_TAB)
        return "Previous tab!", "Prev Tab"

    if any(k in text for k in ['refresh', 'reload']):
        send_combo(VK_F5)
        return "Refreshed page!", "Refresh"

    # ================= 7. HARDWARE: BRIGHTNESS & VOLUME =================
    if 'brightness' in text:
        cur = get_brightness()
        num_match = re.search(r'(\d+)', text)
        if num_match and ('to' in text or 'set' in text or '%' in text or len(text.split()) <= 3):
            target = int(num_match.group(1))
            new_val = set_brightness(target)
            return f"Set screen brightness to {new_val}%", f"Brightness {new_val}%"
        elif any(k in text for k in ['increase', 'up', 'brighter', 'more']):
            new_val = set_brightness(cur + 20)
            return f"Increased brightness to {new_val}%", f"Brightness {new_val}%"
        elif any(k in text for k in ['decrease', 'down', 'dim', 'less', 'lower']):
            new_val = set_brightness(cur - 20)
            return f"Decreased brightness to {new_val}%", f"Brightness {new_val}%"

    if 'volume' in text or 'sound' in text or 'mute' in text or 'unmute' in text:
        num_match = re.search(r'(\d+)', text)
        if num_match and ('to' in text or 'set' in text or '%' in text or len(text.split()) <= 3):
            target = int(num_match.group(1))
            set_volume_percent(target)
            return f"Set volume to {target}%", f"Volume {target}%"
        elif any(k in text for k in ['up', 'increase', 'louder', 'high', 'more']):
            for _ in range(6):
                press_key(VK_VOLUME_UP)
            return "Turned volume up!", "Volume Up"
        elif any(k in text for k in ['down', 'decrease', 'quieter', 'lower', 'less']):
            for _ in range(6):
                press_key(VK_VOLUME_DOWN)
            return "Turned volume down!", "Volume Down"
        elif any(k in text for k in ['mute', 'unmute', 'silence']):
            press_key(VK_VOLUME_MUTE)
            return "Toggled volume mute!", "Mute Toggled"

    # ================= 8. MATH =================
    if any(k in text for k in ['plus', 'minus', 'times', 'divided by', 'calculate', 'percent of']):
        math_ans = evaluate_math(text)
        if math_ans:
            return f"The answer is {math_ans}", f"= {math_ans}"

    # ================= 9. SYSTEM METRICS =================
    if any(k in text for k in ['ram', 'memory', 'cpu']):
        load, used, total = get_ram_load()
        return f"RAM usage is at {load} percent. {used} GB used out of {total} GB.", f"RAM: {load}%"

    if any(k in text for k in ['disk', 'storage', 'free space']):
        free_gb, total_gb = get_disk_info()
        return f"You have {free_gb} gigabytes free out of {total_gb} gigabytes on C drive.", f"Free: {free_gb}GB"

    if any(k in text for k in ['battery', 'charge', 'power']):
        b_info = get_battery_info()
        return f"Your battery is at {b_info}!", f"Battery: {b_info}"

    # ================= 10. CLIPBOARD =================
    if any(k in text for k in ['read clipboard', 'what did i copy']):
        try:
            cb = pyperclip.paste().strip()
            if cb:
                return f"Clipboard: {cb[:80]}", "Read Clipboard"
            return "Clipboard is empty.", "Clipboard Empty"
        except Exception:
            return "Could not read clipboard", "Clipboard"

    # ================= 11. TYPING & EDITING =================
    if text.startswith('type ') or text.startswith('write '):
        to_type = re.sub(r'^(type|write)\s+', '', command_text).strip()
        time.sleep(0.2)
        import pyautogui
        pyautogui.FAILSAFE = False
        pyautogui.write(to_type, interval=0.03)
        return f"Typed: {to_type}", "Typed"

    if text in ['copy', 'copy this']:
        send_combo(VK_CONTROL, ord('C'))
        return "Copied!", "Copied"

    if text in ['paste', 'paste this']:
        send_combo(VK_CONTROL, ord('V'))
        return "Pasted!", "Pasted"

    if text in ['select all']:
        send_combo(VK_CONTROL, ord('A'))
        return "Selected all!", "Select All"

    if text in ['undo']:
        send_combo(VK_CONTROL, ord('Z'))
        return "Undone!", "Undo"

    # ================= 12. SCREENSHOT =================
    if any(k in text for k in ['screenshot', 'capture screen']):
        home = os.path.expanduser('~')
        sc_dir = os.path.join(home, 'Pictures', 'Screenshots')
        os.makedirs(sc_dir, exist_ok=True)
        file_path = os.path.join(sc_dir, f"Screenshot_{int(time.time())}.png")
        ps = f'''
        Add-Type -AssemblyName System.Windows.Forms;
        Add-Type -AssemblyName System.Drawing;
        $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
        $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height;
        $g = [System.Drawing.Graphics]::FromImage($bmp);
        $g.CopyFromScreen($b.X, $b.Y, 0, 0, $bmp.Size);
        $bmp.Save('{file_path.replace("\\", "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png);
        $g.Dispose(); $bmp.Dispose();
        '''
        subprocess.call(f'powershell -NoProfile -Command "{ps}"', shell=True)
        subprocess.call(f'explorer /select,"{file_path}"', shell=True)
        return "Screenshot captured!", "Screenshot Saved"

    # ================= 13. POWER =================
    if any(k in text for k in ['lock laptop', 'lock screen', 'lock pc']):
        ctypes.windll.user32.LockWorkStation()
        return "Locking laptop!", "Locked"

    if text in ['sleep', 'put laptop to sleep']:
        os.system('rundll32.exe powrprof.dll,SetSuspendState 0,1,0')
        return "Putting laptop to sleep!", "Sleep"

    # ================= 14. WEATHER =================
    if 'weather' in text:
        try:
            w_res = requests.get('https://wttr.in/?format=%C+%t', timeout=3).text.strip()
            return f"The weather is {w_res}", f"Weather: {w_res}"
        except Exception:
            return "Could not fetch weather", "Weather"

    # ================= 15. COMMON FOLDERS =================
    folder_map = {
        'downloads': r'%USERPROFILE%\Downloads',
        'documents': r'%USERPROFILE%\Documents',
        'desktop': r'%USERPROFILE%\Desktop',
        'pictures': r'%USERPROFILE%\Pictures',
        'c drive': r'C:\\',
    }
    for f_name, f_path in folder_map.items():
        if f_name in text and any(w in text for w in ['open', 'show', 'folder']):
            os.startfile(os.path.expandvars(f_path))
            return f"Opened {f_name.capitalize()}!", f"Opened {f_name.capitalize()}"

    # ================= 16. MEDIA & YOUTUBE =================
    if any(k in text for k in ['pause', 'resume', 'play music', 'stop music', 'next song', 'skip track']):
        if any(w in text for w in ['next', 'skip']):
            press_key(VK_MEDIA_NEXT_TRACK)
            return "Next track!", "Next Track"
        else:
            press_key(VK_MEDIA_PLAY_PAUSE)
            return "Toggled media!", "Play/Pause"

    if 'youtube' in text or (text.startswith('play ') and not 'game' in text):
        query = re.sub(r'^(play|search|watch)\s+', '', text)
        query = re.sub(r'\s+on\s+youtube', '', query).strip()
        url = f"https://www.youtube.com/results?search_query={webbrowser.quote(query)}"
        webbrowser.open(url)
        return f"Playing {query} on YouTube!", f"YouTube: {query}"

    # ================= 17. APP LAUNCHER (152+ APPS) =================
    clean_target = re.sub(r'^(open|launch|start|run)\s+', '', text).strip()
    installed_apps, built_ins = get_installed_apps()

    if clean_target in built_ins:
        os.startfile(built_ins[clean_target])
        return f"Opening {clean_target.title()}!", f"Opened {clean_target.title()}"

    for app_name, app_path in installed_apps.items():
        if clean_target == app_name or clean_target in app_name or app_name in clean_target:
            os.startfile(app_path)
            return f"Opening {app_name.title()}!", f"Opened {app_name.title()}"

    # ================= 18. GOOGLE SEARCH FALLBACK =================
    query = re.sub(r'^(search|google|look up|who is|what is|how to)\s+(for\s+)?', '', text).strip()
    if not query:
        query = command_text
    webbrowser.open(f"https://www.google.com/search?q={webbrowser.quote(query)}")
    return f"Searching Google for {query}", f"Search: {query}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = " ".join(sys.argv[1:])
        speak_msg, pill_msg = execute_command(cmd)
        print(f"PILL:{pill_msg}")
        print(f"SPEAK:{speak_msg}")
