import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Competitor } from '@/types';
import { ExternalLink, Building2 } from 'lucide-react';

interface CompetitorTableProps {
  competitors: Competitor[];
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl gradient-text flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Competitor Landscape
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Comparison</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {competitor.name}
                      {competitor.websiteUrl && (
                        <a
                          href={competitor.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {competitor.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{competitor.country}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{competitor.fundingStage}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] text-sm text-muted-foreground">
                    {competitor.comparison}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
