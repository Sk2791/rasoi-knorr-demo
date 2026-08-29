import { Trigger, Cluster, AgentInfo, GuardrailItem, Asset } from "../types";

export const AXES = ["Sweet", "Sour", "Heat", "Salt", "Aroma", "Body"];

export const ASSETS: Asset[] = [
  {
    c: "DL",
    city: "Delhi NCR",
    lang: "Hindi (hi-IN)",
    fmt: "9:16 · Instagram Reels",
    head: "6°C. सूप बनने दो।",
    sub: "Knorr Classic Sweet Corn · 4 मिनट में तैयार",
    bg1: "#0d5a3a",
    bg2: "#3a9e6a",
    badge: "Live · IMD Cold Wave",
    q: "₹ 55",
    tasteNote: "Warming, rich body with hint of ghee and mild black pepper",
    englishMeaning: "6°C outside. Let the hot soup simmer. Ready in 4 minutes."
  },
  {
    c: "PB",
    city: "Ludhiana, Punjab",
    lang: "Punjabi (pa-IN)",
    fmt: "16:9 · YouTube Shorts",
    head: "ਪ੍ਰੋਟੀਨ ਨਾਲ ਭਰਪੂਰ।",
    sub: "ਰੋਜ਼ਾਨਾ ਸਰਦੀਆਂ ਦੀ ਤਾਕਤ",
    bg1: "#3a3a12",
    bg2: "#8f7020",
    badge: "HELD FOR REVIEW · Health Claim",
    q: "HOLD",
    held: 1,
    tasteNote: "Thick creamy broth with butter notes and warming spices",
    englishMeaning: '"Rich in protein & builds daily winter immunity"',
    suggestedEdit: "ਸਰਦੀਆਂ ਦੀ ਨਿੱਘੀ ਸੁਗੰਧ।",
    suggestedEnglish: "Warming buttery comfort for cold Punjab evenings (100% FSSAI Compliant)"
  },
  {
    c: "WB",
    city: "Kolkata",
    lang: "Bengali (bn-IN)",
    fmt: "1:1 · Swiggy / Blinkit Feed",
    head: "শীতের প্রথম বাটি।",
    sub: "সরষের ফোড়নে, খাঁটি বাঙালি স্বাদে",
    bg1: "#14503a",
    bg2: "#8f7a26",
    badge: "Live · Mustard Aroma",
    q: "₹ 55",
    tasteNote: "Pungent mustard oil tempering, delicate sweetness, lighter consistency",
    englishMeaning: "First steaming bowl of winter. Mustard tempered, authentic Bengali taste."
  },
  {
    c: "MH",
    city: "Mumbai & Pune",
    lang: "Marathi (mr-IN)",
    fmt: "9:16 · Reels / Stories",
    head: "गरमागरम सूप, ५ मिनिटांत!",
    sub: "थंडीतली खरी मजा · नॉर स्वीट कॉर्न",
    bg1: "#1a5a2a",
    bg2: "#c4903f",
    badge: "Live · Quick Comfort",
    q: "₹ 55",
    tasteNote: "Balanced spice, touch of coriander seed and light sweetness",
    englishMeaning: "Steaming hot soup in 5 minutes! The true joy of chilly evenings."
  },
  {
    c: "TN",
    city: "Chennai",
    lang: "Tamil (ta-IN)",
    fmt: "1:1 · Blinkit PDP Banner",
    head: "புளி சுவையில் காரசார சூப்.",
    sub: "மிளகு காரம் · 4 நிமிடங்களில் தயார்",
    bg1: "#10402e",
    bg2: "#4a9e7a",
    badge: "Live · Pepper & Tamarind",
    q: "₹ 55",
    tasteNote: "Tamarind-forward rasam notes, crushed black pepper, thinner broth",
    englishMeaning: "Tangy tamarind & fiery black pepper hot soup. Ready in 4 minutes."
  },
  {
    c: "KA",
    city: "Bengaluru",
    lang: "Kannada (kn-IN)",
    fmt: "4:5 · Zepto Quick Banner",
    head: "ಬಿಸಿ ಬಿಸಿ ಸೂಪ್ ನಿಮ್ಮ ಮನೆಗೆ.",
    sub: "ಕರಿಬೇವು ಘಮಲು · 4 ನಿಮಿಷದಲ್ಲಿ",
    bg1: "#144835",
    bg2: "#428d68",
    badge: "Live · Curry Leaf Tempering",
    q: "₹ 55",
    tasteNote: "Coconut & curry-leaf tempering with medium peppery heat",
    englishMeaning: "Steaming hot soup at home. Curry-leaf aroma in just 4 minutes."
  },
  {
    c: "GJ",
    city: "Ahmedabad",
    lang: "Gujarati (gu-IN)",
    fmt: "1:1 · WhatsApp Business Catalog",
    head: "ગરમાગરમ સ્વાદિષ્ટ સૂપ.",
    sub: "મીઠો મસાલેદાર સ્વાદ · ૪ મિનિટ",
    bg1: "#1d5830",
    bg2: "#a0882e",
    badge: "Live · Mild Sweet & Spiced",
    q: "₹ 55",
    tasteNote: "Delicate sweet undertone, no pungent raw garlic, mild spice",
    englishMeaning: "Delicious steaming soup. Gently sweet & spiced in 4 minutes."
  },
  {
    c: "UP",
    city: "Lucknow & Kanpur",
    lang: "Hindi (hi-IN)",
    fmt: "9:16 · Shorts",
    head: "कड़क ठंड में देसी गरमाहट।",
    sub: "खड़े मसालों का स्वाद · नॉर सूप",
    bg1: "#0e5233",
    bg2: "#57a876",
    badge: "Live · Robust Spice",
    q: "₹ 55",
    tasteNote: "Whole spice punch, generous salt, warming ginger-garlic body",
    englishMeaning: "Desi warmth in bitter cold. Packed with robust whole-spice flavor."
  },
  {
    c: "AP",
    city: "Vizag & Amaravati",
    lang: "Telugu (te-IN)",
    fmt: "1:1 · Swiggy Instamart",
    head: "వేడి వేడి ఘాటైన సూప్.",
    sub: "మంచి మిరియాల ఘాటు · 4 నిమిషాలు",
    bg1: "#124b30",
    bg2: "#639a48",
    badge: "Live · Bold Guntur Heat",
    q: "₹ 55",
    tasteNote: "High red chilli heat, tangy tamarind finish, bold seasoning",
    englishMeaning: "Piping hot spicy soup. Rich pepper heat ready in 4 minutes."
  },
  {
    c: "TG",
    city: "Hyderabad",
    lang: "Telugu (te-IN)",
    fmt: "1:1 · Swiggy Instamart",
    head: "నిజాం స్టైల్ వెచ్చని సూప్.",
    sub: "దమ్ మసాలా ఘుమఘుమలు · 4 నిమిషాలు",
    bg1: "#123f4b",
    bg2: "#3f7d98",
    badge: "Live · Hyderabadi Dum Spice",
    q: "₹ 55",
    tasteNote: "Layered dum-style spice, saffron warmth, rich biryani-adjacent aroma",
    englishMeaning: "Nizami-style warm soup. Fragrant dum-spiced comfort, ready in 4 minutes."
  },
  {
    c: "KL",
    city: "Kochi & Trivandrum",
    lang: "Malayalam (ml-IN)",
    fmt: "9:16 · Instagram Reels",
    head: "ചൂടുള്ള സൂപ്പ് രുചി.",
    sub: "കുരുമുളകും കറിവേപ്പിലയും ചേർത്ത്",
    bg1: "#0b4e36",
    bg2: "#3ca073",
    badge: "Live · Coconut & Pepper",
    q: "₹ 55",
    tasteNote: "Creamy coconut milk undertone, crushed Wayanad pepper",
    englishMeaning: "Delicious piping hot soup infused with black pepper and curry leaves."
  },
  {
    c: "RJ",
    city: "Jaipur & Jodhpur",
    lang: "Hindi (hi-IN)",
    fmt: "16:9 · Kirana Digital Board",
    head: "मरुधरा की ठंड में तीखा सूप।",
    sub: "देसी मसालों का दम · 4 मिनट",
    bg1: "#195028",
    bg2: "#9c7f2b",
    badge: "Live · Dry Roasted Spice",
    q: "₹ 55",
    tasteNote: "Dry roasted coriander, mathania chilli warmth, rich texture",
    englishMeaning: "Spicy warming soup for desert winters. Power of authentic spices."
  },
  {
    c: "MP",
    city: "Indore & Bhopal",
    lang: "Hindi (hi-IN)",
    fmt: "1:1 · Blinkit Feed",
    head: "शाम की भूख का चटपटा इलाज।",
    sub: "चटपटा स्वाद · झटपट 4 मिनट में",
    bg1: "#115238",
    bg2: "#4ba372",
    badge: "Live · Central Balance",
    q: "₹ 55",
    tasteNote: "Balanced sweet-sour-spicy street style soup profile",
    englishMeaning: "Zesty cure for evening hunger. Tangy street-style taste in 4 minutes."
  },
  {
    c: "BR",
    city: "Patna",
    lang: "Bhojpuri & Hindi",
    fmt: "WhatsApp Forward",
    head: "ठंडी में गरमागरम कटोरा।",
    sub: "सरसों तेल का तड़का · भरपूर स्वाद",
    bg1: "#154e2f",
    bg2: "#7a9c35",
    badge: "Live · Mustard & Cumin",
    q: "₹ 55",
    tasteNote: "Hearty portion sizing, mustard & roasted cumin aroma",
    englishMeaning: "A steaming hot bowl in chilly weather. Rich mustard tempering."
  },
  {
    c: "AS",
    city: "Guwahati",
    lang: "Assamese (as-IN)",
    fmt: "1:1 · Zepto Quick Ad",
    head: "শীতৰ আবেলি গৰম চুপ।",
    sub: "সুগন্ধি ভেষজ আৰু নিমখীয়া সোৱাদ",
    bg1: "#0d553b",
    bg2: "#5ba678",
    badge: "Live · Fresh Herb Aroma",
    q: "₹ 55",
    tasteNote: "Light, fresh ginger-herb broth with minimal oil and crisp finish",
    englishMeaning: "Warm evening soup for winter. Fragrant fresh herbs and savory taste."
  }
];

