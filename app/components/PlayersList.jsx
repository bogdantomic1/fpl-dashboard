"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"; // Adjust the import path based on your setup
import { Pagination } from "@/components/ui/pagination"; // Ensure Pagination component is installed and set up

const ResponsivePlayersTable = ({ players }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const columns = [
    { label: "Name", key: "web_name" },
    { label: "Position", key: "element_type" },
    { label: "Cost", key: "now_cost" },
    { label: "Points Per Game", key: "points_per_game" },
    { label: "Selected By (%)", key: "selected_by_percent" },
    { label: "Total Points", key: "total_points" },
    { label: "Goals Scored", key: "goals_scored" },
    { label: "Assists", key: "assists" },
    { label: "Clean Sheets", key: "clean_sheets" },
    { label: "Expected Goals", key: "expected_goals" },
    { label: "Expected Assists", key: "expected_assists" },
    { label: "Expected Goal Involvements", key: "expected_goal_involvements" },
  ];

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

  // Pagination logic
  const totalPages = Math.ceil(players.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlayers = players.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="overflow-x-auto bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <Table className="min-w-full table-auto border-collapse border border-gray-600">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} className="py-2 px-4 text-left text-gray-300">
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPlayers.map((player, index) => (
            <TableRow
              key={index}
              className={`hover:bg-gray-800 ${index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}`}
            >
              {columns.map((column) => {
                let value = player[column.key];
                if (column.key === "element_type") {
                  value = positions[parseInt(value) - 1];
                } else if (column.key === "now_cost") {
                  value = `£${(value / 10).toFixed(1)}m`;
                }
                return (
                  <TableCell key={column.key} className="py-2 px-4 text-gray-300">
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default ResponsivePlayersTable;
