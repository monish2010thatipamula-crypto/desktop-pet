// Natural Language Intent Parser and Laptop Automation Engine

export class ActionEngine {
  constructor(pet, sfx, ui) {
    this.pet = pet;
    this.sfx = sfx;
    this.ui = ui;
    this.voiceEnabled = true;

    // Set up Speech Synthesis (Text to Speech)
    this.synth = window.speechSynthesis;
  }

  speak(text) {
    if (!this.voiceEnabled || !this.synth) return;
    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15; // Slightly upbeat, energetic
      utterance.pitch = 1.35; // Cute, youthful robotic pitch

      // Pick an English voice if available
      const voices = this.synth.getVoices();
      const cuteVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Zira') || v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Natural')));
      if (cuteVoice) utterance.voice = cuteVoice;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  async parseAndExecute(input) {
    const raw = input.trim();
    if (!raw) return;

    const text = raw.toLowerCase();
    this.pet.setExpression('working');
    this.sfx.playExecute();

    try {
      // 1. GREETINGS & PERSONALITY
      if (/^(hello|hi|hey|yo|what'?s up|good morning|good afternoon)/i.test(text)) {
        this.pet.spin();
        this.sfx.playHappy();
        const reply = "Hi master! Nova is online and ready for your commands!";
        this.speak(reply);
        this.ui.showBubble(reply, 'happy');
        return;
      }

      if (/who are you|what are you/i.test(text)) {
        this.pet.bounce();
        const reply = "I am Nova, your 3D desktop companion! I live on your screen and control your laptop whenever you ask.";
        this.speak(reply);
        this.ui.showBubble(reply, 'happy');
        return;
      }

      if (/i love you|good pet|good bot|good boy|good girl|cute/i.test(text)) {
        this.pet.setExpression('love');
        this.pet.bounce();
        this.sfx.playHappy();
        const reply = "Aww, thank you! I love helping you with your laptop!";
        this.speak(reply);
        this.ui.showBubble(reply, 'love');
        setTimeout(() => this.pet.setExpression('default'), 3000);
        return;
      }

      if (/(tell.*joke|make me laugh)/i.test(text)) {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs!",
          "There are 10 types of people in the world: those who understand binary, and those who don't.",
          "Why did the computer keep freezing? It left its Windows open!",
          "What is an astronaut's favorite key on a keyboard? The Space bar!",
          "Why did the JavaScript developer wear glasses? Because they didn't C#!",
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        this.pet.bounce();
        this.sfx.playHappy();
        this.speak(joke);
        this.ui.showBubble(joke, 'happy');
        return;
      }

      if (/^(dance|spin|do a flip|somersault)/i.test(text)) {
        this.pet.spin();
        this.sfx.playHappy();
        this.speak("Wheee! Watch this flip!");
        this.ui.showBubble("Look at me dance! ✨", 'happy');
        return;
      }

      if (/^(sleep|go to sleep|take a nap|rest)/i.test(text)) {
        this.pet.setExpression('sleep');
        const reply = "Zzz... Good night! Click me or type to wake me up.";
        this.speak("Going to sleep now... zzz");
        this.ui.showBubble(reply, 'sleep');
        return;
      }

      if (/^(wake up|wake)/i.test(text)) {
        this.pet.setExpression('surprised');
        this.sfx.playChirp();
        setTimeout(() => this.pet.setExpression('default'), 1200);
        const reply = "I'm awake! Ready for action!";
        this.speak(reply);
        this.ui.showBubble(reply, 'happy');
        return;
      }

      if (/^(help|what can you do|commands)/i.test(text)) {
        this.pet.bounce();
        const reply = "I can:\n• Open apps (Chrome, VS Code, Spotify...)\n• Search Google & YouTube\n• Control volume & media\n• Take screenshots & lock laptop\n• Check battery & take quick notes\n• Open Downloads/Documents\n• Chat & tell jokes!";
        this.speak("Here is what I can do on your laptop! Try asking me to open an app or search for something.");
        this.ui.showBubble(reply, 'happy', 7000);
        return;
      }

      // 2. YOUTUBE MUSIC & VIDEOS
      const ytMatch = text.match(/(?:play|search|watch)\s+(.+?)(?:\s+on\s+youtube|\s+in\s+youtube)?$/i);
      if (/youtube/i.test(text) || (text.startsWith('play ') && !text.includes('game'))) {
        let query = text.replace(/^(play|search|watch)\s+/i, '').replace(/\s+on\s+youtube/i, '').trim();
        if (query) {
          const res = await window.electronAPI.executeAction({ type: 'play-youtube', query });
          this.pet.spin();
          this.sfx.playHappy();
          this.speak(`Playing ${query} on YouTube!`);
          this.ui.showBubble(res.message, 'happy');
          return;
        }
      }

      // 3. GOOGLE / WEB SEARCH
      const searchMatch = text.match(/^(?:search|google|search for|find|look up)\s+(.+)/i);
      if (searchMatch) {
        const query = searchMatch[1].trim();
        const res = await window.electronAPI.executeAction({ type: 'search-web', query });
        this.pet.bounce();
        this.sfx.playHappy();
        this.speak(`Searching Google for ${query}`);
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 4. WEBSITES SHORTCUTS
      const sites = {
        'github': 'https://github.com',
        'reddit': 'https://reddit.com',
        'chatgpt': 'https://chatgpt.com',
        'twitter': 'https://x.com',
        'x': 'https://x.com',
        'netflix': 'https://netflix.com',
        'twitch': 'https://twitch.tv',
        'gmail': 'https://mail.google.com',
      };
      for (const [site, url] of Object.entries(sites)) {
        if (text === `open ${site}` || text === `go to ${site}` || text === site) {
          await window.electronAPI.executeAction({ type: 'open-url', url });
          this.pet.spin();
          this.sfx.playHappy();
          this.speak(`Opening ${site}!`);
          this.ui.showBubble(`Opening ${site}...`, 'happy');
          return;
        }
      }

      // 5. AUDIO & VOLUME CONTROLS
      if (/^(mute|unmute|silence|toggle sound|quiet)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'volume-control', action: 'mute' });
        this.pet.nod();
        this.sfx.playChirp();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/^(volume up|louder|increase volume|turn it up|sound up)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'volume-control', action: 'up' });
        this.pet.bounce();
        this.sfx.playChirp();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/^(volume down|quieter|decrease volume|lower volume|turn it down|sound down)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'volume-control', action: 'down' });
        this.pet.nod();
        this.sfx.playChirp();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 6. MEDIA CONTROLS
      if (/^(pause|resume|play music|pause music|toggle play)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'media-control', action: 'play-pause' });
        this.pet.bounce();
        this.sfx.playChirp();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/^(next song|skip|skip track|next track)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'media-control', action: 'next' });
        this.pet.spin();
        this.sfx.playChirp();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/^(previous song|prev track|last song)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'media-control', action: 'prev' });
        this.pet.spin();
        this.sfx.playChirp();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 7. SYSTEM & LAPTOP CONTROLS
      if (/(lock laptop|lock screen|lock pc)/i.test(text)) {
        this.speak("Locking your laptop now. See you soon!");
        this.pet.setExpression('sleep');
        await window.electronAPI.executeAction({ type: 'lock-pc' });
        return;
      }

      if (/(minimize all|show desktop|hide windows)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'minimize-all' });
        this.pet.spin();
        this.sfx.playHappy();
        this.speak("Desktop revealed!");
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/(take screenshot|screenshot|capture screen)/i.test(text)) {
        this.pet.setExpression('surprised');
        this.sfx.playExecute();
        this.speak("Capturing screenshot!");
        const res = await window.electronAPI.executeAction({ type: 'take-screenshot' });
        this.pet.spin();
        this.sfx.playHappy();
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/(battery|battery level|power|charge)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'get-battery' });
        this.pet.bounce();
        this.sfx.playHappy();
        this.speak(res.message);
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      if (/(empty recycle bin|clean trash|empty trash)/i.test(text)) {
        const res = await window.electronAPI.executeAction({ type: 'empty-recycle-bin' });
        this.pet.spin();
        this.sfx.playHappy();
        this.speak("Recycle bin emptied cleanly!");
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 8. FOLDERS
      const folderMatch = text.match(/open (downloads|documents|desktop|pictures|music|videos)(?: folder)?/i);
      if (folderMatch) {
        const folder = folderMatch[1];
        const res = await window.electronAPI.executeAction({ type: 'open-folder', folder });
        this.pet.bounce();
        this.sfx.playHappy();
        this.speak(`Opened your ${folder} folder!`);
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 9. NOTES
      const noteMatch = text.match(/^(?:note|save note|write note|remember|take note)[:\s]+(.+)/i);
      if (noteMatch) {
        const noteText = noteMatch[1].trim();
        const res = await window.electronAPI.executeAction({ type: 'save-note', text: noteText });
        this.pet.spin();
        this.sfx.playHappy();
        this.speak("Saved that note to your desktop!");
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 10. TIMERS & REMINDERS
      const timerMatch = text.match(/^(?:timer|set timer for|remind me in)\s+(\d+)\s*(min|minute|minutes|sec|second|seconds)?(?:\s+to\s+(.+))?/i);
      if (timerMatch) {
        const amount = parseInt(timerMatch[1], 10);
        const unit = timerMatch[2] || 'minute';
        const task = timerMatch[3] || 'your timer is up';
        const ms = unit.startsWith('sec') ? amount * 1000 : amount * 60 * 1000;

        this.pet.spin();
        this.sfx.playHappy();
        const confirmMsg = `Timer set for ${amount} ${unit}!`;
        this.speak(confirmMsg);
        this.ui.showBubble(confirmMsg, 'happy');

        setTimeout(() => {
          this.pet.setExpression('surprised');
          this.pet.bounce();
          this.sfx.playExecute();
          const alertMsg = `⏰ Alert! ${task}!`;
          this.speak(alertMsg);
          this.ui.showBubble(alertMsg, 'happy', 8000);
        }, ms);
        return;
      }

      // 11. TIME & DATE
      if (/^(what time is it|time|clock)/i.test(text)) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.pet.bounce();
        this.speak(`It is currently ${now}`);
        this.ui.showBubble(`Current time: ${now} ⌚`, 'happy');
        return;
      }

      if (/^(what'?s today'?s date|what date is it|today'?s date|date)/i.test(text)) {
        const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        this.pet.bounce();
        this.speak(`Today is ${today}`);
        this.ui.showBubble(`Today is ${today} 📅`, 'happy');
        return;
      }

      // 12. APP LAUNCHING (Matches "open X", "launch X", "start X")
      const appMatch = text.match(/^(?:open|launch|start)\s+(.+)/i);
      if (appMatch) {
        const target = appMatch[1].trim();
        const res = await window.electronAPI.executeAction({ type: 'open-app', target });
        this.pet.spin();
        this.sfx.playHappy();
        this.speak(`Opening ${target}!`);
        this.ui.showBubble(res.message, 'happy');
        return;
      }

      // 13. DIRECT RUN / POWERSHELL COMMAND
      if (text.startsWith('run ') || text.startsWith('exec ')) {
        const command = raw.replace(/^(run|exec)\s+/i, '').trim();
        const res = await window.electronAPI.executeAction({ type: 'run-command', command });
        this.pet.bounce();
        this.sfx.playHappy();
        this.ui.showBubble(`Executed: ${res.message || 'Done'}`, 'happy');
        return;
      }

      // Fallback: Default to web search
      this.pet.bounce();
      const fallbackRes = await window.electronAPI.executeAction({ type: 'search-web', query: raw });
      this.speak(`I searched for ${raw}`);
      this.ui.showBubble(`Searching: "${raw}"`, 'happy');

    } catch (err) {
      this.pet.shake();
      this.sfx.playError();
      this.pet.setExpression('surprised');
      this.speak("Oops, I encountered an error!");
      this.ui.showBubble(`Error: ${err.message}`, 'surprised');
    } finally {
      setTimeout(() => {
        if (this.pet.expression !== 'sleep' && this.pet.expression !== 'love') {
          this.pet.setExpression('default');
        }
      }, 3500);
    }
  }
}
