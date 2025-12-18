import { ScoreItem } from '@/types';
import { cn } from '@/lib/utils';

interface ScoreBoxProps {
  label: string;
  scoreItem: ScoreItem;
}

const getScoreColor = (score: number): string => {
  if (score >= 5) return 'bg-score-excellent text-primary-foreground';
  if (score >= 4) return 'bg-score-good text-primary-foreground';
  if (score >= 3) return 'bg-score-average text-foreground';
  if (score >= 2) return 'bg-score-poor text-primary-foreground';
  return 'bg-score-bad text-primary-foreground';
};

const getScoreBorderColor = (score: number): string => {
  if (score >= 5) return 'border-score-excellent/30';
  if (score >= 4) return 'border-score-good/30';
  if (score >= 3) return 'border-score-average/30';
  if (score >= 2) return 'border-score-poor/30';
  return 'border-score-bad/30';
};

export function ScoreBox({ label, scoreItem }: ScoreBoxProps) {
  const { score, reason } = scoreItem;

  return (
    <div className={cn(
      "rounded-xl border-2 p-5 transition-all hover:shadow-md",
      getScoreBorderColor(score)
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground">{label}</h4>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
          getScoreColor(score)
        )}>
          {score}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {reason}
      </p>
    </div>
  );
}
