"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Players() {
  const searchParams = useSearchParams();
  const ID = searchParams.get("teamId");
  const [players, setPlayers] = useState([]);
  const [position, setPosition] = useState([]);
  useEffect(() => {
    fetchPlayers();
    fetchPosition();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/team");
      const data = await response.json();

      setPlayers(data.data.elements);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchPosition = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/team");
      const data = await response.json();

      setPosition(data.data.element_types);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <div className="bg-gradient-to-b from-blue-400 to-green-600 min-h-screen p-8 text-white">
        <div className="max-w-full mx-auto my-8 flex">
          {position.map((pos) => {
            // Filter players based on element_type and team_id
            const filteredPlayers = players.filter(
              (player) => player.element_type === pos.id && player.team == ID
            );

            return (
              <div
                key={pos.id}
                className="flex-1 bg-gradient-to-br from-blue-500 to-green-500 text-white p-6 rounded-md text-center mr-4 shadow-lg transition-transform transform "
              >
                <h1 className="text-5xl font-bold mb-4">{pos.plural_name}</h1>

                <ul className="pl-4">
                  {filteredPlayers.map((player) => (
                    <li
                      key={player.id}
                      className="text-3xl font-medium hover:scale-110"
                    >
                      <a href={`/players/${player.id}`}>{player.web_name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
