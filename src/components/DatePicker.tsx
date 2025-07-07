import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, isSameMonth, isSameDay, isToday, getWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

type ViewType = 'calendar' | 'months' | 'years';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  mode: 'daily' | 'weekly' | 'monthly';
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  mode,
  isOpen,
  onClose,
  triggerRef
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [view, setView] = useState<ViewType>('calendar');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, triggerRef]);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('calendar');
      setCurrentMonth(selectedDate);
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [isOpen, selectedDate]);

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days = [];
    let day = start;

    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const getWeeksInMonth = () => {
    const days = getDaysInMonth();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const handleDateClick = (date: Date) => {
    if (mode === 'daily') {
      onDateChange(date);
      onClose();
    } else if (mode === 'weekly') {
      const weekStart = startOfWeek(date);
      onDateChange(weekStart);
      onClose();
    } else if (mode === 'monthly') {
      onDateChange(startOfMonth(date));
      onClose();
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(addMonths(currentMonth, -1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? currentYear - 1 : currentYear + 1;
    setCurrentYear(newYear);
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    setCurrentMonth(newDate);
    setView('calendar');
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setView('calendar');
  };

  const getYearRange = () => {
    const startYear = Math.floor(currentYear / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isDateSelected = (date: Date) => {
    if (mode === 'daily') {
      return isSameDay(date, selectedDate);
    } else if (mode === 'weekly') {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return date >= weekStart && date <= weekEnd;
    } else if (mode === 'monthly') {
      return isSameMonth(date, selectedDate);
    }
    return false;
  };

  const getWeekNumber = (date: Date) => {
    return getWeek(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        ref={pickerRef}
        className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-sm mx-4 transform transition-all duration-300 scale-100 border border-gray-100"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Select {mode === 'daily' ? 'Date' : mode === 'weekly' ? 'Week' : 'Month'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Navigation Header */}
        {view === 'calendar' && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 text-blue-600" />
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setView('months')}
                className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
              >
                {format(currentMonth, 'MMMM')}
              </button>
              <button
                onClick={() => setView('years')}
                className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
              >
                {currentYear}
              </button>
            </div>

            <button
              onClick={() => handleMonthChange('next')}
              className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        )}

        {/* Month Selection View */}
        {view === 'months' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleYearChange('prev')}
                className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </button>
              <h4 className="text-xl font-bold text-gray-800">{currentYear}</h4>
              <button
                onClick={() => handleYearChange('next')}
                className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    currentMonth.getMonth() === index
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Year Selection View */}
        {view === 'years' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentYear(currentYear - 12)}
                className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </button>
              <h4 className="text-xl font-bold text-gray-800">
                {Math.floor(currentYear / 12) * 12} - {Math.floor(currentYear / 12) * 12 + 11}
              </h4>
              <button
                onClick={() => setCurrentYear(currentYear + 12)}
                className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {getYearRange().map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    currentYear === year
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        {view === 'calendar' && (
          <div className="space-y-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {getWeeksInMonth().map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((date, dayIndex) => {
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isSelected = isDateSelected(date);
                  const isTodayDate = isToday(date);
                  const isPastDate = date > new Date();

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => !isPastDate && handleDateClick(date)}
                      disabled={isPastDate}
                      className={`
                        relative h-12 w-12 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105
                        ${!isCurrentMonth 
                          ? 'text-gray-300 hover:text-gray-400' 
                          : isPastDate
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }
                        ${isSelected 
                          ? mode === 'daily'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700'
                            : mode === 'weekly'
                            ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg'
                            : 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg'
                          : ''
                        }
                        ${isTodayDate && !isSelected 
                          ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50' 
                          : ''
                        }
                      `}
                    >
                      {format(date, 'd')}
                      {mode === 'weekly' && dayIndex === 0 && isCurrentMonth && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                          {getWeekNumber(date) % 10}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Mode-specific info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="text-sm text-gray-600 mb-2">
            {mode === 'daily' && (
              <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-blue-500" />Click on a date to select it</p>
            )}
            {mode === 'weekly' && (
              <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-purple-500" />Click on any day to select that week. Week numbers are shown on Sundays.</p>
            )}
            {mode === 'monthly' && (
              <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-green-500" />Click on any date to select that month</p>
            )}
          </div>
          {selectedDate && (
            <div className="mt-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm font-semibold text-gray-500 mb-1">Currently Selected:</div>
              <div className="text-base font-bold text-gray-800">
                {
                  mode === 'daily' 
                    ? format(selectedDate, 'MMMM d, yyyy')
                    : mode === 'weekly'
                    ? `Week of ${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d, yyyy')}`
                    : format(selectedDate, 'MMMM yyyy')
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatePicker;