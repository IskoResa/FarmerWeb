import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Calendar, Clock, Package, Minus, Plus, ShoppingCart, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => base44.entities.Product.get(id),
  });

  const addToCart = useMutation({
    mutationFn: (data) => base44.entities.CartItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to your basket!");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/" className="text-primary mt-4 inline-block">Back to marketplace</Link>
      </div>
    );
  }

  const isBuyer = !!user;
  const maxQty = product.available_kg || 1;

  const handleAddToCart = () => {
    addToCart.mutate({
      product_id: product.id,
      product_name: product.name,
      product_image: product.image || "",
      shop_name: product.shop_name,
      price_per_kg: product.price_per_kg,
      quantity_kg: qty,
      buyer_email: user?.email,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
          {product.image2 && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={product.image2} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Link to={`/shop/${product.shop_id}`} className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
              <Store className="h-3.5 w-3.5" /> {product.shop_name}
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground">{product.name}</h1>
            <Badge className="mt-2 bg-primary/10 text-primary border-0">{product.category}</Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">${product.price_per_kg?.toFixed(2)}</span>
            <span className="text-muted-foreground">per kg</span>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Location</div>
              <p className="text-sm font-medium">{product.location}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="h-3.5 w-3.5" /> Available</div>
              <p className="text-sm font-medium">{product.available_kg} kg</p>
            </div>
            {product.availability_date && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Available From</div>
                <p className="text-sm font-medium">{format(new Date(product.availability_date), "MMM d, yyyy")}</p>
              </div>
            )}
            {product.estimated_delivery && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Delivery</div>
                <p className="text-sm font-medium">{product.estimated_delivery}</p>
              </div>
            )}
          </div>

          {isBuyer && product.status === "available" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity (kg)</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQty(Math.min(maxQty, qty + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">${(product.price_per_kg * qty).toFixed(2)}</span>
              </div>
              <Button
                className="w-full rounded-xl h-11"
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addToCart.isPending ? "Adding..." : "Add to Basket"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}