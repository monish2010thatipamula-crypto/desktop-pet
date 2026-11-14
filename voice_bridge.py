import sys
import speech_recognition as sr
import pyttsx3
import universal_controller

def speak(text):
    if not text:
        return
    try:
        engine = pyttsx3.init()
        engine.setProperty('rate', 175)
        voices = engine.getProperty('voices')
        for v in voices:
            if 'zira' in v.name.lower() or 'female' in v.name.lower():
                engine.setProperty('voice', v.id)
                break
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"Speak error: {e}", file=sys.stderr)

def listen_and_execute(timeout=6, phrase_limit=8):
    r = sr.Recognizer()
    # Fast instant listening parameters
    r.energy_threshold = 280
    r.dynamic_energy_threshold = True
    r.pause_threshold = 0.65

    try:
        with sr.Microphone() as source:
            # Signal immediately to UI that microphone is live!
            print("LISTENING_START", flush=True)
            audio = r.listen(source, timeout=timeout, phrase_time_limit=phrase_limit)

        try:
            # Multi-dialect Google Speech Recognition
            try:
                text = r.recognize_google(audio, language="en-IN")
            except Exception:
                text = r.recognize_google(audio, language="en-US")
            
            if text:
                print(f"HEARD:{text.strip()}", flush=True)
                speak_msg, pill_msg = universal_controller.execute_command(text.strip())
                print(f"PILL:{pill_msg}", flush=True)
                print(f"RESULT:{text.strip()}", flush=True)
                # Speak confirmation out loud through laptop speakers
                speak(speak_msg)
            else:
                print("ERROR:No speech detected", flush=True)
        except sr.UnknownValueError:
            print("ERROR:Could not understand", flush=True)
        except sr.RequestError as e:
            print(f"ERROR:Network error: {e}", flush=True)
    except sr.WaitTimeoutError:
        print("ERROR:Timed out", flush=True)
    except Exception as e:
        print(f"ERROR:{e}", flush=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(0)
    
    cmd = sys.argv[1].lower()
    if cmd == "listen":
        listen_and_execute()
    elif cmd == "speak":
        text = " ".join(sys.argv[2:])
        speak(text)
    elif cmd == "exec":
        text = " ".join(sys.argv[2:])
        speak_msg, pill_msg = universal_controller.execute_command(text)
        print(f"PILL:{pill_msg}")
        speak(speak_msg)
