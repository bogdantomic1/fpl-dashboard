"use client";

import React, { useState, useEffect } from "react";
import PlayersList from "./components/PlayersList";

const Home = () => {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("api/data", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        const data = await response.json();
        setTeams(data.teams);
        setData(data);
        setPlayers(data.elements);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (event) => {
    const selectedTeamId = event.target.value;
    setSelectedTeam(selectedTeamId);

    const filteredPlayers = data.elements.filter(
      (player) => player.team === parseInt(selectedTeamId)
    );

    setPlayers(filteredPlayers);
  };

  const dummyStandings = [
    { team: "Team A", points: 45 },
    { team: "Team B", points: 40 },
    { team: "Team C", points: 38 },
  ];

  return (
    <div className="home-page flex flex-col h-screen">
      {/* Navbar */}
      <header className="navbar bg-indigo-500 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Fantasy Football</h1>
        <nav>
          <ul className="flex gap-4">
            <li>
              <a href="#" className="hover:underline">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Teams
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Standings
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <div className="main-content flex flex-1">
        {/* Table Section */}
        <div className="players-table flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-xl font-bold mb-4 text-center">Select a Team</h1>
          <div className="relative mb-4 text-center">
            <select
              value={selectedTeam}
              onChange={handleChange}
              className="form-select border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>
                Select a team
              </option>
              {teams.map((team, id) => (
                <option key={id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <PlayersList players={players} />
        </div>

        {/* Standings Sidebar */}
        <aside className="standings-sidebar w-1/4 bg-gray-100 p-4 shadow-md">
          <h2 className="text-lg font-bold mb-4">Standings</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Team</th>
                <th className="py-2 px-4 border-b">Points</th>
              </tr>
            </thead>
            <tbody>
              {dummyStandings.map((team, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{team.team}</td>
                  <td className="py-2 px-4 border-b">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
    </div>
  );
};

export default Home;
