































































export const products = [
{
  id: "p1",
  brand: "Hatkhola",
  name: "Pure Ghee",
  type: "Ghee",
  variants: [
  { id: "p1v1", name: "250g", sku: "HK-GH-250", costPrice: 380, sellingPrice: 520, stock: 42 },
  { id: "p1v2", name: "500g", sku: "HK-GH-500", costPrice: 720, sellingPrice: 980, stock: 18 },
  { id: "p1v3", name: "1kg", sku: "HK-GH-1K", costPrice: 1380, sellingPrice: 1850, stock: 5 }]

},
{
  id: "p2",
  brand: "Hatkhola",
  name: "Raw Honey",
  type: "Honey",
  variants: [
  { id: "p2v1", name: "250g", sku: "HK-HN-250", costPrice: 250, sellingPrice: 360, stock: 60 },
  { id: "p2v2", name: "500g", sku: "HK-HN-500", costPrice: 470, sellingPrice: 680, stock: 24 },
  { id: "p2v3", name: "1kg", sku: "HK-HN-1K", costPrice: 900, sellingPrice: 1280, stock: 0 }]

},
{
  id: "p3",
  brand: "Hatkhola",
  name: "Mustard Oil",
  type: "Oil",
  variants: [
  { id: "p3v1", name: "500ml", sku: "HK-MO-500", costPrice: 240, sellingPrice: 320, stock: 38 },
  { id: "p3v2", name: "1L", sku: "HK-MO-1L", costPrice: 460, sellingPrice: 620, stock: 12 }]

},
{
  id: "p4",
  brand: "Lakum",
  name: "Rose Attar",
  type: "Attar",
  variants: [
  { id: "p4v1", name: "3ml", sku: "LK-RS-3", costPrice: 180, sellingPrice: 320, stock: 70 },
  { id: "p4v2", name: "6ml", sku: "LK-RS-6", costPrice: 340, sellingPrice: 580, stock: 35 },
  { id: "p4v3", name: "12ml", sku: "LK-RS-12", costPrice: 640, sellingPrice: 1080, stock: 8 }]

},
{
  id: "p5",
  brand: "Lakum",
  name: "Oud Attar",
  type: "Attar",
  variants: [
  { id: "p5v1", name: "3ml", sku: "LK-OD-3", costPrice: 320, sellingPrice: 580, stock: 22 },
  { id: "p5v2", name: "6ml", sku: "LK-OD-6", costPrice: 600, sellingPrice: 1080, stock: 9 }]

},
{
  id: "p6",
  brand: "Lakum",
  name: "Musk Attar",
  type: "Attar",
  variants: [
  { id: "p6v1", name: "3ml", sku: "LK-MK-3", costPrice: 200, sellingPrice: 360, stock: 4 },
  { id: "p6v2", name: "6ml", sku: "LK-MK-6", costPrice: 380, sellingPrice: 660, stock: 14 }]

}];


export const customers = [
{ id: "c1", name: "Rahim Uddin", phone: "01711-220011", address: "Dhanmondi, Dhaka", type: "Retail", totalPurchases: 12400, due: 0 },
{ id: "c2", name: "Karim Stores", phone: "01811-330022", address: "Mirpur, Dhaka", type: "Wholesale", totalPurchases: 84200, due: 4500 },
{ id: "c3", name: "Sumi Akter", phone: "01911-440033", address: "Uttara, Dhaka", type: "Retail", totalPurchases: 3200, due: 0 },
{ id: "c4", name: "Nadia Trading", phone: "01611-550044", address: "Chattogram", type: "Wholesale", totalPurchases: 156000, due: 12000 },
{ id: "c5", name: "Hasan Mahmud", phone: "01511-660055", address: "Sylhet", type: "Retail", totalPurchases: 2100, due: 800 }];


const today = new Date();
const d = (offset) => {
  const x = new Date(today);
  x.setDate(x.getDate() - offset);
  return x.toISOString().slice(0, 10);
};

