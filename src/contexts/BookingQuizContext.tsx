import { createContext, useContext, useState, ReactNode } from "react";
import { trackQuizStart } from "@/lib/analytics";
import { track } from "@/lib/posthog";

/** Answers handed over by the Find the Queen pop-up, plus the code to attach. */
export interface QuizPrefill {
  eventType: string;
  eventLabel: string;
  date: string;
  queenCode: string;
}

interface BookingQuizContextType {
  isOpen: boolean;
  defaultSource: string;
  prefill: QuizPrefill | null;
  openQuiz: (source?: string | unknown, prefill?: QuizPrefill) => void;
  closeQuiz: () => void;
}

const BookingQuizContext = createContext<BookingQuizContextType>({
  isOpen: false,
  defaultSource: "",
  prefill: null,
  openQuiz: () => {},
  closeQuiz: () => {},
});

export const useBookingQuiz = () => useContext(BookingQuizContext);

export const BookingQuizProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultSource, setDefaultSource] = useState("");
  const [prefill, setPrefill] = useState<QuizPrefill | null>(null);
  return (
    <BookingQuizContext.Provider
      value={{
        isOpen,
        defaultSource,
        prefill,
        openQuiz: (source?: string | unknown, pre?: QuizPrefill) => { if (typeof source === 'string') setDefaultSource(source); setPrefill(pre ?? null); trackQuizStart("booking"); track("quiz_started"); setIsOpen(true); },
        closeQuiz: () => { setIsOpen(false); setDefaultSource(""); setPrefill(null); },
      }}
    >
      {children}
    </BookingQuizContext.Provider>
  );
};
