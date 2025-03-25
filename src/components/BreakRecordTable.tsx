import { format } from 'date-fns';
import tea from './../assets/Tea.png'

interface BreakRecordsTableProps {
  todayBreak: {
    start_time: string;
    end_time: string;
    duration: string;
    status: string;
  }[];
}


export default function BreakRecordsTable({ todayBreak = [] }: BreakRecordsTableProps) {
  return (
    <>
      <div className="flex items-center  gap-8 mb-4">
        <div className="flex items-center">
          <img src={tea} alt="tea" className='w-[30px] h-[30px]
        object-contain' />
          <h2 className="text-[#000000] font-bold text-[23px] leading-8">Break Records</h2>
        </div>
        <select className="bg-[#FFFFFF] text-gray-700 text-sm px-3 py-1 rounded-md border border-gray-300 focus:outline-none">
          <option>Today</option>
          <option>Yesterday</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="font-normal text-sm text-[#666666] leading-5">
                {["Break no", "Start Time", "End Time", "Duration", "Status"].map(
                  (heading, index) => (
                    <th key={index} className="p-5 border border-gray-200">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {todayBreak.length > 0 ? (
                todayBreak.map((breakRecord, index) => {
                  const startTime = format(new Date(breakRecord.start_time), "h:mm a");
                  const endTime = breakRecord.end_time
                    ? format(new Date(breakRecord.end_time), "h:mm a")
                    : "-";
                  const duration = breakRecord.duration || "-";
                  // const statusClass =
                  //   breakRecord.status === "on_time"
                  //     ? 'bg-green-100 text-green-800'
                  //     : 'bg-yellow-100 text-yellow-800'

                  return (
                    <tr key={index} className="text-gray-600 text-sm text-center">
                      <td className="p-5 border">Break {index + 1}</td>
                      <td className="p-5 border">{startTime}</td>
                      <td className="p-5 border">{endTime}</td>
                      <td className="p-5 border">{duration}</td>
                      <td className="p-5 border">
                        {breakRecord.status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${breakRecord.status === "on_time" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {breakRecord.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-5 border text-center text-gray-500">
                    No breaks taken today
                  </td>
                </tr>
              )}
              {/* <tr className="text-gray-600 text-sm">
                <td className="p-5 border text-center">Break 01</td>
                <td className="p-5 border text-center">9:15 AM</td>
                <td className="p-5 border text-center">9:15 AM</td>
                <td className="p-5 border text-center">2h 27m</td>
                <td className="p-5 border text-center">
                  <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs">
                    Late
                  </span>
                </td>
              </tr> */}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
