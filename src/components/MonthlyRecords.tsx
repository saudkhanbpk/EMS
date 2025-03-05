import calendar from './../assets/calendar.png'
const MonthlyRecord = () => {
  return (
    <>
      <div className="flex items-center gap-6  mb-4">
        <div className="flex items-center space-x-2">
          <img src={calendar} alt="calendar" className='w-[30px] h-[30px]' />
          <h2 className="text-xl font-semibold">Monthly Overview - February 2025</h2>
        </div>
        <select className="border border-gray-300 rounded px-3 py-1">
          <option value="onsite">Onsite</option>
          <option value="remote">Remote</option>
        </select>
      </div>
      <div className=" bg-white rounded-lg shadow-lg mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className=" text-gray-700">
                {['Expected Working Days', 'Days Attended', 'Present Days', 'Late Days', 'Absentees', 'Leaves', 'Average Daily Hours', 'Total Hours', 'Expected Hours'].map((heading) => (
                  <th key={heading} className="border border-gray-200 p-5  text-left text-sm font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="text-gray-600">
                {['20', '02', '03', '02', '02', '02', '08 hours', '01 hours', '20 hours'].map((data, index) => (
                  <td key={index} className="border border-gray-200 p-8 text-sm">
                    {data}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonthlyRecord;
