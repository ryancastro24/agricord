"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import supabase from "@/db/config";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";
import type { ChartConfig } from "@/components/ui/chart";

interface Cluster {
  id: string;
  cluster_name: string;
}

export default function AttendanceClusterChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch clusters
        const { data: clustersData, error: clusterError } = await supabase
          .from("clusters")
          .select("id, cluster_name")
          .order("cluster_name", { ascending: true });

        if (clusterError) throw clusterError;

        // Fetch attendance data
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("id, created_at, cluster_id");

        if (attendanceError) throw attendanceError;

        // Determine time range
        const referenceDate = new Date();
        const daysToSubtract =
          timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(referenceDate.getDate() - daysToSubtract);

        // Filter by date
        const filteredAttendance = attendanceData.filter((a) => {
          const d = new Date(a.created_at);
          return d >= startDate;
        });

        // ✅ Filter clusters to only include those that exist in attendance
        const validClusterIds = new Set(
          filteredAttendance.map((a) => a.cluster_id)
        );
        const filteredClusters = clustersData.filter((c) =>
          validClusterIds.has(c.id)
        );

        // Build chart data
        const dateMap: Record<string, any> = {};
        filteredAttendance.forEach((record) => {
          const dateKey = new Date(record.created_at)
            .toISOString()
            .split("T")[0];
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = { date: dateKey };
          }
          const clusterName =
            filteredClusters.find((c) => c.id === record.cluster_id)
              ?.cluster_name ?? "Unknown";
          dateMap[dateKey][clusterName] =
            (dateMap[dateKey][clusterName] || 0) + 1;
        });

        const sortedData = Object.values(dateMap).sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setClusters(filteredClusters);
        setChartData(sortedData);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const chartConfig: ChartConfig = clusters.reduce((acc, cluster, i) => {
    acc[cluster.cluster_name] = {
      label: cluster.cluster_name,
      color: `hsl(${(i * 45) % 360}, 70%, 50%)`,
    };
    return acc;
  }, {} as ChartConfig);

  if (loading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Attendance Overview by Cluster</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Attendance Overview by Cluster</CardTitle>
          <CardDescription>
            Showing attendance records per cluster
          </CardDescription>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {chartData.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No attendance records found for this period.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                {clusters.map((c, i) => (
                  <linearGradient
                    key={c.id}
                    id={`fill-${c.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`hsl(${(i * 45) % 360}, 70%, 50%)`}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={`hsl(${(i * 45) % 360}, 70%, 50%)`}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />

              {clusters.map((cluster, i) => (
                <Area
                  key={cluster.id}
                  dataKey={cluster.cluster_name}
                  type="natural"
                  fill={`url(#fill-${cluster.id})`}
                  stroke={`hsl(${(i * 45) % 360}, 70%, 50%)`}
                  stackId="a"
                />
              ))}

              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
