"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import supabase from "@/db/config";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function ItemStockChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, quantity");

      if (error) {
        console.error("Error fetching items:", error);
        return;
      }

      // Prepare data: name and quantity
      const result = (data || []).map((item) => ({
        name: item.name,
        quantity: Number(item.quantity || 0),
      }));

      setChartData(result);
      setLoading(false);
    };

    fetchItems();

    const interval = setInterval(fetchItems, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle>Item Stock</CardTitle>
        <CardDescription>
          Shows total stock quantity for each item
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-10">Loading chart...</p>
        ) : chartData.length === 0 ? (
          <p className="text-center py-10">No data found.</p>
        ) : (
          // Container for horizontal scroll
          <div className="overflow-x-auto">
            <div
              style={{
                minWidth: "100%", // at least full parent width
                width: Math.max(chartData.length * 60, 600), // dynamic width with min 600px
              }}
            >
              <BarChart
                data={chartData}
                width={Math.max(chartData.length * 60, 600)} // match container
                height={400}
                margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#4f46e5">
                  <LabelList dataKey="quantity" position="top" />
                </Bar>
              </BarChart>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
