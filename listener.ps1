param(
    [int]$TimeoutSeconds = 6
)

try {
    Add-Type -AssemblyName System.Speech -ErrorAction Stop

    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.SetInputToDefaultAudioDevice()

    # 1. Command Grammar for fast matching
    $appChoices = New-Object System.Speech.Recognition.Choices
    $appChoices.Add(@(
        "open chrome", "launch chrome", "open google chrome",
        "open edge", "open microsoft edge", "open firefox",
        "open notepad", "open calculator", "open calc", "open paint",
        "open spotify", "open discord", "open vs code", "open vscode",
        "open terminal", "open cmd", "open task manager", "open settings",
        "open downloads", "open documents", "open desktop", "open pictures",
        "volume up", "volume down", "mute", "unmute", "turn it up", "turn it down",
        "pause", "play", "next song", "previous song", "skip",
        "take screenshot", "screenshot", "capture screen",
        "lock laptop", "lock pc", "lock screen",
        "minimize all", "show desktop", "battery", "empty recycle bin",
        "dance", "spin", "tell a joke", "who are you", "what time is it", "hello", "hi"
    ))

    $grammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
    $grammarBuilder.Append($appChoices)
    $cmdGrammar = New-Object System.Speech.Recognition.Grammar($grammarBuilder)
    $cmdGrammar.Priority = 1
    $recognizer.LoadGrammar($cmdGrammar)

    # 2. General Dictation Grammar for general queries / web searches / music
    $dictGrammar = New-Object System.Speech.Recognition.DictationGrammar
    $dictGrammar.Priority = 0
    $recognizer.LoadGrammar($dictGrammar)

    # Signal to caller that microphone is live and listening
    Write-Output "LISTENING_NOW"

    $result = $recognizer.Recognize([System.TimeSpan]::FromSeconds($TimeoutSeconds))

    if ($result -and $result.Text) {
        $text = $result.Text.Trim()
        Write-Output "RESULT:$text"
    } else {
        Write-Output "ERROR:No speech detected"
    }

    $recognizer.Dispose()
} catch {
    Write-Output "ERROR:$($_.Exception.Message)"
}
