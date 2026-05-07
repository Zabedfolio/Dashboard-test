export const products = [];
export const customers = [];
export const expenses = [];
export const invoices = [];
export const salesTrend = [];
export const topProducts = [];

export const fmt = (n) => {
  const value = Number(n ?? 0);
  return "৳" + value.toLocaleString("en-BD", { maximumFractionDigits: 0 });
};
