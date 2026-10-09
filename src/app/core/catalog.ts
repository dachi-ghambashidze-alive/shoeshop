import { colorFamily } from './colors';
import { Badge, Category, Colorway, Product, Silhouette } from './models';

/**
 * Product catalogue.
 *  - the 36 hand-written "atelier" products keep their original ids (1-36);
 *  - the rest are generated deterministically from model families, so the catalogue is identical on every
 *    load, nothing has to be persisted, and tests are stable.
 */

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const between = (rng: Rng, min: number, max: number): number => min + rng() * (max - min);
const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

function pickMany<T>(rng: Rng, list: readonly T[], count: number): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------------------------

const TAG_RULES: ReadonlyArray<readonly [string, RegExp]> = [
  ['waterproof', /waterproof|gore-tex|hydro|weatherproof|storm welt|rainproof/i],
  ['steel toe', /steel/i],
  ['composite toe', /composite/i],
  ['carbon plate', /carbon/i],
  ['recycled', /recycled|ocean|algae|organic|hemp|bio-based/i],
  ['suede', /suede|nubuck/i],
  ['canvas', /canvas/i],
  ['knit', /knit|mesh/i],
  ['leather', /leather|calf|horween|cordovan/i],
  ['patent', /patent/i],
  ['velvet', /velvet/i],
  ['vibram', /vibram/i],
  ['goodyear welt', /goodyear|welt/i],
  ['slip resistant', /slip[- ]resistant|sip-tread|grips/i],
  ['insulated', /insulat|thermal|merino/i],
  ['lightweight', /lightweight|featherlight|ultralight|featherweight/i],
  ['cushioned', /cushion|foam|plush/i],
  ['arch support', /arch|orthotic|rocker|podiatrist/i],
];

const SIL_TAGS: Record<Silhouette, string[]> = {
  runner: ['sneaker', 'trainer', 'running'],
  court: ['sneaker', 'trainer'],
  hightop: ['sneaker', 'high-top'],
  boot: ['boot'],
  chelsea: ['boot', 'ankle boot'],
  derby: ['dress shoe', 'lace-up'],
  loafer: ['loafer', 'slip-on'],
  pump: ['heel', 'pump'],
  sandal: ['sandal', 'summer'],
};

export function deriveTags(p: Pick<Product, 'name' | 'desc' | 'specs' | 'sil'>): string[] {
  const text = `${p.name} ${p.desc} ${p.specs.upper} ${p.specs.outsole}`;
  const tags = TAG_RULES.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag);
  return [...new Set([...SIL_TAGS[p.sil], ...tags])];
}

/** Fill in the derived fields so hand-made products (admin form) behave like catalogue ones. */
export function decorate(p: Omit<Product, 'families' | 'tags'>): Product {
  return {
    ...p,
    families: [...new Set(p.colorways.map((c) => colorFamily(c.hex)))],
    tags: deriveTags(p),
  };
}

// ---------------------------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------------------------

const COLORS: Record<string, string> = {
  'Onyx Black': '#1b1b1d', Graphite: '#3a3d42', 'Slate Grey': '#6d737b', 'Cloud Grey': '#c9c9c6',
  'Bone White': '#f0ede6', Stone: '#cfc7b8', Sand: '#d9c9a8', Oat: '#d8cdb8',
  Espresso: '#3a2d22', Walnut: '#4a3223', Chestnut: '#6e4527', Cognac: '#9a5b2a',
  Saddle: '#8a6a3b', Tobacco: '#7a5230', Caramel: '#b07a45', Mocha: '#5b4334',
  Crimson: '#b3262e', Oxblood: '#5b1f24', Burgundy: '#6d1d34', Brick: '#a0452f', Rust: '#b5532a',
  Navy: '#1f2f4f', Cobalt: '#2a52a0', 'Ink Blue': '#1c2a44', Sky: '#7fb0d6', Teal: '#2a7d80', Petrol: '#24505c',
  Forest: '#2f5a42', Olive: '#5b6038', Moss: '#6f8a4e', Sage: '#9caf88', Pine: '#1f4034',
  'Signal Orange': '#ee5a24', Volt: '#c8e03a', Sunflower: '#e8b923', Coral: '#ef6f61', Magenta: '#c2347a',
  Violet: '#5d4a9a', Aqua: '#38b6c4', Lilac: '#b7a4d6', Rose: '#d98aa0', Blush: '#e8c4c0',
  Gold: '#c9a24b', Silver: '#b8bcc2',
};

// ---------------------------------------------------------------------------------------------
// Hand-written atelier range (ids 1-36, same order and ids as the original storefront)
// ---------------------------------------------------------------------------------------------

// name, price, was, badge, rating, reviews, silhouette, variant, description, upper, outsole, weight, drop, colorways
type Curated = [string, number, number, Badge | '', number, number, Silhouette, 0 | 1, string, string, string, string, string, string];

