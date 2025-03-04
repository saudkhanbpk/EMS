import tea from './../assets/Tea.png'
export default function BreakRecordsTable() {
  return (
    <>
      <div className="flex items-center  gap-8 mb-4">
        <div className="flex items-center">
          <img src={tea} alt="tea" />
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
              <tr className="text-gray-600 text-sm">
                <td className="p-5 border text-center">Break 01</td>
                <td className="p-5 border text-center">9:15 AM</td>
                <td className="p-5 border text-center">9:15 AM</td>
                <td className="p-5 border text-center">2h 27m</td>
                <td className="p-5 border text-center">
                  <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs">
                    Late
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
