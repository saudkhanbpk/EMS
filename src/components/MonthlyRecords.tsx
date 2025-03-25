import calendar from './../assets/calendar.png'


interface MonthlyRecordProps {
  monthlyStats: {
    expectedWorkingDays: number;
    daysAttended: number;
    presentDays: number;
    lateDays: number;
    absentees: number;
    leaves: number;
    totalWorkingDays: number;
    averageDailyHours: string;
    expectedHours: string;
    expectedWorkHours: number;
    averageWorkHours: number;
  };
  leaves: number;
  absentees: number;
}

const MonthlyRecord = (props: MonthlyRecordProps) => {
  const { monthlyStats, leaves, absentees } = props;
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
                <td className="border border-gray-200 p-4">{monthlyStats?.expectedWorkingDays}</td>
                <td className="border border-gray-200 p-4">{monthlyStats.totalWorkingDays}</td>
                <td className="border border-gray-200 p-4">{monthlyStats.presentDays}</td>
                <td className="border border-gray-200 p-4">{monthlyStats?.lateDays}</td>
                <td className="border border-gray-200 p-4">{absentees}</td>
                <td className="border border-gray-200 p-4">{leaves}</td>
                <td className="border border-gray-200 p-4">                      {monthlyStats.averageWorkHours.toFixed(1)}h
                </td>
                <td className="border border-gray-200 p-4">   {(monthlyStats.averageWorkHours * monthlyStats.totalWorkingDays).toFixed(1)}h</td>
                <td className="border border-gray-200 p-4">                      {(7 * monthlyStats.expectedWorkingDays)}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonthlyRecord;
