"use client";

import { useEffect, useState } from "react";
import supabase from "@/db/config";

import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";

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

export const description = "Gender distribution chart of farmers";

const chartConfig: ChartConfig = {
  Male: {
    label: "Male",
    color: "var(--chart-1)",
  },
  Female: {
    label: "Female",
    color: "var(--chart-2)",
  },
  count: {
    label: "Count",
  },
};

export default function GenderChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenders = async () => {
      const { data, error } = await supabase.from("farmers").select("sex");

      if (error) {
        console.error("Error fetching farmers sex:", error);
        setLoading(false);
        return;
      }

      // Count dynamically
      const maleCount = data.filter((f) => f.sex === "Male").length;
      const femaleCount = data.filter((f) => f.sex === "Female").length;

      const updatedData = [];

      if (maleCount > 0) {
        updatedData.push({
          gender: "Male",
          count: maleCount,
          fill: "var(--chart-1)",
        });
      }

      if (femaleCount > 0) {
        updatedData.push({
          gender: "Female",
          count: femaleCount,
          fill: "var(--chart-2)",
        });
      }

      setChartData(updatedData);
      setLoading(false);
    };

    fetchGenders();
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription>Male vs Female Farmers</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {loading ? (
          <p className="text-center text-gray-500">Loading chart...</p>
        ) : chartData.length === 0 ? (
          <p className="text-center text-gray-500">No gender data available.</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="count" hideLabel />}
              />
              <Pie data={chartData} dataKey="count" nameKey="gender">
                <LabelList
                  dataKey="gender"
                  className="fill-background"
                  stroke="none"
                  fontSize={12}
                  formatter={(value: keyof typeof chartConfig) =>
                    chartConfig[value]?.label
                  }
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing gender breakdown of registered farmers
        </div>
      </CardFooter>
    </Card>
  );
}
