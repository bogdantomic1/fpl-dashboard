'use client';

interface Player {
  id: number;
  web_name: string;
  total_points: number;
  [key: string]: any;
}

export default function ComparePlayers({
  allPlayers,
  selectedPlayers,
}: {
  allPlayers: Player[];
  selectedPlayers: number[];
}) {
  // Ensure it's an array
  const ids = Array.isArray(selectedPlayers) ? selectedPlayers : [];

  return (
    <div className="mt-8 p-4 bg-white dark:bg-[#2d0036] rounded-lg overflow-x-scroll">
      <h3 className="text-lg font-semibold mb-4 text-[#37003c] dark:text-white">
        Compare Players
      </h3>

      {ids.length === 0 ? (
        <div className="text-sm text-muted-foreground">No players selected</div>
      ) : (
        <div className="flex grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ids.map((id) => {
            const ply = allPlayers.find((p) => p.id === id);
            if (!ply) {
              return (
                <div
                  key={id}
                  className="bg-muted/20 dark:bg-muted/50 p-4 rounded-lg flex items-center justify-center text-sm text-muted-foreground"
                >
                  Player #{id} not found
                </div>
              );
            }
            return (
              <div
                key={ply.id}
                className="bg-muted/20 dark:bg-muted/50 p-4 rounded-lg"
              >
                <div className="font-semibold text-[#37003c] dark:text-white">
                  {ply.web_name}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Total Points: {ply.total_points}
                </div>
                {/* Add more stats here, e.g.: */}
                {/* <div className="mt-1 text-sm text-muted-foreground">
                     Goals: {ply.goals_scored} | Assists: {ply.assists}
                   </div> */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
