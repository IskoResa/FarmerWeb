import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

const statuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

export default function FarmerDashboard() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["farmerOrders", user?.email],
    queryFn: () => base44.entities.Order.filter({ farmer_email: user?.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["farmerProducts", user?.email],
    queryFn: () => base44.entities.Product.filter({ farmer_email: user?.email }),
    enabled: !!user?.email,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmerOrders"] });
      toast.success("Order status updated.");
    },
  });

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const totalProducts = products.length;

  // Chart data - last 7 orders
  const chartData = orders.slice(0, 7).reverse().map((o) => ({
    name: format(new Date(o.created_date), "MMM d"),
    amount: o.total_amount || 0,
  }));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
          { label: "Pending", value: pendingOrders, icon: Package, color: "text-amber-600 bg-amber-50" },
          { label: "Products Listed", value: totalProducts, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <h2 className="font-semibold mb-4">Recent Sales</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Bar dataKey="amount" fill="hsl(142, 40%, 32%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Orders */}
      <h2 className="font-semibold text-xl mb-4">Recent Orders</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.slice(0, 20).map((order) => (
            <div key={order.id} className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{order.buyer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · ${order.total_amount?.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(order.created_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                  <SelectTrigger className="w-36 rounded-xl h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}