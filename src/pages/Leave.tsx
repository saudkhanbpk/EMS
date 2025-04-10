import React, { useState } from "react";
import LeaveRequest from "./leaveRequest";
import LeaveHistory from "./LeaveHistory";
import arrow from './../assets/Arrow.png'
// Updated leave policies as per TechCreator Leave Policy
const leavePolicies = [
  {
    title: "Total Leave Entitlement",
    description: (
      <>
        Employees are entitled to <strong className="text-[#C26AFC]">22 paid leave days</strong> per year, covering all types of leave, including WFH. <br />
        Any leave beyond <strong className="text-[#C26AFC]">22 days</strong> will be <span className="text-red-500">unpaid</span> and require managerial approval.
      </>
    ),
  },
  {
    title: "Sick Leave",
    description: (
      <>
        Sick leave is included within the <strong className="text-[#C26AFC]">22 total leave days</strong>. <br />
        A medical certificate is required if sick leave exceeds <strong className="text-red-500">2 consecutive days</strong>.
      </>
    ),
  },
  {
    title: "Casual Leave",
    description: (
      <>
        Casual leave is included within the <strong className="text-[#C26AFC]">22 total leave days</strong>. <br />
        Must be informed at least <strong className="text-red-500">1 day in advance</strong> except in emergencies.
      </>
    ),
  },
  {
    title: "Public Holidays",
    description: (
      <>
        Employees will observe all national and company-declared public holidays as <strong className="text-[#C26AFC]">paid leave</strong>, separate from the 22-day entitlement.
      </>
    ),
  },
  {
    title: "Maternity & Paternity Leave",
    description: (
      <>
        Male employees are entitled to <strong className="text-[#C26AFC]">5 days</strong> of paid paternity leave, separate from the 22-day entitlement.
      </>
    ),
  },
  {
    title: "Unpaid Leave",
    description: (
      <>
        Any additional leave beyond the <strong className="text-[#C26AFC]">22 days</strong> will be <span className="text-red-500">unpaid</span> and require managerial approval.
      </>
    ),
  },
];

const Leave: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState("default"); // "default", "request", "history"

  return (
    <div className="relative max-w-5xl ">
      {activeComponent === "request" && <LeaveRequest setActiveComponent={setActiveComponent} />}
      {activeComponent === "history" && <LeaveHistory setActiveComponent={setActiveComponent} />}
      {activeComponent === "default" && (
        <>

          <h2 className="font-bold mb-4 text-[28px] leading-10 text-[#000000]">Leaves Management</h2>
          <div className=" p-6 rounded-lg shadow-md bg-[#FFFFFF]">
            <h2 className="mb-4 font-normal text-[22px] leading-7 text-[#000000]">TechCreator Leave Policy</h2>

            <div className="space-y-4">
              {leavePolicies.map((policy, index) => (
                <div key={index} className="flex flex-wrap items-center">
                  <div className="bg-[#C26AFC] text-white px-4 py-2 rounded-md text-sm font-medium min-w-[160px] text-center">
                    {policy.title}
                  </div>

                  <div className="text-[#C26AFC] mx-4"><img src={arrow} alt="arrow" /></div>

                  <div className="font-normal text-sm leading-5">{policy.description}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Buttons */}
          <div className="flex justify-end gap-6 mt-6 mr-4 mb-4 pb-4">
            <button
              className="bg-[#C26AFC] text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
              onClick={() => setActiveComponent("history")}
            >
              Leaves History
            </button>

            <button
              className="bg-[#C26AFC] text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
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
