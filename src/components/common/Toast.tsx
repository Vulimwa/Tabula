import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const toastHelpers = {
    success: useCallback((msg: string) => showToast(msg, 'success'), [showToast]),
    error: useCallback((msg: string) => showToast(msg, 'error'), [showToast]),
    info: useCallback((msg: string) => showToast(msg, 'info'), [showToast]),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers }}>
      {children}
      {/* Fixed Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-md border shadow-lg transition-all transform translate-y-0 duration-200 ${
              t.type === 'success'
                ? 'bg-[#141414] border-[#36A269] text-white'
                : t.type === 'error'
                ? 'bg-[#141414] border-[#E51B4B] text-white'
                : 'bg-[#141414] border-[#3F6FD9] text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#36A269] shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#E51B4B] shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#3F6FD9] shrink-0" />}
              <span className="text-xs font-medium leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white ml-3 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
