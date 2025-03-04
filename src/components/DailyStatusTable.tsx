import clockImage from './../assets/Time.png'
export default function DailyStatusTable() {
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
                  <th key={index} className=" border p-4 border-gray-200 font-medium text-sm leading-5 text-[#344054]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              <tr className="text-gray-600 text-sm">
                <td className="px-4 py-2 border p-4">9:15 AM</td>
                <td className="px-4 py-2 border p-4">
                  <span className="bg-[#C5D7FF] text-[#5055D5] px-3 py-1 rounded-full text-xs">
                    On site
                  </span>
                </td>
                <td className="px-4 py-2 border p-4">34.1298, 72.4656</td>
                <td className="px-4 py-2 border p-4">2h 27m</td>
                <td className="px-4 py-2 border p-4">9:15 AM</td>
                <td className="px-4 py-2 border p-4">
                  <span className="bg-[#C5D7FF] text-[#5055D5] px-3 py-1 rounded-full text-xs">
                    Working
                  </span>
                </td>
                <td className="px-4 py-2 border p-4">
                  <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs">
                    Late
                  </span>
                </td>
                <td className="px-4 py-2 border p-4 text-center">01</td>
                <td className="px-4 py-2 border p-4">0h 0m</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
