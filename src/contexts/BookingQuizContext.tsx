import { createContext, useContext, useState, ReactNode } from "react";
import { trackQuizStart } from "@/lib/analytics";

interface BookingQuizContextType {
  isOpen: boolean;
  defaultSource: string;
  openQuiz: (source?: string) => void;
  closeQuiz: () => void;
}

const BookingQuizContext = createContext<BookingQuizContextType>({
  isOpen: false,
  defaultSource: "",
  openQuiz: () => {},
  closeQuiz: () => {},
});

export const useBookingQuiz = () => useContext(BookingQuizContext);

export const BookingQuizProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultSource, setDefaultSource] = useState("");
  return (
    <BookingQuizContext.Provider
      value={{
        isOpen,
        defaultSource,
        openQuiz: (source?: string) => { if (source) setDefaultSource(source); trackQuizStart("booking"); setIsOpen(true); },
        closeQuiz: () => { setIsOpen(false); setDefaultSource(""); },
      }}
    >
      {children}
    </BookingQuizContext.Provider>
  );
};
