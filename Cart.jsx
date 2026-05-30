import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const EMPTY_IMG = "https://media.base44.com/images/public/6a1adc60daf80c817c60553f/742ee18bd_generated_image.png";

export default function Cart() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart", user?.email],
    queryFn: () => base44.entities.CartItem.filter({ buyer_email: user?.email }),
    enabled: !!user?.email,
  });

  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.CartItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CartItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  // Group by shop
  const byShop = {};
  cartItems.forEach((item) => {
    const key = item.shop_name || "Unknown";
    if (!byShop[key]) byShop[key] = [];
    byShop[key].push(item);
  });

  const total = cartItems.reduce((s, i) => s + (i.price_per_kg * i.quantity_kg), 0);

  const placeOrders = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    setPlacing(true);
    // Create one order per shop
    const productIds = [...new Set(cartItems.map(i => i.product_id))];
    const products = [];
    for (const pid of productIds) {
      const p = await base44.entities.Product.get(pid);
      products.push(p);
    }

    for (const [shopName, items] of Object.entries(byShop)) {
      const shopProduct = products.find(p => p.shop_name === shopName);
      await base44.entities.Order.create({
        buyer_email: user.email,
        buyer_name: user.full_name || user.email,
        farmer_email: shopProduct?.farmer_email || "",
        shop_name: shopName,
        shop_id: shopProduct?.shop_id || "",
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          price_per_kg: i.price_per_kg,
          quantity_kg: i.quantity_kg,
          subtotal: i.price_per_kg * i.quantity_kg,
        })),
        total_amount: items.reduce((s, i) => s + (i.price_per_kg * i.quantity_kg), 0),
        delivery_address: address,
        notes: notes,
        status: "pending",
      });
    }

    // Clear cart
    for (const item of cartItems) {
      await base44.entities.CartItem.delete(item.id);
    }

    queryClient.invalidateQueries({ queryKey: ["cart"] });
    setPlacing(false);
    toast.success("Order placed! Your farmer will prepare your harvest.");
    navigate("/orders");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <img src={EMPTY_IMG} alt="Empty basket" className="h-48 mx-auto rounded-2xl object-cover opacity-80" />
        <h2 className="font-display text-2xl font-semibold">Your basket is empty</h2>
        <p className="text-muted-foreground">Explore what's growing nearby and fill your basket.</p>
        <Button onClick={() => navigate("/")} className="rounded-xl">
          Browse Marketplace <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Your Basket</h1>

      <div className="space-y-6">
        {Object.entries(byShop).map(([shopName, items]) => (
          <div key={shopName} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted/50 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">From: {shopName}</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">${item.price_per_kg?.toFixed(2)}/kg</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => {
                      if (item.quantity_kg > 1) updateItem.mutate({ id: item.id, data: { quantity_kg: item.quantity_kg - 1 } });
                    }}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity_kg}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => {
                      updateItem.mutate({ id: item.id, data: { quantity_kg: item.quantity_kg + 1 } });
                    }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-sm w-20 text-right">${(item.price_per_kg * item.quantity_kg).toFixed(2)}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Delivery Address *</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your delivery address" className="rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." className="rounded-xl" rows={2} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
          <Button className="w-full rounded-xl h-12 text-base" onClick={placeOrders} disabled={placing}>
            {placing ? "Placing order..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}