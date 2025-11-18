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

export const description = "IP membership chart of farmers";

const chartConfig: ChartConfig = {
  IP: {
    label: "IP Member",
    color: "var(--chart-1)",
  },
  NonIP: {
    label: "Not IP Member",
    color: "var(--chart-2)",
  },
  count: {
    label: "Count",
  },
};

export default function IPGraph() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIPStatus = async () => {
      const { data, error } = await supabase.from("farmers").select("is_ip");

      if (error) {
        console.error("Error fetching farmers IP status:", error);
        setLoading(false);
        return;
      }

      // Count IP and Non-IP members
      const ipCount = data.filter((f) => f.is_ip === true).length;
      const nonIpCount = data.filter((f) => f.is_ip === false).length;

      const updatedData = [];

      if (ipCount > 0) {
        updatedData.push({
          type: "IP",
          count: ipCount,
          fill: "var(--chart-1)",
        });
      }

      if (nonIpCount > 0) {
        updatedData.push({
          type: "NonIP",
          count: nonIpCount,
          fill: "var(--chart-2)",
        });
      }

      setChartData(updatedData);
      setLoading(false);
    };

    fetchIPStatus();
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>IP Membership Distribution</CardTitle>
        <CardDescription>IP vs Non-IP Farmers</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {loading ? (
          <p className="text-center text-gray-500">Loading chart...</p>
        ) : chartData.length === 0 ? (
          <p className="text-center text-gray-500">
            No IP membership data available.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="count" hideLabel />}
              />
              <Pie data={chartData} dataKey="count" nameKey="type">
                <LabelList
                  dataKey="type"
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
          Showing IP membership breakdown of registered farmers
        </div>
      </CardFooter>
    </Card>
  );
}
