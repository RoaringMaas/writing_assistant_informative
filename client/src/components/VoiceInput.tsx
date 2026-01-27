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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>(""); // Use ref to avoid state timing issues

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
      setIsListening(true);
      transcriptRef.current = ""; // Reset transcript ref on start
      toast.info("🎤 Listening... Speak now!");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + " ";
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Update ref directly for immediate access in stopListening
      transcriptRef.current += finalTranscript;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access to use voice input.");
      } else if (event.error === "no-speech") {
        toast.warning("No speech detected. Try again!");
      } else {
        toast.error("Speech recognition error. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
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
      transcriptRef.current = ""; // Reset transcript ref
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

    // Use ref value directly to avoid state timing issues
    const finalTranscript = transcriptRef.current.trim();
    if (finalTranscript) {
      onTranscript(finalTranscript);
      toast.success("✓ Voice input added!");
    } else {
      toast.warning("No speech detected. Please try again.");
    }
  };

  const tryAgain = () => {
    transcriptRef.current = "";
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
    }, 200);
  };

  if (!isSupported) {
    return null; // Hide button if not supported
  }

  return (
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
  );
}
