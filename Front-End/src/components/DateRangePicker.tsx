import { useState } from 'react';
import { Calendar} from 'lucide-react';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

export default function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const predefinedRanges = [
    { label: 'Last 30 Days', getDays: () => 30 },
    { label: '3 Months', getDays: () => 90 },
    { label: '6 Months', getDays: () => 180 },
    { label: '1 Year', getDays: () => 365 },
  ];

  const handlePredefinedRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange(start, end);
    setShowCustomPicker(false);
  };

  const handleCustomApply = () => {
    onDateRangeChange(startDate, endDate);
    setShowCustomPicker(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowCustomPicker(!showCustomPicker)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm">
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </span>
      </button>

      {showCustomPicker && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Select Date Range</h4>
          
          {/* Predefined Ranges */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {predefinedRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => handlePredefinedRange(range.getDays())}
                className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCustomApply}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Apply
            </button>
            <button
              onClick={() => setShowCustomPicker(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}