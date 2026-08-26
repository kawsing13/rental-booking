import { createContext, useContext, useMemo, useState } from 'react';

const BookingDraftContext = createContext(null);

// Holds the in-progress booking a customer is building: one date range plus
// a list of {itemId, name, unitPrice, quantity} lines. Lives in memory only
// (cleared on refresh) - it's a shopping-cart style draft, not something
// that needs to survive across sessions.
export function BookingDraftProvider({ children }) {
  const [eventDate, setEventDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([]);

  const addItem = (item, quantity) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === item.id);
      if (existing) {
        return prev.map((l) => (l.itemId === item.id ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { itemId: item.id, name: item.name, unitPrice: Number(item.rentalPrice), quantity }];
    });
  };

  const updateQuantity = (itemId, quantity) => {
    setLines((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, quantity } : l)));
  };

  const removeItem = (itemId) => setLines((prev) => prev.filter((l) => l.itemId !== itemId));

  const clear = () => {
    setLines([]);
    setDeliveryAddress('');
    setNotes('');
  };

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [lines]);

  const value = {
    eventDate,
    setEventDate,
    returnDate,
    setReturnDate,
    deliveryAddress,
    setDeliveryAddress,
    notes,
    setNotes,
    lines,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    subtotal,
  };

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft() {
  const ctx = useContext(BookingDraftContext);
  if (!ctx) throw new Error('useBookingDraft must be used within a BookingDraftProvider');
  return ctx;
}
