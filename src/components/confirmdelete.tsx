import React, { useState } from 'react';
import { Trash2, XCircle, CheckCircle } from 'lucide-react';


interface ConfirmationAlertProps {
  isVisible: boolean;
    isDeleting: boolean;
}
const ConfirmationAlert = ({isVisible,isDeleting}:ConfirmationAlertProps) => {


  

  return (
<>

      {isVisible && (
        <div 
          className={`
            fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50
            ${isDeleting ? 'animate-fade-in' : 'animate-fade-out'}
          `}
        >
          <div 
            className={`
              bg-white rounded-lg shadow-xl p-6 max-w-sm w-full 
              transform transition-all duration-500 ease-in-out
              ${isDeleting 
                ? 'scale-100 opacity-100 translate-y-0' 
                : 'scale-90 opacity-0 -translate-y-10'
              }
            `}
          >
            {isDeleting ? (
              <div className="flex flex-col items-center space-y-4">
                <Trash2 className="text-red-500 w-16 h-16 animate-pulse" />
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">Deleting Message</h2>
                  <p className="text-gray-600 mt-2">Your message is being deleted...</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full animate-progress-bar"
                    style={{animationDuration: '2s'}}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="text-green-500 w-16 h-16" />
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">Message Deleted</h2>
                  <p className="text-gray-600 mt-2">Your message has been successfully removed.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
   
    </>
  );
};

// Add custom animations to Tailwind config


export default ConfirmationAlert;