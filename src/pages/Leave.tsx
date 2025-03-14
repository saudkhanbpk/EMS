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
        // <>
        //   <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        //     Leave Management
        //   </h1>

        //   <div className="bg-white p-6 rounded-lg shadow-sm h-[70vh] overflow-y-auto custom-scrollbar">
        //     <h2 className="text-xl font-semibold text-gray-700 mb-4">
        //       TechCreator Leave Policy
        //     </h2>

        //     {/* Leave Policy Details */}
        //     <div className="space-y-4 text-gray-700">
        //       <div>
        //         <h3 className="font-semibold text-gray-800">1. Annual Leave</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees are entitled to <strong>22 paid annual leave days</strong> per year.
        //         </p>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Any leave beyond 22 days will be unpaid.
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">2. Sick Leave</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees can take up to <strong>10 paid sick leave days</strong> per year.
        //         </p>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> A medical certificate is required if sick leave exceeds 2 consecutive days.
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">3. Casual Leave</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees have <strong>6 casual leave days</strong> per year.
        //         </p>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Must be informed at least 1 day in advance (except emergencies).
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">4. Public Holidays</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Employees will observe all national and company-declared public holidays as paid leave.
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">5. Maternity & Paternity Leave</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Male employees are entitled to <strong>5 days of paid paternity leave</strong>.
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">6. Unpaid Leave</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Any additional leave beyond entitlement will be unpaid and require managerial approval.
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">7. Unauthorized Absences</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> Absence without prior approval may lead to <strong>salary deductions</strong> or disciplinary action.
        //         </p>
        //       </div>

        //       <div>
        //         <h3 className="font-semibold text-gray-800">8. Emergency Leave</h3>
        //         <p>
        //           <ArrowBigRight className="inline w-6 h-6 text-gray-600" /> In case of an emergency, employees must inform their manager as soon as possible.
        //         </p>
        //       </div>
        //     </div>

        //     {/* Contact Info */}
        //     <p className="mt-6 text-gray-600 text-sm">
        //       For any clarifications, contact the HR department:{" "}
        //       <a href="mailto:contact@techcreator.co" className="text-blue-500 underline">
        //         contact@techcreator.co
        //       </a>
        //     </p>
        //   </div>

        //   {/* Buttons */}
        //   <div className="flex justify-end gap-6 mt-6 mr-4 mb-4 pb-4">
        //     <button
        //       className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
        //       onClick={() => setActiveComponent("history")}
        //     >
        //       Leaves History
        //     </button>

        //     <button
        //       className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
        //       onClick={() => setActiveComponent("request")}
        //     >
        //       Request Leave
        //     </button>
        //   </div>
        // </>
      )}
    </div>
  );
};

export default Leave;
