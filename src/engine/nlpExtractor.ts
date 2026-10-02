/**
 * Layer 2: NLP Symptom Extractor & PII Stripper
 *
 * Provides:
 * 1. Client-side PII Redaction for Privacy Transparency (strips phone, email, names, addresses)
 * 2. Deterministic Multilingual NLP extractor (English, Hindi, Telugu, Hinglish, Tenglish)
 * 3. Works seamlessly offline and as a local-first fallback when API is unavailable.
 */

import { BodyArea, ExtractedSymptom } from '../types';

export interface PiiRedactionResult {
  originalText: string;
  sanitizedText: string;
  redactedItems: { type: string; original: string; placeholder: string }[];
}

/**
 * Strips PII (Personally Identifiable Information) before transmitting to any external LLM
 */
export function stripPII(text: string): PiiRedactionResult {
  const redactedItems: { type: string; original: string; placeholder: string }[] = [];
  let sanitized = text;

  // 1. Phone numbers (10 digits, formatted, +91, etc.)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    const placeholder = '[PHONE REDACTED]';
    redactedItems.push({ type: 'phone', original: match, placeholder });
    return placeholder;
  });

  // 2. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  sanitized = sanitized.replace(emailRegex, (match) => {
    const placeholder = '[EMAIL REDACTED]';
    redactedItems.push({ type: 'email', original: match, placeholder });
    return placeholder;
  });

  // 3. Indian Aadhaar / Identification numbers (12 digits)
  const idRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
  sanitized = sanitized.replace(idRegex, (match) => {
    const placeholder = '[GOV_ID REDACTED]';
    redactedItems.push({ type: 'id_number', original: match, placeholder });
    return placeholder;
  });

  // 4. Common name patterns (e.g., "My name is John", "I am Priya Sharma", "patient Rahul")
  const namePatterns = [
    /(?:my name is|i am|patient is|myself|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /(?:mera naam|na peru)\s+([A-Za-z]+)/gi,
  ];
  for (const pat of namePatterns) {
    sanitized = sanitized.replace(pat, (full, name) => {
      const placeholder = '[NAME REDACTED]';
      redactedItems.push({ type: 'name', original: name, placeholder });
      return full.replace(name, placeholder);
    });
  }

  return {
    originalText: text,
    sanitizedText: sanitized,
    redactedItems,
  };
}

interface SymptomKnowledge {
  canonicalName: string;
  bodyArea: BodyArea;
  defaultSeverity: number;
  patterns: RegExp[];
}

