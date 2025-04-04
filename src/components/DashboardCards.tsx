import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const leaveData = [
  { type: "Casual Leave", used: 5, total: 7, color: "#FF355C" },
  { type: "Sick Leave", used: 3, total: 7, color: "#3572FF" },
  { type: "Unpaid Leave", used: 2, total: 7, color: "#24B12B" },
  { type: "Half Leave", used: 7, total: 7, color: "#C78E2C" },
  { type: "Earned Leave", used: 5, total: 7, color: "#9A00FF" },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 mb-6 mt-2">
      {leaveData.map((leave, index) => (
        <div
          key={index}
          className="bg-white p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <h2
            className="text-sm sm:text-base font-semibold text-left leading-5 mb-2 sm:mb-3"
            style={{ color: leave.color }}
          >
            {leave.type}
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div className="w-12 sm:w-14 md:w-16">
              <CircularProgressbar
                counterClockwise
                value={(leave.used / leave.total) * 100}
                text={`${leave.used}/${leave.total}`}
                styles={buildStyles({
                  textColor: leave.color,
                  pathColor: leave.color,
                  trailColor: "#e5e7eb",
                  textSize: "24px",
                })}
              />
            </div>
            <div className="font-medium text-[#344054] text-[8px] sm:text-[10px]">
              <p className="mb-1">Available: {leave.total - leave.used}</p>
              <p>Used: {leave.used}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
