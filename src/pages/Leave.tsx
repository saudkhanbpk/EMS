import React, { useState } from "react";
import LeaveRequest from "./leaveRequest";
import LeaveHistory from "./LeaveHistory"; // Make sure this component exists
import { ArrowBigRight } from "lucide-react";

const Leave: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState("default"); // "default", "request", "history"

  return (
    <div className="relative max-w-5xl mx-auto bg-gray-100 rounded-lg shadow-md">
      {/* Conditionally Render Components */}
      {activeComponent === "request" && <LeaveRequest setActiveComponent = {setActiveComponent}/>}
      {activeComponent === "history" && <LeaveHistory setActiveComponent = {setActiveComponent}/>}
      {activeComponent === "default" && (
        <>
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Leave Management
          </h1>

          <div className="bg-white p-6 rounded-lg shadow-sm h-[70vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              TechCreator Leave Policy
            </h2>

            {/* Leave Policy Details */}
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800">1. Annual Leave</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees are entitled to <strong>22 paid annual leave days</strong> per year.
                </p>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Any leave beyond 22 days will be unpaid.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">2. Sick Leave</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees can take up to <strong>10 paid sick leave days</strong> per year.
                </p>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> A medical certificate is required if sick leave exceeds 2 consecutive days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">3. Casual Leave</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees have <strong>6 casual leave days</strong> per year.
                </p>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Must be informed at least 1 day in advance (except emergencies).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">4. Public Holidays</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees will observe all national and company-declared public holidays as paid leave.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">5. Maternity & Paternity Leave</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Male employees are entitled to <strong>5 days of paid paternity leave</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">6. Unpaid Leave</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Any additional leave beyond entitlement will be unpaid and require managerial approval.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">7. Unauthorized Absences</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Absence without prior approval may lead to <strong>salary deductions</strong> or disciplinary action.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">8. Emergency Leave</h3>
                <p>
                  <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> In case of an emergency, employees must inform their manager as soon as possible.
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <p className="mt-6 text-gray-600 text-sm">
              For any clarifications, contact the HR department:{" "}
              <a href="mailto:contact@techcreator.co" className="text-blue-500 underline">
                contact@techcreator.co
              </a>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-6 mt-6 mr-4 mb-4 pb-4">
            <button
              className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
              onClick={() => setActiveComponent("history")}
            >
              Leaves History
            </button>

            <button
              className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
              onClick={() => setActiveComponent("request")}
            >
              Request Leave
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Leave;
