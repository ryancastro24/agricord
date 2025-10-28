import LineChartMain from "@/charts/LineChartMain";
import PieChartContent from "@/charts/PieChart";
import BarChartContent from "@/charts/BarChartContent";
import PieChartPerBarangay from "@/charts/PieChartPerBarangay";
import ItemUpdateChart from "@/charts/ItemUpdateChart";

const DashboardContent = () => {
  return (
    <div>
      <LineChartMain />

      <div className="flex w-full justify-evenly gap-4 mt-4 ">
        <PieChartContent />
        <BarChartContent />
        <PieChartPerBarangay />
      </div>

      <ItemUpdateChart />
    </div>
  );
};

export default DashboardContent;
