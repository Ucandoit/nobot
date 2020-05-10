export interface AuctionCard {
  tradeBuyId: string;
  cardBuyId: string;
  rarity: string;
  star: number;
  name: string;
  illust: string | undefined;
  price: number;
  currentNP: number;
  requestParams: string;
}
