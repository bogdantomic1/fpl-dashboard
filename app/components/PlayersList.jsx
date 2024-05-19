import React from "react";
import { useState, useEffect } from "react";
const PlayersList = ({ players }) => {

  const positions = [
    "Goalkeeper", "Defender", "Midfielder", "Attacker"
  ]
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const sortedPlayers = React.useMemo(() => {
    let sortablePlayers = [...players];
    if (sortConfig.key) {
      sortablePlayers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortablePlayers;
  }, [players, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getClassNamesFor = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? 'sorted-asc' : 'sorted-desc';
    }
    return '';
  };

  return (
    <div className="players-list overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('web_name')}>
              Name <span className={getClassNamesFor('web_name')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('element_type')}>
              Position <span className={getClassNamesFor('element_type')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('now_cost')}>
              Cost <span className={getClassNamesFor('now_cost')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('points_per_game')}>
              Points Per Game <span className={getClassNamesFor('points_per_game')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('selected_by_percent')}>
              Selected By (%) <span className={getClassNamesFor('selected_by_percent')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('total_points')}>
              Total Points <span className={getClassNamesFor('total_points')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('value_season')}>
              Value Season <span className={getClassNamesFor('value_season')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('minutes')}>
              Minutes <span className={getClassNamesFor('minutes')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('goals_scored')}>
              Goals Scored <span className={getClassNamesFor('goals_scored')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('assists')}>
              Assists <span className={getClassNamesFor('assists')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('clean_sheets')}>
              Clean Sheets <span className={getClassNamesFor('clean_sheets')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('influence')}>
              Influence <span className={getClassNamesFor('influence')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('creativity')}>
              Creativity <span className={getClassNamesFor('creativity')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('threat')}>
              Threat <span className={getClassNamesFor('threat')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('bonus')}>
              Bonus <span className={getClassNamesFor('bonus')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('ict_index')}>
              ICT Index <span className={getClassNamesFor('ict_index')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('expected_goals')}>
              Expected Goals <span className={getClassNamesFor('expected_goals')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('expected_assists')}>
              Expected Assists <span className={getClassNamesFor('expected_assists')}></span>
            </th>
            <th className="py-2 px-4 border-b cursor-pointer" onClick={() => requestSort('expected_goal_involvements')}>
              Expected Goal Involvements <span className={getClassNamesFor('expected_goal_involvements')}></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{player.web_name}</td>
              <td className="py-2 px-4 border-b">{positions[parseInt(player.element_type) - 1]}</td>
              <td className="py-2 px-4 border-b">£{(player.now_cost / 10).toFixed(1)}m</td>
              <td className="py-2 px-4 border-b">{player.points_per_game}</td>
              <td className="py-2 px-4 border-b">{player.selected_by_percent}%</td>
              <td className="py-2 px-4 border-b">{player.total_points}</td>
              <td className="py-2 px-4 border-b">{player.value_season}</td>
              <td className="py-2 px-4 border-b">{player.minutes}</td>
              <td className="py-2 px-4 border-b">{player.goals_scored}</td>
              <td className="py-2 px-4 border-b">{player.assists}</td>
              <td className="py-2 px-4 border-b">{player.clean_sheets}</td>
              <td className="py-2 px-4 border-b">{player.influence}</td>
              <td className="py-2 px-4 border-b">{player.creativity}</td>
              <td className="py-2 px-4 border-b">{player.threat}</td>
              <td className="py-2 px-4 border-b">{player.bonus}</td>
              <td className="py-2 px-4 border-b">{player.ict_index}</td>
              <td className="py-2 px-4 border-b">{player.expected_goals}</td>
              <td className="py-2 px-4 border-b">{player.expected_assists}</td>
              <td className="py-2 px-4 border-b">{player.expected_goal_involvements}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  
  );
};

export default PlayersList;