const CURATED: ReadonlyArray<readonly [Category, readonly Curated[]]> = [
  ['Sport / Runner', [
    ['Stride 01', 120, 145, 'Bestseller', 4.9, 142, 'runner', 0, 'High-propulsion daily runner engineered with responsive supercritical foam and carbon stability wings.', 'Breathable Engineered Monomesh', 'Vibram® SpeedGrip Rubber', '215g (Size 42)', '8mm', 'Ember Crimson=d9531e|Stealth Onyx=1b1b1b|Polar White=f0ede6'],
    ['Tempo Run', 135, 0, 'New Drop', 4.8, 86, 'runner', 0, 'Tuned tempo trainer delivering ultra-plush transitions and energy return for marathon pace workouts.', 'Zero-Seam Knit Collar', 'Dual-Compound High Abrasion', '228g', '6mm', 'Deep Cobalt=1f4e79|Ice Teal=2a9d8f|Charcoal=2b2d42'],
    ['Sprint Lite', 110, 0, 'Staff Pick', 4.7, 54, 'runner', 0, 'Minimalist featherweight sprint flat with lockdown midfoot cage for track intervals and 5K racing.', 'Ultralight Ripstop Mesh', 'Pebax Plate Forefoot Lugs', '185g', '4mm', 'Onyx Black=222222|Electric Lime=b5e7a0|Pure Chalk=ffffff'],
    ['Marathon V', 150, 180, 'Sale', 4.9, 210, 'runner', 0, 'Full-length carbon composite plate shoe designed for maximum mechanical efficiency across 42 kilometers.', 'Hydrophobic Matrix Fiber', 'Continental™ Wet Traction', '205g', '8mm', 'Forest Pace=5f7f2a|Solar Crimson=c0392b|Monochrome Silver=bdc3c7'],
    ['Track Pace', 125, 0, 'Eco-Crafted', 4.6, 41, 'runner', 0, 'Sustainable track trainer constructed with 80% recycled post-consumer ocean yarns and algae-based EVA foam.', 'OceanCycle Recycled Knit', 'Bloom Algae Rubber Compound', '235g', '7mm', 'Cement Grey=8a8a85|Glacier Blue=4682b4|Sand Camo=c2b280'],
    ['Aero-Stark Carbon', 195, 0, 'Limited', 5.0, 97, 'runner', 0, 'Our pinnacle technological runner with sculpted aerospace geometry and dual pressurized air capsules.', '3D Woven FormKnit Matrix', 'Laser-Cut Aerodynamic Lug Grid', '198g', '9mm', 'Jet Carbon=111111|Hyper Orange=ff5722|Titanium White=fafafa'],
  ]],
  ['Heavy Duty', [
    ['Site Boot', 165, 0, 'Bestseller', 4.9, 312, 'boot', 0, 'Waterproof 8-inch field boot made with oil-tanned crazy horse cowhide leather and puncture-resistant midsole.', 'Full-Grain 2.2mm Waterproof Leather', 'Oil & Acid Resistant Vibram Lug', '680g', '12mm', 'Saddle Tan=8a6a3b|Dark Walnut=3d2b1f|Matte Black=1c1b1a'],
    ['Forge 6"', 185, 0, 'Staff Pick', 4.8, 140, 'boot', 0, 'Industrial composite-toe safety boot tested to withstand 2,500 lbs of compression with thermal barrier insulation.', 'Ballistic Nubuck & Rubberized Toe Cap', 'Heat-Resistant Rubber (up to 300°C)', '710g', '10mm', 'Iron Black=2b2b2b|Charcoal Grey=4a4a4a|Oxblood Burnish=581845'],
    ['Ridge Steel Toe', 199, 0, 'Limited', 4.9, 98, 'boot', 0, 'Goodyear welted heavy workhorse featuring ASTM-rated steel safety toe and dual-density anti-fatigue footbeds.', 'Horween Chromexcel Oiled Leather', 'Storm-Welted Lug Tread', '740g', '12mm', 'Bark Brown=6b4a2a|Raw Ochre=b37d4e|Pitch Black=141414'],
    ['Haul Pro', 175, 0, 'New Drop', 4.7, 62, 'boot', 0, 'Engineered for warehouse logistics, delivery drivers, and long shifts on polished concrete floors.', 'Water-Repellent Ripstop Cordura', 'Sip-Tread Slip Resistant Sole', '560g', '8mm', 'Olive Drab=4a4a3f|Gunmetal=37474f|Dune Sand=d7ccc8'],
    ['Quarry', 210, 0, 'Bestseller', 5.0, 175, 'boot', 0, 'Alpine-inspired severe terrain trench boot built with triple-stitched Norwegian welt and padded bellows tongue.', 'Waxed Roughout Reverse Leather', 'Vibram Commando Mountaineering Sole', '790g', '14mm', 'Espresso=3a2d22|Bourbon Bronze=7a4e28|Midnight=111111'],
    ['Geo-Form X Trek', 220, 0, 'Staff Pick', 4.8, 83, 'boot', 1, 'Tactical all-weather boot featuring GORE-TEX waterproof breathable membrane and molded heel lock chassis.', 'Waterproof Hydroguard Nubuck', 'Multi-directional Chevron Lug System', '640g', '10mm', 'Stealth Black=222222|Coyote Tan=81613e|Ranger Moss=3d4f3b'],
  ]],
  ['Classic', [
    ['Court 70', 85, 105, 'Bestseller', 4.9, 420, 'court', 0, 'Timeless 70s tennis court silhouette hand-assembled from Italian nappa calf leather and natural rubber cupsole.', 'Full-Grain White Nappa Calf', 'Stitched Natural Gum Cupsole', '330g', '6mm', 'Vintage Chalk=e8e6df|Forest Green=264633|Collegiate Navy=1e3050'],
    ['Lowtop Canvas', 65, 0, 'Eco-Crafted', 4.6, 215, 'court', 0, '14-ounce heavy organic duck canvas shoe with reinforced double-needle binding and vulcanized waffle sole.', '100% GOTS Certified Organic Canvas', 'Vulcanized Wild Rubber', '290g', '4mm', 'Indigo Blue=1f3a5f|Washed Charcoal=333333|Off-White Ecru=fdfbf7'],
    ['Hightop Original', 75, 0, 'Staff Pick', 4.8, 180, 'hightop', 0, 'Ankle-hugging retro basketball shoe with padded collar, brass eyelets, and heritage vulcanized toe cap.', 'Heavyweight Canvas & Suede Piping', 'Textured Gum Bumper Tread', '360g', '5mm', 'Crimson Wine=a3262a|Black Shadow=191919|Natural Parchment=eee9e0'],
    ['Plain Sneaker', 80, 0, 'New Drop', 4.7, 110, 'court', 0, 'Pure minimalist sneaker devoid of branding for effortlessly pairing with tailored trousers or denim.', 'Smooth Micro-Grain Leather', 'Monochrome Lightweight Foam Sole', '310g', '6mm', 'Clean White=f1f1ee|Warm Taupe=b0a89d|Muted Slate=5c6b73'],
    ['Varsity', 90, 0, 'Limited', 4.8, 73, 'court', 0, 'Ivy League athletic trainer featuring perforated leather quarter panels and contrast suede mudguard overlays.', 'Perforated Cowhide & Split Suede', 'Arch-Supporting Ortho Cupsole', '340g', '7mm', 'Oxford Pine=2f5d46|Harvard Burgundy=6b1724|Yale Blue=183b5e'],
    ['Void Runner 85', 180, 0, 'Staff Pick', 4.9, 135, 'runner', 0, 'Archival 1985 running architecture rebuilt with luxurious hairy suede overlays and raw-edge foam tongue.', 'Italian Hairy Suede & Ballistic Nylon', 'Dual-Layer Vintage Aged Midsole', '320g', '8mm', 'Void Black=333333|Aged Cream=f2eee5|Silver Mist=a6a8a9'],
  ]],
  ['Leather', [
    ['Derby Tan', 210, 0, 'Bestseller', 4.9, 260, 'derby', 0, 'Hand-burnished open-lacing Derby crafted from vegetable-tanned Tuscan calfskin with stacked leather heel.', 'Full-Grain French Calfskin', 'Oak-Bark Tanned Leather with Brass Tacks', '450g', '15mm', 'Cognac Tan=9a6b3c|Dark Bourbon=4e2a14|Vintage Chestnut=773f1a'],
    ['Chelsea Black', 240, 0, 'Bestseller', 5.0, 388, 'chelsea', 0, 'Seamless wholecut Chelsea boot with high-recovery elastic side webbing and woven grosgrain pull loops.', 'Aniline Dyed Black Calfskin', 'Goodyear Welted Dainite Rubber Studded Sole', '510g', '18mm', 'Pitch Black=161616|Antique Walnut=382218|Bordeaux Glaze=42141e'],
    ['Loafer Brown', 195, 0, 'Staff Pick', 4.8, 154, 'loafer', 0, 'Classic beefroll penny loafer hand-sewn on the last using traditional moccasin lockstitch construction.', 'Horween Chromexcel Pull-Up Leather', 'Flexible Water-Lock Leather Sole', '420g', '12mm', 'Roast Coffee=5a3a22|Caramel Glaze=8a532d|Jet Noir=181818'],
    ['Brogue Oxblood', 260, 0, 'Limited', 4.9, 122, 'derby', 1, 'Full English wingtip brogue with intricate medallion toe punching and storm welt for moisture resistance.', 'Museum Calfskin with Cloud Marbling', 'Double Leather Sole with Bevelled Waist', '490g', '16mm', 'Deep Oxblood=5b1f24|Vintage Mahogany=3f1a1d|Black Mirror=121212'],
    ['Chukka Suede', 180, 0, 'New Drop', 4.7, 89, 'chelsea', 0, 'Two-eyelet desert chukka boot fashioned from soft water-resistant suede paired with natural plantation crepe.', 'Charles F. Stead Repello Suede', 'Unvulcanized Natural Plantation Crepe', '410g', '10mm', 'Snuff Tobacco=8c7556|Slate Grey=5d6468|Midnight Blue=1c2833'],
    ['Artisan Monkstrap', 265, 0, 'Limited', 4.9, 74, 'derby', 0, 'Chiseled single monk strap shoe with solid antiqued brass roller buckle and hand-painted fiddleback waist.', 'Crust Calfskin Hand-Patinated in Atelier', 'Single Oak Tanned Leather Sole', '460g', '15mm', 'Bourbon Amber=4a2b1b|Obsidian Jet=111111|Museum Plum=381628'],
  ]],
  ['Everyday', [
    ['Walker One', 70, 0, 'Bestseller', 4.8, 512, 'runner', 0, 'Ergonomic walking shoe designed with podiatrist-approved rocker geometry to reduce heel strike fatigue.', '4-Way Stretch Knit with Supportive TPU', 'Dual-Density CloudStride EVA', '240g', '10mm', 'Pebble Slate=7d8b8f|Charcoal Knit=2f3542|Sandstone=dfd8ca'],
    ['Slip-On Easy', 60, 0, 'Eco-Crafted', 4.7, 320, 'court', 0, 'Step-in hands-free slip-on with collapsible memory foam heel cup and antimicrobial bamboo lining.', 'Breathable Washed Linen & Hemp', 'Ultra-Flex Zero-Drop Rubber', '210g', '0mm', 'Oatmeal=b8ae9c|Olive Sage=626d58|Midnight=1e272e'],
    ['Commute', 95, 0, 'Staff Pick', 4.9, 198, 'court', 0, 'The ultimate hybrid: sharp enough for boardroom presentations, cushioned enough for a 5-mile subway commute.', 'Stain-Resistant Scotchgard Wool Blend', 'Shock-Absorbing Wedge Outsole', '295g', '8mm', 'Deep Navy=33415a|Heather Grey=57606f|Total Black=000000'],
    ['Daily Knit', 88, 0, 'New Drop', 4.6, 145, 'runner', 0, 'Featherlight sock-like fit made with zero-pressure ribbing around the ankle and springy honeycomb insole.', 'Engineered Seamless Jacquard Knit', 'Bubble Cushion Air Pod Midsole', '220g', '6mm', 'Cloud Grey=c9c5bb|Dusty Rose=bca0a0|Dark Ink=1c1e21'],
    ['Trail Town', 105, 0, 'Bestseller', 4.8, 230, 'runner', 1, 'All-terrain hybrid with water-shedding ripstop overlays and low-profile lugs that glide smoothly on pavement.', 'Reinforced Diamond Ripstop Mesh', 'Vibram CityTrail Multi-Surface Compound', '310g', '7mm', 'Forest Green=556b4d|Earth Clay=8a4b38|Shadow Granite=34495e'],
    ['Cloud Moccasin', 115, 0, 'Limited', 4.9, 88, 'loafer', 0, 'Ultra-luxurious unlined deconstructed driver moccasin with glove-soft suede and rubber pebble driving sole.', 'Silky Reverse Calf Suede', 'Grip-Pebble Injected Driving Sole', '260g', '2mm', 'Cinnamon Brown=6a5a4a|Taupe Mist=8e8477|Royal Navy=1b2a4a'],
  ]],
  ['Fancy', [
    ['Oxford Patent', 280, 0, 'Bestseller', 5.0, 310, 'derby', 0, 'Formal closed-lacing bal-oxford with high-gloss mirror patent leather for galas, black-tie, and red carpet.', 'Mirror-Finish French Patent Leather', 'Fiddleback Waist Hand-Stitched Leather', '430g', '16mm', 'Mirror Black=0e0e0e|Midnight Gala=121927|Bordeaux Patent=380e15'],
    ['Monk Strap', 265, 0, 'Staff Pick', 4.9, 165, 'derby', 0, 'Double monk strap shoe with hand-beveled edges, solid gold-tone hardware, and sculpted arch contours.', 'Museum Marbled Calfskin', 'Oak-Bark Tanned Leather Channel Stitch', '470g', '15mm', 'Cognac Glaze=4a2b1b|Gloss Obsidian=141414|Mahogany Cordovan=42161b'],
    ['Velvet Loafer', 230, 0, 'Limited', 4.9, 140, 'loafer', 0, 'Venetian smoking slipper hand-tailored from deep pile Italian cotton velvet with quilted ruby silk lining.', 'Deep Pile Royal Cotton Velvet', 'Buffed Suede Indoor/Outdoor Dress Sole', '360g', '12mm', 'Royal Sapphire=2d2a52|Midnight Onyx=121212|Emerald Velvet=123524'],
    ['Heeled Pump', 220, 0, 'New Drop', 4.8, 95, 'pump', 0, 'Timeless 75mm sculpted stiletto pump engineered with patented metatarsal shock pods for all-evening elegance.', 'Italian Glove Suede Leather', 'Non-Slip Coated Leather Sole', '240g', '75mm heel', 'Ruby Merlot=8b1e3f|Nude Almond=d2b48c|Classic Black=0f0f0f'],
    ['Evening Slipper', 200, 0, 'Eco-Crafted', 4.7, 78, 'loafer', 0, 'Grosgrain-trimmed opera slipper with quilted diamond insole and supple chrome-free leather upper.', 'Satin & Fine Nap Calfskin', 'Flexible Leather Dance-Floor Sole', '310g', '10mm', 'Tuxedo Black=1a1a1a|Burgundy Velvet=4a1525|Gold Champagne=d4af37'],
    ['Savile Row Wholecut', 315, 0, 'Staff Pick', 5.0, 118, 'derby', 0, 'The highest expression of footwear: sculpted from a single seamless piece of full-grain flawless leather.', 'Seamless Single-Piece French Calfskin', 'Hand-Welted Oak Bark Sole with Brass Tacks', '450g', '16mm', 'Piano Black=1c1b1a|Antiqued Bourbon=543019|Imperial Cordovan=3d1620'],
  ]],
];