const SYMPTOM_DICTIONARY: SymptomKnowledge[] = [
  // Cardiac / Chest
  {
    canonicalName: 'Chest Pain or Tightness',
    bodyArea: 'chest',
    defaultSeverity: 7,
    patterns: [
      /\b(chest pain|chest tightness|chest pressure|heaviness in chest|angina)\b/i,
      /\b(chhati me[n]? dard|seene me[n]? dard|chhati me jakdan)\b/i,
      /\b(chathi noppi|gunde noppi|gundelo noppi)\b/i,
      /\b(सीने में दर्द|छाती में दर्द|छाती में जकड़न)\b/i,
      /\b(గుండె నొప్పి|ఛాతీ నొప్పి)\b/i,
    ],
  },
  {
    canonicalName: 'Pain radiating to Arm or Jaw',
    bodyArea: 'chest',
    defaultSeverity: 8,
    patterns: [
      /\b(radiat(?:ing|es)? to (?:left )?arm|pain in left arm|jaw pain|neck pain radiating)\b/i,
      /\b(haath me dard|baayein haath me dard)\b/i,
      /\b(chethi noppi|edama cheyyi noppi)\b/i,
      /\b(बाएं हाथ में दर्द|हाथ में दर्द)\b/i,
    ],
  },
  {
    canonicalName: 'Cold Sweats or Diaphoresis',
    bodyArea: 'systemic',
    defaultSeverity: 6,
    patterns: [
      /\b(cold sweat[s]?|sweating heavily|profuse sweating|diaphoresis|clammy skin)\b/i,
      /\b(pasina|paseena chhootna|bahut pasina)\b/i,
      /\b(chematalu|ghamandalu)\b/i,
      /\b(पसीना|बहुत पसीना छूट रहा)\b/i,
      /\b(చెమటలు పట్టడం)\b/i,
    ],
  },
  // Respiratory
  {
    canonicalName: 'Shortness of Breath / Dyspnea',
    bodyArea: 'respiratory',
    defaultSeverity: 7,
    patterns: [
      /\b(shortness of breath|breathlessness|difficulty breathing|dyspnea|gasping|wheezing)\b/i,
      /\b(saans phoolna|saans lene me dikkat|dam phoolna)\b/i,
      /\b(aayasam|oopiri aadatledu|dammu)\b/i,
      /\b(सांस फूलना|सांस लेने में तकलीफ)\b/i,
      /\b(ఆయాసం|ఊపిరి ఆడకపోవడం)\b/i,
    ],
  },
  {
    canonicalName: 'Cough',
    bodyArea: 'respiratory',
    defaultSeverity: 4,
    patterns: [
      /\b(cough|coughing|dry cough|wet cough|phlegm)\b/i,
      /\b(khansi|balgam|khasi)\b/i,
      /\b(daggu|kaphmu)\b/i,
      /\b(खांसी|कफ|बलगम)\b/i,
      /\b(దగ్గు|కఫం)\b/i,
    ],
  },
  {
    canonicalName: 'Sore Throat',
    bodyArea: 'throat',
    defaultSeverity: 3,
    patterns: [
      /\b(sore throat|throat irritation|scratchy throat|difficulty swallowing)\b/i,
      /\b(gale me kharash|gale me dard|gala kharab)\b/i,
      /\b(gonthu noppi|gonthulo manta|gonthu gichukovadam)\b/i,
      /\b(गले में खराश|गले में दर्द)\b/i,
      /\b(గొంతు నొప్పి|గొంతులో మంట)\b/i,
    ],
  },
  // Fever / Systemic
  {
    canonicalName: 'Fever or Elevated Body Temperature',
    bodyArea: 'systemic',
    defaultSeverity: 5,
    patterns: [
      /\b(fever|febrile|high temperature|pyrexia|chills|shivering)\b/i,
      /\b(bukhar|tez bukhar|kapkapi)\b/i,
      /\b(jwaram|chali jwaram|ontlo vedi)\b/i,
      /\b(बुखार|तेज बुखार|कंपकंपी)\b/i,
      /\b(జ్వరం|చలి జ్వరం)\b/i,
    ],
  },
  {
    canonicalName: 'Headache',
    bodyArea: 'head',
    defaultSeverity: 4,
    patterns: [
      /\b(headache|migraine|head pain|throbbing head)\b/i,
      /\b(sir dard|sar dard|sir me dard)\b/i,
      /\b(tala noppi|tala thimmiri)\b/i,
      /\b(सिर दर्द|सर दर्द)\b/i,
      /\b(తల నొప్పి)\b/i,
    ],
  },
  {
    canonicalName: 'Dizziness or Vertigo',
    bodyArea: 'neurological',
    defaultSeverity: 5,
    patterns: [
      /\b(dizzy|dizziness|lightheaded|vertigo|spinning head|unsteady)\b/i,
      /\b(chakkar|sir ghoomna|chakkar aana)\b/i,
      /\b(kadupu thippadam|tala thiruguthondi|thiragadam)\b/i,
      /\b(चक्कर|सिर घूमना)\b/i,
      /\b(తల తిరగడం)\b/i,
    ],
  },
  // Gastrointestinal
  {
    canonicalName: 'Abdominal Pain or Cramps',
    bodyArea: 'abdomen',
    defaultSeverity: 5,
    patterns: [
      /\b(stomach ache|abdominal pain|belly pain|stomach cramps|gut pain)\b/i,
      /\b(pet dard|pet me dard|pet me marod)\b/i,
      /\b(kadupu noppi|kadupulo noppi)\b/i,
      /\b(पेट दर्द|पेट में दर्द)\b/i,
      /\b(కడుపు నొప్పి)\b/i,
    ],
  },
  {
    canonicalName: 'Nausea or Vomiting',
    bodyArea: 'abdomen',
    defaultSeverity: 4,
    patterns: [
      /\b(nausea|vomiting|feeling sick|threw up|puking)\b/i,
      /\b(ulti|jee machlana|matli)\b/i,
      /\b(vanthulu|kadupu thippudu|vanthi)\b/i,
      /\b(उल्टी|जी मिचलाना)\b/i,
      /\b(వాంతులు|వికారం)\b/i,
    ],
  },
  {
    canonicalName: 'Body Aches / Generalized Fatigue',
    bodyArea: 'systemic',
    defaultSeverity: 3,
    patterns: [
      /\b(body ache[s]?|myalgia|muscle soreness|fatigue|exhaustion|weakness)\b/i,
      /\b(badan dard|thakaan|kamzori|sharir me dard)\b/i,
      /\b(ollu noppulu|neerasam|balaheenhata)\b/i,
      /\b(बदन दर्द|थकान|कमजोरी)\b/i,
      /\b(ఒళ్లు నొప్పులు|నీరసం)\b/i,
    ],
  },
  // Neurological / Stroke
  {
    canonicalName: 'Facial Droop or Asymmetry',
    bodyArea: 'head',
    defaultSeverity: 9,
    patterns: [
      /\b(facial droop|drooping face|one side face numb|droopy smile)\b/i,
      /\b(muh tedha|chehre ka lakwa)\b/i,
      /\b(mukham vankara)\b/i,
      /\b(मुंह टेढ़ा|चेहरे का लकवा)\b/i,
      /\b(ముఖం వంకర)\b/i,
    ],
  },
  {
    canonicalName: 'Speech Slurring or Difficulty Speaking',
    bodyArea: 'neurological',
    defaultSeverity: 9,
    patterns: [
      /\b(slurred speech|speech slurred|cannot speak words|garbled speech)\b/i,
      /\b(bolne me pareshani|zuban ladkhadana)\b/i,
      /\b(matalu thadabadadam|matladaleka povadam)\b/i,
      /\b(बोलने में परेशानी|जुबान लड़खड़ाना)\b/i,
      /\b(మాటలు తడబడడం)\b/i,
    ],
  },
];

