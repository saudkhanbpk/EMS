import { format } from 'date-fns';
import clockImage from './../assets/Time.png'


interface DailyStatusTableProps {
  todayAttendance:
  {
    check_in: string;
    check_out: string;
    work_mode: string;
    latitude: number;
    longitude: number;
    totalTime: string;
    breakTime: string;
    status: string;
    checkInStatus: string;
    totalBreaks: number;
    breakHours: string;
  };
  todayBreak: {
    break_in: string;
    break_out: string;
  }[];
  calculateDuration: (checkIn: string, checkOut: string) => string;
  getTotalBreakDuration: () => string;
}

export default function DailyStatusTable(props: DailyStatusTableProps) {
  const {
    todayAttendance,
    todayBreak,
    calculateDuration,
    getTotalBreakDuration
  } = props;
  return (
    <div>
      <div className="flex items-center mb-4">
        <img src={clockImage} className='w-[30px] h-[30px]
        object-contain' />
        <h2 className="text-[23px] font-bold ml-2 text-[#000000] leading-[31.37px]">Today's Status</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-[#F5F5F9]">
            <thead>
              <tr className=" text-gray-700 text-sm">
                {[
                  "Check-In",
                  "Work Mode",
                  "Location",
                  "Total Time",
                  "Break Time",
                  "Status",
                  "Check-in Status",
                  "Total Breaks",
                  "Break Hours",
                ].map((heading, index) => (
                  <th key={index} className=" border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr className="text-gray-600 text-sm">
                <td className=" border p-4">
                  {format(new Date(todayAttendance.check_in), 'h:mm a')}
                </td>
                <td className=" border p-4">
                  <span className={`bg-[#C5D7FF] text-[#5055D5] px-3 py-1 rounded-full text-xs ${todayAttendance.work_mode === 'on_site'
                    ? 'bg-[#C5D7FF] text-blue-800'
                    : 'bg-[#C5D7FF] text-purple-800'
                    }`}>
                    {todayAttendance.work_mode}
                  </span>
                </td>
                <td className=" border p-4">   {todayAttendance.latitude.toFixed(4)}, {todayAttendance.longitude.toFixed(4)}</td>
                <td className=" border p-4">  {calculateDuration(todayAttendance.check_in, todayAttendance.check_out)}</td>
                <td className=" border p-4">
                  {getTotalBreakDuration() || '0h 0m'}
                </td>
                <td className=" border p-4">
                  <span className={`bg-[#C5D7FF] text-[#5055D5] px-3 py-1 rounded-full text-xs ${!todayAttendance.check_out
                    ? 'bg-[#C5D7FF] text-blue-800'
                    : 'bg-[#C5D7FF] text-green-800'
                    }`}>
                    {!todayAttendance.check_out ? 'Working' : 'Completed'}

                  </span>
                </td>
                <td className=" border p-4">
                  <span className={` px-3 py-1 rounded-full text-xs  ${todayAttendance.checkInStatus === 'late'
                    ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                    {todayAttendance.status}
                  </span>
                </td>
                <td className=" border p-4 text-center">{todayBreak.length}</td>
                <td className=" border p-4">                    {getTotalBreakDuration() || '0h 0m'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
