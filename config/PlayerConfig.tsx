import { Badge } from '@/components/ui/badge';
interface ColumnConfig {
  label: string;
  visible: boolean;
  format?: (v: any) => React.ReactNode;
  order?: number;
}

import type { Team } from '@/types/fpl';
export const singlePlayerConfig: Record<string, ColumnConfig> = {
  can_transact: { label: 'Can Transact', visible: false },
  can_select: { label: 'Can Select', visible: false },
  chance_of_playing_next_round: {
    label: 'Chance Of Playing Next Round',
    visible: false,
  },
  chance_of_playing_this_round: {
    label: 'Chance Of Playing This Round',
    visible: false,
  },
  code: { label: 'Code', visible: false },
  cost_change_event: { label: 'Cost Change Event', visible: false },
  cost_change_event_fall: { label: 'Cost Change Event Fall', visible: false },
  cost_change_start: { label: 'Cost Change Start', visible: false },
  cost_change_start_fall: { label: 'Cost Change Start Fall', visible: false },
  dreamteam_count: { label: 'Dreamteam Count', visible: false },
  element_type: { label: 'Element Type', visible: true, order: 14 },
  ep_next: { label: 'Ep Next', visible: false },
  ep_this: { label: 'Ep This', visible: false },
  event_points: { label: 'Event Points', visible: true, order: 13 },
  first_name: { label: 'First Name', visible: false },
  form: { label: 'Form', visible: true, order: 12 },
  id: { label: 'Id', visible: false },
  in_dreamteam: { label: 'In Dreamteam', visible: false },
  news: { label: 'News', visible: false },
  news_added: { label: 'News Added', visible: false },
  now_cost: {
    label: 'Cost',
    visible: true,
    format: (v: number, teams?: Team[]) => `${(v / 10).toFixed(1)}m`,
    order: 11,
  },
  photo: { label: 'Photo', visible: false },
  points_per_game: { label: 'Points Per Game', visible: true, order: 10 },
  removed: { label: 'Removed', visible: false },
  second_name: { label: 'Second Name', visible: false },
  selected_by_percent: {
    label: 'Selected By Percent',
    visible: true,
    order: 9,
  },
  special: { label: 'Special', visible: false },
  squad_number: { label: 'Squad Number', visible: false },
  status: {
    label: 'Status',
    visible: true,
    format: (v: string) => {
      switch (v) {
        case 'a':
          return (
            <Badge
              variant="secondary"
              className="bg-green-500 text-black dark:bg-blue-600"
            >
              Available
            </Badge>
          );
        case 'i':
          return (
            <Badge
              variant="destructive"
              className="bg-green-500 text-black dark:bg-green-500"
            >
              Injured
            </Badge>
          );
        case 'u':
          return (
            <Badge
              variant="secondary"
              className="bg-green-500 text-black dark:bg-blue-600"
            >
              Unavailable
            </Badge>
          );
        default:
          return (
            <Badge
              variant="secondary"
              className="bg-green-600 text-black dark:bg-blue-600"
            >
              N/A
            </Badge>
          );
      }
    },
    order: 15,
  },
  team: { label: 'Team', visible: false },
  team_code: { label: 'Team Code', visible: false },
  total_points: { label: 'Total Points', visible: true },
  transfers_in: { label: 'Transfers In', visible: true },
  transfers_in_event: { label: 'Transfers In Event', visible: true },
  transfers_out: { label: 'Transfers Out', visible: true },
  transfers_out_event: { label: 'Transfers Out Event', visible: true },
  value_form: { label: 'Value Form', visible: false },
  value_season: { label: 'Value Season', visible: true, order: 7 },
  web_name: { label: 'Web Name', visible: true, order: 0 },
  region: { label: 'Region', visible: false },
  team_join_date: { label: 'Team Join Date', visible: false },
  birth_date: { label: 'Birth Date', visible: false },
  has_temporary_code: { label: 'Has Temporary Code', visible: false },
  opta_code: { label: 'Opta Code', visible: false },
  minutes: { label: 'Minutes', visible: true, order: 6 },
  goals_scored: { label: 'Goals Scored', visible: true, order: 5 },
  assists: { label: 'Assists', visible: true, order: 4 },
  clean_sheets: { label: 'Clean Sheets', visible: true },
  goals_conceded: { label: 'Goals Conceded', visible: true },
  own_goals: { label: 'Own Goals', visible: true },
  penalties_saved: { label: 'Penalties Saved', visible: true },
  penalties_missed: { label: 'Penalties Missed', visible: true },
  yellow_cards: { label: 'Yellow Cards', visible: true },
  red_cards: { label: 'Red Cards', visible: true },
  saves: { label: 'Saves', visible: true },
  bonus: { label: 'Bonus', visible: true },
  bps: { label: 'Bps', visible: true },
  influence: { label: 'Influence', visible: true },
  creativity: { label: 'Creativity', visible: true },
  threat: { label: 'Threat', visible: true },
  ict_index: { label: 'Ict Index', visible: true },
  clearances_blocks_interceptions: {
    label: 'Clearances Blocks Interceptions',
    visible: true,
  },
  recoveries: { label: 'Recoveries', visible: true },
  tackles: { label: 'Tackles', visible: true },
  defensive_contribution: { label: 'Defensive Contribution', visible: true },
  starts: { label: 'Starts', visible: true },
  expected_goals: { label: 'Expected Goals', visible: true, order: 3 },
  expected_assists: { label: 'Expected Assists', visible: true },
  expected_goal_involvements: {
    label: 'Expected Goal Involvements',
    visible: true,
    order: 2,
  },
  expected_goals_conceded: { label: 'Expected Goals Conceded', visible: true },
  influence_rank: { label: 'Influence Rank', visible: true },
  influence_rank_type: { label: 'Influence Rank Type', visible: true },
  creativity_rank: { label: 'Creativity Rank', visible: true },
  creativity_rank_type: { label: 'Creativity Rank Type', visible: true },
  threat_rank: { label: 'Threat Rank', visible: true },
  threat_rank_type: { label: 'Threat Rank Type', visible: true },
  ict_index_rank: { label: 'Ict Index Rank', visible: true },
  ict_index_rank_type: { label: 'Ict Index Rank Type', visible: true },
  corners_and_indirect_freekicks_order: {
    label: 'Corners And Indirect Freekicks Order',
    visible: true,
  },
  corners_and_indirect_freekicks_text: {
    label: 'Corners And Indirect Freekicks Text',
    visible: true,
  },
  direct_freekicks_order: { label: 'Direct Freekicks Order', visible: true },
  direct_freekicks_text: { label: 'Direct Freekicks Text', visible: true },
  penalties_order: { label: 'Penalties Order', visible: true },
  penalties_text: { label: 'Penalties Text', visible: true },
  expected_goals_per_90: { label: 'Expected Goals Per 90', visible: true },
  saves_per_90: { label: 'Saves Per 90', visible: true },
  expected_assists_per_90: { label: 'Expected Assists Per 90', visible: true },
  expected_goal_involvements_per_90: {
    label: 'Expected Goal Involvements Per 90',
    visible: true,
  },
  expected_goals_conceded_per_90: {
    label: 'Expected Goals Conceded Per 90',
    visible: true,
  },
  goals_conceded_per_90: { label: 'Goals Conceded Per 90', visible: true },
  now_cost_rank: { label: 'Now Cost Rank', visible: true },
  now_cost_rank_type: { label: 'Now Cost Rank Type', visible: true },
  form_rank: { label: 'Form Rank', visible: true },
  form_rank_type: { label: 'Form Rank Type', visible: true },
  points_per_game_rank: { label: 'Points Per Game Rank', visible: true },
  points_per_game_rank_type: {
    label: 'Points Per Game Rank Type',
    visible: true,
  },
  selected_rank: { label: 'Selected Rank', visible: true },
  selected_rank_type: { label: 'Selected Rank Type', visible: true },
  starts_per_90: { label: 'Starts Per 90', visible: true },
  clean_sheets_per_90: { label: 'Clean Sheets Per 90', visible: true },
  defensive_contribution_per_90: {
    label: 'Defensive Contribution Per 90',
    visible: true,
  },
};
