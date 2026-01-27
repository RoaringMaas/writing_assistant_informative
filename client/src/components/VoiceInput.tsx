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
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

      setTranscript((prev) => prev + finalTranscript);
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
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || disabled) return;

    try {
      setTranscript("");
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

    // Send transcript to parent component
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      toast.success("✓ Voice input added!");
    }
  };

  const tryAgain = () => {
    setTranscript("");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTimeout(() => {
      startListening();
    }, 100);
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
