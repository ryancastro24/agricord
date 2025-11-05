"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import supabase from "@/db/config";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function ItemMonthlyChart() {
  const [items, setItems] = React.useState<any[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, quantity, created_at");

      if (error) {
        console.error("Error fetching items:", error);
        return;
      }

      setItems(data);

      // Auto-select first item
      if (data.length > 0) {
        setSelectedItem(data[0].name);
      }
    };

    fetchItems();
  }, []);

  React.useEffect(() => {
    if (!selectedItem || items.length === 0) return;

    setLoading(true);

    // Filter items based on selected item name
    const filtered = items.filter((item) => item.name === selectedItem);

    // Group by year-month
    const grouped: Record<string, number> = {};

    filtered.forEach((item) => {
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      grouped[key] = (grouped[key] || 0) + Number(item.quantity || 0);
    });

    const result = Object.entries(grouped).map(([date, qty]) => ({
      date,
      quantity: qty,
    }));

    setChartData(result);
    setLoading(false);
  }, [selectedItem, items]);

  return (
    <Card className="py-0 mt-5">
      <CardHeader className="flex flex-col border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Item Quantity by Month</CardTitle>
          <CardDescription>
            Select an item to view its monthly quantity history
          </CardDescription>
        </div>

        <div className="p-4 w-[250px]">
          <Select onValueChange={setSelectedItem} value={selectedItem || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select Item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.name || "Unnamed"}>
                  {item.name || "Unnamed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {loading ? (
          <p className="text-center py-10">Loading chart...</p>
        ) : (
          <ChartContainer
            config={{
              quantity: { label: "Quantity", color: "var(--chart-1)" },
            }}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const [year, month] = value.split("-");
                  return new Date(
                    Number(year),
                    Number(month) - 1
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="quantity"
                    labelFormatter={(value) => {
                      const [year, month] = value.split("-");
                      return new Date(
                        Number(year),
                        Number(month) - 1
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Bar dataKey="quantity" fill="var(--chart-1)" />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
