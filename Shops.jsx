import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { MapPin, Store } from "lucide-react";

export default function Shops() {
  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: () => base44.entities.Shop.filter({ status: "active" }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Local Farms</h1>
        <p className="mt-2 text-muted-foreground">Discover stories and fresh produce from farmers near you.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">No farms have opened their shop yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Link key={shop.id} to={`/shop/${shop.id}`} className="group">
              <div className="rounded-2xl border border-border overflow-hidden bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                <div className="h-40 bg-muted relative overflow-hidden">
                  {shop.cover_image ? (
                    <img src={shop.cover_image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {shop.logo_image ? (
                        <img src={shop.logo_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{shop.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" /> {shop.location}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{shop.description}</p>
                  <p className="text-xs text-muted-foreground/60">by {shop.owner_name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}