function parseColorways(raw: string): Colorway[] {
  return raw.split('|').map((entry) => {
    const [name, hex] = entry.split('=');
    return { name, hex: `#${hex}` };
  });
}

// ---------------------------------------------------------------------------------------------
// Generated model families
// ---------------------------------------------------------------------------------------------

interface Family {
  cat: Category;
  count: number;
  /** Cycled through, so repeats here control the mix of silhouettes. */
  sils: ReadonlyArray<readonly [Silhouette, 0 | 1]>;
  name: (sil: Silhouette, variant: 0 | 1, rng: Rng) => string;
  price: readonly [number, number];
  palette: readonly string[];
  drops: readonly string[];
  uppers: readonly string[];
  outsoles: readonly string[];
  leads: readonly string[];
  features: readonly string[];
}

const words = (text: string): string[] => text.split(/\s*,\s*/);

const FAMILIES: readonly Family[] = [
  {
    cat: 'Sport / Runner', count: 26, sils: [['runner', 0]],
    name: (_s, _v, r) => `${pick(r, words('Stride,Tempo,Sprint,Marathon,Pace,Aero,Surge,Flux,Apex,Velo,Kestrel,Cadence,Strata,Lumen,Pulse,Vector,Rally,Dash'))} ${pick(r, words('02,03,Pro,Lite,Elite,GT,Carbon,Speed,Flex,Max'))}`,
    price: [90, 210],
    palette: words('Signal Orange,Cobalt,Volt,Onyx Black,Bone White,Coral,Teal,Magenta,Graphite,Sky,Violet,Sunflower,Crimson,Aqua'),
    drops: ['4mm', '6mm', '8mm', '10mm'],
    uppers: ['Breathable Engineered Mesh', 'Seamless Jacquard Knit', 'Ultralight Ripstop Mesh', 'Recycled Monomesh', 'Zero-Seam Stretch Knit'],
    outsoles: ['Vibram® SpeedGrip Rubber', 'Dual-Compound Road Rubber', 'Continental™ Wet Traction', 'Blown Rubber Lug Grid', 'Carbon-Infused Forefoot Plate'],
    leads: [
      'Daily trainer built around a responsive foam midsole.',
      'Race-day shoe with a snappy, stable platform.',
      'Versatile road runner for everything from easy miles to tempo days.',
      'Lightweight speed shoe with a locked-in midfoot.',
      'Plush long-run cruiser with generous heel cushioning.',
      'Neutral trainer tuned for smooth, efficient transitions.',
    ],
    features: [
      'Breathable mesh keeps feet cool and the rubber outsole grips wet roads.',
      'A rocker geometry rolls you forward while the heel counter keeps your foot centred.',
      'Recycled laces and a bio-based foam lower its footprint without softening the ride.',
      'Reflective details keep you visible on early morning and evening runs.',
      'A gusseted tongue stops slipping, and the knit collar is gentle on your Achilles.',
      'Wide-base stability wings keep you balanced when the legs get tired.',
    ],
  },
  {
    cat: 'Trail & Hike', count: 28, sils: [['runner', 1], ['boot', 1], ['runner', 1], ['boot', 1], ['runner', 1]],
    name: (sil, _v, r) =>
      `${pick(r, words('Ridgeline,Summit,Granite,Alder,Cascade,Basalt,Larch,Moraine,Scree,Tundra,Fjord,Cairn,Aspen,Talus,Juniper,Kodiak,Sierra,Boreal'))} ${
        sil === 'boot' ? pick(r, words('Mid GTX,Trek WP,High,Pro Boot,Mid')) : pick(r, words('Trail,GTX Low,Speed,Pro,Ultra'))
      }`,
    price: [110, 230],
    palette: words('Olive,Moss,Rust,Petrol,Slate Grey,Sage,Saddle,Signal Orange,Forest,Graphite,Sand,Brick'),
    drops: ['4mm', '6mm', '8mm', '10mm', '12mm'],
    uppers: ['Waterproof Hydroguard Mesh', 'Abrasion-Resistant Ripstop', 'Full-Grain Waterproof Leather', 'Recycled Trail Knit', 'GORE-TEX Surround Membrane'],
    outsoles: ['Vibram® Megagrip Lug', '5mm Multi-Directional Lugs', 'Rock-Plate Trail Rubber', 'Vibram® Litebase Compound', 'Sticky Wet-Rock Rubber'],
    leads: [
      'Grippy all-terrain shoe for rocky ridgelines and muddy forest paths.',
      'Supportive hiker that carries a loaded pack all day.',
      'Fast-and-light trail shoe for technical descents.',
      'Weatherproof mid-cut built for unpredictable mountain days.',
      'Confidence-inspiring grip for scrambling and river crossings.',
    ],
    features: [
      'Aggressive 5mm lugs bite into loose gravel and wet roots.',
      'A rock plate underfoot shields you from sharp stones.',
      'A waterproof membrane with taped seams keeps socks dry through stream crossings.',
      'A reinforced toe bumper protects against kicked rocks.',
      'Gaiter hooks and a protective rand keep debris out.',
      'A cushioned midsole absorbs long descents without feeling mushy.',
    ],
  },
  {
    cat: 'Heavy Duty', count: 24, sils: [['boot', 0]],
    name: (_s, _v, r) => `${pick(r, words('Foundry,Anvil,Rivet,Girder,Bedrock,Crew,Depot,Warden,Sledge,Smelter,Gantry,Kiln,Lathe,Forklift'))} ${pick(r, words('6",8",Steel Toe,Composite,Pro,Insulated,Mid,Logger'))}`,
    price: [140, 250],
    palette: words('Saddle,Espresso,Onyx Black,Walnut,Tobacco,Olive,Graphite,Caramel,Chestnut'),
    drops: ['8mm', '10mm', '12mm', '14mm'],
    uppers: ['Full-Grain Oil-Tanned Leather', 'Ballistic Nubuck', 'Waterproof Crazy Horse Leather', 'Ripstop Cordura & Leather', 'Chromexcel Oiled Leather'],
    outsoles: ['Oil & Acid Resistant Lug', 'Goodyear Welted Rubber', 'Heat-Resistant Rubber', 'Slip-Resistant Sip-Tread', 'Vibram® Work Compound'],
    leads: [
      'Hard-working boot built for twelve-hour shifts.',
      'Rugged work boot with a welted construction that can be resoled.',
      'Safety-rated boot that protects without feeling like a brick.',
      'Site-ready boot with a reinforced toe and all-day cushioning.',
      'Heavy-duty classic made to be broken in and kept for years.',
    ],
    features: [
      'Slip-resistant lugs grip oily floors and wet scaffolding.',
      'A padded collar and removable footbed ease fatigue on concrete.',
      'The reinforced toe cap is rated for impact and compression.',
      'Water-resistant leather is treated to shrug off mud, rain and splashes.',
      'Triple-stitched seams stay together through years of abuse.',
      'An electrical-hazard rated sole adds an extra layer of protection.',
    ],
  },
  {
    cat: 'Classic', count: 26, sils: [['court', 0], ['court', 0], ['hightop', 0], ['court', 0], ['runner', 0]],
    name: (sil, _v, r) =>
      `${pick(r, words('Court,Varsity,Heritage,Campus,Baseline,Original,Gym,Terrace,Albion,Marlow,Capitol,Brooklyn'))} ${
        sil === 'hightop' ? pick(r, words('High,Hightop,Hi')) : sil === 'runner' ? pick(r, words('OG,Runner,85')) : pick(r, words('70,Canvas,Suede,Leather,Mono,Low,Retro'))
      }`,
    price: [55, 130],
    palette: words('Bone White,Navy,Crimson,Forest,Onyx Black,Sand,Slate Grey,Cobalt,Sunflower,Oat'),
    drops: ['4mm', '5mm', '6mm', '7mm'],
    uppers: ['Organic Cotton Canvas', 'Full-Grain Nappa Leather', 'Brushed Split Suede', 'Heavyweight Duck Canvas', 'Perforated Cowhide'],
    outsoles: ['Vulcanized Gum Rubber', 'Stitched Cupsole', 'Natural Rubber Waffle Sole', 'Arch-Supporting Cupsole', 'Textured Foxing Sole'],
    leads: [
      'Stripped-back court shoe with timeless proportions.',
      'Heritage-inspired sneaker with a vulcanised sole.',
      'A clean everyday sneaker that goes with almost everything.',
      'Retro silhouette rebuilt with modern comfort.',
      'Throwback trainer with premium materials and quiet details.',
    ],
    features: [
      'Cotton laces, a gum cupsole and a cushioned insole make it comfortable out of the box.',
      'A stitched toe cap and reinforced eyelets age gracefully.',
      'A padded collar and tongue keep the fit snug but never tight.',
      'Made in small batches with Italian leather and organic cotton.',
      'A contrast heel tab adds a quiet nod to the original design.',
      'It wipes clean easily and softens with wear.',
    ],
  },
  {
    cat: 'Leather', count: 28,
    sils: [['derby', 0], ['chelsea', 0], ['loafer', 0], ['derby', 1], ['chelsea', 0], ['derby', 0], ['loafer', 0]],
    name: (sil, variant, r) => {
      const surname = pick(r, words('Aldrich,Brennan,Calder,Dunmore,Ellery,Fenwick,Garrick,Hadley,Ingram,Jessop,Kendal,Linden,Marlowe,Pembroke'));
      if (sil === 'chelsea') return `${surname} ${pick(r, words('Chelsea,Chukka,Jodhpur'))}`;
      if (sil === 'loafer') return `${surname} ${pick(r, words('Loafer,Penny Loafer,Tassel Loafer'))}`;
      return `${surname} ${variant ? 'Brogue' : pick(r, words('Derby,Oxford,Monk Strap'))}`;
    },
    price: [170, 320],
    palette: words('Cognac,Espresso,Onyx Black,Oxblood,Chestnut,Walnut,Burgundy,Navy,Tobacco,Caramel,Mocha'),
    drops: ['10mm', '12mm', '15mm', '16mm', '18mm'],
    uppers: ['Full-Grain French Calfskin', 'Museum Calfskin', 'Horween Chromexcel Leather', 'Hand-Burnished Tuscan Calfskin', 'Charles F. Stead Suede'],
    outsoles: ['Oak-Bark Tanned Leather', 'Goodyear Welted Dainite Rubber', 'Leather Sole with Rubber Top Lift', 'Double Leather Sole', 'Blake-Stitched Leather Sole'],
    leads: [
      'Hand-finished in Portugal on a classic last.',
      'Goodyear-welted so it can be resoled again and again.',
      'Full-grain calfskin that develops a deep patina with wear.',
      'Clean, versatile silhouette that works from boardroom to dinner.',
      'Burnished by hand for rich depth of colour.',
      'Cut from a single hide for consistent grain and colour.',
    ],
    features: [
      'Leather-lined and cushioned with a cork footbed that moulds to your foot.',
      'A stacked leather heel with a rubber top lift keeps steps quiet.',
      'A Blake-stitched sole keeps it flexible and light.',
      'Cedar shoe trees are included in the box.',
      'A storm welt keeps water out when the weather turns.',
      'A hand-stitched apron adds quiet detail.',
    ],
  },
  {
    cat: 'Everyday', count: 28, sils: [['runner', 0], ['court', 0], ['loafer', 0], ['runner', 0], ['court', 0]],
    name: (sil, _v, r) =>
      `${pick(r, words('Walker,Commute,Daily,Stroll,Errand,Weekend,Easy,Cloud,Glide,Amble,Rove,Hop,Transit,Metro'))} ${
        sil === 'runner' ? pick(r, words('Knit,Air,Mesh,Flex,Two')) : sil === 'loafer' ? pick(r, words('Slip-On,Moccasin,Driver')) : pick(r, words('Leather,Canvas,Lite,Wool'))
      }`,
    price: [55, 130],
    palette: words('Slate Grey,Navy,Oat,Sage,Stone,Graphite,Rose,Sand,Bone White,Petrol,Blush,Cloud Grey'),
    drops: ['0mm', '4mm', '6mm', '8mm', '10mm'],
    uppers: ['4-Way Stretch Knit', 'Washed Linen & Hemp', 'Stain-Resistant Wool Blend', 'Recycled Mesh', 'Soft Pebbled Leather'],
    outsoles: ['Dual-Density CloudStride EVA', 'Ultra-Flex Rubber', 'Shock-Absorbing Wedge Outsole', 'Grip-Pebble Driving Sole', 'Bio-Based Foam Sole'],
    leads: [
      'All-day comfort in a shoe that looks as good as it feels.',
      'Easy-wearing daily shoe with a cushioned, flexible sole.',
      'Lightweight and breathable for long days on your feet.',
      'Slip-on convenience without giving up support.',
      'Smart-casual shoe that handles commutes, errands and weekends.',
    ],
    features: [
      'A memory-foam insole and rocker sole reduce fatigue on long walks.',
      'The upper is machine washable and made from recycled materials.',
      'A stretch collar and pull tab make it easy on and off.',
      'Antimicrobial lining stays fresh through busy days.',
      'A flexible outsole grips polished floors and wet pavement.',
      'A padded heel and wide toe box give your feet room to move.',
    ],
  },
  {
    cat: 'Fancy', count: 26, sils: [['derby', 0], ['loafer', 0], ['pump', 0], ['derby', 0], ['loafer', 0]],
    name: (sil, _v, r) =>
      `${pick(r, words('Gala,Soiree,Opera,Velvet,Satin,Patent,Regent,Mayfair,Belgravia,Savoy,Ritz,Aurelia,Vesper,Noir'))} ${
        sil === 'pump' ? pick(r, words('Pump,Stiletto Pump')) : sil === 'loafer' ? pick(r, words('Loafer,Slipper,Smoking Slipper')) : pick(r, words('Oxford,Monk Strap,Balmoral'))
      }`,
    price: [180, 340],
    palette: words('Onyx Black,Oxblood,Navy,Burgundy,Gold,Silver,Forest,Violet,Ink Blue,Rose,Magenta,Blush'),
    drops: ['10mm', '12mm', '15mm', '16mm'],
    uppers: ['Mirror-Finish Patent Leather', 'Deep Pile Cotton Velvet', 'Satin & Fine Nap Calfskin', 'Italian Glove Suede', 'Museum Marbled Calfskin'],
    outsoles: ['Hand-Stitched Leather Sole', 'Fiddleback Waist Leather Sole', 'Buffed Suede Dress Sole', 'Non-Slip Coated Leather Sole', 'Oak-Bark Channel-Stitched Sole'],
    leads: [
      'Evening shoe made for black-tie and special occasions.',
      'Occasion-ready pair with a glossy, elegant finish.',
      'Statement shoe that lifts any formal outfit.',
      'Dressed-up silhouette with understated glamour.',
    ],
    features: [
      'Satin lining and a cushioned insole keep you comfortable all night.',
      'A hand-polished upper catches the light on the dance floor.',
      'A slim leather sole with a hand-finished edge.',
      'Subtle hardware adds a little glamour without shouting.',
      'A padded footbed and balanced heel make long events easier.',
      'Packed in a dust bag and presentation box.',
    ],
  },
  {
    cat: 'Sandals & Slides', count: 26, sils: [['sandal', 0], ['sandal', 1]],
    name: (_s, variant, r) =>
      `${pick(r, words('Marina,Capri,Sahara,Riviera,Dune,Tide,Lagoon,Palma,Cove,Sol,Coral,Mykonos,Positano,Ibiza'))} ${
        variant ? pick(r, words('Sandal,Sport Sandal,Strap Sandal')) : pick(r, words('Slide,Sliders,Pool Slide'))
      }`,
    price: [45, 110],
    palette: words('Sand,Onyx Black,Coral,Aqua,Sky,Sunflower,Oat,Sage,Rust,Blush,Bone White,Teal'),
    drops: ['0mm', '4mm', '6mm'],
    uppers: ['Quick-Dry Webbing', 'Recycled Neoprene Straps', 'Soft Nubuck Leather', 'Moulded EVA', 'Padded Jacquard Straps'],
    outsoles: ['Contoured Cork-Latex Footbed', 'Grippy Rubber Outsole', 'Recycled EVA Midsole', 'Wet-Grip Compound', 'Ocean-Bound Plastic Foam'],
    leads: [
      'Easy summer sandal with a contoured footbed.',
      'Pool-to-street slide with a cushioned sole.',
      'Adjustable strap sandal built for walking all day.',
      'Lightweight warm-weather essential.',
    ],
    features: [
      'Quick-dry straps and a grippy rubber outsole handle wet decks and sand.',
      'A moulded cork-and-latex footbed supports your arch.',
      'Soft padded straps avoid rubbing, even without socks.',
      'Made from recycled EVA and ocean-bound plastics.',
      'Lightweight and flexible, so it packs flat in a carry-on.',
      'A contoured heel cup keeps your foot steady with every step.',
    ],
  },
];

