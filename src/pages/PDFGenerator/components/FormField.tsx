import React from 'react';
import type { FormFieldProps } from '../types';

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  required = false,
  min,
  max,
  rows = 4
}) => {
  const baseClasses = `w-full px-3 py-2 bg-zinc-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-zinc-100 placeholder-zinc-400 ${
    error ? 'border-red-500' : 'border-zinc-600'
  }`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className={`${baseClasses} resize-none`}
            placeholder={placeholder}
            required={required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            className={baseClasses}
            placeholder={placeholder}
            required={required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            placeholder={placeholder}
            required={required}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            placeholder={placeholder}
            required={required}
          />
        );
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FormField;
