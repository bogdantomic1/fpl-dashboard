// app/docs/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'data', label: 'Data Model' },
  { id: 'api', label: 'API Routes' },
  { id: 'components', label: 'Components' },
  { id: 'logic', label: 'Domain Logic' },
  { id: 'theming', label: 'Theming' },
];

export default function DocsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen">
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Docs</Badge>
          <Input
            placeholder="Search docs (static for now)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r p-4 sticky top-0 self-start h-[calc(100vh-56px)] hidden md:block">
          <nav className="space-y-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-sm hover:underline"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="p-4 md:p-8 space-y-12">
          {/* Intro */}
          <section id="intro" className="scroll-mt-24">
            <h1 className="text-2xl font-bold mb-2">
              FPL Dashboard Documentation
            </h1>
            <p className="text-muted-foreground">
              This site documents your FPL dashboard: data sources, core
              utilities (difficulty, transfers, filters), UI components
              (ComparePlayers, TopNav), and integration notes.
            </p>
            <div className="mt-4">
              <Link href="/" className="text-sm underline">
                Back to Dashboard
              </Link>
            </div>
          </section>

          {/* Data model */}
          <section id="data" className="scroll-mt-24">
            <h2 className="text-xl font-semibold mb-2">Data Model</h2>
            <Tabs defaultValue="entities" className="mt-2">
              <TabsList>
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="types">Types</TabsTrigger>
              </TabsList>
              <TabsContent value="entities" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold">Players</h3>
                  <p className="text-sm text-muted-foreground">
                    Mirrors FPL’s <code>elements</code>: cost, points, position,
                    ownership, transfers, etc.
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold">Teams</h3>
                  <p className="text-sm text-muted-foreground">
                    Includes home/away strength metrics; used by difficulty
                    calculations.
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold">Fixtures</h3>
                  <p className="text-sm text-muted-foreground">
                    Upcoming and finished fixtures with venue, score, and base
                    difficulty.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="types">
                <pre className="mt-4 overflow-x-auto rounded bg-muted p-4 text-xs">
                  {`type Player = {
  id: number;
  web_name: string;
  element_type: 1|2|3|4; // GKP/DEF/MID/FWD
  team: number; // team id
  now_cost: number;
  total_points: number;
  selected_by_percent: string;
  transfers_in_event: number;
  transfers_out_event: number;
  // ...
}

type Team = {
  id: number;
  name: string;
  strength_overall_home: number;
  strength_overall_away: number;
  // ...
}

type Fixture = {
  id: number;
  team_h: number;
  team_a: number;
  kickoff_time: string;
  finished: boolean;
  team_h_score: number | null;
  team_a_score: number | null;
  // ...
}`}
                </pre>
              </TabsContent>
            </Tabs>
          </section>

          {/* API Routes */}
          <section id="api" className="scroll-mt-24">
            <h2 className="text-xl font-semibold mb-2">API Routes</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <code>/api/data</code> – bootstrap (players, teams, positions,
                total_players)
              </li>
              <li>
                <code>/api/fixtures</code> – fixtures list
              </li>
            </ul>
          </section>

          {/* Components */}
          <section id="components" className="scroll-mt-24">
            <h2 className="text-xl font-semibold mb-2">Components</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <code>TopNav</code> – shadcn navigation menu
              </li>
              <li>
                <code>ComparePlayers</code> – customizable, columnar comparison
              </li>
              <li>Tables/Filters – shadcn Select/Slider/Table</li>
            </ul>
          </section>

          {/* Domain Logic */}
          <section id="logic" className="scroll-mt-24">
            <h2 className="text-xl font-semibold mb-2">Domain Logic</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <code>computeDifficultyMap()</code> – opponent-centric,
                venue-aware difficulty
              </li>
              <li>
                <code>buildTransferStats()</code>, <code>topNIn()</code>,{' '}
                <code>topNOut()</code>
              </li>
              <li>
                <code>filterAndSortPlayers()</code> – composable player
                filtering
              </li>
            </ul>
          </section>

          {/* Theming */}
          <section id="theming" className="scroll-mt-24">
            <h2 className="text-xl font-semibold mb-2">Theming</h2>
            <p className="text-sm text-muted-foreground">
              Tailwind CSS + shadcn; dark mode via <code>next-themes</code>.
              Tokens in <code>globals.css</code>.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Open App</Link>
            </Button>
          </section>
        </main>
      </div>
    </div>
  );
}