const GRAMS: Record<Silhouette, readonly [number, number]> = {
  runner: [195, 300], court: [290, 380], hightop: [330, 420], boot: [600, 900], chelsea: [420, 560],
  derby: [400, 520], loafer: [300, 420], pump: [210, 300], sandal: [180, 320],
};

function badgeRoll(roll: number): Badge | undefined {
  if (roll < 0.12) return 'Bestseller';
  if (roll < 0.26) return 'New Drop';
  if (roll < 0.34) return 'Staff Pick';
  if (roll < 0.39) return 'Limited';
  if (roll < 0.5) return 'Sale';
  if (roll < 0.56) return 'Eco-Crafted';
  return undefined;
}

function generate(startId: number, taken: Set<string>): Product[] {
  const rng = mulberry32(2026);
  const out: Product[] = [];
  let id = startId;

  for (const family of FAMILIES) {
    for (let i = 0; i < family.count; i++) {
      const [sil, variant] = family.sils[i % family.sils.length];

      let name = family.name(sil, variant, rng);
      for (let attempt = 0; taken.has(name) && attempt < 40; attempt++) name = family.name(sil, variant, rng);
      if (taken.has(name)) name = `${name} II`;
      taken.add(name);

      const price = roundTo(between(rng, family.price[0], family.price[1]), 5);
      const badge = badgeRoll(rng());
      const colorNames = pickMany(rng, family.palette, rng() < 0.5 ? 3 : 4);
      const upper = pick(rng, family.uppers);
      const grams = roundTo(between(rng, ...GRAMS[sil]), 5);
      const drop = sil === 'pump' ? `${pick(rng, ['60', '75', '85'])}mm heel` : pick(rng, family.drops);

      out.push(
        decorate({
          id: id++,
          name,
          cat: family.cat,
          sil,
          variant,
          price,
          was: badge === 'Sale' ? roundTo(price * 1.25, 5) : undefined,
          badge,
          rating: Math.round((4.2 + rng() * 0.8) * 10) / 10,
          reviews: Math.floor(10 + rng() ** 2 * 600),
          desc: `${pick(rng, family.leads)} ${pick(rng, family.features)}`,
          specs: { upper, outsole: pick(rng, family.outsoles), weight: `${grams}g (Size 42)`, drop },
          colorways: colorNames.map((colorName) => ({ name: colorName, hex: COLORS[colorName] })),
        }),
      );
    }
  }
  return out;
}

