/**
 * @file src/utils/classify.ts
 * @description A utility function for classifying raw CSV rows into semantic categories.
 *
 * This file contains the core business logic for interpreting a row from an inventory
 * CSV file and determining what kind of item it represents (e.g., a complete frame,
 * lenses, a hardware part, etc.). This classification is crucial for the filtering
 * and matching logic in the recommendations feature.
 */
import { includesAny } from './text.js';

/**
 * Analyzes a raw CSV row and returns a set of boolean flags describing its type.
 * The logic is based on a series of heuristics that check for keywords and patterns
 * in the 'Product' (SKU) and 'Descriptionz' columns.
 * @param {Record<string, string>} row - A single row from the parsed CSV file.
 * @returns An object containing boolean flags for each possible category.
 */
export function classifyRow(row: Record<string, string>) {
  // --- 1. Data Preparation ---
  // Extract and clean the relevant fields from the row.
  const product = (row['Product'] || '').trim();
  const description = (row['Descriptionz'] || '').trim();
  const status = (row['Status'] || '').trim().toLowerCase();
  const productLower = product.toLowerCase();
  const descLower = description.toLowerCase();
  const productLowerExpanded = productLower.replace(/[-_/]+/g, ' ');
  const descLowerExpanded = descLower.replace(/[-_/]+/g, ' ');
  const lensSearchHaystack = `${descLower} ${productLower} ${descLowerExpanded} ${productLowerExpanded}`;
  const toWordHaystack = (value: string) => {
    const normalized = value.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    return normalized ? ` ${normalized} ` : ' ';
  };
  const wordMatchHaystack = `${toWordHaystack(productLower)}${toWordHaystack(descLower)}`;

  // --- 2. Initial, High-Priority Classifications ---
  const isSample = product.startsWith('S-') || /(^|\s)sample:/.test(descLower);
  const isReserve = product.startsWith('V-') || /(^|\s)reserve:/.test(descLower);
  const isRx = productLower.includes('-rx') || descLower.includes('-rx') || /\brx\b/.test(descLower);
  const demoLensKeywords = ['demo lens', 'demo lenses', 'demo len', 'demo acrylic', 'demo cr39', 'cr39 demo'];
  const hasDemoLensLanguage =
    includesAny(descLower, demoLensKeywords) ||
    /\bdemo\s*l(?:en)?s\b/.test(descLower);
  let isDemo = /\bdemo\b/.test(descLower) || hasDemoLensLanguage;

  // --- 3. Component/Part Detection ---
  // A series of heuristics to identify if an item is a part (front, temples, hardware).
  const hasFrontDesc =
    /^front\s*:/.test(descLower) ||
    includesAny(descLower, ['front only']) ||
    ' front '.includes(' ') && /(^|[\s,;()\-])fronts?(\b|:)/.test(descLower) ||
    /(^|[\s,;()\-])fron(\b|:)/.test(descLower);
  const hasTemplesDesc =
    /^temples?\s*:/.test(descLower) ||
    /\btemples?\b/.test(descLower) ||
    /(^|[\s,;()\-])templs?\b/.test(descLower) ||
    /(^|[\s,;()\-])templ\b/.test(descLower) ||
    /\(pr\)/.test(descLower) ||
    /\bpair\b/.test(descLower);
  const frontSkuHint = productLower.startsWith('f-') || /(^|[\-_])spf(\b|[\-_])/.test(productLower);
  const templesSkuHint = productLower.startsWith('t-') || /(^|[\-_])spt(\b|[\-_])/.test(productLower);
  const isFront = hasFrontDesc || frontSkuHint;
  const isTemples = hasTemplesDesc || templesSkuHint;
  // Leather pads are accessories, not hardware parts
  const isLeatherPad = descLower.includes('leather') && (descLower.includes('pad') || productLower.startsWith('j-ldp'));
  const isHardware = !isLeatherPad && includesAny(descLower, ['screw', 'screws', 'hinge', 'hinges', 'pad', 'pads', 'nose pad', 'hardware']);
  // An item is considered a "part" if it matches any of the component heuristics.
  const isParts = product.startsWith('T-') || isFront || isTemples || isHardware;

  // --- 4. Other Category Classifications ---
  const isClipOn = includesAny(descLower, ['clip-on', 'clip on', 'clipon']) || includesAny(productLower, ['clip-on', 'clipon']);
  
  // A hint that an item is likely a frame based on common SKU prefixes.
  // Lens Detection: Uses keywords or SKU patterns, but avoids misclassifying frames that mention lens material.
  const skuLensPattern = /^\d{2,}[\w-]*-(?:s|g)(?:\b|$)/i;
  const lensKeyword = includesAny(lensSearchHaystack, [
    ' lens', 'lenses', 'glass lens', 'mineral-glass', 'mineral glass',
    'cr39 lens', 'cr-39 lens', 'polycarbonate lens', 'polyurethane-lens', 'demo lens', 'demo lenses'
  ]);
  const demoLensSku = /^\d{3}-s-\d/.test(productLower) || productLower.startsWith('000-s-');
  let isLens = lensKeyword || hasDemoLensLanguage || skuLensPattern.test(productLower) || demoLensSku;
  const isHorn = descLower.includes('-horn') || productLower.includes('horn');

  // --- 5. "Other" and Final Frame Classification (Process of Elimination) ---
  // A broad bucket for accessories, merchandise, etc., based on keywords and SKU patterns.
  const otherKeywords = [
    'vinyl', 'record', 'case', 'cases', 'travel case', 'pouch', 'pouches', 'sleeve', 'sleeves', 'dust bag', 'dustbag', 'leather', 'bag', 'bags', 'gift box', 'gift bag', 'box set', 'carton',
    'cap', 'caps', 'hat', 'hats', 'shirt', 't-shirt', 'hoodie', 'sweat', 'sweater', 'sweatshirt', 'beanie', 'beanies', 'scarf', 'scarves', 'glove', 'gloves', 'mitten', 'mittens', 'sock', 'socks', 'vest', 'jacket', 'varsity', 'coat', 'parka', 'trench', 'pullover', 'turtleneck', 'sweatpants',
    'cloth', 'cloths', 'clean', 'cleaner', 'cleaning', 'wipe', 'wipes', 'spray', 'solution', 'polish', 'kit', 'care kit', 'repair kit', 'tool kit', 'cleaning kit', 'polishing cloth',
    'chain', 'chains', 'cord', 'strap', 'straps', 'lanyard', 'keychain', 'key chain', 'key ring', 'belt', 'belts', 'stand', 'display', 'display tray', 'tray', 't-bar',
    'box', 'book', 'booklet', 'catalog', 'zine', 'poster', 'print', 'sticker', 'stickers', 'stationery', 'card set', 'cards', 'merch', 'wallet', 'wallets', 'bi-fold', 'tri-fold',
    'necklace', 'necklaces', 'pendant', 'pendants', 'eyewear box', 'eyewear', 'bolo', 'ring', 'rings', 'bracelet', 'bracelets', 'bangle', 'bangles', 'cuff', 'cuffs', 'cufflink', 'cufflinks',
    'earring', 'earrings', 'brooch', 'brooches', 'lapel pin', 'enamel pin', 'pin set', 'pin-set', 'pin badge', 'collector pin', 'cassandre', 'jewel', 'jewelry', 'softcover', 'paperback', 'microfiber', 'envelope', 'envelopes', 'slip case', 'slipcase',
    'anklet', 'anklets', 'charm', 'charms', 'medallion', 'medallions', 'tie bar', 'tie clip', 'tie pin', 'card holder', 'passport holder', 'key holder', 'key case',
    'catch-all', 'catchall', 'catchall tray', 'catch-all tray', 'ashtray', 'ash tray', 'lighter', 'lighter case', 'lens case', 'lens cases', 'usb', 'charger', 'speaker', 'flashlight', 'lamp', 'clock', 'timer',
    'paperweight', 'figurine', 'statue', 'ornament', 'coaster', 'candle', 'vase', 'planter', 'collector', 'trunk', 'bill clip', 'bill-clip', 'money clip',
    'picture frame', 'photo frame', 'watch box', 'watch case', 'watch holder'
  ];
  const isOtherKeyword = otherKeywords.some(k => productLower.includes(k) || descLower.includes(k));
  // Force baseball merchandise into "Other" even when SKU looks frame-like.
  const isBaseballMerch = /\bbaseball(?:\s*bats?)?\b/.test(descLowerExpanded) || /\bbaseball(?:\s*bats?)?\b/.test(productLowerExpanded);
  const productSkuCompact = productLower.replace(/[^a-z0-9]+/g, '');
  const isOacSku =
    productLower.startsWith('j-oac') ||
    productLower.startsWith('j_oac') ||
    productSkuCompact.startsWith('joac');
  const isJbglSku =
    productLower.startsWith('j-bgl') ||
    productLower.startsWith('j-jbgl') ||
    productSkuCompact.startsWith('jbgl') ||
    productSkuCompact.startsWith('jjbgl');
  const isOtherCode =
    productLower.includes('case-') ||
    productLower.startsWith('jmm-case') ||
    productLower.startsWith('j-evnl') ||
    isOacSku ||
    isJbglSku ||
    productLower.includes('vinyl');
  const isOtherCandidateRaw = isOtherKeyword || isOtherCode || isBaseballMerch;
  // Explicit apparel detection should always be classified as Other, even if the SKU looks like a frame.
  const apparelKeywords = [
    'shirt', 't-shirt', 'hoodie', 'sweat', 'sweater', 'sweatshirt', 'jacket', 'coat', 'trench', 'parka', 'pullover', 'turtleneck', 'vest', 'sweatpants',
    'pants', 'jogger', 'joggers', 'glove', 'gloves', 'mitten', 'mittens', 'sock', 'socks', 'scarf', 'scarves', 'beanie', 'beanies', 'cap', 'caps', 'hat', 'hats'
  ];
  const teeWordRe = /\btee\b/;
  const hasStandaloneTee = teeWordRe.test(productLower) || teeWordRe.test(descLower);
  const matchesApparelKeyword = (keyword: string) => {
    const normalizedKeyword = toWordHaystack(keyword.toLowerCase());
    return normalizedKeyword.trim().length > 0 && wordMatchHaystack.includes(normalizedKeyword);
  };
  const isApparel = hasStandaloneTee || apparelKeywords.some(matchesApparelKeyword);
  const isAccessorySku =
    // General accessory prefixes
    productLower.startsWith('jmm-acc') || productLower.startsWith('jmm-accs') || productLower.startsWith('jmm-case') ||
    productLower.startsWith('jmm-bwe') || productLower.startsWith('j-bwe') ||
    // Apparel
    productLower.startsWith('j-act') || // Apparel/clothing (varsity jackets, etc.)
    // Cases, boxes, bags
    productLower.startsWith('j-evnl') || productLower.startsWith('j-box') || productLower.startsWith('j-obx') ||
    productLower.startsWith('j-ebx') || // Eyewear boxes
    productLower.startsWith('j-ecs') || // Cases (Rossi Case, etc.)
    productLower.startsWith('j-lcs') || // Leather cases
    productLower.startsWith('j-jcs') || // Jewelry cases
    productLower.startsWith('j-edb') || // Dust bags
    // Books and paper goods
    productLower.startsWith('j-ebk') || // Books
    productLower.startsWith('j-hbk') || // Book boxes
    // Cleaning and care
    productLower.startsWith('j-ecc') || // Cleaning cloths
    productLower.startsWith('j-jcc') || // Jewelry polishing cloths
    // Jewelry
    productLower.startsWith('j-jbt') || // Bolos
    productLower.startsWith('j-jrg') || // Rings
    productLower.startsWith('j-jpd') || // Pendants
    productLower.startsWith('j-jbc') || // Bracelets
    productLower.startsWith('j-jbh') || // Brooches
    productLower.startsWith('j-jcf') || // Cuffs
    productLower.startsWith('j-jnl') || // Necklaces
    productLower.startsWith('j-jbx') || // Jewelry boxes
    productLower.startsWith('j-jer') || // Earrings
    productLower.startsWith('j-jan') || // Anklets
    productLower.startsWith('j-jtb') || // Tie bars
    productLower.startsWith('j-jch') || // Charms
    productLower.startsWith('j-jmd') || // Medallions
    // Wallets and leather goods
    productLower.startsWith('j-lwl') || // Wallets
    productLower.startsWith('j-lbf') || // Bi-fold wallets
    productLower.startsWith('j-ltf') || // Tri-fold wallets
    productLower.startsWith('j-ldp') || // Leather pads
    productLower.startsWith('j-lch') || // Card holders
    productLower.startsWith('j-lps') || // Passport holders
    productLower.startsWith('j-lkc') || // Key cases
    productLower.startsWith('j-lbl') || // Leather belts
    // Home and lifestyle
    productLower.startsWith('j-has') || // Ashtrays and home accessories
    productLower.startsWith('j-jlr') || // Lighter cases
    productLower.startsWith('j-ecn') || // Chains (T-bar chains, etc.)
    productLower.startsWith('j-otk') || // Trunks (storage boxes)
    productLower.startsWith('j-jmnc') || // Money clips / bill clips
    productLower.startsWith('j-hvs') || // Vases
    productLower.startsWith('j-hcn') || // Candles
    productLower.startsWith('j-hfr') || // Picture frames
    productLower.startsWith('j-hcl') || // Clocks
    // ID Cards
    productLower.startsWith('j-eid-crd') || productLower.includes('-crd-') ||
    // Pattern-based detection
    productLower.includes('-blts-') || productLower.includes('vinyl') || 
    productLower.includes('case-') || productLower.includes('envelope');
  const isLikelyFrameSku = /^jmm[a-z]/.test(productLower) || (/^j-/.test(productLower) && !isAccessorySku);

  const forcedLensSku =
    productLower.startsWith('000-') ||
    productLower.startsWith('003-') ||
    (!isLikelyFrameSku && hasDemoLensLanguage);
  if (forcedLensSku) {
    isLens = true;
    isDemo = false;
  }
  const isDemoLens = hasDemoLensLanguage && !forcedLensSku && isLikelyFrameSku;

  // Use word boundaries for "ring" to avoid matching brand names like "RINGO".
  // Also check for "lighter case" pattern in description
  const accessoryWordRe = /\b(necklace|necklaces|pendant|pendants|bolo|ring|rings|eyewear|bracelet|bracelets|bangle|bangles|cuff|cuffs|cufflink|cufflinks|earring|earrings|brooch|brooches|wallet|wallets|key\s*chain|keychain|key\s*ring|lanyard|belt|belts|clean|cleaning|cleaner|cloth|cloths|microfiber|wipes?|spray|solution|polish|kit|care\s*kit|repair\s*kit|tool\s*kit|cleaning\s*kit|pouch|pouches|sleeve|sleeves|dust[\s-]*bag|travel\s*case|slip\s?case|slipcase|case|cases|box|boxes|boite|gift\s*box|gift\s*bag|box\s*set|carton|chain|chains|t-?bar|card\s*holder|card\s*set|catch(?:-| )?all|ash(?:-| )?tray|display\s*tray|tray|stand|poster|print|book|booklet|catalog|zine|sticker|stickers|stationery|demo\s+lens|demo\s+lenses|lens\s+case|usb|charger|speaker|flashlight|lamp|clock|timer|paperweight|figurine|statue|ornament|coaster|candle|vase|planter|id\s*card)\b|lapel\s+pin|enamel\s+pin|pin\s+set|collector\s+pin|pin\s+badge/;
  const accessoryDesc = accessoryWordRe.test(descLower) || accessoryWordRe.test(productLower);
  const isOtherCandidate = isBaseballMerch || isOtherCode || accessoryDesc || isAccessorySku || isApparel || (!isLikelyFrameSku && isOtherCandidateRaw);

  // A "complete frame" is the default classification if it's not identified as any other category.
  const isCompleteFrame = isLikelyFrameSku && !isParts && !isLens && !isClipOn && !isSample && !isReserve && !isOtherCandidate && !isDemo;
  const isOther = !isCompleteFrame && !isRx && !isParts && !isLens && !isSample && !isReserve && isOtherCandidate;
  
  
  // If an item doesn't fit any category, it's marked as "unknown".
  const isUnknown = !isCompleteFrame && !isRx && !isLens && !isParts && !isSample && !isReserve && !isOther;

  // An item is only considered "good" for analysis if its status column is 'good'.
  const isGood = status === 'good';

  // Return the final object of boolean flags.
  return { isSample, isReserve, isRx, isFront, isTemples, isHardware, isParts, isClipOn, isLens, isHorn, isCompleteFrame, isOther, isUnknown, isGood, isDemo, isDemoLens };
}


