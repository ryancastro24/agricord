"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import supabase from "@/db/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

export const description = "Dynamic farmer cluster donut chart";

const chartConfig = {
  farmers: {
    label: "Farmers",
  },
} satisfies ChartConfig;

// Helper: Generate HSL colors dynamically
const generateColor = (index: number, total: number) => {
  const hue = (index * (360 / total)) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

type FarmerClusterRow = {
  farmer_id: string;
  clusters:
    | { cluster_name: string } // normal object
    | { cluster_name: string }[] // sometimes array
    | null; // sometimes null
};

export default function PieChartContent() {
  const [chartData, setChartData] = React.useState<
    { cluster: string; farmers: number; fill: string }[]
  >([]);
  const [totalFarmers, setTotalFarmers] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("farmer_clusters")
        .select(`farmer_id, clusters(cluster_name)`);

      if (error) {
        console.error("Error fetching farmer_clusters:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      const typedData = data as unknown as FarmerClusterRow[];

      // Compute total unique farmers
      const uniqueFarmers = new Set(typedData.map((item) => item.farmer_id));
      setTotalFarmers(uniqueFarmers.size);

      // Compute per-cluster counts
      const clusterCounts: Record<string, number> = {};

      for (const row of typedData) {
        let clusterName = "Uncategorized";

        if (Array.isArray(row.clusters) && row.clusters.length > 0) {
          clusterName = row.clusters[0].cluster_name || "Uncategorized";
        } else if (
          row.clusters &&
          typeof row.clusters === "object" &&
          "cluster_name" in row.clusters
        ) {
          clusterName = row.clusters.cluster_name || "Uncategorized";
        }

        clusterCounts[clusterName] = (clusterCounts[clusterName] || 0) + 1;
      }

      const totalClusters = Object.keys(clusterCounts).length;
      const chartFormatted = Object.entries(clusterCounts).map(
        ([cluster, count], index) => ({
          cluster,
          farmers: count,
          fill: generateColor(index, totalClusters),
        })
      );

      setChartData(chartFormatted);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    // 🦴 Skeleton Loader
    return (
      <Card className="flex flex-col items-center justify-center p-6">
        <CardHeader className="items-center pb-0">
          <CardTitle>Farmer Clusters Overview</CardTitle>
          <CardDescription>Loading data from Supabase...</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4 w-full mt-4">
          <Skeleton className="rounded-full h-[250px] w-[250px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </CardContent>

        <CardFooter className="flex-col gap-2 text-sm mt-4">
          <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            Fetching...
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Farmer Clusters Overview</CardTitle>
        <CardDescription>Unique farmers and per-cluster totals</CardDescription>
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
              dataKey="farmers"
              nameKey="cluster"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalFarmers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Farmers
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Data from Supabase <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Each cluster shows total members (duplicates allowed)
        </div>
      </CardFooter>
    </Card>
  );
}