function buildCatalog(): Product[] {
  const taken = new Set<string>();
  const curated: Product[] = [];
  let id = 1;
  for (const [cat, rows] of CURATED) {
    for (const [name, price, was, badge, rating, reviews, sil, variant, desc, upper, outsole, weight, drop, colors] of rows) {
      taken.add(name);
      curated.push(
        decorate({
          id: id++,
          name,
          cat,
          sil,
          variant,
          price,
          was: was || undefined,
          badge: badge || undefined,
          rating,
          reviews,
          desc,
          specs: { upper, outsole, weight, drop },
          colorways: parseColorways(colors),
        }),
      );
    }
  }
  return [...curated, ...generate(id, taken)];
}

let cached: Product[] | undefined;

/** The full, immutable base catalogue (built once). */
export function baseCatalog(): readonly Product[] {
  return (cached ??= buildCatalog());
}

// ---------------------------------------------------------------------------------------------
// Stock & reviews (derived deterministically, so they never need to be stored)
// ---------------------------------------------------------------------------------------------

/** Units left for a product in a given EU size: ~7% sold out, ~11% low stock. */
export function stockFor(id: number, size: number): number {
  let h = Math.imul(id, 2654435761) ^ Math.imul(Math.round(size * 10), 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  const n = ((h ^ (h >>> 16)) >>> 0) % 100;
  if (n < 7) return 0;
  if (n < 18) return 1 + (n % 3);
  return 4 + (n % 12);
}
