import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (tasks: string) => void;
  onSkip: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onApply, onSkip }) => {
  const [tasks, setTasks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      setTasks('');
      setIsSaving(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling of background content
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    if (!tasks.trim()) return;
    setIsSaving(true);
    onApply(tasks);
  };

  // Handle enter key press with ctrl/cmd to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (tasks.trim()) {
        handleApply();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10 relative animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Today's Tasks</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">Please enter the tasks you plan to work on today:</p>
          
          <textarea
            ref={inputRef}
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={5}
            placeholder="Enter your tasks for today..."
            disabled={isSaving}
          />
          
          <div className="text-xs text-gray-500 mb-2">
            <span>Pro tip: Press Ctrl+Enter to quickly submit</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onSkip}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleApply}
            disabled={!tasks.trim() || isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;