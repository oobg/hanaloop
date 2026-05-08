import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type ChartPlaceholderProps = {
  caption: string;
};

export function ChartPlaceholder({ caption }: ChartPlaceholderProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>배출량 추이</CardTitle>
        <CardDescription>
          차트 영역입니다. 아직 데이터 연동 및 시각화는 없습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-border bg-muted text-muted-foreground flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 text-center text-sm"
          role="img"
          aria-label="차트 자리 표시"
        >
          <span className="font-medium text-foreground">자리 표시</span>
          <p className="max-w-sm leading-relaxed">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}
