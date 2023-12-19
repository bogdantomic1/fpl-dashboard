"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function Teams() {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/team");
      const data = await response.json();

      setTeams(data.data.teams);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
       <div className="bg-gradient-to-b from-blue-700 to-green-900 min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Choose Your Team</h1>
      <div className="flex justify-start h-full">
        <div className="grid grid-cols-5 gap-4 flex-grow">
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="bg-gradient-to-b from-blue-500 to-green-500 text-white p-4 rounded-md text-center hover:from-blue-600 hover:to-green-600 transition duration-300"
            >
              <Link
                href={{
                  pathname: '/players',
                  query: { teamId: team.id },
                }}
              >
                {team.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
