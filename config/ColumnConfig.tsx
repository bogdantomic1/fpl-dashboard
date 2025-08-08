interface ColumnConfig {
  label: string;
  visible: boolean;
  format?: (v: any) => React.ReactNode;
  order?: number;
}
import { Badge } from '@/components/ui/badge';
import type { Team } from '@/types/fpl';

export const playerColumnConfig: Record<string, ColumnConfig> = {
  team: { label: 'Team', visible: true, order: 0 },
  element_type: { label: 'Position', visible: true, order: 1 },
  web_name: { label: 'Web Name', visible: true, order: 2 },
  selected_by_percent: { label: 'Selected %', visible: true, order: 3 },
  form: { label: 'Form', visible: true, order: 3 },
  now_cost: {
    label: 'Cost',
    visible: true,
    format: (v: number) => `£${(v / 10).toFixed(1)}`,
    order: 4,
  },
  total_points: { label: 'Total Points', visible: false, order: 5 },
  event_points: { label: 'Gameweek Points', visible: true, order: 6 },
  points_per_game: { label: 'Points Per Game', visible: true, order: 7 },
  minutes: { label: 'Minutes', visible: true, order: 8 },
  goals_scored: { label: 'Goals', visible: true, order: 9 },
  expected_goals: { label: 'xG', visible: true, order: 10 },
  assists: { label: 'Assists', visible: true, order: 11 },
  expected_assists: { label: 'xA', visible: true, order: 12 },
  transfers_in_event: { label: 'Transfers In GW', visible: false, order: 13 },
  transfers_out_event: { label: 'Transfers Out GW', visible: false, order: 14 },
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
  ep_next: { label: 'Ep Next', visible: false },
  ep_this: { label: 'Ep This', visible: false },
  first_name: { label: 'First Name', visible: false },
  id: { label: 'Id', visible: false },
  in_dreamteam: { label: 'In Dreamteam', visible: false },
  news: { label: 'News', visible: false },
  news_added: { label: 'News Added', visible: false },
  photo: { label: 'Photo', visible: false },
  removed: { label: 'Removed', visible: false },
  second_name: { label: 'Second Name', visible: false },
  special: { label: 'Special', visible: false },
  squad_number: { label: 'Squad Number', visible: false },
  team_code: { label: 'Team Code', visible: false },
  transfers_in: { label: 'Transfers In', visible: false },
  transfers_out: { label: 'Transfers Out', visible: false },
  value_form: { label: 'Value Form', visible: false },
  value_season: { label: 'Value Season', visible: false },
  region: { label: 'Region', visible: false },
  team_join_date: { label: 'Team Join Date', visible: false },
  birth_date: { label: 'Birth Date', visible: false },
  has_temporary_code: { label: 'Has Temporary Code', visible: false },
  opta_code: { label: 'Opta Code', visible: false },
  clean_sheets: { label: 'Clean Sheets', visible: false },
  goals_conceded: { label: 'Goals Conceded', visible: false },
  own_goals: { label: 'Own Goals', visible: false },
  penalties_saved: { label: 'Penalties Saved', visible: false },
  penalties_missed: { label: 'Penalties Missed', visible: false },
  yellow_cards: { label: 'Yellow Cards', visible: false },
  red_cards: { label: 'Red Cards', visible: false },
  saves: { label: 'Saves', visible: false },
  bonus: { label: 'Bonus', visible: false },
  bps: { label: 'Bps', visible: false },
  influence: { label: 'Influence', visible: false },
  creativity: { label: 'Creativity', visible: false },
  threat: { label: 'Threat', visible: false },
  ict_index: { label: 'Ict Index', visible: false },
  clearances_blocks_interceptions: {
    label: 'Clearances Blocks Interceptions',
    visible: false,
  },
  recoveries: { label: 'Recoveries', visible: false },
  tackles: { label: 'Tackles', visible: false },
  defensive_contribution: { label: 'Defensive Contribution', visible: false },
  starts: { label: 'Starts', visible: false },
  expected_goal_involvements: {
    label: 'Expected Goal Involvements',
    visible: false,
  },
  expected_goals_conceded: { label: 'Expected Goals Conceded', visible: false },
  influence_rank: { label: 'Influence Rank', visible: false },
  influence_rank_type: { label: 'Influence Rank Type', visible: false },
  creativity_rank: { label: 'Creativity Rank', visible: false },
  creativity_rank_type: { label: 'Creativity Rank Type', visible: false },
  threat_rank: { label: 'Threat Rank', visible: false },
  threat_rank_type: { label: 'Threat Rank Type', visible: false },
  ict_index_rank: { label: 'Ict Index Rank', visible: false },
  ict_index_rank_type: { label: 'Ict Index Rank Type', visible: false },
  corners_and_indirect_freekicks_order: {
    label: 'Corners And Indirect Freekicks Order',
    visible: false,
  },
  corners_and_indirect_freekicks_text: {
    label: 'Corners And Indirect Freekicks Text',
    visible: false,
  },
  direct_freekicks_order: { label: 'Direct Freekicks Order', visible: false },
  direct_freekicks_text: { label: 'Direct Freekicks Text', visible: false },
  penalties_order: { label: 'Penalties Order', visible: false },
  penalties_text: { label: 'Penalties Text', visible: false },
  expected_goals_per_90: { label: 'Expected Goals Per 90', visible: false },
  saves_per_90: { label: 'Saves Per 90', visible: false },
  expected_assists_per_90: { label: 'Expected Assists Per 90', visible: false },
  expected_goal_involvements_per_90: {
    label: 'Expected Goal Involvements Per 90',
    visible: false,
  },
  expected_goals_conceded_per_90: {
    label: 'Expected Goals Conceded Per 90',
    visible: false,
  },
  goals_conceded_per_90: { label: 'Goals Conceded Per 90', visible: false },
  now_cost_rank: { label: 'Now Cost Rank', visible: false },
  now_cost_rank_type: { label: 'Now Cost Rank Type', visible: false },
  form_rank: { label: 'Form Rank', visible: false },
  form_rank_type: { label: 'Form Rank Type', visible: false },
  points_per_game_rank: { label: 'Points Per Game Rank', visible: false },
  points_per_game_rank_type: {
    label: 'Points Per Game Rank Type',
    visible: false,
  },
  selected_rank: { label: 'Selected Rank', visible: false },
  selected_rank_type: { label: 'Selected Rank Type', visible: false },
  starts_per_90: { label: 'Starts Per 90', visible: false },
  clean_sheets_per_90: { label: 'Clean Sheets Per 90', visible: false },
  defensive_contribution_per_90: {
    label: 'Defensive Contribution Per 90',
    visible: false,
  },
};
