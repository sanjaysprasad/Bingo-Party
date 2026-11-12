/**
 * Monopoly: Kerala Edition (Mallu Monopoly)
 * Complete Game Configuration, Board Spaces, Economy, Rent Schedules,
 * Card Decks (Chance & Community Chest), and Malayalam Dialogue Manifest.
 */

window.MALLU_MONOPOLY_CONFIG = {
  currency: 'INR',
  currencySymbol: '₹',
  startingBalance: 15000,
  startSalary: 2000,
  incomeTax: 2000,
  luxuryTax: 1000,
  jailFine: 500,
  minimumDenomination: 50,
  maxHousesPerProperty: 4,
  maxHotelsPerProperty: 1,
  totalBankHouses: 32,
  totalBankHotels: 12,

  // Player Tokens available in Kerala Edition
  tokens: [
    { id: 'coconut', name: 'Coconut', icon: '🥥', desc: 'Nammude Thenga' },
    { id: 'elephant', name: 'Gajarajan Elephant', icon: '🐘', desc: 'Anakkaran Pride' },
    { id: 'houseboat', name: 'Kettuvallam Houseboat', icon: '🚢', desc: 'Alappuzha Cruiser' },
    { id: 'auto', name: 'Auto Rickshaw', icon: '🛺', desc: 'Meter Auto' },
    { id: 'palm', name: 'Coconut Palm', icon: '🌴', desc: 'Pacha Thanal' },
    { id: 'ksrtc', name: 'KSRTC Swift Bus', icon: '🚌', desc: 'Aanavandi' },
    { id: 'kathakali', name: 'Kathakali Crown', icon: '👑', desc: 'Classical Icon' },
    { id: 'snack', name: 'Neyyappam', icon: '🍛', desc: 'Chaya Kadi' }
  ],

  // Bot Personalities inspired by Malayalam Cinema Legends
  botProfiles: [
    { name: 'Dashamoolam Damu', token: '🛺', dialogue: 'Damu aada parayunne!' },
    { name: 'Ramanan', token: '🥥', dialogue: 'Kure kashtapettu... kure nattellu poyi.' },
    { name: 'Gafoorkka', token: '🚢', dialogue: 'Gafoor ka dosth! Dubai vazhi Kanimangalam.' },
    { name: 'Ananthan Nambiar', token: '👑', dialogue: 'Athu oru kollaam aayirunnu!' },
    { name: 'Appukuttan', token: '🍛', dialogue: 'Enikkariyilla njan onnum arinjilla!' },
    { name: 'Manavalan', token: '🌴', dialogue: 'Dubaiyile valya business aayirunnu!' },
    { name: 'Pavam Ponnappan', token: '🐘', dialogue: 'Ellathinum athinteyathaaya samayamundu.' }
  ],

  // Colour Group Construction Costs
  colorGroupHouseCosts: {
    brown: 500,
    lightblue: 500,
    pink: 1000,
    orange: 1000,
    red: 1500,
    yellow: 1500,
    green: 2000,
    darkblue: 2000
  },

  // EXACT 40 BOARD SPACES (0 to 39 clockwise)
  boardSpaces: [
    // 0: START
    {
      index: 0,
      id: 'start',
      name: 'START – Kerala',
      subtitle: 'Collect ₹2,000 as you pass',
      type: 'start',
      icon: '🏁',
      salary: 2000
    },

    // 1: Kasaragod (Brown)
    {
      index: 1,
      id: 'kasaragod',
      name: 'Kasaragod',
      district: 'Kasaragod',
      type: 'property',
      group: 'brown',
      groupName: 'Brown',
      price: 600,
      mortgage: 300,
      houseCost: 500,
      hotelCost: 500,
      rent: {
        base: 20,
        fullSet: 50,
        house1: 100,
        house2: 300,
        house3: 850,
        house4: 1500,
        hotel: 2350
      }
    },

    // 2: Community Chest
    {
      index: 2,
      id: 'community_chest_1',
      name: 'Community Chest',
      subtitle: 'Kudumbashree & Bank',
      type: 'chest',
      icon: '📦'
    },

    // 3: Kanhangad (Brown)
    {
      index: 3,
      id: 'kanhangad',
      name: 'Kanhangad',
      district: 'Kasaragod',
      type: 'property',
      group: 'brown',
      groupName: 'Brown',
      price: 600,
      mortgage: 300,
      houseCost: 500,
      hotelCost: 500,
      rent: {
        base: 20,
        fullSet: 50,
        house1: 100,
        house2: 300,
        house3: 850,
        house4: 1500,
        hotel: 2350
      }
    },

    // 4: Income Tax
    {
      index: 4,
      id: 'income_tax',
      name: 'Income Tax',
      subtitle: 'Pay ₹2,000 to Government',
      type: 'tax',
      amount: 2000,
      icon: '💸'
    },

    // 5: Southern Railway (Transport)
    {
      index: 5,
      id: 'southern_railway',
      name: 'Southern Railway',
      subtitle: 'Shoranur Junction',
      type: 'transport',
      price: 2000,
      mortgage: 1000,
      icon: '🚆',
      rentSchedule: { 1: 250, 2: 500, 3: 1000, 4: 2000 }
    },

    // 6: Palakkad (Light Blue)
    {
      index: 6,
      id: 'palakkad',
      name: 'Palakkad',
      district: 'Palakkad',
      type: 'property',
      group: 'lightblue',
      groupName: 'Light Blue',
      price: 950,
      mortgage: 475,
      houseCost: 500,
      hotelCost: 500,
      rent: {
        base: 50,
        fullSet: 100,
        house1: 300,
        house2: 900,
        house3: 2700,
        house4: 4000,
        hotel: 5500
      }
    },

    // 7: Chance
    {
      index: 7,
      id: 'chance_1',
      name: 'Chance',
      subtitle: 'Nammude Bhagyam',
      type: 'chance',
      icon: '❓'
    },

    // 8: Malappuram (Light Blue)
    {
      index: 8,
      id: 'malappuram',
      name: 'Malappuram',
      district: 'Malappuram',
      type: 'property',
      group: 'lightblue',
      groupName: 'Light Blue',
      price: 950,
      mortgage: 475,
      houseCost: 500,
      hotelCost: 500,
      rent: {
        base: 50,
        fullSet: 100,
        house1: 300,
        house2: 900,
        house3: 2700,
        house4: 4000,
        hotel: 5500
      }
    },

    // 9: Manjeri (Light Blue)
    {
      index: 9,
      id: 'manjeri',
      name: 'Manjeri',
      district: 'Malappuram',
      type: 'property',
      group: 'lightblue',
      groupName: 'Light Blue',
      price: 1100,
      mortgage: 550,
      houseCost: 500,
      hotelCost: 500,
      rent: {
        base: 50,
        fullSet: 100,
        house1: 300,
        house2: 900,
        house3: 2700,
        house4: 4000,
        hotel: 5500
      }
    },

    // 10: Jail / Just Visiting
    {
      index: 10,
      id: 'jail',
      name: 'Jail / Just Visiting',
      subtitle: 'Lock-Up / Sandarshakar',
      type: 'jail',
      fine: 500,
      icon: '⛓️'
    },

    // 11: Kollam (Pink)
    {
      index: 11,
      id: 'kollam',
      name: 'Kollam',
      district: 'Kollam',
      type: 'property',
      group: 'pink',
      groupName: 'Pink',
      price: 1300,
      mortgage: 650,
      houseCost: 1000,
      hotelCost: 1000,
      rent: {
        base: 100,
        fullSet: 200,
        house1: 500,
        house2: 1500,
        house3: 4500,
        house4: 6250,
        hotel: 7500
      }
    },

    // 12: KSEB (Utility)
    {
      index: 12,
      id: 'kseb',
      name: 'KSEB',
      subtitle: 'Electricity Board',
      type: 'utility',
      price: 1500,
      mortgage: 750,
      icon: '⚡',
      multiplierSingle: 40,
      multiplierBoth: 100
    },

    // 13: Pathanamthitta (Pink)
    {
      index: 13,
      id: 'pathanamthitta',
      name: 'Pathanamthitta',
      district: 'Pathanamthitta',
      type: 'property',
      group: 'pink',
      groupName: 'Pink',
      price: 1300,
      mortgage: 650,
      houseCost: 1000,
      hotelCost: 1000,
      rent: {
        base: 100,
        fullSet: 200,
        house1: 500,
        house2: 1500,
        house3: 4500,
        house4: 6250,
        hotel: 7500
      }
    },

    // 14: Kottayam (Pink)
    {
      index: 14,
      id: 'kottayam',
      name: 'Kottayam',
      district: 'Kottayam',
      type: 'property',
      group: 'pink',
      groupName: 'Pink',
      price: 1500,
      mortgage: 750,
      houseCost: 1000,
      hotelCost: 1000,
      rent: {
        base: 100,
        fullSet: 200,
        house1: 500,
        house2: 1500,
        house3: 4500,
        house4: 6250,
        hotel: 7500
      }
    },

    // 15: Kochi Metro (Transport)
    {
      index: 15,
      id: 'kochi_metro',
      name: 'Kochi Metro',
      subtitle: 'Aluva to Petta',
      type: 'transport',
      price: 2000,
      mortgage: 1000,
      icon: '🚇',
      rentSchedule: { 1: 250, 2: 500, 3: 1000, 4: 2000 }
    },

    // 16: Thrissur (Orange)
    {
      index: 16,
      id: 'thrissur',
      name: 'Thrissur',
      district: 'Thrissur',
      type: 'property',
      group: 'orange',
      groupName: 'Orange',
      price: 1700,
      mortgage: 850,
      houseCost: 1000,
      hotelCost: 1000,
      rent: {
        base: 100,
        fullSet: 250,
        house1: 700,
        house2: 2000,
        house3: 5500,
        house4: 7500,
        hotel: 9500
      }
    },

    // 17: Community Chest
    {
      index: 17,
      id: 'community_chest_2',
      name: 'Community Chest',
      subtitle: 'Kudumbashree & Bank',
      type: 'chest',
      icon: '📦'
    },

    // 18: Kozhikode (Orange)
    {
      index: 18,
      id: 'kozhikode',
      name: 'Kozhikode',
      district: 'Kozhikode',
      type: 'property',
      group: 'orange',
      groupName: 'Orange',
      price: 1700,
      mortgage: 850,
      houseCost: 1000,
      hotelCost: 1000,
      rent: {
        base: 100,
        fullSet: 250,
        house1: 700,
        house2: 2000,
        house3: 5500,
        house4: 7500,
        hotel: 9500
      }
    },

    // 19: Kannur (Orange)
    {
      index: 19,
      id: 'kannur',
      name: 'Kannur',
      district: 'Kannur',
      type: 'property',
      group: 'orange',
      groupName: 'Orange',
      price: 1900,
      mortgage: 950,
      houseCost: 1000,
      hotelCost: 1000,
      rent: {
        base: 100,
        fullSet: 250,
        house1: 700,
        house2: 2000,
        house3: 5500,
        house4: 7500,
        hotel: 9500
      }
    },

    // 20: KSRTC Bus Stand / Free Parking
    {
      index: 20,
      id: 'free_parking',
      name: 'KSRTC Bus Stand',
      subtitle: 'Free Parking / Rest',
      type: 'parking',
      icon: '🚌'
    },

    // 21: Alappuzha (Red)
    {
      index: 21,
      id: 'alappuzha',
      name: 'Alappuzha',
      district: 'Alappuzha',
      type: 'property',
      group: 'red',
      groupName: 'Red',
      price: 2100,
      mortgage: 1050,
      houseCost: 1500,
      hotelCost: 1500,
      rent: {
        base: 150,
        fullSet: 350,
        house1: 900,
        house2: 2500,
        house3: 7000,
        house4: 8750,
        hotel: 10500
      }
    },

    // 22: Chance
    {
      index: 22,
      id: 'chance_2',
      name: 'Chance',
      subtitle: 'Nammude Bhagyam',
      type: 'chance',
      icon: '❓'
    },

    // 23: Varkala (Red)
    {
      index: 23,
      id: 'varkala',
      name: 'Varkala',
      district: 'Thiruvananthapuram',
      type: 'property',
      group: 'red',
      groupName: 'Red',
      price: 2100,
      mortgage: 1050,
      houseCost: 1500,
      hotelCost: 1500,
      rent: {
        base: 150,
        fullSet: 350,
        house1: 900,
        house2: 2500,
        house3: 7000,
        house4: 8750,
        hotel: 10500
      }
    },

    // 24: Fort Kochi (Red)
    {
      index: 24,
      id: 'fort_kochi',
      name: 'Fort Kochi',
      district: 'Ernakulam',
      type: 'property',
      group: 'red',
      groupName: 'Red',
      price: 2250,
      mortgage: 1125,
      houseCost: 1500,
      hotelCost: 1500,
      rent: {
        base: 150,
        fullSet: 350,
        house1: 900,
        house2: 2500,
        house3: 7000,
        house4: 8750,
        hotel: 10500
      }
    },

    // 25: Kerala Water Transport (Transport)
    {
      index: 25,
      id: 'kerala_water_transport',
      name: 'Water Transport',
      subtitle: 'State SWTD Boats',
      type: 'transport',
      price: 2000,
      mortgage: 1000,
      icon: '⛴️',
      rentSchedule: { 1: 250, 2: 500, 3: 1000, 4: 2000 }
    },

    // 26: Wayanad (Yellow)
    {
      index: 26,
      id: 'wayanad',
      name: 'Wayanad',
      district: 'Wayanad',
      type: 'property',
      group: 'yellow',
      groupName: 'Yellow',
      price: 2450,
      mortgage: 1225,
      houseCost: 1500,
      hotelCost: 1500,
      rent: {
        base: 200,
        fullSet: 400,
        house1: 1100,
        house2: 3300,
        house3: 8000,
        house4: 9750,
        hotel: 11500
      }
    },

    // 27: Thekkady (Yellow)
    {
      index: 27,
      id: 'thekkady',
      name: 'Thekkady',
      district: 'Idukki',
      type: 'property',
      group: 'yellow',
      groupName: 'Yellow',
      price: 2450,
      mortgage: 1225,
      houseCost: 1500,
      hotelCost: 1500,
      rent: {
        base: 200,
        fullSet: 400,
        house1: 1100,
        house2: 3300,
        house3: 8000,
        house4: 9750,
        hotel: 11500
      }
    },

    // 28: Kerala Water Authority (Utility)
    {
      index: 28,
      id: 'kwa',
      name: 'Water Authority',
      subtitle: 'Kerala Jalaprathikaram',
      type: 'utility',
      price: 1500,
      mortgage: 750,
      icon: '🚰',
      multiplierSingle: 40,
      multiplierBoth: 100
    },

    // 29: Kumarakom (Yellow)
    {
      index: 29,
      id: 'kumarakom',
      name: 'Kumarakom',
      district: 'Kottayam',
      type: 'property',
      group: 'yellow',
      groupName: 'Yellow',
      price: 2650,
      mortgage: 1325,
      houseCost: 1500,
      hotelCost: 1500,
      rent: {
        base: 200,
        fullSet: 400,
        house1: 1100,
        house2: 3300,
        house3: 8000,
        house4: 9750,
        hotel: 11500
      }
    },

    // 30: Police Station / Go to Jail
    {
      index: 30,
      id: 'go_to_jail',
      name: 'Police Station',
      subtitle: 'Go Directly to Jail!',
      type: 'gotojail',
      icon: '👮'
    },

    // 31: Munnar (Green)
    {
      index: 31,
      id: 'munnar',
      name: 'Munnar',
      district: 'Idukki',
      type: 'property',
      group: 'green',
      groupName: 'Green',
      price: 2800,
      mortgage: 1400,
      houseCost: 2000,
      hotelCost: 2000,
      rent: {
        base: 200,
        fullSet: 500,
        house1: 1300,
        house2: 3900,
        house3: 9000,
        house4: 11000,
        hotel: 12750
      }
    },

    // 32: Kovalam (Green)
    {
      index: 32,
      id: 'kovalam',
      name: 'Kovalam',
      district: 'Thiruvananthapuram',
      type: 'property',
      group: 'green',
      groupName: 'Green',
      price: 2800,
      mortgage: 1400,
      houseCost: 2000,
      hotelCost: 2000,
      rent: {
        base: 200,
        fullSet: 500,
        house1: 1300,
        house2: 3900,
        house3: 9000,
        house4: 11000,
        hotel: 12750
      }
    },

    // 33: Community Chest
    {
      index: 33,
      id: 'community_chest_3',
      name: 'Community Chest',
      subtitle: 'Kudumbashree & Bank',
      type: 'chest',
      icon: '📦'
    },

    // 34: Bekal (Green)
    {
      index: 34,
      id: 'bekal',
      name: 'Bekal',
      district: 'Kasaragod',
      type: 'property',
      group: 'green',
      groupName: 'Green',
      price: 3000,
      mortgage: 1500,
      houseCost: 2000,
      hotelCost: 2000,
      rent: {
        base: 200,
        fullSet: 500,
        house1: 1300,
        house2: 3900,
        house3: 9000,
        house4: 11000,
        hotel: 12750
      }
    },

    // 35: Kerala Railways (Transport)
    {
      index: 35,
      id: 'kerala_railways',
      name: 'Kerala Railways',
      subtitle: 'Silverline Corridor',
      type: 'transport',
      price: 2000,
      mortgage: 1000,
      icon: '🚄',
      rentSchedule: { 1: 250, 2: 500, 3: 1000, 4: 2000 }
    },

    // 36: Chance
    {
      index: 36,
      id: 'chance_3',
      name: 'Chance',
      subtitle: 'Nammude Bhagyam',
      type: 'chance',
      icon: '❓'
    },

    // 37: Kochi (Dark Blue)
    {
      index: 37,
      id: 'kochi',
      name: 'Kochi',
      district: 'Ernakulam',
      type: 'property',
      group: 'darkblue',
      groupName: 'Dark Blue',
      price: 3300,
      mortgage: 1650,
      houseCost: 2000,
      hotelCost: 2000,
      rent: {
        base: 350,
        fullSet: 800,
        house1: 1750,
        house2: 5500,
        house3: 12500,
        house4: 15000,
        hotel: 17500
      }
    },

    // 38: Luxury Tax
    {
      index: 38,
      id: 'luxury_tax',
      name: 'Luxury Tax',
      subtitle: 'Gold & Resort Tax: Pay ₹1,000',
      type: 'tax',
      amount: 1000,
      icon: '💍'
    },

    // 39: Thiruvananthapuram (Dark Blue)
    {
      index: 39,
      id: 'trivandrum',
      name: 'Thiruvananthapuram',
      district: 'Thiruvananthapuram',
      type: 'property',
      group: 'darkblue',
      groupName: 'Dark Blue',
      price: 3800,
      mortgage: 1900,
      houseCost: 2000,
      hotelCost: 2000,
      rent: {
        base: 350,
        fullSet: 800,
        house1: 1750,
        house2: 5500,
        house3: 12500,
        house4: 15000,
        hotel: 17500
      }
    }
  ],

  // COLOUR GROUPS DEFINITION
  colorGroups: {
    brown: { name: 'Brown', spaces: [1, 3], count: 2, hex: '#8B4513' },
    lightblue: { name: 'Light Blue', spaces: [6, 8, 9], count: 3, hex: '#38bdf8' },
    pink: { name: 'Pink', spaces: [11, 13, 14], count: 3, hex: '#ec4899' },
    orange: { name: 'Orange', spaces: [16, 18, 19], count: 3, hex: '#f97316' },
    red: { name: 'Red', spaces: [21, 23, 24], count: 3, hex: '#ef4444' },
    yellow: { name: 'Yellow', spaces: [26, 27, 29], count: 3, hex: '#eab308' },
    green: { name: 'Green', spaces: [31, 32, 34], count: 3, hex: '#22c55e' },
    darkblue: { name: 'Dark Blue', spaces: [37, 39], count: 2, hex: '#1e3a8a' },
    transport: { name: 'Transport', spaces: [5, 15, 25, 35], count: 4, hex: '#64748b' },
    utility: { name: 'Utility', spaces: [12, 28], count: 2, hex: '#e2e8f0' }
  },

  // CHANCE CARD DECK (Kerala Themed)
  chanceCards: [
    {
      id: 'chance_start',
      title: 'Vande Bharat Express to START',
      text: 'Catch the express train straight to START! Collect your ₹2,000 salary.',
      dialogue: 'Vande Bharat vannu makkale! Speedil pokaam!',
      movie: 'Express Speed',
      action: 'move_to',
      target: 0,
      collectStart: true
    },
    {
      id: 'chance_munnar',
      title: 'Munnar Tea Vacation',
      text: 'Pack your bags for a holiday in Munnar! If you pass START, collect ₹2,000.',
      dialogue: 'Munnarile thanuppil oru chaaya kudikkaan enthu rasam!',
      movie: 'Kilukkam',
      action: 'move_to',
      target: 31,
      collectStart: true
    },
    {
      id: 'chance_jail',
      title: 'Police Checking at Checkpost',
      text: 'Caught without helmet and rash driving! Go directly to Jail. Do not pass START, do not collect ₹2,000.',
      dialogue: 'Police aada parayunne! Athinte idakkoode oru van!',
      movie: 'Dashamoolam Damu',
      action: 'go_to_jail'
    },
    {
      id: 'chance_get_out_jail',
      title: 'MLA Recommendation Letter',
      text: 'You received a high-level recommendation! Keep this card to Get Out of Jail Free, or trade it to another player.',
      dialogue: 'Njan MLA-yude aalaanu! Enne thottaal kooduthal prashnamaakum!',
      movie: 'Sandesham',
      action: 'get_out_of_jail'
    },
    {
      id: 'chance_kochi_metro',
      title: 'Kochi Metro Fast Pass',
      text: 'Take the rapid metro directly to Kochi Metro station (Space 15). If you pass START, collect ₹2,000.',
      dialogue: 'Metroyil kayariyaal samayam poyathariyilla!',
      movie: 'Metro Kerala',
      action: 'move_to',
      target: 15,
      collectStart: true
    },
    {
      id: 'chance_onam_bonus',
      title: 'State Bumper Lottery Prize',
      text: 'Your Karunya ticket hit a mini prize! Collect ₹1,500 from the bank.',
      dialogue: 'Bumper adichu makkale! Ippozhaanu oru aashwasam!',
      movie: 'Pranchiyettan',
      action: 'receive_cash',
      amount: 1500
    },
    {
      id: 'chance_house_repairs',
      title: 'Monsoon Roof Renovation',
      text: 'Heavy monsoon rains damaged tiles! Pay ₹250 per house and ₹1,000 per hotel.',
      dialogue: 'Mazha vannu vazhi thuranney... Odu maari vekkanam!',
      movie: 'Thenmavin Kombath',
      action: 'property_repairs',
      houseCost: 250,
      hotelCost: 1000
    },
    {
      id: 'chance_treat_all',
      title: 'Thattukada Party for Everyone',
      text: 'Celebrate your promotion! Pay ₹200 to each other player for Porotta & Beef roast.',
      dialogue: 'Ellavarkkum oru double Porotta & Beef! Bill njan kodutholaam!',
      movie: 'Ustad Hotel',
      action: 'pay_each_player',
      amount: 200
    },
    {
      id: 'chance_speeding_fine',
      title: 'AI Camera Speeding Fine',
      text: 'Caught exceeding 80 km/h on NH 66! Pay ₹500 fine to the bank.',
      dialogue: 'AI camera kannu thurannu... Dha vannu fine challan!',
      movie: 'Motor Vehicle Dept',
      action: 'pay_cash',
      amount: 500
    },
    {
      id: 'chance_advance_nearest_transport',
      title: 'Catch Nearest Transport',
      text: 'Advance to the nearest Transport property. If unowned, you may purchase it. If owned, pay double rent!',
      dialogue: 'Bus kittiyilla enkil boatil povaam!',
      movie: 'Kerala Tourism',
      action: 'nearest_transport'
    }
  ],

  // COMMUNITY CHEST CARD DECK (Kerala Themed)
  communityChestCards: [
    {
      id: 'chest_onam_gift',
      title: 'Onam Family Gift & Kodi',
      text: 'Gulf uncle sent Onam celebration gift! Collect ₹1,000 from the bank.',
      dialogue: 'Gulf-il ninnu Mani vannu! Pathu rupayude gold coin!',
      movie: 'Nadodikkattu',
      action: 'receive_cash',
      amount: 1000
    },
    {
      id: 'chest_start',
      title: 'Advance to START',
      text: 'Head to Kerala Headquarters (START). Collect ₹2,000.',
      dialogue: 'Swantham naattil ethi... START-il ninnu salary edukkam!',
      movie: 'Godfather',
      action: 'move_to',
      target: 0,
      collectStart: true
    },
    {
      id: 'chest_doctor_fee',
      title: 'Ayurvedic Treatment & Massage',
      text: 'Went to Kottakkal Arya Vaidya Sala for rejuvenation. Pay ₹500.',
      dialogue: 'Uzhichilum kizhiyum koodi kazhinjappol nalloru aashwasam!',
      movie: 'Ayurveda Retreat',
      action: 'pay_cash',
      amount: 500
    },
    {
      id: 'chest_kudumbashree_dividend',
      title: 'Kudumbashree Chitty Dividend',
      text: 'Your local Chitty scheme matured! Collect ₹1,200 from the bank.',
      dialogue: 'Chitti thavanayaayi! Kaashu kayyil vannu!',
      movie: 'Manassinakkare',
      action: 'receive_cash',
      amount: 1200
    },
    {
      id: 'chest_kalyanam_gift',
      title: 'Wedding Reception Gifts',
      text: 'It is your family wedding! Collect ₹200 gift envelope from every player.',
      dialogue: 'Kalyanam aada kalyanam! Sadhyayum coverum venam!',
      movie: 'Kalyanaraman',
      action: 'collect_from_each_player',
      amount: 200
    },
    {
      id: 'chest_jail',
      title: 'Hartal Roadblock Violation',
      text: 'Broken curfew rules during Hartal! Go directly to Jail. Do not pass START, do not collect ₹2,000.',
      dialogue: 'Ivide hartal aada! Vandiyum kondu engottu pova?',
      movie: 'Sandesham',
      action: 'go_to_jail'
    },
    {
      id: 'chest_get_out_jail',
      title: 'High Court Bail Order',
      text: 'Advocate Mukundan Unni secured your anticipatory bail! Keep this card or trade it.',
      dialogue: 'Courtil ninnu stay order vannaal pinne aarkkum onnum cheyyaan patilla!',
      movie: 'Mukundan Unni Associates',
      action: 'get_out_of_jail'
    },
    {
      id: 'chest_temple_festival',
      title: 'Thrissur Pooram Contribution',
      text: 'Contribute to the annual Pooram fireworks and elephant caparisons. Pay ₹750.',
      dialogue: 'Pooram aayi makkale! Kaanunnavar aaraandu kanathe!',
      movie: 'Thrissur Pooram',
      action: 'pay_cash',
      amount: 750
    },
    {
      id: 'chest_tax_refund',
      title: 'Kerala GST Rebate',
      text: 'State government approved your business rebate! Collect ₹800 from the bank.',
      dialogue: 'Sarkkaarinte nalla manassu! Kaashu thirike kittiyallo!',
      movie: 'Chotta Mumbai',
      action: 'receive_cash',
      amount: 800
    },
    {
      id: 'chest_school_fee',
      title: 'Kids School Donation Fee',
      text: 'School reopening kit & PTA development fund. Pay ₹400 to the bank.',
      dialogue: 'School thurakkumbozhekum oronnum koodi vannolum!',
      movie: 'Spadikam',
      action: 'pay_cash',
      amount: 400
    }
  ],

  // MALAYALAM DIALOGUE AUDIO & CAPTION MANIFEST
  dialogues: {
    start: [
      { text: 'Swantham naattil ethi! Salary ₹2,000 edutho!', movie: 'Kilukkam', actor: 'Innocent' },
      { text: 'START-il kayari ₹2,000 medichu! Ini kalikal vere!', movie: 'Nadodikkattu', actor: 'Mohanlal' },
      { text: 'Ippozhaanu oru aashwasam vannath!', movie: 'Chitram', actor: 'Sreenivasan' }
    ],
    propertyPurchase: [
      { text: 'Ithu njan angu medikkuvaa! Swantham aayittoru sthalam!', movie: 'Manavalan', actor: 'Salim Kumar' },
      { text: 'Kowdiar Palace aayalum Marine Drive aayalum kaashundel njan medikkum!', movie: 'Pranchiyettan', actor: 'Mammootty' },
      { text: 'Sadhanam kayyil undo? Undel token vecho!', movie: 'Kilukkam', actor: 'Jagathy' },
      { text: 'Deal set aayi! Registration njan nale thanne cheyyum!', movie: 'Chotta Mumbai', actor: 'Mohanlal' }
    ],
    rentPayment: [
      { text: 'Kollalo! Rent aada rent! Ente kayyile ellam theernnu!', movie: 'Dashamoolam Damu', actor: 'Suraj' },
      { text: 'Dha dharidryam! Rent koduthu koduthu njan theernnu!', movie: 'Ramanan', actor: 'Harisree Ashokan' },
      { text: 'Ithra valya rento? Enikku oru chaya kudikkan polum baakki illa!', movie: 'Punjabi House', actor: 'Dileep' },
      { text: 'Kashtapettu undakkiya kaashu muzhuvan rent aayi poyi!', movie: 'Godfather', actor: 'Innocent' }
    ],
    rentReceived: [
      { text: 'Kaashu vannu makkale! Rent vanne! Nammal vere level!', movie: 'Lucifer', actor: 'Mohanlal' },
      { text: 'Kaikkooli alla, athu ente swantham sthalathinte rent!', movie: 'Sandesham', actor: 'Sreenivasan' },
      { text: 'Ente peraanu kooduthal sthalangalil kaanuka!', movie: 'Bheeshma Parvam', actor: 'Mammootty' }
    ],
    jailEnter: [
      { text: 'Police aada parayunne! Poyi lock-upil kedaam!', movie: 'Dashamoolam Damu', actor: 'Suraj' },
      { text: 'Enikku oru abadham pattiyathaanu saare! Kshemikkanam!', movie: 'C.I.D Moosa', actor: 'Dileep' },
      { text: 'Jailile kanji oru prathyeka swaadanu!', movie: 'Chotta Mumbai', actor: 'Manianpilla Raju' }
    ],
    jailExit: [
      { text: 'Njan purathirangi makkale! Ini kalikal vere!', movie: 'Spadikam', actor: 'Mohanlal' },
      { text: 'Bail kitti! Ini aarkkum enne thadayaan patilla!', movie: 'Mukundan Unni Associates', actor: 'Vineeth Sreenivasan' }
    ],
    doubles: [
      { text: 'Double veenu! Enikku veendum turn!', movie: 'Meesha Madhavan', actor: 'Dileep' },
      { text: 'Aha! Randum onnupole! Adutha roll koodi!', movie: 'Kilukkam', actor: 'Mohanlal' }
    ],
    chance: [
      { text: 'Nammude bhagyam parikshikkam! Chance card!', movie: 'Aaram Thampuran', actor: 'Mohanlal' },
      { text: 'Nallathonnum thonanilla... Card thurakku!', movie: 'In Harihar Nagar', actor: 'Mukesh' }
    ],
    communityChest: [
      { text: 'Kudumbashree box vannu! Kaashu thaa!', movie: 'Kalyanaraman', actor: 'Innocent' },
      { text: 'Bank chitti dividend kitti! Oru chaya koodi kitti!', movie: 'Pranchiyettan', actor: 'Mammootty' }
    ],
    tax: [
      { text: 'Sarkkaar tax! Ente kayyile kaashu poyi!', movie: 'Sandesham', actor: 'Jayaram' },
      { text: 'Tax koduthu koduthu njan oru vazhiyaayi!', movie: 'Pattana Pravesham', actor: 'Sreenivasan' }
    ],
    buildHouse: [
      { text: 'Ivide oru puthiya veedu panithu! Rent double!', movie: 'Manassinakkare', actor: 'Jayaram' },
      { text: 'Hotel aada hotel! 5-star resort ivide varum!', movie: 'Ustad Hotel', actor: 'Dulquer Salmaan' }
    ],
    trade: [
      { text: 'Namukku oru samjhotha aavam! Give and take!', movie: 'Sandesham', actor: 'Sreenivasan' },
      { text: 'Njan nalloru deal tharaam... Nee sammathikkuvo?', movie: 'Chitram', actor: 'Mohanlal' }
    ],
    auction: [
      { text: 'Vilikkeda vilikku! High bid aaraanu?', movie: 'Ravanaprabhu', actor: 'Mohanlal' },
      { text: '₹50 kooduthal! Enikku venam ee property!', movie: 'Manavalan', actor: 'Salim Kumar' }
    ],
    bankruptcy: [
      { text: 'Dha dharidryam! Njan theernnu... Bankrupt aayi!', movie: 'Ramanan', actor: 'Harisree Ashokan' },
      { text: 'Pawam njan... Ellaam poyi... Kure kashtapettu!', movie: 'Kilukkam', actor: 'Jagathy' },
      { text: 'Ente aasthiyum kayyum kaalum theernnu!', movie: 'Godfather', actor: 'Innocent' }
    ],
    victory: [
      { text: 'Njan jayichu makkale! Kerala Monopoly King!', movie: 'Aaram Thampuran', actor: 'Mohanlal' },
      { text: 'Ithaneda kalaride adavukal! Winner!', movie: 'Spadikam', actor: 'Mohanlal' },
      { text: 'Bilalinte kottayil thakarkkan aarumilla!', movie: 'Big B', actor: 'Mammootty' }
    ]
  }
};
