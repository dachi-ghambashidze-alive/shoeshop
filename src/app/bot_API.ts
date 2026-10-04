/**
 * Soleworks Atelier Concierge - bot_API
 * A lightweight, rule-based retail chatbot assistant.
 * Provides instant answers for sizing, terrain recommendations,
 * hiking/running/formal shoe selection, discounts, and customer care.
 */

export interface BotSuggestion {
  id: number;
  name: string;
  price: number;
  cat: string;
  badge?: string;
  img?: string;
}

export interface BotReply {
  reply: string;
  suggestions?: BotSuggestion[];
  quickReplies?: string[];
}

export interface BotProductRef {
  id: number;
  name: string;
  price: number;
  cat: string;
  badge?: string;
  img?: string;
  desc?: string;
}

export function getBotResponse(userMessage: string, catalog: BotProductRef[] = []): BotReply {
  const msg = userMessage.trim().toLowerCase();

  // Helper to find products matching keywords
  const findShoes = (keywords: string[], limit = 3): BotSuggestion[] => {
    const matches = catalog.filter((p) => {
      const text = `${p.name} ${p.cat} ${p.desc || ''}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    return matches.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      cat: p.cat,
      badge: p.badge,
      img: p.img,
    }));
  };

  // 1. Chitchat / Greetings
  if (/^(hi|hello|hey|greetings|good\s?(morning|afternoon|evening)|yo)\b/.test(msg)) {
    return {
      reply: 'Hello! I am your Soleworks Atelier Concierge. How can I assist with your footwear rotation today?',
      quickReplies: ['🥾 Hiking & Trail', '🏃 Marathon Runners', '🏷️ Discount Codes', '📏 Size Guide'],
    };
  }

  if (msg.includes('how are you') || msg.includes('how r u') || msg.includes("how's it going")) {
    return {
      reply: 'I am doing fine, thank you for asking! Ready to help you find the right fit, style, or size for any occasion.',
      quickReplies: ['I need hiking shoes', 'Show me bestsellers', 'What sizes do you carry?'],
    };
  }

  if (msg.includes('who are you') || msg.includes('what can you do')) {
    return {
      reply: 'I am the Soleworks automated atelier assistant. I can recommend silhouettes for hiking, running, work, or galas, answer sizing questions, and share exclusive discount codes!',
      quickReplies: ['Recommend hiking shoes', 'Do you have wide shoes?', 'Shipping policy'],
    };
  }

  // 2. Hiking & Outdoor Terrains
  if (msg.includes('hike') || msg.includes('hiking') || msg.includes('trail') || msg.includes('outdoor') || msg.includes('mountain')) {
    const suggestions = findShoes(['trek', 'trail', 'ridge', 'quarry', 'site boot', 'geo-form'], 3);
    return {
      reply: 'For hiking and rugged terrain, models with Vibram® multi-surface traction and reinforced waterproof uppers like the Quarry Alpine, Ridge Steel Toe, and Geo-Form X Trek are ideal.',
      suggestions,
      quickReplies: ['Are they waterproof?', 'Do you have Wide (EE)?', 'Check boot prices'],
    };
  }

  // 3. Running & Athletic
  if (msg.includes('run') || msg.includes('runner') || msg.includes('running') || msg.includes('marathon') || msg.includes('jog') || msg.includes('gym')) {
    const suggestions = findShoes(['stride', 'tempo', 'marathon', 'sprint', 'aero-stark'], 3);
    return {
      reply: 'For high-tempo workouts and marathon training, the Stride 01 and Marathon V feature supercritical responsive foam with carbon-infused stabilization plates.',
      suggestions,
      quickReplies: ['Stride 01 details', 'Compare Marathon V', 'Running shoe weights'],
    };
  }

  // 4. Work & Heavy Duty
  if (msg.includes('work') || msg.includes('duty') || msg.includes('steel toe') || msg.includes('safety') || msg.includes('construction')) {
    const suggestions = findShoes(['site boot', 'forge', 'ridge', 'haul pro'], 3);
    return {
      reply: 'Our Heavy Duty lineup is ASTM-tested, featuring puncture-resistant steel/composite toes, Goodyear welted outsoles, and oil-resistant slip lugs.',
      suggestions,
      quickReplies: ['Site Boot specs', 'Forge 6" details', 'Wide sizes'],
    };
  }

  // 5. Formal, Black Tie, & Dress Leather
  if (msg.includes('formal') || msg.includes('wedding') || msg.includes('dress') || msg.includes('gala') || msg.includes('suit') || msg.includes('oxford') || msg.includes('patent')) {
    const suggestions = findShoes(['oxford patent', 'savile row', 'monk strap', 'velvet loafer', 'derby'], 3);
    return {
      reply: 'For formal galas, weddings, and black-tie events, the Oxford Patent mirror-finish bal-oxford and Savile Row Wholecut offer unmatched elegance.',
      suggestions,
      quickReplies: ['Oxford Patent', 'Savile Row Wholecut', 'Chelsea Black'],
    };
  }

  // 6. Leather Classics & Loafers
  if (msg.includes('leather') || msg.includes('chelsea') || msg.includes('loafer') || msg.includes('brogue') || msg.includes('boot')) {
    const suggestions = findShoes(['derby', 'chelsea', 'loafer', 'brogue'], 3);
    return {
      reply: 'Our Artisan Leather collection is crafted in Guimarães, Portugal using vegetable-tanned French calfskin and Dainite studded rubber outsoles.',
      suggestions,
      quickReplies: ['Chelsea Black', 'Derby Tan', 'Loafer Brown'],
    };
  }

  // 7. Everyday Casual & Sneakers
  if (msg.includes('casual') || msg.includes('everyday') || msg.includes('comfort') || msg.includes('walk') || msg.includes('walking') || msg.includes('sneaker')) {
    const suggestions = findShoes(['court 70', 'walker one', 'slip-on', 'commute', 'plain sneaker'], 3);
    return {
      reply: 'For all-day daily wear, the Walker One features ergonomic rocker soles to reduce foot fatigue, while Court 70 offers timeless minimalist court style.',
      suggestions,
      quickReplies: ['Court 70', 'Walker One', 'Slip-On Easy'],
    };
  }

  // 8. Discounts & Promos
  if (msg.includes('discount') || msg.includes('coupon') || msg.includes('promo') || msg.includes('code') || msg.includes('sale') || msg.includes('voucher') || msg.includes('deal')) {
    return {
      reply: 'You can use promo code COOKED20 at checkout for an instant 20% discount on your entire order! Code SOLE10 also takes $10 off.',
      quickReplies: ['Use COOKED20 in Bag', 'Free shipping threshold', 'Show on-sale shoes'],
    };
  }

  // 9. Sizing & Widths
  if (msg.includes('size') || msg.includes('width') || msg.includes('fit') || msg.includes('chart') || msg.includes('small') || msg.includes('big') || msg.includes('wide')) {
    return {
      reply: 'All Soleworks shoes are crafted true-to-size. We offer sizes EU 38 through 46 (US 5.5 to 13) in three width profiles: Standard (D), Wide (EE), and Extra Wide (4E).',
      quickReplies: ['How to measure size?', 'Do you have Wide EE?', 'Free size swaps'],
    };
  }

  // 10. Shipping & Delivery
  if (msg.includes('shipping') || msg.includes('delivery') || msg.includes('track') || msg.includes('return') || msg.includes('trial')) {
    return {
      reply: 'We offer carbon-neutral priority courier shipping. Orders over $150 qualify for FREE Express Courier delivery! Every order includes a 30-day risk-free home trial.',
      quickReplies: ['Return policy', 'Express courier time', 'Track an order'],
    };
  }

  // 11. Fallback / Default
  return {
    reply: "I'd be glad to help you find the best footwear! Are you searching for hiking boots, marathon runners, everyday sneakers, or formal dress shoes?",
    suggestions: catalog.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      cat: p.cat,
      badge: p.badge,
      img: p.img,
    })),
    quickReplies: ['🥾 Hiking Shoes', '🏃 Running Shoes', '👞 Artisan Leather', '🏷️ Discount Codes'],
  };
}
