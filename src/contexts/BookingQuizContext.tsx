import { createContext, useContext, useState, ReactNode } from "react";
import { trackQuizStart } from "@/lib/analytics";

interface BookingQuizContextType {
  isOpen: boolean;
  openQuiz: () => void;
  closeQuiz: () => void;
}

const BookingQuizContext = createContext<BookingQuizContextType>({
  isOpen: false,
  openQuiz: () => {},
  closeQuiz: () => {},
});

export const useBookingQuiz = () => useContext(BookingQuizContext);

export const BookingQuizProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <BookingQuizContext.Provider
      value={{
        isOpen,
        openQuiz: () => { trackQuizStart("booking"); setIsOpen(true); },
        closeQuiz: () => setIsOpen(false),
      }}
    >
      {children}
    </BookingQuizContext.Provider>
  );
};
