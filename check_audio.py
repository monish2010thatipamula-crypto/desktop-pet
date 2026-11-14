import subprocess
import re

def get_audio_playing():
    """Get what's currently playing audio using Windows Core Audio API via PowerShell."""
    ps_script = r"""
$sessionManager = [activator]::CreateInstance([type]::GetTypeFromCLSID([Guid]"77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"))
$sessions = @()
foreach ($session in $sessionManager.GetSessionEnumerator()) {
    try {
        $state = $session.GetState()
        $pid2 = $session.GetProcessId()
        if ($state -eq 1) {  # Active
            $proc = Get-Process -Id $pid2 -ErrorAction SilentlyContinue
            if ($proc) {
                $sessions += [PSCustomObject]@{ Name = $proc.Name; PID = $pid2; Title = $proc.MainWindowTitle }
            }
        }
    } catch {}
}
$sessions | ConvertTo-Json
"""
    try:
        result = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", ps_script],
            timeout=5
        ).decode(errors='ignore').strip()
        return result
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    print(get_audio_playing())
