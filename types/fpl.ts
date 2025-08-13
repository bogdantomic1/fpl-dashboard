export interface Fixture {
  id: number;
  kickoff_time: string;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
}

export interface Player {
  id: number;
  team?: number; // FPL links players to teams by id
  web_name?: string;
  selected_by_percent?: string;
  transfers_in_event?: number;
  transfers_out_event?: number;
  now_cost?: number;
  element_type?: number;
  [key: string]: any;
}

export interface Team {
  id: number;
  name: string;
  strength_overall_home?: number;
  strength_overall_away?: number;
  strength_attack_home?: number;
  strength_attack_away?: number;
  strength_defence_home?: number;
  strength_defence_away?: number;
}

export interface Position {
  id: number;
  singular_name: string;
}

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}
