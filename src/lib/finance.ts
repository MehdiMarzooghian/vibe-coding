export interface StockState {
  quantity: number;
  averageCost: number;
}

export function applyPurchase(
  stock: StockState,
  purchasedQuantity: number,
  unitCost: number,
): StockState {
  if (purchasedQuantity <= 0 || unitCost < 0) throw new Error("مقدار یا قیمت خرید نامعتبر است");
  const quantity = stock.quantity + purchasedQuantity;
  const value = stock.quantity * stock.averageCost + purchasedQuantity * unitCost;
  return { quantity, averageCost: quantity === 0 ? 0 : value / quantity };
}

export function applySale(stock: StockState, soldQuantity: number): StockState & { costOfGoods: number } {
  if (soldQuantity <= 0 || soldQuantity > stock.quantity) throw new Error("موجودی کافی نیست");
  return {
    quantity: stock.quantity - soldQuantity,
    averageCost: stock.averageCost,
    costOfGoods: soldQuantity * stock.averageCost,
  };
}

export function applySaleReturn(
  stock: StockState,
  returnedQuantity: number,
  capturedUnitCost: number,
): StockState {
  return applyPurchase(stock, returnedQuantity, capturedUnitCost);
}

export function applyPurchaseReturn(
  stock: StockState,
  returnedQuantity: number,
  originalUnitCost: number,
): StockState {
  if (returnedQuantity <= 0 || returnedQuantity > stock.quantity) throw new Error("موجودی قابل مرجوعی کافی نیست");
  const quantity = stock.quantity - returnedQuantity;
  const value = stock.quantity * stock.averageCost - returnedQuantity * originalUnitCost;
  return { quantity, averageCost: quantity === 0 ? 0 : Math.max(0, value / quantity) };
}

export function calculateProfit(netSales: number, costOfGoods: number, expenses = 0) {
  const grossProfit = netSales - costOfGoods;
  return { grossProfit, netProfit: grossProfit - expenses };
}

export function convertToBase(quantity: number, factor: number): number {
  if (quantity <= 0 || factor <= 0) throw new Error("مقدار یا ضریب واحد نامعتبر است");
  return quantity * factor;
}

export function outstanding(total: number, paid: number): number {
  if (total < 0 || paid < 0) throw new Error("مبلغ نامعتبر است");
  return Math.max(0, total - paid);
}
