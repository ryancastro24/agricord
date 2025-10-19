"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
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

export const description = "Dynamic farmer demographics pie chart";

// Helper: dynamic color generator
const generateColor = (index: number, total: number) => {
  const hue = (index * (360 / total)) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export default function PieChartPerBarangay() {
  const [chartData, setChartData] = React.useState<
    { category: string; count: number; fill: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("farmers")
        .select("is_with_disability, is_4ps_beneficiary");

      if (error) {
        console.error("Error fetching farmers:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // Initialize counts
      let withDisability = 0;
      let withoutDisability = 0;
      let fourPsMember = 0;
      let notFourPsMember = 0;

      // Count per category
      data.forEach((farmer) => {
        if (farmer.is_with_disability) withDisability++;
        else withoutDisability++;

        if (farmer.is_4ps_beneficiary) fourPsMember++;
        else notFourPsMember++;
      });

      // Prepare categories
      const categories = [
        { category: "With Disability", count: withDisability },
        { category: "Without Disability", count: withoutDisability },
        { category: "4Ps Member", count: fourPsMember },
        { category: "Not 4Ps Member", count: notFourPsMember },
      ];

      // Apply colors
      const total = categories.length;
      const formatted = categories.map((c, i) => ({
        ...c,
        fill: generateColor(i, total),
      }));

      setChartData(formatted);
      setLoading(false);
    };

    fetchData();
  }, []);

  const chartConfig: ChartConfig = {
    count: { label: "Farmers" },
  };

  // 🔄 Loading skeleton
  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-6">
        <CardHeader className="items-center pb-0">
          <CardTitle>Farmer Demographics</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 w-full mt-4">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[120px]" />
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm mt-4">
          <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            Fetching farmer demographics...
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Farmer Demographics</CardTitle>
        <CardDescription>
          Categorized by Disability and 4Ps Membership
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="category"
              stroke="0"
              outerRadius={100}
              isAnimationActive
            />
          </PieChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Updated farmer records <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing distribution of disability and 4Ps membership
        </div>
      </CardFooter>
    </Card>
  );
}
