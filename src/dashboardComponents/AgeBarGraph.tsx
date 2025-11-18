"use client";

import { useEffect, useState } from "react";
import supabase from "@/db/config";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts";

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

interface FarmerRow {
  date_of_birth: string | null;
}

interface ChartRow {
  category: string;
  value: number;
}

export default function AgeBarGraph() {
  const [chartData, setChartData] = useState<ChartRow[]>([]);

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchAges = async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("date_of_birth");

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      const rows = (data as FarmerRow[]) || [];
      const ages = rows
        .filter((f) => f.date_of_birth)
        .map((f) => calculateAge(f.date_of_birth!));

      if (ages.length === 0) return;

      const youngest = Math.min(...ages);
      const oldest = Math.max(...ages);
      const average = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);

      setChartData([
        { category: "Youngest", value: youngest },
        { category: "Average", value: average },
        { category: "Oldest", value: oldest },
      ]);
    };

    fetchAges();
  }, []);

  const chartConfig: ChartConfig = {
    value: { label: "Age" },
    Youngest: { label: "Youngest", color: "var(--chart-1)" },
    Average: { label: "Average", color: "var(--chart-2)" },
    Oldest: { label: "Oldest", color: "var(--chart-3)" },
  };

  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Farmer Age Statistics</CardTitle>
        <CardDescription>Based on farmers.date_of_birth</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <XAxis dataKey="value" type="number" hide />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar dataKey="value" layout="vertical" radius={6}>
              {chartData.map((entry, index) => (
                <Cell key={entry.category} fill={colors[index]} />
              ))}
              <LabelList
                dataKey="value" // just show the number
                position="insideLeft"
                offset={10}
                fill="#fff"
                fontSize={14}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Updated dynamically from farmer records
          <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
