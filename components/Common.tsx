import React from 'react';

// --- Colors & Utility ---
const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ');

// --- Components ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className, ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-prizzys text-white hover:bg-prizzys-hover focus:ring-prizzys",
    secondary: "bg-dark-700 text-white hover:bg-dark-600 focus:ring-dark-600 border border-dark-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-dark-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg", className)}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
    <input 
      className={cn("w-full bg-dark-900 border border-dark-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-prizzys focus:border-transparent outline-none transition-all placeholder-gray-600", className)}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className, children, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
    <select 
      className={cn("w-full bg-dark-900 border border-dark-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-prizzys focus:border-transparent outline-none transition-all", className)}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-green-900/30 text-green-400 border-green-800",
    yellow: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    red: "bg-red-900/30 text-red-400 border-red-800",
    blue: "bg-blue-900/30 text-blue-400 border-blue-800",
    gray: "bg-gray-800 text-gray-400 border-gray-700",
  };
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", colors[color])}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-md border border-dark-700 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// File Upload helper
export const FileUpload: React.FC<{ label: string; onFileSelect: (base64: string) => void }> = ({ label, onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
      <input 
        type="file" 
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-dark-700 file:text-prizzys
          hover:file:bg-dark-600
        "
      />
    </div>
  );
};
