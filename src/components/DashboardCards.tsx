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
    <div className="flex flex-wrap gap-6 md:gap-5 justify-center mb-10 mt-2">
      {leaveData.map((leave, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-lg shadow-md w-32 sm:w-36 md:w-40 text-center"
        >
          <h2
            className="text-base sm:text-sm font-semibold text-left leading-5"
            style={{ color: leave.color }}
          >
            {leave.type}
          </h2>
          <div className="flex items-center justify-center">
            <div className="w-14 sm:w-16 mx-auto my-2">
              <CircularProgressbar
                counterClockwise
                value={(leave.used / leave.total) * 100}
                text={`${leave.used}/${leave.total}`}
                styles={buildStyles({
                  textColor: leave.color,
                  pathColor: leave.color,
                  trailColor: "#e5e7eb",
                })}
              />
            </div>
            <div className="font-medium text-[#344054] text-[8px] sm:text-[9px] leading-5">
              <p>Available: {leave.total - leave.used}</p>
              <p>Used: {leave.used}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

  );
}
