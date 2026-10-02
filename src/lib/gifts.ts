// E-gift cards an owner can add to a thank-you letter.

export const GIFT_BRANDS: { key: string; name: string; how: string }[] = [
  { key: 'amazon', name: 'Amazon gift card', how: 'Enter the code at amazon.co.jp → Gift cards → Redeem.' },
  { key: 'quo', name: 'QUO Card Pay', how: 'Open the code link on your phone and show the barcode at the shop.' },
  { key: 'starbucks', name: 'Starbucks eGift', how: 'Show the code at the counter.' },
];
export const GIFT_AMOUNTS = [500, 1000, 3000, 5000];

export const CARD_DESIGNS = ['classic', 'sakura', 'sunny', 'mint'] as const;
export type CardDesign = (typeof CARD_DESIGNS)[number];
