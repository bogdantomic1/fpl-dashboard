'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import type { TransferRow } from '@/lib/fpl/transfers';

interface Props {
  topIn: TransferRow[];
  topOut: TransferRow[];
}

export default function TransfersTabs({ topIn, topOut }: Props) {
  return (
    <div className="mt-8 p-4 ml-4 mr-4 bg-white dark:bg-card rounded-lg">
      <Tabs defaultValue="in" className="space-y-4">
        <TabsList>
          <TabsTrigger value="in">In</TabsTrigger>
          <TabsTrigger value="out">Out</TabsTrigger>
        </TabsList>

        <TabsContent value="in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Transfers In</TableHead>
                <TableHead>Ownership %</TableHead>
                <TableHead>In % of Managers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topIn.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.transfersIn}</TableCell>
                  <TableCell>{p.ownershipPct.toFixed(1)}%</TableCell>
                  <TableCell>{p.inPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="out">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Transfers Out</TableHead>
                <TableHead>Ownership %</TableHead>
                <TableHead>Out % of Managers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topOut.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.transfersOut}</TableCell>
                  <TableCell>{p.ownershipPct.toFixed(1)}%</TableCell>
                  <TableCell>{p.outPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
