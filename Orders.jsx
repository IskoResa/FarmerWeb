import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", icon: Package, color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-700" },
};

export default function Orders() {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isFarmer = user?.role === "farmer";

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.email, isFarmer],
    queryFn: () => isFarmer
      ? base44.entities.Order.filter({ farmer_email: user?.email }, "-created_date")
      : base44.entities.Order.filter({ buyer_email: user?.email }, "-created_date"),
    enabled: !!user?.email,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">{isFarmer ? "Incoming Orders" : "My Orders"}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">{isFarmer ? "No orders yet — your first harvest awaits!" : "You haven't placed any orders yet."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <div key={order.id} className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_date), "MMM d, yyyy · h:mm a")}
                    </p>
                    <p className="font-medium mt-0.5">
                      {isFarmer ? `From ${order.buyer_name}` : `From ${order.shop_name}`}
                    </p>
                  </div>
                  <Badge className={`${config.color} border-0 gap-1`}>
                    <Icon className="h-3.5 w-3.5" /> {config.label}
                  </Badge>
                </div>
                <div className="divide-y divide-border">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                      <span>{item.product_name} × {item.quantity_kg} kg</span>
                      <span className="font-medium">${item.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">${order.total_amount?.toFixed(2)}</span>
                </div>
                {order.delivery_address && (
                  <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}