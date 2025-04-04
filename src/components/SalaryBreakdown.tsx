import earningImage from './../assets/Dollar.png'
import deductImage from './../assets/6dfeac41f1caee5067c397ea655feda6.png'
import userProfile from './../assets/profile_breakdown.jpeg'
export default function SalaryBreakdown() {
  return (
    <div>
      <h2 className="text-[28px] leading-9 text-[#000000] font-bold mb-4">Salary Breakdown</h2>

      <div className="bg-white shadow-lg rounded-[10px] p-6 flex flex-wrap items-center justify-between">
        <div className="flex space-x-4 space-y-4">
          <img
            src={userProfile}
            alt="Profile"
            className="w-40 h-40 rounded-[10px]  object-cover"
          />
          <div>
            <h3 className="font-semibold text-[#000000] text-xl leading-[30.01px]">John Wick</h3>
            <p className="font-normal text-[#404142] text-base leading-[24.55px]">Front End Developer</p>
          </div>
        </div>

        <div className="bg-purple-600 flex justify-center items-center gap-4 text-white p-8 rounded-lg text-lg leading-4 font-normal">
          Your Total Earning is <span className="font-bold text-[40px]">45,000</span>
          {/* <span className="text-2xl font-bold text-center ">Rs 40,000</span> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div>
              <img src={earningImage} alt="earningImage" className='h-[23px] w-[23px]'
              />

            </div>
            <div
              className="font-semibold text-xl  leading-[27px] text-[#000000]"
            >Earnings</div>
          </div>
          <div className="border border-[#C0BFBF]"></div>
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Basic Pay</span> <span className="text-[#6D6E70] font-normal text-base leading-5">40,000</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Total Hours</span> <span className="text-[#6D6E70] font-normal text-base leading-5">1200</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Pay Per Hour</span> <span className="text-[#6D6E70] font-normal text-base leading-5">1200</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Overtime</span> <span className="text-[#6D6E70] font-normal text-base leading-5">00</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Total Earning</span> <span className="text-[#6D6E70] font-normal text-base leading-5">45,000</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white shadow-lg rounded-lg p-4 h-min">
          <div className="flex items-center gap-2 mb-3">
            <div>
              <img src={deductImage} alt="earningImage" className='h-[23px] w-[23px]'
              />

            </div>
            <div
              className="font-semibold text-xl  leading-[27px] text-[#000000]"
            >Deductions</div>
          </div>
          <div className="border border-[#C0BFBF]"></div>

          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Extra Leaves</span> <span className="text-[#6D6E70] font-normal text-base leading-5">5000</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Check-in Late</span> <span className="text-[#6D6E70] font-normal text-base leading-5">1200</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Advance Pay</span> <span className="text-[#6D6E70] font-normal text-base leading-5">1500</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Total Deduction</span> <span className="text-[#6D6E70] font-normal text-base leading-5">1500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
