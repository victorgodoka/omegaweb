import React from 'react';
import FormField from './FormField';

interface DatePickerProps {
  month: string;
  day: string;
  year: string;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  onYearChange: (value: string) => void;
  errors: {
    month?: string;
    day?: string;
    year?: string;
  };
}

const DatePicker: React.FC<DatePickerProps> = ({
  month,
  day,
  year,
  onMonthChange,
  onDayChange,
  onYearChange,
  errors
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Event Date <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className={`w-full px-3 py-2 bg-zinc-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-zinc-100 ${
              errors.month ? 'border-red-500' : 'border-zinc-600'
            }`}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const monthNum = i + 1;
              const monthName = new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' });
              return (
                <option key={monthNum} value={monthNum.toString()}>
                  {monthNum} - {monthName}
                </option>
              );
            })}
          </select>
          {errors.month && <p className="text-red-400 text-xs mt-1">{errors.month}</p>}
        </div>
        
        <div>
          <FormField
            label=""
            value={day}
            onChange={onDayChange}
            error={errors.day}
            placeholder="Day"
            type="number"
            min={1}
            max={31}
          />
        </div>
        
        <div>
          <FormField
            label=""
            value={year}
            onChange={onYearChange}
            error={errors.year}
            placeholder="Year"
            type="number"
            min={2020}
            max={2030}
          />
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
