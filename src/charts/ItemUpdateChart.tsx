import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import supabase from "../db/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";

type Item = {
  id: string;
  name: string;
  barcode: string;
  quantity: number;
  created_at: string;
};

type ItemStockUpdate = {
  id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  items?: {
    name: string;
  };
};

type ChartData = {
  date: string;
  total: number;
};

export default function ItemUpdateChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Automatically insert all items into itemstockupdates every 12AM
  const scheduleMidnightInsert = () => {
    const now = new Date();
    const nextMidnight = new Date();

    nextMidnight.setHours(24, 0, 0, 0); // next 12:00 AM
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Trigger insert at midnight
    setTimeout(() => {
      insertItemStockUpdates();
      // Then repeat every 24 hours
      setInterval(insertItemStockUpdates, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  };

  // ✅ Function to insert all current items into itemstockupdates
  const insertItemStockUpdates = async () => {
    const { data: items, error } = await supabase
      .from("items")
      .select("id, quantity");

    if (error) {
      console.error("❌ Error fetching items for insert:", error.message);
      return;
    }

    if (!items || items.length === 0) return;

    const updates = items.map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("itemstockupdates")
      .insert(updates);

    if (insertError) {
      console.error(
        "❌ Error inserting item stock updates:",
        insertError.message
      );
    } else {
      console.log("✅ Inserted daily item stock updates at 12AM");
    }
  };

  // ✅ Fetch data joined with items for chart
  const fetchItemStockUpdates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("itemstockupdates")
      .select("id, created_at, items(name, quantity)")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching item stock updates:", error.message);
      setLoading(false);
      return;
    }

    // Group by date (sum of quantities)
    const grouped: Record<string, number> = {};
    data.forEach((entry) => {
      const date = new Date(entry.created_at).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + entry.quantity;
    });

    const formatted = Object.entries(grouped).map(([date, total]) => ({
      date,
      total,
    }));

    setChartData(formatted);
    setLoading(false);
  };

  // ✅ Real-time updates for itemstockupdates table
  useEffect(() => {
    fetchItemStockUpdates();
    scheduleMidnightInsert(); // Schedule automatic insert

    const channel = supabase
      .channel("itemstockupdates-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "itemstockupdates" },
        () => fetchItemStockUpdates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="py-0">
      <CardHeader>
        <CardTitle>Inventory Overview</CardTitle>
        <CardDescription>
          Displays quantity per day (auto-updated from item stock updates)
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading data...</p>
        ) : chartData.length === 0 ? (
          <p className="text-center text-muted-foreground">No data found</p>
        ) : (
          <ChartContainer className="aspect-auto h-[300px] w-full">
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="total"
                    labelFormatter={(value: string) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              <Bar dataKey="total" fill="var(--chart-1)" />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
