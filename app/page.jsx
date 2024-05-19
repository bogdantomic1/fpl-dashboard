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
        console.log(error);
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

  return (
    <div className="home-container">
      <h1 className="text-xl font-bold mb-4">Select a Team</h1>
      <div className="relative mb-4 justify-items-center">
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
  );
};

export default Home;
