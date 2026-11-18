import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface LargeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function LargeButton({
  children,
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}: LargeButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-emerald-600 active:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
    secondary: 'bg-white active:bg-gray-50 text-gray-800 border-2 border-gray-200',
    danger: 'bg-red-50 active:bg-red-100 text-red-700 border-2 border-red-200',
    ghost: 'bg-transparent active:bg-gray-100 text-gray-700',
  };
  return (
    <button
      {...props}
      className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl bg-white p-5 shadow-sm ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-lg text-gray-900 outline-none transition-colors focus:border-emerald-500 ${className}`}
      />
    </label>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-lg text-gray-900 outline-none transition-colors focus:border-emerald-500 ${className}`}
      />
    </label>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>}
      <select
        {...props}
        className={`w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-lg text-gray-900 outline-none transition-colors focus:border-emerald-500 ${className}`}
      >
        {children}
      </select>
    </label>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 max-h-[90vh] overflow-y-auto animate-slideup"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