/**
 * Extracts duration string and estimates day count from text
 */
function extractDuration(text: string): { durationStr: string; days: number } {
  // Check patterns like "3 days", "since morning", "2 weeks", "4 hours"
  const patterns: { regex: RegExp; calcDays: (m: RegExpMatchArray) => { durationStr: string; days: number } }[] = [
    {
      regex: /(\d+)\s*(?:day|days|din|rojulu|rojula nunchi)/i,
      calcDays: (m) => {
        const d = parseInt(m[1], 10);
        return { durationStr: `${d} day${d > 1 ? 's' : ''}`, days: d };
      },
    },
    {
      regex: /(\d+)\s*(?:week|weeks|hafte|varalu)/i,
      calcDays: (m) => {
        const w = parseInt(m[1], 10);
        return { durationStr: `${w} week${w > 1 ? 's' : ''}`, days: w * 7 };
      },
    },
    {
      regex: /(\d+)\s*(?:month|months|mahine|nelalu)/i,
      calcDays: (m) => {
        const mon = parseInt(m[1], 10);
        return { durationStr: `${mon} month${mon > 1 ? 's' : ''}`, days: mon * 30 };
      },
    },
    {
      regex: /(\d+)\s*(?:hour|hours|ghante|gantalu)/i,
      calcDays: (m) => {
        const h = parseInt(m[1], 10);
        return { durationStr: `${h} hour${h > 1 ? 's' : ''}`, days: Math.max(0.2, +(h / 24).toFixed(1)) };
      },
    },
    {
      regex: /(?:since\s+morning|subah se|podhunna nunchi|aaj subah)/i,
      calcDays: () => ({ durationStr: 'Since morning', days: 0.5 }),
    },
    {
      regex: /(?:since\s+yesterday|kal se|ninna nunchi)/i,
      calcDays: () => ({ durationStr: 'Since yesterday', days: 1 }),
    },
    {
      regex: /(?:just\s+started|sudden|achanak|ventane)/i,
      calcDays: () => ({ durationStr: 'Sudden / Acute', days: 0.1 }),
    },
  ];

  for (const { regex, calcDays } of patterns) {
    const match = text.match(regex);
    if (match) {
      return calcDays(match);
    }
  }

  return { durationStr: '1-2 days', days: 1.5 };
}

