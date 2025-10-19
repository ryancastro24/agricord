"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import supabase from "@/db/config";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Skeleton } from "@/components/ui/skeleton";

export const description = "Dynamic transaction bar chart";

// Helper to generate distinct HSL colors for each item
const generateColor = (index: number, total: number) => {
  const hue = (index * (360 / total)) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Format month name from timestamp
const getMonthName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("default", { month: "long" });
};

type TransactionRow = {
  created_at: string;
  quantity: number;
  items: { name: string } | null;
};

export default function BarChartContent() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch transactions with item details
      const { data, error } = await supabase
        .from("transactions")
        .select(`created_at, quantity, items(name)`);

      if (error) {
        console.error("Error fetching transactions:", error);
        setLoading(false);
        return;
      }

      const typedData = data as unknown as TransactionRow[];

      // Group by month and item
      const monthlyData: Record<string, Record<string, number>> = {};

      for (const tx of typedData) {
        const month = getMonthName(tx.created_at);
        const item = tx.items?.name || "Unknown Item";

        if (!monthlyData[month]) monthlyData[month] = {};
        monthlyData[month][item] =
          (monthlyData[month][item] || 0) + tx.quantity;
      }

      // Determine all unique items
      const allItems = Array.from(
        new Set(typedData.map((tx) => tx.items?.name || "Unknown Item"))
      );

      // Create chart data array
      const formattedData = Object.entries(monthlyData).map(
        ([month, items]) => ({
          month,
          ...items,
        })
      );

      // Generate chart config with colors
      const config: ChartConfig = {};
      allItems.forEach((item, index) => {
        config[item] = {
          label: item,
          color: generateColor(index, allItems.length),
        };
      });

      setChartConfig(config);
      setChartData(formattedData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-6">
        <CardHeader className="items-center pb-0">
          <CardTitle>Transaction Overview</CardTitle>
          <CardDescription>Loading data from Supabase...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 w-full mt-4">
          <Skeleton className="h-[250px] w-full rounded-lg" />
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[120px]" />
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm mt-4">
          <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            Fetching transactions...
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Overview</CardTitle>
        <CardDescription>Items transacted per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} accessibilityLayer barCategoryGap={20}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {Object.keys(chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={chartConfig[key].color}
                radius={6}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Transaction trends <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Comparing total quantities of items transacted per month
        </div>
      </CardFooter>
    </Card>
  );
}
