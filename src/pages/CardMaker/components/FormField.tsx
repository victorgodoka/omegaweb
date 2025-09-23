import React from 'react';
import { Icon } from '@iconify/react';
import type { FormFieldProps } from '../types';

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  rows = 3,
  required = false,
  error
}) => {
  const baseInputClasses = `
    w-full px-3 py-2 bg-zinc-700 border rounded-lg text-zinc-100 
    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
    transition-all duration-200
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-zinc-600'}
  `.trim();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClasses}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseInputClasses}
        />
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <Icon icon="mdi:alert-circle" className="text-sm" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;