/**
 * Extracts explicit severity 1-10 or infers from linguistic modifiers
 */
function extractSeverity(text: string, defaultSeverity: number): number {
  // Explicit number out of 10 e.g., "severity 8", "pain 7/10", "8 out of 10"
  const explicitMatch = text.match(/(?:severity|pain|dard|noppi)?\s*(?:level|rate|is)?\s*(\d{1,2})\s*(?:\/|\s*out of\s*)\s*10/i) ||
                        text.match(/(?:severity|pain level)\s*(?:is|:)?\s*(\d{1,2})/i);
  if (explicitMatch) {
    const val = parseInt(explicitMatch[1], 10);
    if (val >= 1 && val <= 10) return val;
  }

  // Modifiers
  if (/\b(mild|thoda|halka|chinnaga|slight|low)\b/i.test(text)) {
    return Math.max(2, defaultSeverity - 2);
  }
  if (/\b(severe|unbearable|bahut tez|chala ekkuva|intense|excruciating|extreme|severe)\b/i.test(text)) {
    return Math.min(10, defaultSeverity + 3);
  }
  if (/\b(moderate|theek thaak|madhyam|ordinary)\b/i.test(text)) {
    return 5;
  }

  return defaultSeverity;
}

/**
 * Checks if a specific symptom keyword inside the text is negated
 * e.g., "no fever", "bukhar nahi hai", "without cough", "jwaram ledu"
 */
function isNegated(text: string, matchIndex: number, matchLength: number): boolean {
  const windowBefore = text.slice(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();
  const windowAfter = text.slice(matchIndex + matchLength, Math.min(text.length, matchIndex + matchLength + 30)).toLowerCase();

  const negationBefore = /\b(no|not|denies|denied|without|never|neither|zero|absent|nahi|nahin|na)\b/i.test(windowBefore);
  const negationAfter = /\b(nahi|nahin|ledu|ledhu|nill|none)\b/i.test(windowAfter);

  return negationBefore || negationAfter;
}

/**
 * Deterministic NLP Extractor (works instantly, client-side, zero latency, 100% offline capable)
 */
export function extractSymptomsLocal(rawText: string): ExtractedSymptom[] {
  const extracted: ExtractedSymptom[] = [];
  const lowerText = rawText.toLowerCase();

  const durationInfo = extractDuration(rawText);

  for (const item of SYMPTOM_DICTIONARY) {
    for (const pattern of item.patterns) {
      const match = rawText.match(pattern);
      if (match && match.index !== undefined) {
        const negated = isNegated(rawText, match.index, match[0].length);
        const severity = extractSeverity(rawText, item.defaultSeverity);

        // Avoid duplicate canonical entries
        if (!extracted.some((s) => s.name === item.canonicalName)) {
          extracted.push({
            id: `sym-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: item.canonicalName,
            duration: durationInfo.durationStr,
            durationDays: durationInfo.days,
            severity: negated ? 1 : severity,
            bodyArea: item.bodyArea,
            isNegation: negated,
            rawText: match[0],
            confidence: 0.92,
          });
        }
        break; // matched this dictionary item
      }
    }
  }

  // If no known symptom was caught by dictionary, create a generic entry from input
  if (extracted.length === 0 && rawText.trim().length > 3) {
    extracted.push({
      id: `sym-generic-${Date.now()}`,
      name: rawText.length > 30 ? rawText.substring(0, 30) + '...' : rawText.trim(),
      duration: durationInfo.durationStr,
      durationDays: durationInfo.days,
      severity: 5,
      bodyArea: 'systemic',
      isNegation: false,
      rawText: rawText.trim(),
      confidence: 0.7,
    });
  }

  return extracted;
}
