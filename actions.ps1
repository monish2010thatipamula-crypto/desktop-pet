param(
    [string]$Action
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class NativeActions {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    public const byte VK_VOLUME_MUTE = 0xAD;
    public const byte VK_VOLUME_DOWN = 0xAE;
    public const byte VK_VOLUME_UP = 0xAF;
    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;

    public static void SendKey(byte vk) {
        keybd_event(vk, 0, 0, 0);
        keybd_event(vk, 0, 2, 0);
    }
}
"@ -ErrorAction SilentlyContinue

switch ($Action.ToLower()) {
    "volume-up" {
        for ($i=0; $i -lt 5; $i++) { [NativeActions]::SendKey([NativeActions]::VK_VOLUME_UP) }
    }
    "volume-down" {
        for ($i=0; $i -lt 5; $i++) { [NativeActions]::SendKey([NativeActions]::VK_VOLUME_DOWN) }
    }
    "volume-mute" {
        [NativeActions]::SendKey([NativeActions]::VK_VOLUME_MUTE)
    }
    "media-play" {
        [NativeActions]::SendKey([NativeActions]::VK_MEDIA_PLAY_PAUSE)
    }
    "media-next" {
        [NativeActions]::SendKey([NativeActions]::VK_MEDIA_NEXT_TRACK)
    }
    "media-prev" {
        [NativeActions]::SendKey([NativeActions]::VK_MEDIA_PREV_TRACK)
    }
}