export const TRIGGERS: Record<string, Trigger> = {
  cold: {
    name: "Cold wave in North India",
    meta: "IMD Weather Alert · Delhi 6°C · 3-Hour Demand Spike",
    blurb: "First sharp winter drop of the season. 72-hour demand window across North & East India.",
    headlineInsight: "Cold wave in North India — soup demand up 310% in 3 hours. Recommend act now.",
    recommendation: "Approve & launch 14 regional campaign versions immediately to capture ₹14.2 Cr incremental sales across 142 quick-commerce pincodes and 18,400 kirana stores.",
    urgencyLevel: "Immediate (Next 3h)",
    affectedRegions: ["Delhi NCR", "Punjab", "Uttar Pradesh", "Rajasthan", "West Bengal"],
    marketLift: "+18% Predicted Category Sales Lift",
    revenueHeadroom: "₹14.2 Crore Incremental Sales",
    windowDuration: "72-Hour Demand Peak Window",
    targetMin: 47,
    opp: "The first cold wave of winter just landed on 340 million consumers. Unprecedented 310% search surge for warming comfort soups across Delhi NCR, Punjab, UP, and Rajasthan.",
    scores: ["94%", "96%", "Low Risk", "₹14.2cr"],
    mesh: ["8,700/min", "14 of 14", "19 active feeds"],
    reach: ["142 dark store pincodes", "18,400 kirana outlets", "4,200 Shakti kits", "6 regional languages"],
    signals: [
      { src: "IMD WEATHER", t: "North India cold wave: Delhi min 6°C, sharpest 24-hr drop of the season", v: 95, hot: 1 },
      { src: "SEARCH TRENDS", t: '"hot soup recipe at home" +310% in Delhi NCR overnight', v: 92, hot: 1 },
      { src: "BLINKIT ORDERS", t: "Soup & instant noodles basket additions +48% in 142 pincodes", v: 88, hot: 1 },
      { src: "SWIGGY INSTAMART", t: "Evening soup sachet orders up 2.4× in Gurgaon & Noida", v: 83 },
      { src: "YOUTUBE SHORTS", t: "'5-minute winter soup' creator recipes surging, 18 uploads/hr", v: 80 },
      { src: "KIRANA EPOS", t: "Knorr ₹10 & ₹55 sachets sales velocity up in 18,400 North stores", v: 76 },
      { src: "WHATSAPP GROUPS", t: "Family winter comfort recipe forwards spiking in Punjab & UP", v: 72 }
    ],
    verdict: "✓ Predicted category offtake +18% over 72 hours · Recipe-led comfort messaging outperforms generic product ads by 23pt in Tier-2 households",
    kpis: [
      ["47 min", "Time to Live Ads", "vs 6 weeks"],
      ["14 of 14", "Regional Versions", "Tailored"],
      ["18,400", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹9,400", "Compute Cost", "vs ₹12L Agency"],
      ["+18%", "Predicted Sales Lift", "₹14.2 Cr"]
    ],
    assets: ASSETS
  },
  navratri: {
    name: "Navratri Fasting Season",
    meta: "Festival Calendar · Day 1 of 9 · West & North Clusters",
    blurb: "Nine days of vrat dietary rules varying by state. High demand for onion-garlic free comfort meals.",
    headlineInsight: "Navratri fasting week begins tomorrow — vrat-safe recipe queries +420% in Maharashtra & Gujarat. Recommend act now.",
    recommendation: "Approve & launch vrat-certified regional recipes across West & North clusters. Clarifying 'No Onion No Garlic / Sabudana Base' on PDPs lifts conversion by 19%.",
    urgencyLevel: "Immediate (Next 3h)",
    affectedRegions: ["Maharashtra", "Gujarat", "Delhi NCR", "Rajasthan", "Madhya Pradesh"],
    marketLift: "+24% Predicted Category Sales Lift",
    revenueHeadroom: "₹18.6 Crore Incremental Sales",
    windowDuration: "9-Day Fasting Window",
    targetMin: 44,
    opp: "Navratri fasting begins tomorrow. Vrat dietary rules differ sharply by cluster: Maharashtra demands sabudana-friendly soups, Gujarat requires sweet cumin bases with zero onion/garlic.",
    scores: ["96%", "91%", "Low Risk", "₹18.6cr"],
    mesh: ["6,400/min", "12 of 14", "19 active feeds"],
    reach: ["120 dark store pincodes", "14,100 kirana outlets", "3,600 Shakti kits", "5 regional languages"],
    signals: [
      { src: "CALENDAR SIGNAL", t: "Navratri 9-day fasting begins tomorrow across West & North India", v: 96, hot: 1 },
      { src: "SEARCH TRENDS", t: '"vrat recipes without onion garlic" +420% in Maharashtra & Gujarat', v: 93, hot: 1 },
      { src: "BLINKIT ORDERS", t: "Fasting ingredients & instant meal searches up 3.1× in 85 pincodes", v: 87, hot: 1 },
      { src: "WHATSAPP GROUPS", t: "9-day fasting menus widely circulating in family communities", v: 82 },
      { src: "CONSUMER REVIEWS", t: "'Is this vrat-safe / no onion garlic?' top question on Blinkit PDPs", v: 84 },
      { src: "KIRANA EPOS", t: "West cluster: Fasting basket building 4 days early in 14,100 stores", v: 76 }
    ],
    verdict: "✓ Predicted category sales lift +24% in West & North · Clear 'Vrat-Safe / No Onion Garlic' badge lifts checkout conversion 19pt",
    kpis: [
      ["44 min", "Time to Live Ads", "vs 6 weeks"],
      ["12 of 14", "Regional Versions", "Tailored"],
      ["14,100", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹8,100", "Compute Cost", "vs ₹12L Agency"],
      ["+24%", "Predicted Sales Lift", "₹18.6 Cr"]
    ],
    assets: ASSETS.map(a => {
      if (a.c === "MH") {
        return { ...a, head: "उपवासाला चालेल.", sub: "व्रत-friendly · साबुदाणा सूप · 5 मिनिटांत", badge: "Live · Vrat Certified", englishMeaning: "Safe for fasting. Sabudana comfort soup ready in 5 minutes." };
      }
      if (a.c === "GJ") {
        return { ...a, head: "નવરાત્રી સ્પેશિયલ સૂપ.", sub: "કાંદા-લસણ વગર · ૧૦૦% ઉપવાસ-યોગ્ય", badge: "Live · No Onion Garlic", englishMeaning: "Navratri special soup. Zero onion or garlic, 100% fasting safe." };
      }
      return a;
    })
  },
  monsoon: {
    name: "Monsoon Downpour in West",
    meta: "IMD Weather Alert · 6 Straight Days of Rain in Mumbai & Pune",
    blurb: "Heavy rainfall causing commute delays. Surge in indoor snacking and 5-minute hot soup demand.",
    headlineInsight: "Heavy monsoon rain in Mumbai — 5-minute hot snack searches up 260%. Recommend act now.",
    recommendation: "Approve & launch 'Ready in 5 minutes' rainy-day creative campaign across Mumbai, Pune, Goa, and Surat quick-commerce dark stores.",
    urgencyLevel: "High (Next 12h)",
    affectedRegions: ["Mumbai", "Pune", "Thane", "Surat", "Goa"],
    marketLift: "+15% Predicted Category Sales Lift",
    revenueHeadroom: "₹9.8 Crore Incremental Sales",
    windowDuration: "5-Day Rain Window",
    targetMin: 41,
    opp: "Continuous monsoon downpour across Mumbai & Western coast. Misery in daily commute triggers instant comfort-food and hot soup cravings at 4 PM and 9 PM.",
    scores: ["88%", "89%", "Low Risk", "₹9.8cr"],
    mesh: ["7,300/min", "11 of 14", "19 active feeds"],
    reach: ["98 dark store pincodes", "11,200 kirana outlets", "2,800 Shakti kits", "4 regional languages"],
    signals: [
      { src: "IMD WEATHER", t: "Mumbai & Western Ghats: 6th day of torrential rain, red alert active", v: 93, hot: 1 },
      { src: "SEARCH TRENDS", t: '"quick hot snacks rainy day" +260% in Mumbai & Pune', v: 90, hot: 1 },
      { src: "SWIGGY INSTAMART", t: "Hot soup & instant noodle orders +61% in Mumbai pincodes", v: 88, hot: 1 },
      { src: "INSTAGRAM REELS", t: "Monsoon comfort-food cooking reels at peak viral circulation", v: 81 },
      { src: "KIRANA EPOS", t: "West cluster small sachet mix sales up 38% in residential areas", v: 73 }
    ],
    verdict: "✓ Predicted category sales lift +15% · 'Hot in 5 minutes' headline outperforms gourmet taste claims by 17pt during heavy rain",
    kpis: [
      ["41 min", "Time to Live Ads", "vs 6 weeks"],
      ["11 of 14", "Regional Versions", "Tailored"],
      ["11,200", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹7,600", "Compute Cost", "vs ₹12L Agency"],
      ["+15%", "Predicted Sales Lift", "₹9.8 Cr"]
    ],
    assets: ASSETS.map(a => {
      if (a.c === "MH") {
        return { ...a, head: "बाहेर पाऊस, घरात गरमागरम सूप!", sub: "फक्त ५ मिनिटांत तयार · नॉर स्वीट कॉर्न", badge: "Live · Monsoon Quick Comfort", englishMeaning: "Raining outside, steaming soup inside! Ready in just 5 minutes." };
      }
      return a;
    })
  },
  cricket: {
    name: "IPL Big Match & Late Night Snacking",
    meta: "Cricket Calendar · Final Match Evening · All-India Metros",
    blurb: "Prime-time cricket match triggering huge late-night snacking basket additions between 8 PM - 11 PM.",
    headlineInsight: "Cricket match evening — late-night meal basket additions up 380% in 14 metros. Recommend act now.",
    recommendation: "Approve & launch midnight cricket companion campaign with 'Halftime 4-minute hot bowl' banner ads on Blinkit, Zepto & Swiggy Instamart.",
    urgencyLevel: "Immediate (Next 3h)",
    affectedRegions: ["Bengaluru", "Chennai", "Mumbai", "Delhi NCR", "Kolkata", "Hyderabad"],
    marketLift: "+28% Predicted Category Sales Lift",
    revenueHeadroom: "₹21.4 Crore Incremental Sales",
    windowDuration: "6-Hour Match Window",
    targetMin: 38,
    opp: "High-stakes cricket match creates massive household snacking spike. Consumers want hot, satisfying comfort food that takes less than 5 minutes during match breaks.",
    scores: ["97%", "98%", "Low Risk", "₹21.4cr"],
    mesh: ["10,200/min", "14 of 14", "19 active feeds"],
    reach: ["180 dark store pincodes", "24,000 kirana outlets", "5,000 Shakti kits", "6 regional languages"],
    signals: [
      { src: "EVENT CALENDAR", t: "Cricket Final match tonight, projected 180M simultaneous viewers", v: 98, hot: 1 },
      { src: "ZEPTO & BLINKIT", t: "Midnight snack searches +380% between 7 PM - 11 PM", v: 95, hot: 1 },
      { src: "SWIGGY INSTAMART", t: "Quick meal basket additions peaking in urban metro hubs", v: 91, hot: 1 },
      { src: "TWITTER / X", t: "Match banter and #LateNightSnacks trending in India", v: 84 },
      { src: "KIRANA EPOS", t: "Evening small-pack snack offtake up 45% across all 14 clusters", v: 79 }
    ],
    verdict: "✓ Predicted category sales lift +28% · 'Match break 4-minute bowl' messaging boosts conversion by 26pt on quick-commerce apps",
    kpis: [
      ["38 min", "Time to Live Ads", "vs 6 weeks"],
      ["14 of 14", "Regional Versions", "Tailored"],
      ["24,000", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹6,800", "Compute Cost", "vs ₹12L Agency"],
      ["+28%", "Predicted Sales Lift", "₹21.4 Cr"]
    ],
    assets: ASSETS.map(a => {
      if (a.c === "KA") {
        return { ...a, head: "ಮ್ಯಾಚ್ ಬ್ರೇಕ್‌ನಲ್ಲಿ ಬಿಸಿ ಸೂಪ್!", sub: "4 ನಿಮಿಷದಲ್ಲಿ ರೆಡಿ · ಬಿಸಿ ಬಿಸಿ ರುಚಿ", badge: "Live · Match Special", englishMeaning: "Hot soup in match break! Ready in 4 minutes." };
      }
      if (a.c === "TN") {
        return { ...a, head: "மேட்ச் பார்க்கும்போது சூடான சூப்!", sub: "4 நிமிடங்களில் தயார் · மிளகு சுவை", badge: "Live · Match Special", englishMeaning: "Hot soup while watching the match! Ready in 4 minutes." };
      }
      return a;
    })
  },
  diwali: {
    name: "Diwali Festive Guest Rush",
    meta: "Festival Calendar · Diwali Week · North & West Clusters",
    blurb: "Peak home-hosting week — families want an impressive hot starter soup ready before guests arrive for mithai and dinner.",
    headlineInsight: "Diwali guest season has begun — 'quick starter soup for guests' searches up 275% in Delhi & Gujarat. Recommend act now.",
    recommendation: "Approve & launch a 'guest-ready in 4 minutes' Diwali hosting campaign across North & West quick-commerce dark stores.",
    urgencyLevel: "High (Next 12h)",
    affectedRegions: ["Delhi NCR", "Uttar Pradesh", "Rajasthan", "Gujarat", "Punjab"],
    marketLift: "+21% Predicted Category Sales Lift",
    revenueHeadroom: "₹16.4 Crore Incremental Sales",
    windowDuration: "6-Day Festive Window",
    targetMin: 42,
    opp: "Diwali guest season means back-to-back home visits every evening. Hosts want an impressive hot starter that doesn't pull them away from decorating or rangoli for long.",
    scores: ["93%", "90%", "Low Risk", "₹16.4cr"],
    mesh: ["7,900/min", "13 of 14", "19 active feeds"],
    reach: ["132 dark store pincodes", "16,800 kirana outlets", "4,100 Shakti kits", "5 regional languages"],
    signals: [
      { src: "CALENDAR SIGNAL", t: "Diwali week begins across North & West India, peak home-hosting days ahead", v: 94, hot: 1 },
      { src: "SEARCH TRENDS", t: '"quick starter soup for guests" +275% in Delhi NCR & Gujarat', v: 90, hot: 1 },
      { src: "BLINKIT ORDERS", t: "Festive hosting basket additions +52% in 132 pincodes", v: 86, hot: 1 },
      { src: "SWIGGY INSTAMART", t: "Evening guest-ready snack orders up 2.1× in Delhi & Jaipur", v: 81 },
      { src: "WHATSAPP GROUPS", t: "Diwali hosting menu shares circulating widely in family groups", v: 75 },
      { src: "KIRANA EPOS", t: "Festive gifting & sachet combo sales up in 16,800 North & West stores", v: 71 }
    ],
    verdict: "✓ Predicted category sales lift +21% over Diwali week · 'Guest-ready in 4 minutes' messaging outperforms generic festive ads by 20pt",
    kpis: [
      ["42 min", "Time to Live Ads", "vs 6 weeks"],
      ["13 of 14", "Regional Versions", "Tailored"],
      ["16,800", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹8,900", "Compute Cost", "vs ₹12L Agency"],
      ["+21%", "Predicted Sales Lift", "₹16.4 Cr"]
    ],
    assets: ASSETS.map(a => {
      if (a.c === "DL") {
        return { ...a, head: "मेहमानों के लिए झटपट सूप।", sub: "दिवाली स्पेशल · 4 मिनट में तैयार", badge: "Live · Diwali Guest Special", englishMeaning: "Quick soup for guests. Diwali special, ready in 4 minutes." };
      }
      if (a.c === "GJ") {
        return { ...a, head: "દિવાળીના મહેમાનો માટે સૂપ.", sub: "૪ મિનિટમાં તૈયાર · તહેવારની મીઠાશ", badge: "Live · Diwali Guest Special", englishMeaning: "Soup for Diwali guests. Ready in 4 minutes with festive sweetness." };
      }
      return a;
    })
  },
  examseason: {
    name: "Board Exam Late-Night Study Season",
    meta: "Academic Calendar · Board Exams Peak · All-India Metros",
    blurb: "Students pulling late-night study sessions; parents want a light, warm snack that doesn't feel heavy before bed.",
    headlineInsight: "Board exam season peaks tonight — 'light snack for late night studying' searches up 240% nationwide. Recommend act now.",
    recommendation: "Approve & launch a 'light, warm, no-mess' study-break campaign across all-India quick-commerce and late-night kirana counters.",
    urgencyLevel: "Moderate",
    affectedRegions: ["Delhi NCR", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad"],
    marketLift: "+12% Predicted Category Sales Lift",
    revenueHeadroom: "₹7.4 Crore Incremental Sales",
    windowDuration: "3-Week Exam Season Window",
    targetMin: 50,
    opp: "Board exam season keeps students and parents up past 11 PM nationwide. They want something warm and light enough not to derail sleep, ready between study blocks.",
    scores: ["85%", "82%", "Low Risk", "₹7.4cr"],
    mesh: ["5,100/min", "10 of 14", "19 active feeds"],
    reach: ["76 dark store pincodes", "9,000 kirana outlets", "2,100 Shakti kits", "6 regional languages"],
    signals: [
      { src: "ACADEMIC CALENDAR", t: "Board exams peak this week across major metros nationwide", v: 87, hot: 1 },
      { src: "SEARCH TRENDS", t: '"light snack for late night studying" +240% nationwide', v: 85, hot: 1 },
      { src: "BLINKIT ORDERS", t: "10 PM-1 AM soup & light snack orders up 44% near residential areas", v: 80, hot: 1 },
      { src: "SWIGGY INSTAMART", t: "Parent-driven late-night reorders rising in exam-heavy pincodes", v: 74 },
      { src: "KIRANA EPOS", t: "Small sachet late-counter sales up in 9,000 metro stores", v: 68 }
    ],
    verdict: "✓ Predicted category sales lift +12% during exam season · 'Light & warm, no heavy feeling' messaging outperforms indulgence-led ads by 14pt after 10 PM",
    kpis: [
      ["50 min", "Time to Live Ads", "vs 6 weeks"],
      ["10 of 14", "Regional Versions", "Tailored"],
      ["9,000", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹6,200", "Compute Cost", "vs ₹12L Agency"],
      ["+12%", "Predicted Sales Lift", "₹7.4 Cr"]
    ],
    assets: ASSETS
  }
};

export const CLUSTERS: Cluster[] = [
  { c: "MH", n: "Maharashtra", lang: "mr-IN", note: "Sabudana & mild spice base, vrat-safe, coriander seed finish", t: [46, 58, 54, 50, 62, 55], tasteSummary: "Mild sweetness with coriander tempering" },
  { c: "DL", n: "Delhi NCR", lang: "hi-IN", note: "Warming, mild heat, ghee notes, thicker rich body for cold evenings", t: [42, 40, 58, 60, 70, 74], tasteSummary: "Thick warming broth with ghee aroma" },
  { c: "KA", n: "Karnataka", lang: "kn-IN", note: "Coconut and curry-leaf tempering with medium peppery heat", t: [48, 62, 64, 54, 66, 48], tasteSummary: "Curry-leaf & coconut aroma" },
  { c: "TN", n: "Tamil Nadu", lang: "ta-IN", note: "Tamarind-forward rasam notes, crushed black pepper, thinner broth", t: [28, 84, 72, 58, 68, 40], tasteSummary: "Tamarind tang & crushed pepper" },
  { c: "WB", n: "West Bengal", lang: "bn-IN", note: "Mustard-oil base, delicate sweetness, pungent aroma", t: [38, 54, 46, 52, 80, 58], tasteSummary: "Mustard aroma with delicate sweet touch" },
  { c: "GJ", n: "Gujarat", lang: "gu-IN", note: "Distinctly sweeter, lighter body, no pungent garlic, gentle cumin", t: [82, 38, 30, 44, 55, 62], tasteSummary: "Sweet undertone & gentle spices" },
  { c: "UP", n: "Uttar Pradesh", lang: "hi-IN", note: "Robust whole spices, heavier body, generous seasoning", t: [40, 44, 66, 68, 64, 76], tasteSummary: "Robust whole spices & ginger warmth" },
  { c: "AP", n: "Andhra Pradesh", lang: "te-IN", note: "Guntur chilli heat, tangy tamarind finish, bold seasoning", t: [26, 76, 90, 66, 70, 50], tasteSummary: "Fiery Guntur chilli & tangy tamarind" },
  { c: "TG", n: "Telangana", lang: "te-IN", note: "Nizami dum-style layered spice, saffron warmth, rich biryani-adjacent aroma", t: [32, 54, 68, 62, 80, 66], tasteSummary: "Hyderabadi dum-spice & saffron aroma" },
  { c: "KL", n: "Kerala", lang: "ml-IN", note: "Coconut milk body, black pepper, aromatic curry leaves", t: [44, 58, 68, 50, 72, 66], tasteSummary: "Creamy coconut milk & Wayanad pepper" },
  { c: "PB", n: "Punjab", lang: "pa-IN", note: "Rich creamy butter notes, robust warming spices, hearty winter body", t: [44, 36, 52, 62, 66, 84], tasteSummary: "Rich butter broth with warming spice depth" },
  { c: "RJ", n: "Rajasthan", lang: "hi-IN", note: "Dry-spice forward, mathania chilli warmth, low sourness", t: [34, 42, 78, 64, 60, 58], tasteSummary: "Dry roasted spices & warming chilli" },
  { c: "MP", n: "Madhya Pradesh", lang: "hi-IN", note: "Balanced central profile, street-style sweet-sour-spicy blend", t: [46, 48, 56, 56, 58, 60], tasteSummary: "Balanced chatpata sweet-sour-spicy" },
  { c: "BR", n: "Bihar & Jharkhand", lang: "hi-IN", note: "Mustard & cumin tempering, simple spicing, hearty portions", t: [36, 52, 54, 60, 68, 72], tasteSummary: "Mustard & roasted cumin tempering" },
  { c: "AS", n: "Assam & North-East", lang: "as-IN", note: "Light, fresh ginger-herb broth, minimal oil, clean finish", t: [40, 60, 48, 44, 74, 42], tasteSummary: "Clean fresh ginger & herb aroma" }
];

export const AGENTS: AgentInfo[] = [
  {
    id: "01",
    n: "SCOUT",
    d: "Scans weather, festival calendar, kirana sales & search trends",
    t: 2.0,
    log: (t) => `SCOUT: ${t.name} threshold crossed · ${t.meta}`,
    details: {
      role: "Demand Signal Ingestion & Threshold Monitoring",
      dataSources: ["IMD Weather API", "Google Search Trends India", "Swiggy Instamart Basket Real-time Feed", "Blinkit Pincode Logs", "Kirana EPOS Network"],
      reasoning: "Continuously scans 19 real-time data feeds for sudden meal-occasion spikes above historical baseline.",
      outputArtifact: "Real-time occasion trigger event payload."
    }
  },
  {
    id: "02",
    n: "SWAAD",
    d: "Adapts 1 national recipe into 14 regional taste profiles",
    t: 3.5,
    log: () => "SWAAD: one occasion → <span class='ok'>14 regional taste profiles</span> · tamarind for TN, mustard for WB",
    details: {
      role: "Regional Taste Resolution (WiMI Engine)",
      dataSources: ["HUL Culinary Knowledge Graph", "Nielsen Regional Offtake Data", "Knorr Culinary Research Specs"],
      reasoning: "Maps single national product recipe into 14 cluster-specific taste vectors across 6 sensory axes.",
      outputArtifact: "14 SWAAD Cluster Taste Profiles & Recipe Adaptation Specs."
    }
  },
  {
    id: "03",
    n: "ARBITER",
    d: "Calculates sales opportunity, stock readiness & ROI",
    t: 2.0,
    log: () => "ARBITER: stock cover healthy in 13 clusters · GO, Punjab flagged for claim review",
    details: {
      role: "Financial & Supply Chain Feasibility Assessment",
      dataSources: ["HUL SAP ERP Sachet Inventory", "Distributor Stock Cover Logs", "Quick Commerce Warehouse Stock"],
      reasoning: "Calculates expected ROI, stock availability, and commercial risk score before triggering content generation.",
      outputArtifact: "Occasion Card & Auto-Approved Deployment Clearance."
    }
  },
  {
    id: "04",
    n: "ECHO",
    d: "Simulates 10,000 Indian household reactions to copy",
    t: 4.5,
    log: () => "ECHO: 'quick comfort for family' beats 'gourmet' by 23pt in Tier-2 households",
    details: {
      role: "Synthetic Household Consumer Simulation",
      dataSources: ["HUL Consumer Persona Memory Graph", "WhatsApp Recipe Share Archives", "PDP Review Sentiment"],
      reasoning: "Runs multi-agent Monte Carlo simulations across 10,000 synthetic Indian household personas.",
      outputArtifact: "Messaging Resonance & Conversion Lift Predictions."
    }
  },
  {
    id: "05",
    n: "MAKER",
    d: "Renders 14 regional digital pack twin ads in seconds",
    t: 8.0,
    log: () => "MAKER: recipe assets rendered from pack twins · <span class='ok'>no food shoot required</span>",
    details: {
      role: "Synthetic Creative Asset Rendering",
      dataSources: ["3D Digital Pack Twins", "IPG Studio Visual Rendering Pipeline", "BrandDNAi Asset Library"],
      reasoning: "Generates photorealistic regional dish stills and 9:16 reels directly from digital pack twins without physical shoots.",
      outputArtifact: "62 Multi-Format Visual Creative Assets."
    }
  },
  {
    id: "06",
    n: "BHASHA",
    d: "Translates and localizes into 6 regional languages & dialects",
    t: 6.5,
    log: () => "BHASHA: hi · ta · te · mr · bn · pa localised · <span class='wn'>'katori' not 'cup'</span> in Hindi packs",
    details: {
      role: "Cultural & Linguistic Localisation Engine",
      dataSources: ["HUL WiMI Vernacular Dictionary", "Local Kitchen Utensil Naming Ontology"],
      reasoning: "Ensures authentic regional kitchen vocabulary (e.g., using 'katori' in Hindi, 'baati' in Bengali, 'kinnam' in Tamil).",
      outputArtifact: "6 Vernacular Localised Copy Bundles."
    }
  },
  {
    id: "07",
    n: "COMMERCE",
    d: "Routes ads to Blinkit, Swiggy Instamart, Zepto & Kirana posters",
    t: 5.5,
    log: () => "COMMERCE: quick-commerce feeds live · Shakti entrepreneur kits queued",
    details: {
      role: "Omnichannel Deployment & Channel Distribution",
      dataSources: ["Blinkit/Swiggy API Connectors", "WhatsApp Business API", "Shakti Entrepreneur App API"],
      reasoning: "Pushes localized PDP banners to quick commerce, updates SEO recipe pages, and sends Shakti seller kits.",
      outputArtifact: "Omnichannel Dispatch Payload."
    }
  },
  {
    id: "08",
    n: "SENTINEL",
    d: "Audits ads against FSSAI food laws & flags unverified health claims",
    t: 3.0,
    log: () => "SENTINEL: auditing claims against FSSAI Advertising Regulations 2018…",
    details: {
      role: "Policy-as-Code Regulatory & Compliance Auditor",
      dataSources: ["FSSAI Advertising & Claims Regulations 2018", "Food Safety and Standards Act 2006", "HUL Legal & Regulatory Policy Rules"],
      reasoning: "Audits every asset for statutory compliance. Flags any health or nutrition claims for mandatory human review (Autonomy L4).",
      outputArtifact: "Compliance Certification Log & Quarantined Claim Flags."
    }
  }
];

export const GUARDS: Array<[string, "pass" | "flag", string]> = [
  ["FSSAI food labelling rules", "pass", "Verified compliant"],
  ["Nutrition & health claim audit", "flag", "Action required: Human review"],
  ["Allergen & vegetarian green dot check", "pass", "100% Cleared"],
  ["Vrat / religious dietary suitability", "pass", "Verified for region"],
  ["Advertising Standards (ASCI) guidelines", "pass", "Cleared"],
  ["Recipe safety & 4-minute cooking test", "pass", "Verified"]
];
