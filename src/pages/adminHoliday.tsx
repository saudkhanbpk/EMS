
import React, { useState, useEffect, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, X, Trash2, Check, ChevronLeft, ChevronRight, Edit, AlertCircle, Search } from "lucide-react";
import { supabase } from "../lib/supabase";

// Add this CSS to your global styles or component-specific styles
const calendarStyles = `
  .custom-datepicker {
    font-family: 'Inter', sans-serif;
    width: 100%;
  }
  
  .custom-datepicker .react-datepicker {
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-family: inherit;
    width: 100%;
  }
  
  .custom-datepicker .react-datepicker__header {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    border-bottom: none;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  
  .custom-datepicker .react-datepicker__current-month {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 8px;
  }
  
  .custom-datepicker .react-datepicker__day-name {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    width: 36px;
    margin: 5px;
  }
  
  .custom-datepicker .react-datepicker__day {
    width: 36px;
    height: 36px;
    line-height: 36px;
    margin: 5px;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  
  .custom-datepicker .react-datepicker__day:hover {
    background-color: #f3f4f6;
    border-radius: 50%;
  }
  
  .custom-datepicker .react-datepicker__day--selected,
  .custom-datepicker .react-datepicker__day--keyboard-selected {
    background-color: #4f46e5;
    color: white;
    font-weight: 600;
  }
  
  .custom-datepicker .react-datepicker__day--highlighted {
    background-color: #c7d2fe;
    color: #4338ca;
    border-radius: 50%;
  }
  
  .custom-datepicker .react-datepicker__navigation {
    top: 16px;
  }
  
  .custom-datepicker .react-datepicker__navigation-icon::before {
    border-color: white;
  }
  
  .custom-datepicker .react-datepicker__month-container {
    width: 100%;
  }
  
  @media (max-width: 640px) {
    .custom-datepicker .react-datepicker__day,
    .custom-datepicker .react-datepicker__day-name {
      width: 30px;
      height: 30px;
      line-height: 30px;
      margin: 2px;
    }
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 50;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  
  .holiday-card {
    transition: all 0.2s ease;
  }
  
  .holiday-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .date-navigation-input {
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 6px;
    font-size: 14px;
    width: 120px;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .date-navigation-input:focus {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  .date-navigation-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .date-navigation-button {
    background-color: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    border-radius: 6px;
    padding: 8px 12px;
    margin-left: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
  }
  
  .date-navigation-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

// Holiday type definition
interface Holiday {
  id: string;
  name: string;
  dates: Date[];
}

function AdminHoliday() {
  // State for selected dates array
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  // State for holiday name
  const [holidayName, setHolidayName] = useState<string>("");
  // State for form submission status
  const [submitted, setSubmitted] = useState<boolean>(false);
  // State for holidays list
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  // State for edit mode
  const [editMode, setEditMode] = useState<boolean>(false);
  // State for current holiday being edited
  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  // State for the month displayed in the calendar
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  // State for the date navigation input
  const [navigationDate, setNavigationDate] = useState<string>("");

  async function fetchholiday() {
    const { data, error } = await supabase
    .from('holidays')           // table name
    .select('*')    
    if (error) {
      console.error(error);
    }
    else{
      console.log("the all holidays is the ", data);
      setHolidays(data)
    } 
  }

  // Load dummy data on component mount
  useEffect(() => {
    fetchholiday()
  }, []);

  // Handle date selection
  const handleDateChange = (input: Date | string) => {
    const date = typeof input === 'string' ? new Date(input) : input;
  
    const dateExists = selectedDates.some(
      selectedDate => new Date(selectedDate).toDateString() === date.toDateString()
    );
  
    if (dateExists) {
      // Remove the date if it already exists
      setSelectedDates(
        selectedDates.filter(
          selectedDate => new Date(selectedDate).toDateString() !== date.toDateString()
        )
      );
    } else {
      // Add the date if it doesn't exist
      setSelectedDates([...selectedDates, date]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    
    if (editMode && currentHoliday) {
      const { data, error } = await supabase
        .from('holidays')
        .update({ dates: currentHoliday.dates, name: currentHoliday.name}) 
        .eq('id', currentHoliday.id);  

      if (error) {
        console.log(error)
      } else {
        // Update existing holiday
        const updatedHolidays = holidays.map(holiday => 
          holiday.id === currentHoliday.id 
            ? { ...holiday, name: holidayName, dates: selectedDates }
            : holiday
        );
        
        setHolidays(updatedHolidays);
        setEditMode(false);
        setCurrentHoliday(null);
      }
    } else {
      // Add new holiday
      const { data, error } = await supabase.from('holidays')
        .insert([
          { dates: selectedDates, name: holidayName }
        ]).select("*")

      if (error) console.error(error)
      else {
        console.log(data)
        setHolidays([...holidays, data[0]])
      }
    }
    
    // Show success message
    setSubmitted(true);
    setSubmitted(false);
    setHolidayName("");
    setSelectedDates([]);
  };

  // Clear all selected dates
  const clearDates = () => {
    setSelectedDates([]);
  };

  // Handle edit button click
  const handleEdit = (holiday: Holiday) => {
    setEditMode(true);
    setCurrentHoliday(holiday);
    setHolidayName(holiday.name);
    setSelectedDates(holiday.dates);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete button click
  const handleDelete = async(id: string) => {
    const { data, error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id) 
    if (error) {
      console.error(error)
    }
    else {
      setHolidays(holidays.filter(holiday => holiday.id !== id));
    }
    
    setShowDeleteConfirm(null);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditMode(false);
    setCurrentHoliday(null);
    setHolidayName("");
    setSelectedDates([]);
  };

  // Handle navigation date input change
  const handleNavigationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNavigationDate(e.target.value);
  };

  // Navigate to the specified date
  const navigateToDate = () => {
    const date = new Date(navigationDate);
    if (!isNaN(date.getTime())) {
      setCalendarDate(date);
    } else {
      alert("Please enter a valid date");
    }
  };

  // Handle key press in navigation input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateToDate();
    }
  };

  // Custom header for the DatePicker
  const CustomHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          type="button"
          className="p-1 rounded-full hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h2 className="text-white font-semibold text-lg">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          type="button"
          className="p-1 rounded-full hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      </div>
      <div className="flex items-center justify-center px-4 pb-2">
        <input
          type="text"
          placeholder="MM/DD/YYYY"
          value={navigationDate}
          onChange={handleNavigationDateChange}
          onKeyPress={handleKeyPress}
          className="date-navigation-input"
        />
        <button 
          onClick={navigateToDate}
          className="date-navigation-button"
        >
          <Search className="h-4 w-4 mr-1" />
          Go
        </button>
      </div>
    </div>
  );

  // Custom day component to show selected dates
  const renderDayContents = (day: number, dateString: string) => {
    const date = new Date(dateString); // Convert incoming date string to Date
  
    const isSelected = selectedDates.some(selectedDate => {
      const selected = new Date(selectedDate); // Convert each selected date string to Date
      return selected.toDateString() === date.toDateString();
    });
    return (
      <div className={`relative ${isSelected ? 'font-bold' : ''}`}>
        {day}
        {isSelected && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></div>
        )}
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Custom input component for the DatePicker
  const CustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
    <button
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center"
      onClick={onClick}
      ref={ref}
    >
      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
      {value || "Select a date"}
    </button>
  ));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-lg sm:w-[90%]">
      <style>{calendarStyles}</style>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Holiday Management
      </h1>

      {submitted && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {editMode ? "Holiday updated successfully!" : "Holiday added successfully!"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {editMode ? "Edit Holiday" : "Add New Holiday"}
          </h2>
          {editMode && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div>
          <label 
            htmlFor="holidayName" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Holiday Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="holidayName"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter holiday name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Dates
          </label>
          <div className="rounded-lg overflow-hidden shadow-lg">
            <DatePicker
              selected={calendarDate}
              onChange={handleDateChange}
              onMonthChange={setCalendarDate}
              inline
              highlightDates={selectedDates}
              calendarClassName="custom-datepicker"
              renderCustomHeader={CustomHeader}
              renderDayContents={renderDayContents}
              showPopperArrow={false}
              minDate={(() => {
                const now = new Date();
                const currentHour = now.getHours();
                
                // If current time is after 9 PM (21:00), set minimum date to tomorrow
                if (currentHour >= 21) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  return tomorrow;
                }
                
                // Before 9 PM, today is still selectable
                return now;
              })()}
              filterDate={date => {
                const now = new Date();
                const currentHour = now.getHours();
                
                // Check if the date is today
                const isToday = date.getDate() === now.getDate() &&
                                date.getMonth() === now.getMonth() &&
                                date.getFullYear() === now.getFullYear();
                
                // If it's today and after 9 PM, disable today
                if (isToday && currentHour >= 21) {
                  return false;
                }
                
                // For any other date (future dates), they're always selectable
                // Past dates will be filtered by the minDate property
                return true;
              }}
            />
          </div>
        </div>
        <div>
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">
              Selected Dates ({selectedDates.length})
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDates.length > 0 ? (
                selectedDates.map((date, index) => (
                  <div 
                    key={index} 
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center shadow-sm"
                  >
                    {formatDate(date)}
                    <button
                      type="button"
                      onClick={() => handleDateChange(date)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No dates selected</p>
              )}
            </div>
            {selectedDates.length > 0 && (
              <button
                type="button"
                onClick={clearDates}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all dates
              </button>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setHolidayName("");
                setSelectedDates([]);
                setEditMode(false)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-md"
              disabled={selectedDates.length === 0 || !holidayName}
            >
              {editMode ? "Update Holiday" : "Save Holiday"}
            </button>
          </div>
        </div>
      </form>

      {/* Holiday List Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Existing Holidays
        </h2>

        {holidays.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No holidays have been added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map((holiday) => (
              <div 
                key={holiday.id} 
                className="holiday-card bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h3 className="font-semibold text-lg text-gray-800">{holiday.name}</h3>
                  <p className="text-sm text-gray-500">{holiday.dates.length} {holiday.dates.length === 1 ? 'day' : 'days'}</p>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {holiday.dates.slice(0, 3).map((date, index) => (
                      <span 
                        key={index} 
                        className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs"
                      >
                        {formatDate(date)}
                      </span>
                    ))}
                    {holiday.dates.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                        +{holiday.dates.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(holiday.id)}
                      className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center mb-4 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this holiday? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHoliday;
