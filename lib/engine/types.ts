export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export interface Order {
  id: string;
  userId: string;
  creatorId: string;
  side: OrderSide;
  type: OrderType;
  price: number | null; // null for MARKET orders
  quantity: number;
  remainingQuantity: number;
  isCreatorAction: boolean;
  createdAt: number;
  isCancelled?: boolean; // Lazy tombstone for O(1) cancellation
}

export interface Trade {
  id: string;
  creatorId: string;
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
  executedAt: number;
  buyerId: string;
  sellerId: string;
}