export const expenses = [
{ id: "e1", date: d(0), item: "Bottle Purchase", amount: 1200, brand: "Hatkhola", paymentMethod: "Cash" },
{ id: "e2", date: d(0), item: "Delivery Charge", amount: 350, brand: "Lakum", paymentMethod: "bKash" },
{ id: "e3", date: d(1), item: "Bottle Cap", amount: 480, brand: "Hatkhola", paymentMethod: "Cash" },
{ id: "e4", date: d(1), item: "Marketing Boost", amount: 2500, brand: "Lakum", paymentMethod: "Card" },
{ id: "e5", date: d(2), item: "Bottle Label", amount: 700, brand: "Hatkhola", paymentMethod: "Cash" },
{ id: "e6", date: d(3), item: "Office Rent", amount: 8000, brand: "General", paymentMethod: "Bank" },
{ id: "e7", date: d(4), item: "Raw Honey Stock", amount: 14500, brand: "Hatkhola", paymentMethod: "Bank" },
{ id: "e8", date: d(5), item: "Attar Base Oil", amount: 6200, brand: "Lakum", paymentMethod: "Cash" }];


export const invoices = [
{
  id: "i1", number: "INV-1042", date: d(0), customerId: "c1", customerName: "Rahim Uddin",
  items: [{ productId: "p1", variantId: "p1v2", productName: "Pure Ghee", variantName: "500g", qty: 2, price: 980 }],
  subtotal: 1960, discount: 60, delivery: 80, total: 1980, paid: 1980, due: 0, paymentMethod: "Cash", status: "Paid"
},
{
  id: "i2", number: "INV-1043", date: d(0), customerId: "c2", customerName: "Karim Stores",
  items: [{ productId: "p4", variantId: "p4v2", productName: "Rose Attar", variantName: "6ml", qty: 10, price: 580 }],
  subtotal: 5800, discount: 300, delivery: 0, total: 5500, paid: 3000, due: 2500, paymentMethod: "bKash", status: "Partial"
},
{
  id: "i3", number: "INV-1044", date: d(1), customerId: "c3", customerName: "Sumi Akter",
  items: [{ productId: "p2", variantId: "p2v1", productName: "Raw Honey", variantName: "250g", qty: 3, price: 360 }],
  subtotal: 1080, discount: 0, delivery: 60, total: 1140, paid: 1140, due: 0, paymentMethod: "Cash", status: "Paid"
},
{
  id: "i4", number: "INV-1045", date: d(2), customerId: "c4", customerName: "Nadia Trading",
  items: [{ productId: "p5", variantId: "p5v2", productName: "Oud Attar", variantName: "6ml", qty: 8, price: 1080 }],
  subtotal: 8640, discount: 640, delivery: 0, total: 8000, paid: 8000, due: 0, paymentMethod: "Bank", status: "Paid"
},
{
  id: "i5", number: "INV-1046", date: d(3), customerId: "c5", customerName: "Hasan Mahmud",
  items: [{ productId: "p3", variantId: "p3v2", productName: "Mustard Oil", variantName: "1L", qty: 2, price: 620 }],
  subtotal: 1240, discount: 0, delivery: 100, total: 1340, paid: 540, due: 800, paymentMethod: "Cash", status: "Partial"
}];


export const salesTrend = Array.from({ length: 14 }).map((_, i) => ({
  date: d(13 - i).slice(5),
  sales: 4000 + Math.round(Math.sin(i / 2) * 1800 + Math.random() * 2400 + i * 220),
  profit: 1200 + Math.round(Math.cos(i / 2) * 600 + Math.random() * 900 + i * 80)
}));

export const topProducts = [
{ name: "Rose Attar 6ml", sold: 84 },
{ name: "Pure Ghee 500g", sold: 62 },
{ name: "Raw Honey 250g", sold: 58 },
{ name: "Oud Attar 6ml", sold: 41 },
{ name: "Mustard Oil 1L", sold: 33 }];


export const fmt = (n) => {
  const value = Number(n ?? 0);
  return "৳" + value.toLocaleString("en-BD", { maximumFractionDigits: 0 });
};
