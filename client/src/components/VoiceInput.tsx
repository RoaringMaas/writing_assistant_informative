import { Mic, MicOff, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState(""); // Show interim results
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>(""); // Store final transcript
  const hasReceivedSpeechRef = useRef<boolean>(false); // Track if we received any speech

  type SpeechRecognitionConstructor = typeof SpeechRecognition | typeof webkitSpeechRecognition;

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // English only

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
      finalTranscriptRef.current = "";
      hasReceivedSpeechRef.current = false;
      setInterimText("");
      toast.info("🎤 Listening... Speak now!");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log("Speech recognition result received");
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + " ";
          console.log("Final transcript piece:", transcriptPiece);
        } else {
          interimTranscript += transcriptPiece;
          console.log("Interim transcript piece:", transcriptPiece);
        }
      }

      // Update refs and state
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        hasReceivedSpeechRef.current = true;
      }
      
      if (interimTranscript) {
        setInterimText(interimTranscript);
        hasReceivedSpeechRef.current = true;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access to use voice input.");
      } else if (event.error === "no-speech") {
        toast.warning("No speech detected. Try speaking louder or closer to the microphone.");
      } else if (event.error === "aborted") {
        // Ignore aborted errors (user stopped manually)
        console.log("Speech recognition aborted by user");
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || disabled || isListening) return;

    try {
      finalTranscriptRef.current = "";
      hasReceivedSpeechRef.current = false;
      setInterimText("");
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Could not start voice input. Please try again.");
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);

    // Wait a moment for final results to come through
    setTimeout(() => {
      const finalTranscript = finalTranscriptRef.current.trim();
      const hasReceivedSpeech = hasReceivedSpeechRef.current;
      
      console.log("Final transcript:", finalTranscript);
      console.log("Has received speech:", hasReceivedSpeech);
      console.log("Interim text:", interimText);
      
      // If we have final transcript, use it
      if (finalTranscript) {
        onTranscript(finalTranscript);
        toast.success("✓ Voice input added!");
      } 
      // If no final transcript but we have interim text, use that
      else if (interimText.trim()) {
        onTranscript(interimText.trim());
        toast.success("✓ Voice input added!");
      }
      // If we received speech events but no transcript, show warning
      else if (hasReceivedSpeech) {
        toast.warning("Could not transcribe clearly. Please try again.");
      }
      // No speech detected at all
      else {
        toast.warning("No speech detected. Please try speaking louder or closer to the microphone.");
      }
      
      setInterimText("");
    }, 300); // Wait 300ms for final results
  };

  const tryAgain = () => {
    finalTranscriptRef.current = "";
    hasReceivedSpeechRef.current = false;
    setInterimText("");
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    }
    setTimeout(() => {
      if (!isListening) {
        startListening();
      }
    }, 300);
  };

  if (!isSupported) {
    return null; // Hide button if not supported
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!isListening ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={startListening}
            disabled={disabled}
            className="shrink-0"
            title="Click to speak"
          >
            <Mic className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={stopListening}
              className="shrink-0 animate-pulse"
              title="Stop recording"
            >
              <MicOff className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={tryAgain}
              className="shrink-0"
              title="Try again"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground animate-pulse">
              Listening...
            </span>
          </div>
        )}
      </div>
      
      {/* Show interim transcript while listening */}
      {isListening && interimText && (
        <div className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
          Hearing: "{interimText}"
        </div>
      )}
    </div>
  );
}
