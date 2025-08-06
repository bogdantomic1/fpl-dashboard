import React from 'react';

const StandingsTable = () => {
  return (
    <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen flex justify-center items-center">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="flex justify-center items-center mb-4">
          <div className="bg-blue-900 px-6 py-2 text-center rounded-full shadow-md">
            <h1 className="text-2xl font-bold tracking-wide uppercase text-white">
              Barclays <span className="text-blue-400 italic">Premier League</span>
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center italic uppercase text-gray-300 mb-2 text-sm">
          Bottom
        </div>

        {/* Table */}
        <div className="relative overflow-hidden border border-gray-600 rounded-lg shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-300 italic">
                <th className="bg-blue-900 text-center py-2 px-3 slanted-right">#</th>
                <th className="bg-blue-800 text-left py-2 px-3 slanted-left">Team</th>
                <th className="bg-blue-900 text-center py-2 px-3">PLD</th>
                <th className="bg-blue-900 text-center py-2 px-3">GD</th>
                <th className="bg-blue-900 text-center py-2 px-3 rounded-left-slash">PTS</th>
              </tr>
            </thead>
            <tbody>
              {/* Example Rows */}
              <tr className="bg-blue-900 border-b border-gray-700">
                <td className="text-center py-2 px-3 slanted-right">11</td>
                <td className="text-left py-2 px-3 slanted-left">Manchester City</td>
                <td className="text-center py-2 px-3">27</td>
                <td className="text-center py-2 px-3">7</td>
                <td className="text-center py-2 px-3 rounded-left-slash">32</td>
              </tr>
              <tr className="bg-blue-900 border-b border-gray-700">
                <td className="text-center py-2 px-3 slanted-right">12</td>
                <td className="text-left py-2 px-3 slanted-left">Sunderland</td>
                <td className="text-center py-2 px-3">26</td>
                <td className="text-center py-2 px-3">-6</td>
                <td className="text-center py-2 px-3 rounded-left-slash">31</td>
              </tr>
              {/* Add more rows here */}
              <tr className="bg-red-700 border-b border-gray-700 italic">
                <td className="text-center py-2 px-3 slanted-right">18</td>
                <td className="text-left py-2 px-3 slanted-left">Middlesbrough</td>
                <td className="text-center py-2 px-3">27</td>
                <td className="text-center py-2 px-3">-16</td>
                <td className="text-center py-2 px-3 rounded-left-slash">26</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



export default StandingsTable;
