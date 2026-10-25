/**
 * Office - Portrait Bank, 3-Factor Security Verification (Banned / Expiry / Visuals),
 * Fake ID Mutation Engine & Animated Happiness Face
 */

const SUBJECTS = [
  'Mathematics', 'English Lit', 'Chemistry', 'Physics', 'Biology',
  'World History', 'Geography', 'Art & Design', 'Music Theory', 'Physical Ed.',
  'Computer Science', 'Drama & Theatre', 'French & Spanish', 'Economics', 'Woodwork',
  'Astronomy', 'Botany', 'School Library', 'Culinary Arts', 'Robotics Lab'
];

const TEACHER_QUOTES_NORMAL = [
  '"Good morning! Just signing in before first period bell."',
  '"Morning! Hope the staffroom coffee machine is working today."',
  '"Hello there! Here is my staff photo badge for inspection."',
  '"Running two minutes late—traffic by the school gates was wild!"',
  '"Good day! I have double Chemistry with Year 9 this morning."',
  '"Hi! My ID badge, expiry date, and clearance are all up to date."',
  '"Morning! Don\'t forget it\'s assembly in the main hall at 9:15."',
  '"Hello! Ready for another lively day of teaching."'
];

const TEACHER_QUOTES_DODGY = [
  '"Heh... yes, that is definitely me on the card. No need to look closely!"',
  '"Different tie or eye colour? Must be a trick of the fluorescent lights!"',
  '"Hello fellow educator! My badge is 100% genuine, trust me."',
  '"Expired? Oh, I\'m sure the admin office meant 2028, let me right in!"',
  '"Banned list?! That was a complete misunderstanding with the headmaster!"',
  '"That eye patch? Or those teeth? Totally normal, happens all the time!"'
];

const VALID_EXPIRY_DATES = [
  'DEC 2027', 'MAR 2028', 'AUG 2028', 'NOV 2028', 'JUN 2029'
];

const EXPIRED_DATES = [
  'JAN 2024', 'MAY 2024', 'NOV 2024', 'FEB 2025', 'AUG 2025', 'DEC 2025'
];

/**
 * Large Roster of 48 Base Teacher Archetypes (Humans, Monsters, Animals, Oddballs)
 */
const BASE_ROSTER = [
  // HUMANS (16)
  { id: 'h01', name: 'Mrs. Clara Higgins', category: 'Human', subType: 'human', skin: '#f5cba7', hairStyle: 'bun', hairColor: '#7f8c8d', eyeColor: '#2563eb', glasses: 'round', mouth: 'smile', outfit: '#1e293b', tie: '#ef4444', bg: '#dbeafe' },
  { id: 'h02', name: 'Mr. Arthur Pendelton', category: 'Human', subType: 'human', skin: '#f0b27a', hairStyle: 'short_part', hairColor: '#6e2c00', eyeColor: '#16a34a', glasses: 'square', mouth: 'mustache', outfit: '#5d4037', tie: '#f59e0b', bg: '#fef3c7' },
  { id: 'h03', name: 'Ms. Mei-Ling Chen', category: 'Human', subType: 'human', skin: '#fdebd0', hairStyle: 'bob', hairColor: '#1c2833', eyeColor: '#7c3aed', glasses: 'none', mouth: 'smile', outfit: '#334155', tie: '#facc15', bg: '#f3e8ff' },
  { id: 'h04', name: 'Coach Marcus Vance', category: 'Human', subType: 'human', skin: '#8d5524', hairStyle: 'flat_top', hairColor: '#17202a', eyeColor: '#d97706', glasses: 'none', mouth: 'grin', outfit: '#1e3a8a', tie: '#22c55e', bg: '#fee2e2' },
  { id: 'h05', name: 'Dr. Elena Rostova', category: 'Human', subType: 'human', skin: '#fadbd8', hairStyle: 'long_wavy', hairColor: '#d35400', eyeColor: '#0d9488', glasses: 'half_moon', mouth: 'smile', outfit: '#115e59', tie: '#ec4899', bg: '#d1fae5' },
  { id: 'h06', name: 'Mr. Barnaby Quilt', category: 'Human', subType: 'human', skin: '#f5cba7', hairStyle: 'bald_fringe', hairColor: '#bdc3c7', eyeColor: '#2563eb', glasses: 'round', mouth: 'beard_smile', outfit: '#1f618d', tie: '#f97316', bg: '#e0f2fe' },
  { id: 'h07', name: 'Ms. Priya Patel', category: 'Human', subType: 'human', skin: '#c68642', hairStyle: 'long_wavy', hairColor: '#17202a', eyeColor: '#15803d', glasses: 'square', mouth: 'smile', outfit: '#7c2d12', tie: '#06b6d4', bg: '#ffedd5' },
  { id: 'h08', name: 'Prof. Julian Sterling', category: 'Human', subType: 'human', skin: '#f5b7b1', hairStyle: 'pompadour', hairColor: '#f1c40f', eyeColor: '#2563eb', glasses: 'none', mouth: 'grin', outfit: '#2e4053', tie: '#a855f7', bg: '#e0e7ff' },
  { id: 'h09', name: 'Mrs. Fiona MacLeod', category: 'Human', subType: 'human', skin: '#fdebd0', hairStyle: 'curly_afro', hairColor: '#e67e22', eyeColor: '#16a34a', glasses: 'round', mouth: 'smile', outfit: '#14532d', tie: '#f59e0b', bg: '#dcfce7' },
  { id: 'h10', name: 'Mr. Kwame Mensah', category: 'Human', subType: 'human', skin: '#6e3b1e', hairStyle: 'curly_afro', hairColor: '#1c2833', eyeColor: '#0284c7', glasses: 'square', mouth: 'grin', outfit: '#1e3a8a', tie: '#facc15', bg: '#dbeafe' },
  { id: 'h11', name: 'Ms. Chloe Beaumont', category: 'Human', subType: 'human', skin: '#fadbd8', hairStyle: 'bob', hairColor: '#f5b041', eyeColor: '#9333ea', glasses: 'none', mouth: 'smile', outfit: '#831843', tie: '#38bdf8', bg: '#fce7f3' },
  { id: 'h12', name: 'Mr. Hector Ramirez', category: 'Human', subType: 'human', skin: '#e0ac69', hairStyle: 'spiky', hairColor: '#212f3d', eyeColor: '#b45309', glasses: 'none', mouth: 'mustache', outfit: '#14532d', tie: '#ef4444', bg: '#dcfce7' },
  { id: 'h13', name: 'Dr. Tobias Finn', category: 'Human', subType: 'human', skin: '#f5cba7', hairStyle: 'spiky', hairColor: '#a04000', eyeColor: '#2563eb', glasses: 'half_moon', mouth: 'beard_smile', outfit: '#4a235a', tie: '#4ade80', bg: '#f3e8ff' },
  { id: 'h14', name: 'Mrs. Greta Lindqvist', category: 'Human', subType: 'human', skin: '#fdebd0', hairStyle: 'bun', hairColor: '#f7dc6f', eyeColor: '#0284c7', glasses: 'square', mouth: 'smile', outfit: '#1e3a8a', tie: '#f43f5e', bg: '#e0f2fe' },
  { id: 'h15', name: 'Mr. Desmond O\'Connor', category: 'Human', subType: 'human', skin: '#f8c471', hairStyle: 'short_part', hairColor: '#d35400', eyeColor: '#16a34a', glasses: 'none', mouth: 'grin', outfit: '#145a32', tie: '#f59e0b', bg: '#d1fae5' },
  { id: 'h16', name: 'Ms. Nadia Al-Mansoor', category: 'Human', subType: 'human', skin: '#d68910', hairStyle: 'long_wavy', hairColor: '#17202a', eyeColor: '#0d9488', glasses: 'round', mouth: 'smile', outfit: '#581c87', tie: '#facc15', bg: '#f3e8ff' },

  // MONSTERS (12)
  { id: 'm01', name: 'Gorgonzola the Cyclops', category: 'Monster', subType: 'cyclops', skin: '#a855f7', hairStyle: 'spiky', hairColor: '#3b0764', eyeColor: '#facc15', glasses: 'none', mouth: 'tusks', outfit: '#1e293b', tie: '#22c55e', bg: '#f3e8ff' },
  { id: 'm02', name: 'Count Vladislav Teach', category: 'Monster', subType: 'vampire', skin: '#cbd5e1', hairStyle: 'pompadour', hairColor: '#0f172a', eyeColor: '#ef4444', glasses: 'none', mouth: 'vamp_smile', outfit: '#111827', tie: '#dc2626', bg: '#fee2e2' },
  { id: 'm03', name: 'Prof. Frankie Stein', category: 'Monster', subType: 'frankenstein', skin: '#4ade80', hairStyle: 'flat_top', hairColor: '#1e293b', eyeColor: '#f59e0b', glasses: 'square', mouth: 'neutral', outfit: '#374151', tie: '#3b82f6', bg: '#dcfce7' },
  { id: 'm04', name: 'Coach Yeti McFrost', category: 'Monster', subType: 'yeti', skin: '#7dd3fc', hairStyle: 'curly_afro', hairColor: '#f8fafc', eyeColor: '#2563eb', glasses: 'none', mouth: 'grin', outfit: '#0c4a6e', tie: '#f97316', bg: '#e0f2fe' },
  { id: 'm05', name: 'Dr. Blobbert Ooze', category: 'Monster', subType: 'slime', skin: '#84cc16', hairStyle: 'none', hairColor: '#65a30d', eyeColor: '#7c3aed', glasses: 'round', mouth: 'smile', outfit: '#365314', tie: '#ec4899', bg: '#ecfccb' },
  { id: 'm06', name: 'Mr. Gill Swampsworth', category: 'Monster', subType: 'swamp', skin: '#14b8a6', hairStyle: 'spiky', hairColor: '#0f766e', eyeColor: '#facc15', glasses: 'half_moon', mouth: 'smile', outfit: '#134e4a', tie: '#ef4444', bg: '#ccfbf1' },
  { id: 'm07', name: 'Madame Medusa Gorgon', category: 'Monster', subType: 'medusa', skin: '#c084fc', hairStyle: 'snakes', hairColor: '#16a34a', eyeColor: '#f59e0b', glasses: 'none', mouth: 'smile', outfit: '#581c87', tie: '#22c55e', bg: '#f3e8ff' },
  { id: 'm08', name: 'Ignatius Hornsby', category: 'Monster', subType: 'demon_imp', skin: '#f87171', hairStyle: 'horns', hairColor: '#1e293b', eyeColor: '#facc15', glasses: 'square', mouth: 'grin', outfit: '#7f1d1d', tie: '#38bdf8', bg: '#fee2e2' },
  { id: 'm09', name: 'Polly Phemus (One-Eye)', category: 'Monster', subType: 'cyclops', skin: '#fb923c', hairStyle: 'bun', hairColor: '#7c2d12', eyeColor: '#38bdf8', glasses: 'none', mouth: 'smile', outfit: '#431407', tie: '#a855f7', bg: '#ffedd5' },
  { id: 'm10', name: 'Baroness Carmilla', category: 'Monster', subType: 'vampire', skin: '#e2e8f0', hairStyle: 'long_wavy', hairColor: '#1e1b4b', eyeColor: '#ec4899', glasses: 'half_moon', mouth: 'vamp_smile', outfit: '#31102f', tie: '#38bdf8', bg: '#fce7f3' },
  { id: 'm11', name: 'Boltssworth Volt', category: 'Monster', subType: 'frankenstein', skin: '#86efac', hairStyle: 'spiky', hairColor: '#0f172a', eyeColor: '#2563eb', glasses: 'none', mouth: 'grin', outfit: '#1e3a8a', tie: '#facc15', bg: '#dbeafe' },
  { id: 'm12', name: 'Prof. Barnaby Bog', category: 'Monster', subType: 'swamp', skin: '#2dd4bf', hairStyle: 'bald_fringe', hairColor: '#047857', eyeColor: '#f59e0b', glasses: 'round', mouth: 'tusks', outfit: '#064e3b', tie: '#f43f5e', bg: '#d1fae5' },

  // ANIMALS (10)
  { id: 'a01', name: 'Sir Hootington Owl', category: 'Animal', subType: 'owl', skin: '#b45309', hairStyle: 'tufts', hairColor: '#78350f', eyeColor: '#f59e0b', glasses: 'round', mouth: 'beak', outfit: '#1e3a8a', tie: '#ef4444', bg: '#fef3c7' },
  { id: 'a02', name: 'Coach Barnaby Grizzly', category: 'Animal', subType: 'bear', skin: '#92400e', hairStyle: 'ears', hairColor: '#451a03', eyeColor: '#2563eb', glasses: 'none', mouth: 'snout_smile', outfit: '#14532d', tie: '#facc15', bg: '#dcfce7' },
  { id: 'a03', name: 'Madame Whiskers Cat', category: 'Animal', subType: 'cat', skin: '#fb923c', hairStyle: 'cat_ears', hairColor: '#c2410c', eyeColor: '#22c55e', glasses: 'half_moon', mouth: 'cat_mouth', outfit: '#581c87', tie: '#ec4899', bg: '#ffedd5' },
  { id: 'a04', name: 'Dr. Jeremiah Hopper', category: 'Animal', subType: 'frog', skin: '#22c55e', hairStyle: 'none', hairColor: '#15803d', eyeColor: '#facc15', glasses: 'square', mouth: 'wide_smile', outfit: '#0369a1', tie: '#ef4444', bg: '#dcfce7' },
  { id: 'a05', name: 'Prof. Percy Waddler', category: 'Animal', subType: 'penguin', skin: '#1e293b', hairStyle: 'tufts', hairColor: '#0f172a', eyeColor: '#38bdf8', glasses: 'round', mouth: 'beak', outfit: '#0f172a', tie: '#e11d48', bg: '#e0f2fe' },
  { id: 'a06', name: 'Mr. Reynard Tod (Fox)', category: 'Animal', subType: 'fox', skin: '#ea580c', hairStyle: 'cat_ears', hairColor: '#9a3412', eyeColor: '#eab308', glasses: 'none', mouth: 'snout_smile', outfit: '#1e3a8a', tie: '#10b981', bg: '#ffedd5' },
  { id: 'a07', name: 'Headmaster Brock Badger', category: 'Animal', subType: 'badger', skin: '#334155', hairStyle: 'ears', hairColor: '#f8fafc', eyeColor: '#f59e0b', glasses: 'square', mouth: 'snout_smile', outfit: '#4c1d95', tie: '#fbbf24', bg: '#e2e8f0' },
  { id: 'a08', name: 'Prof. Leo Maneheart', category: 'Animal', subType: 'lion', skin: '#f59e0b', hairStyle: 'mane', hairColor: '#b45309', eyeColor: '#16a34a', glasses: 'half_moon', mouth: 'cat_mouth', outfit: '#7f1d1d', tie: '#38bdf8', bg: '#fef3c7' },
  { id: 'a09', name: 'Ms. Minerva Screech', category: 'Animal', subType: 'owl', skin: '#94a3b8', hairStyle: 'tufts', hairColor: '#475569', eyeColor: '#38bdf8', glasses: 'square', mouth: 'beak', outfit: '#0f766e', tie: '#f43f5e', bg: '#f1f5f9' },
  { id: 'a10', name: 'Mr. Felix Purrington', category: 'Animal', subType: 'cat', skin: '#475569', hairStyle: 'cat_ears', hairColor: '#1e293b', eyeColor: '#facc15', glasses: 'round', mouth: 'cat_mouth', outfit: '#881337', tie: '#38bdf8', bg: '#e2e8f0' },

  // ROBOTS & ODDBALLS (6)
  { id: 'r01', name: 'Calc-Bot 9000', category: 'Oddball', subType: 'robot', skin: '#94a3b8', hairStyle: 'antenna', hairColor: '#ef4444', eyeColor: '#38bdf8', glasses: 'none', mouth: 'led_grid', outfit: '#334155', tie: '#f59e0b', bg: '#e0f2fe' },
  { id: 'r02', name: 'Zorp from Sector 7', category: 'Oddball', subType: 'alien', skin: '#a3e635', hairStyle: 'dual_antenna', hairColor: '#4d7c0f', eyeColor: '#9333ea', glasses: 'none', mouth: 'smile', outfit: '#3b0764', tie: '#38bdf8', bg: '#ecfccb' },
  { id: 'r03', name: 'Prof. Jack O. Lantern', category: 'Oddball', subType: 'pumpkin', skin: '#f97316', hairStyle: 'stem', hairColor: '#15803d', eyeColor: '#facc15', glasses: 'round', mouth: 'grin', outfit: '#451a03', tie: '#84cc16', bg: '#ffedd5' },
  { id: 'r04', name: 'Sir Rattles Ribcage', category: 'Oddball', subType: 'skeleton', skin: '#f8fafc', hairStyle: 'none', hairColor: '#cbd5e1', eyeColor: '#38bdf8', glasses: 'half_moon', mouth: 'led_grid', outfit: '#1e293b', tie: '#a855f7', bg: '#e2e8f0' },
  { id: 'r05', name: 'Ms. Ada Servo-Unit', category: 'Oddball', subType: 'robot', skin: '#f472b6', hairStyle: 'antenna', hairColor: '#38bdf8', eyeColor: '#facc15', glasses: 'square', mouth: 'led_grid', outfit: '#1e3a8a', tie: '#22c55e', bg: '#fce7f3' },
  { id: 'r06', name: 'Commander Xylar', category: 'Oddball', subType: 'alien', skin: '#67e8f9', hairStyle: 'dual_antenna', hairColor: '#0e7490', eyeColor: '#e11d48', glasses: 'round', mouth: 'smile', outfit: '#111827', tie: '#facc15', bg: '#cffafe' }
];

/**
 * Available Fake ID Visual Discrepancy Types (Includes Different Coloured Tie & Different Coloured Eyes!)
 */
const FAKE_MUTATION_CATALOG = [
  {
    id: 'tie_color_swap',
    label: 'Different Coloured Tie',
    desc: 'The tie colour on the ID photo does not match the computer record!'
  },
  {
    id: 'eye_color_swap',
    label: 'Different Coloured Eyes',
    desc: 'The teacher\'s eye colour on the ID photo mismatches the computer record!'
  },
  {
    id: 'false_teeth',
    label: 'Goofy False Teeth',
    desc: 'Wearing oversized buck teeth / chatter teeth in the ID photo!'
  },
  {
    id: 'eye_patch',
    label: 'Pirate Eye Patch',
    desc: 'Wearing a black pirate eye patch over their eye on the ID card!'
  },
  {
    id: 'different_hair',
    label: 'Wrong Hair / Disguise Wig',
    desc: 'Sporting a completely different hairstyle / clown wig on the ID card!'
  },
  {
    id: 'hair_color_swap',
    label: 'Wrong Hair / Top Colour',
    desc: 'Hair or head-top is dyed a different colour compared to records!'
  },
  {
    id: 'fake_moustache',
    label: 'Fake Handlebar Moustache',
    desc: 'A giant curly disguise moustache is stuck under their nose!'
  },
  {
    id: 'wrong_glasses',
    label: 'Mismatched Glasses / Shades',
    desc: 'Eyewear on the ID badge does not match the computer record!'
  },
  {
    id: 'wrong_hat',
    label: 'Suspicious Hat / Headgear',
    desc: 'Wearing an unregistered pirate hat / tin-foil hat / fez in the ID photo!'
  },
  {
    id: 'cheek_bandaid_scar',
    label: 'Band-Aid & Villain Scar',
    desc: 'Has a big X-plaster and dramatic facial scar not in the database!'
  },
  {
    id: 'wrong_outfit',
    label: 'Striped Burglar Outfit',
    desc: 'Wearing a black-and-white burglar shirt instead of their school blazer!'
  }
];

class PortraitSystem {
  constructor() {
    this.roster = BASE_ROSTER;
    this.mutations = FAKE_MUTATION_CATALOG;
  }

  /**
   * Returns true if `dayNumber` is the scheduled once-a-week Banned List attempt day!
   * Every 5-day school week has 1 day where someone on the Banned List queues up
   * (e.g., Day 2, Day 7, Day 12, Day 17, Day 22, etc.).
   */
  isBannedAttemptDay(dayNumber) {
    return (dayNumber % 5) === 2 || dayNumber === 1 && false;
  }

  /**
   * Generate a full Day's Queue of 10 Teachers.
   * Enforces 2 or 3 'dodgy' (must-deny) teachers per day out of 10, testing:
   *  1. Banned / Allowed status (once a week a BANNED teacher with valid expiry & matching visuals queues up!)
   *  2. Expiry Date (ID Expired vs Valid)
   *  3. Visual Portrait Match (including different coloured ties, different coloured eyes, false teeth, eye patch, etc.)
   */
  generateDayQueue(dayNumber) {
    const dodgyCount = Math.random() < 0.5 ? 2 : 3;
    const dodgyIndices = [];
    const indexSet = new Set();
    while (indexSet.size < dodgyCount) {
      const r = Math.floor(Math.random() * 10);
      if (!indexSet.has(r)) {
        indexSet.add(r);
        dodgyIndices.push(r);
      }
    }

    // Decide which dodgy teacher gets which discrepancy type today:
    // - Once a week (or if dayNumber % 5 === 2, plus a 30% chance on other days so players stay sharp!),
    //   one dodgy slot is a BANNED LIST entrant (Computer says BANNED, expiry is OK, visuals match 100%).
    // - At least one dodgy slot has an EXPIRED ID (or Visual + Expired).
    // - At least one dodgy slot has a pure VISUAL MISMATCH (prioritizing tie colour, eye colour, teeth, eye patch, hair).
    const hasBannedToday = (dayNumber % 5 === 2) || (dayNumber % 7 === 0);
    const bannedSlotIndex = hasBannedToday ? dodgyIndices[0] : -1;
    const expiredSlotIndex = dodgyIndices[hasBannedToday ? 1 : 0];

    const shuffled = [...this.roster].sort(() => Math.random() - 0.5);
    const queue = [];

    for (let i = 0; i < 10; i++) {
      const base = shuffled[i % shuffled.length];
      const isDodgy = indexSet.has(i);
      const subject = SUBJECTS[(i * 3 + dayNumber) % SUBJECTS.length];
      const staffCode = `STF-${1000 + ((dayNumber * 37 + i * 19) % 8900)}`;

      // Official record traits
      const officialTraits = {
        ...base,
        hat: 'none',
        falseTeeth: false,
        eyePatch: false,
        fakeMoustache: false,
        cheekScar: false,
        burglarShirt: false,
        hypnoEyes: false
      };

      const badgeTraits = { ...officialTraits };
      const appliedMutations = [];
      let isBanned = false;
      let isExpired = false;
      let expiryDateStr = VALID_EXPIRY_DATES[(dayNumber + i) % VALID_EXPIRY_DATES.length];

      if (isDodgy) {
        if (i === bannedSlotIndex) {
          // CHECK #1: BANNED LIST TEACHER!
          // Computer says BANNED, even though Expiry Date is OK and Visuals match 100%!
          isBanned = true;
          isExpired = false;
          appliedMutations.push({
            id: 'banned_watchlist',
            label: 'On the BANNED List',
            desc: 'Computer record shows this person is BANNED from the school!'
          });
        } else if (i === expiredSlotIndex && Math.random() < 0.75) {
          // CHECK #2: EXPIRED ID BADGE!
          isExpired = true;
          expiryDateStr = EXPIRED_DATES[(dayNumber + i) % EXPIRED_DATES.length];
          appliedMutations.push({
            id: 'expired_id',
            label: `Expired ID (${expiryDateStr})`,
            desc: `ID Badge expired on ${expiryDateStr}!`
          });

          // 45% of the time, also add a visual discrepancy alongside the expired date
          if (Math.random() < 0.45) {
            this.addRandomVisualMutations(badgeTraits, officialTraits, appliedMutations, 1);
          }
        } else {
          // CHECK #3: VISUAL PORTRAIT DISCREPANCY (Different Tie Colour, Different Eye Colour, False Teeth, Eye Patch, Hair, etc.)
          const numVis = dayNumber <= 4 ? 2 : (Math.random() < 0.5 ? 2 : 1);
          this.addRandomVisualMutations(badgeTraits, officialTraits, appliedMutations, numVis);

          // 25% chance to also be expired
          if (Math.random() < 0.25) {
            isExpired = true;
            expiryDateStr = EXPIRED_DATES[(dayNumber + i) % EXPIRED_DATES.length];
            appliedMutations.push({
              id: 'expired_id',
              label: `Expired ID (${expiryDateStr})`,
              desc: `ID Badge expired on ${expiryDateStr}!`
            });
          }
        }
      }

      const quote = isDodgy
        ? TEACHER_QUOTES_DODGY[Math.floor(Math.random() * TEACHER_QUOTES_DODGY.length)]
        : TEACHER_QUOTES_NORMAL[Math.floor(Math.random() * TEACHER_QUOTES_NORMAL.length)];

      queue.push({
        index: i,
        name: base.name,
        category: base.category,
        subject,
        staffCode,
        isBanned,
        isExpired,
        hasVisualMismatch: appliedMutations.some(m => m.id !== 'banned_watchlist' && m.id !== 'expired_id'),
        entryStatus: isBanned ? 'BANNED — DO NOT ADMIT' : 'ALLOWED (ACTIVE STAFF)',
        expiry: expiryDateStr,
        expiryStatusText: isExpired ? `EXPIRED (${expiryDateStr})` : `VALID (${expiryDateStr})`,
        isDodgy,
        officialTraits,
        badgeTraits,
        appliedMutations,
        quote
      });
    }

    return queue;
  }

  addRandomVisualMutations(badgeTraits, officialTraits, appliedMutations, count) {
    // Give extra weight to tie_color_swap and eye_color_swap so players see them frequently!
    const pool = [
      this.mutations[0], // tie_color_swap
      this.mutations[1], // eye_color_swap
      ...this.mutations
    ].sort(() => Math.random() - 0.5);

    const usedIds = new Set(appliedMutations.map(m => m.id));
    let added = 0;

    for (let m = 0; m < pool.length && added < count; m++) {
      const mut = pool[m];
      if (usedIds.has(mut.id)) continue;
      if (this.applyMutation(badgeTraits, officialTraits, mut.id)) {
        appliedMutations.push(mut);
        usedIds.add(mut.id);
        added++;
      }
    }

    if (added === 0) {
      this.applyMutation(badgeTraits, officialTraits, 'tie_color_swap');
      appliedMutations.push(this.mutations[0]);
    }
  }

  /**
   * Mutates `badgeTraits` compared to `officialTraits` and returns true if applied
   */
  applyMutation(badgeTraits, officialTraits, mutId) {
    switch (mutId) {
      case 'tie_color_swap': {
        const tiePalette = [
          { hex: '#ef4444', name: 'Crimson Red' },
          { hex: '#2563eb', name: 'Royal Blue' },
          { hex: '#22c55e', name: 'Emerald Green' },
          { hex: '#facc15', name: 'Bright Gold' },
          { hex: '#a855f7', name: 'Vivid Purple' },
          { hex: '#ec4899', name: 'Hot Pink' },
          { hex: '#06b6d4', name: 'Cyan Teal' }
        ];
        const choices = tiePalette.filter(c => c.hex.toLowerCase() !== (officialTraits.tie || '').toLowerCase());
        const pick = choices[Math.floor(Math.random() * choices.length)] || tiePalette[0];
        badgeTraits.tie = pick.hex;
        return true;
      }
      case 'eye_color_swap': {
        const eyePalette = [
          '#ef4444', // Bright Red
          '#22c55e', // Bright Emerald Green
          '#2563eb', // Vivid Blue
          '#facc15', // Golden Yellow
          '#a855f7', // Violet Purple
          '#ec4899'  // Magenta Pink
        ];
        const choices = eyePalette.filter(c => c.toLowerCase() !== (officialTraits.eyeColor || '').toLowerCase());
        badgeTraits.eyeColor = choices[Math.floor(Math.random() * choices.length)] || '#ef4444';
        return true;
      }
      case 'false_teeth':
        badgeTraits.falseTeeth = true;
        return true;
      case 'eye_patch':
        badgeTraits.eyePatch = true;
        return true;
      case 'different_hair': {
        const altStyles = ['rainbow_wig', 'punk_mohawk', 'giant_afro', 'bald_shine'];
        badgeTraits.hairStyle = altStyles[Math.floor(Math.random() * altStyles.length)];
        badgeTraits.hairColor = '#ec4899';
        return true;
      }
      case 'hair_color_swap': {
        const neonColors = ['#ff007f', '#00ff66', '#00e5ff', '#ffea00'];
        const pick = neonColors.find(c => c !== officialTraits.hairColor) || '#ff007f';
        badgeTraits.hairColor = pick;
        if (badgeTraits.hairStyle === 'none') {
          badgeTraits.hairStyle = 'spiky';
        }
        return true;
      }
      case 'fake_moustache':
        badgeTraits.fakeMoustache = true;
        return true;
      case 'wrong_glasses':
        if (officialTraits.glasses === 'none') {
          badgeTraits.glasses = 'cool_shades';
        } else {
          badgeTraits.glasses = 'none';
        }
        return true;
      case 'wrong_hat': {
        const hats = ['pirate_hat', 'tinfoil_hat', 'red_fez'];
        badgeTraits.hat = hats[Math.floor(Math.random() * hats.length)];
        return true;
      }
      case 'cheek_bandaid_scar':
        badgeTraits.cheekScar = true;
        return true;
      case 'wrong_outfit':
        badgeTraits.burglarShirt = true;
        return true;
      default:
        return false;
    }
  }

  /**
   * Renders a high-detail colourful portrait of a teacher onto a 2D Canvas
   */
  renderPortrait(canvas, traits, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    const baseW = 300;
    const baseH = 330;
    ctx.scale(W / baseW, H / baseH);

    // 1. Background & Subtle Studio Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, baseH);
    bgGrad.addColorStop(0, traits.bg || '#dbeafe');
    bgGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
    ctx.beginPath();
    ctx.arc(baseW * 0.5, baseH * 0.44, baseW * 0.38, 0, Math.PI * 2);
    ctx.fill();

    const cx = baseW * 0.5;
    const cy = baseH * 0.45;

    // 2. Back Hair / Mane / Cape (behind head)
    this.drawBackHair(ctx, cx, cy, baseW, baseH, traits);

    // 3. Shoulders, Suit Jacket, Shirt & Prominent Colourful Tie
    this.drawOutfit(ctx, cx, cy, baseW, baseH, traits);

    // 4. Neck & Head Base (by species/subType)
    this.drawHeadBase(ctx, cx, cy, baseW, baseH, traits);

    // 5. Facial Scar / Band-Aid (if Fake ID mutation)
    if (traits.cheekScar) {
      this.drawCheekScarAndBandaid(ctx, cx, cy);
    }

    // 6. Eyes & Eyebrows (large vibrant irises so Eye Colour changes are clear!)
    this.drawEyes(ctx, cx, cy, traits);

    // 7. Pirate Eye Patch (if Fake ID mutation)
    if (traits.eyePatch) {
      this.drawEyePatch(ctx, cx, cy, traits);
    }

    // 8. Glasses / Shades
    if (traits.glasses && traits.glasses !== 'none') {
      this.drawGlasses(ctx, cx, cy, traits);
    }

    // 9. Nose / Beak / Snout
    this.drawNose(ctx, cx, cy, traits);

    // 10. Mouth & False Teeth
    this.drawMouthAndTeeth(ctx, cx, cy, traits);

    // 11. Fake Moustache (if Fake ID mutation)
    if (traits.fakeMoustache) {
      this.drawFakeMoustache(ctx, cx, cy);
    }

    // 12. Front Hair / Ears / Horns / Antennae
    this.drawFrontHairAndHeadgear(ctx, cx, cy, traits);

    // 13. Optional Scanner Highlight Overlay (when player clicks Inspect/Scanner)
    if (options.highlightDiscrepancies && options.mutations && options.mutations.length > 0) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.92)';
      ctx.lineWidth = 5;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(8, 8, baseW - 16, baseH - 16);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawBackHair(ctx, cx, cy, W, H, traits) {
    ctx.save();
    ctx.fillStyle = traits.hairColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;

    if (traits.hairStyle === 'long_wavy') {
      ctx.beginPath();
      ctx.roundRect(cx - 72, cy - 55, 144, 145, 36);
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'curly_afro' || traits.hairStyle === 'giant_afro') {
      const r = traits.hairStyle === 'giant_afro' ? 86 : 74;
      ctx.beginPath();
      ctx.arc(cx, cy - 18, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'mane' || traits.subType === 'lion') {
      const petals = 12;
      ctx.beginPath();
      for (let i = 0; i < petals; i++) {
        const ang = (i / petals) * Math.PI * 2;
        const px = cx + Math.cos(ang) * 56;
        const py = (cy - 6) + Math.sin(ang) * 56;
        ctx.moveTo(px + 26, py);
        ctx.arc(px, py, 26, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'bob') {
      ctx.beginPath();
      ctx.roundRect(cx - 68, cy - 48, 136, 105, 32);
      ctx.fill();
      ctx.stroke();
    } else if (traits.subType === 'vampire') {
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(cx - 75, cy + 85);
      ctx.lineTo(cx - 58, cy + 5);
      ctx.lineTo(cx + 58, cy + 5);
      ctx.lineTo(cx + 75, cy + 85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(cx - 62, cy + 85);
      ctx.lineTo(cx - 48, cy + 16);
      ctx.lineTo(cx + 48, cy + 16);
      ctx.lineTo(cx + 62, cy + 85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawOutfit(ctx, cx, cy, W, H, traits) {
    ctx.save();
    const topY = cy + 62;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;

    // Shoulders / Blazer
    ctx.fillStyle = traits.burglarShirt ? '#1e293b' : (traits.outfit || '#1e3a8a');
    ctx.beginPath();
    ctx.moveTo(cx - 98, H + 10);
    ctx.quadraticCurveTo(cx - 92, topY, cx - 42, topY);
    ctx.lineTo(cx + 42, topY);
    ctx.quadraticCurveTo(cx + 92, topY, cx + 98, H + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (traits.burglarShirt) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#f8fafc';
      for (let sy = topY + 8; sy < H; sy += 20) {
        ctx.fillRect(cx - 100, sy, 200, 10);
      }
      ctx.restore();
      ctx.stroke();
    } else {
      // Crisp wide white shirt V-neck so the Tie stands out clearly!
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 32, topY);
      ctx.lineTo(cx, topY + 84);
      ctx.lineTo(cx + 32, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shirt collar flaps
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(cx - 28, topY);
      ctx.lineTo(cx - 12, topY + 24);
      ctx.lineTo(cx, topY + 12);
      ctx.lineTo(cx + 12, topY + 24);
      ctx.lineTo(cx + 28, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Prominent Tie (knot + wide blade) for easy visual colour verification
      ctx.fillStyle = traits.tie || '#ef4444';
      // Tie Knot
      ctx.beginPath();
      ctx.moveTo(cx - 11, topY + 8);
      ctx.lineTo(cx + 11, topY + 8);
      ctx.lineTo(cx + 8, topY + 24);
      ctx.lineTo(cx - 8, topY + 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tie Blade
      ctx.beginPath();
      ctx.moveTo(cx - 8, topY + 24);
      ctx.lineTo(cx + 8, topY + 24);
      ctx.lineTo(cx + 15, topY + 76);
      ctx.lineTo(cx, topY + 92);
      ctx.lineTo(cx - 15, topY + 76);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Subtle tie highlight stripe
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, topY + 38);
      ctx.lineTo(cx + 6, topY + 48);
      ctx.moveTo(cx - 7, topY + 56);
      ctx.lineTo(cx + 8, topY + 68);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHeadBase(ctx, cx, cy, W, H, traits) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;

    // Neck
    ctx.fillStyle = traits.skin;
    ctx.fillRect(cx - 20, cy + 40, 40, 32);
    ctx.strokeRect(cx - 20, cy + 40, 40, 32);

    // Frankenstein neck bolts
    if (traits.subType === 'frankenstein') {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 34, cy + 48, 14, 12);
      ctx.strokeRect(cx - 34, cy + 48, 14, 12);
      ctx.fillRect(cx + 20, cy + 48, 14, 12);
      ctx.strokeRect(cx + 20, cy + 48, 14, 12);
    }

    // Swamp monster side fins
    if (traits.subType === 'swamp') {
      ctx.fillStyle = '#0d9488';
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 52, cy - 15);
        ctx.lineTo(cx + dir * 78, cy - 28);
        ctx.lineTo(cx + dir * 72, cy + 18);
        ctx.lineTo(cx + dir * 52, cy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }

    // Ears for Humans / Monsters
    if (['human', 'cyclops', 'vampire', 'demon_imp', 'medusa', 'alien'].includes(traits.subType)) {
      ctx.fillStyle = traits.skin;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.ellipse(cx + dir * 56, cy + 2, 11, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    // Round Top Ears for Bear / Badger
    if (traits.subType === 'bear' || traits.subType === 'badger') {
      ctx.fillStyle = traits.skin;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.arc(cx + dir * 44, cy - 48, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = traits.hairColor;
        ctx.beginPath();
        ctx.arc(cx + dir * 44, cy - 48, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = traits.skin;
      });
    }

    // Pointed Ears for Cat / Fox
    if (traits.subType === 'cat' || traits.subType === 'fox') {
      ctx.fillStyle = traits.skin;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 24, cy - 48);
        ctx.lineTo(cx + dir * 54, cy - 82);
        ctx.lineTo(cx + dir * 54, cy - 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.moveTo(cx + dir * 30, cy - 46);
        ctx.lineTo(cx + dir * 48, cy - 70);
        ctx.lineTo(cx + dir * 48, cy - 32);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = traits.skin;
      });
    }

    // Head shape
    ctx.fillStyle = traits.skin;
    if (traits.subType === 'robot') {
      ctx.beginPath();
      ctx.roundRect(cx - 54, cy - 52, 108, 102, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      [[-44, -42], [44, -42], [-44, 40], [44, 40]].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(cx + rx, cy + ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (traits.subType === 'frankenstein') {
      ctx.beginPath();
      ctx.roundRect(cx - 52, cy - 56, 104, 106, 18);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 25, cy - 34);
      ctx.lineTo(cx + 18, cy - 30);
      ctx.stroke();
      for (let sx = -18; sx <= 12; sx += 10) {
        ctx.beginPath();
        ctx.moveTo(cx + sx, cy - 38);
        ctx.lineTo(cx + sx, cy - 26);
        ctx.stroke();
      }
    } else if (traits.subType === 'pumpkin') {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(124, 45, 18, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 52, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#0f172a';
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, 55, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (traits.subType === 'badger') {
      ctx.fillStyle = '#f8fafc';
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.ellipse(cx + dir * 22, cy - 4, 12, 44, dir * 0.1, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (traits.subType === 'penguin') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 42, 42, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (traits.subType === 'slime') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(cx - 28, cy - 26, 8, 0, Math.PI * 2);
      ctx.arc(cx + 32, cy + 14, 6, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 32, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCheekScarAndBandaid(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy - 2);
    ctx.lineTo(cx - 24, cy + 22);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const y = cy + 3 + i * 7;
      ctx.beginPath();
      ctx.moveTo(cx - 37 + i * 3, y);
      ctx.lineTo(cx - 25 + i * 3, y - 3);
      ctx.stroke();
    }

    ctx.translate(cx + 30, cy + 12);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#fcd34d';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-16, -7, 32, 14, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  drawEyes(ctx, cx, cy, traits) {
    ctx.save();
    const eyeY = cy - 10;

    if (traits.subType === 'cyclops') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(cx, eyeY - 2, 25, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vibrant Cyclops Iris
      ctx.fillStyle = traits.eyeColor || '#facc15';
      ctx.beginPath();
      ctx.arc(cx, eyeY - 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, eyeY - 2, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 4.5, eyeY - 6, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx - 26, eyeY - 24);
      ctx.quadraticCurveTo(cx, eyeY - 30, cx + 26, eyeY - 24);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Standard Two-Eye layout with bold, easy-to-compare irises
    [-1, 1].forEach(dir => {
      const ex = cx + dir * 21;

      if (traits.subType === 'owl') {
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ex, eyeY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Sclera
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 12.5, 10.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bold Iris so eye colour changes are immediately visible
      ctx.fillStyle = traits.eyeColor || '#2563eb';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 7.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 3.4, 0, Math.PI * 2);
      ctx.fill();

      // Eye sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 2.6, eyeY - 2.8, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrow
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - 11, eyeY - 15);
      ctx.quadraticCurveTo(ex, eyeY - 19, ex + 11, eyeY - 14);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawEyePatch(ctx, cx, cy, traits) {
    ctx.save();
    const eyeY = cy - 10;
    const patchX = traits.subType === 'cyclops' ? cx : cx + 21;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 54, eyeY - 22);
    ctx.lineTo(cx + 54, eyeY + 8);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(patchX, eyeY + 1, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(patchX - 6, eyeY - 5);
    ctx.lineTo(patchX + 6, eyeY + 7);
    ctx.moveTo(patchX + 6, eyeY - 5);
    ctx.lineTo(patchX - 6, eyeY + 7);
    ctx.stroke();

    ctx.restore();
  }

  drawGlasses(ctx, cx, cy, traits) {
    ctx.save();
    const eyeY = cy - 10;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.2;

    if (traits.glasses === 'cool_shades') {
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(cx - 42, eyeY - 12, 36, 22, 5);
      ctx.roundRect(cx + 6, eyeY - 12, 36, 22, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 6, eyeY - 4);
      ctx.lineTo(cx + 6, eyeY - 4);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 34, eyeY + 5);
      ctx.lineTo(cx - 22, eyeY - 7);
      ctx.moveTo(cx + 14, eyeY + 5);
      ctx.lineTo(cx + 26, eyeY - 7);
      ctx.stroke();
    } else if (traits.glasses === 'round') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.14)';
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.arc(cx + dir * 21, eyeY, 15.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, eyeY);
      ctx.lineTo(cx + 5.5, eyeY);
      ctx.stroke();
    } else if (traits.glasses === 'square' || traits.glasses === 'half_moon') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.14)';
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.roundRect(cx + dir * 21 - 15.5, eyeY - 11.5, 31, 23, 5);
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, eyeY - 2);
      ctx.lineTo(cx + 5.5, eyeY - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawNose(ctx, cx, cy, traits) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;

    if (traits.subType === 'owl' || traits.subType === 'penguin') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 1);
      ctx.lineTo(cx + 9, cy + 1);
      ctx.lineTo(cx, cy + 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (traits.subType === 'bear' || traits.subType === 'fox' || traits.subType === 'badger') {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 17, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (traits.subType === 'cat' || traits.subType === 'lion') {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy + 3);
      ctx.lineTo(cx + 7, cy + 3);
      ctx.lineTo(cx, cy + 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 2;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 16, cy + 8);
        ctx.lineTo(cx + dir * 44, cy + 4);
        ctx.moveTo(cx + dir * 16, cy + 13);
        ctx.lineTo(cx + dir * 44, cy + 15);
        ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 3);
      ctx.lineTo(cx - 6, cy + 9);
      ctx.lineTo(cx + 4, cy + 11);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMouthAndTeeth(ctx, cx, cy, traits) {
    ctx.save();
    const my = cy + 25;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.2;

    if (traits.mouth === 'beard_smile') {
      ctx.fillStyle = traits.hairColor || '#6e2c00';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 52, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (traits.mouth === 'mustache') {
      ctx.fillStyle = traits.hairColor || '#4a235a';
      ctx.beginPath();
      ctx.roundRect(cx - 22, my - 9, 44, 10, 5);
      ctx.fill();
      ctx.stroke();
    }

    if (traits.mouth === 'led_grid') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 24, my - 7, 48, 16);
      ctx.fillStyle = '#4ade80';
      for (let gx = -18; gx <= 14; gx += 8) {
        ctx.fillRect(cx + gx, my - 3, 5, 8);
      }
    } else {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(cx, my - 3, 18, 0.08 * Math.PI, 0.92 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (traits.mouth === 'vamp_smile') {
        ctx.fillStyle = '#ffffff';
        [-10, 10].forEach(ox => {
          ctx.beginPath();
          ctx.moveTo(cx + ox - 4, my - 1);
          ctx.lineTo(cx + ox + 4, my - 1);
          ctx.lineTo(cx + ox, my + 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      } else if (traits.mouth === 'tusks') {
        ctx.fillStyle = '#fef9c3';
        [-14, 14].forEach(ox => {
          ctx.beginPath();
          ctx.moveTo(cx + ox - 4, my + 6);
          ctx.lineTo(cx + ox + 4, my + 6);
          ctx.lineTo(cx + ox, my - 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      }
    }

    // FAKE ID DISCREPANCY: Big Goofy False Teeth!
    if (traits.falseTeeth) {
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.roundRect(cx - 24, my - 8, 48, 9, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      for (let t = -1; t <= 1; t++) {
        ctx.beginPath();
        ctx.roundRect(cx + t * 13 - 6, my - 2, 12, 17, 3);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawFakeMoustache(ctx, cx, cy) {
    ctx.save();
    const my = cy + 17;
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(cx, my - 2);
    ctx.bezierCurveTo(cx - 18, my - 12, cx - 34, my + 8, cx - 44, my - 4);
    ctx.bezierCurveTo(cx - 34, my + 18, cx - 12, my + 6, cx, my + 5);
    ctx.bezierCurveTo(cx + 12, my + 6, cx + 34, my + 18, cx + 44, my - 4);
    ctx.bezierCurveTo(cx + 34, my + 8, cx + 18, my - 12, cx, my - 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.fillRect(cx - 5, my - 8, 10, 11);
    ctx.strokeRect(cx - 5, my - 8, 10, 11);
    ctx.restore();
  }

  drawFrontHairAndHeadgear(ctx, cx, cy, traits) {
    ctx.save();
    ctx.fillStyle = traits.hairColor || '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;

    const topY = cy - 54;

    if (traits.hairStyle === 'short_part' || traits.hairStyle === 'pompadour') {
      const h = traits.hairStyle === 'pompadour' ? 32 : 20;
      ctx.beginPath();
      ctx.moveTo(cx - 52, cy - 22);
      ctx.quadraticCurveTo(cx - 50, topY - h, cx + 8, topY - h + 6);
      ctx.quadraticCurveTo(cx + 54, topY - 4, cx + 52, cy - 22);
      ctx.quadraticCurveTo(cx, cy - 42, cx - 52, cy - 22);
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'flat_top') {
      ctx.beginPath();
      ctx.rect(cx - 52, topY - 8, 104, 28);
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'spiky') {
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 28);
      ctx.lineTo(cx - 38, topY - 18);
      ctx.lineTo(cx - 18, topY + 2);
      ctx.lineTo(cx, topY - 24);
      ctx.lineTo(cx + 18, topY + 2);
      ctx.lineTo(cx + 38, topY - 18);
      ctx.lineTo(cx + 50, cy - 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'bun') {
      ctx.beginPath();
      ctx.arc(cx, topY - 14, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 55, Math.PI * 1.12, Math.PI * 1.88);
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'punk_mohawk') {
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(cx - 14, topY + 6);
      ctx.lineTo(cx - 24, topY - 38);
      ctx.lineTo(cx, topY - 26);
      ctx.lineTo(cx + 24, topY - 38);
      ctx.lineTo(cx + 14, topY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (traits.hairStyle === 'rainbow_wig') {
      const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
      [-40, -20, 0, 20, 40].forEach((ox, idx) => {
        ctx.fillStyle = colors[idx];
        ctx.beginPath();
        ctx.arc(cx + ox, topY + Math.abs(ox) * 0.25, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    } else if (traits.hairStyle === 'snakes') {
      ctx.fillStyle = '#16a34a';
      [-36, -18, 0, 18, 36].forEach(ox => {
        ctx.beginPath();
        ctx.roundRect(cx + ox - 7, topY - 18, 14, 28, 7);
        ctx.fill();
        ctx.stroke();
      });
    } else if (traits.hairStyle === 'horns') {
      ctx.fillStyle = '#1e293b';
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 25, topY + 8);
        ctx.quadraticCurveTo(cx + dir * 58, topY - 28, cx + dir * 42, topY - 36);
        ctx.quadraticCurveTo(cx + dir * 32, topY - 10, cx + dir * 12, topY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (traits.hairStyle === 'antenna' || traits.hairStyle === 'dual_antenna') {
      const list = traits.hairStyle === 'dual_antenna' ? [-22, 22] : [0];
      list.forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(cx + ox, topY + 4);
        ctx.lineTo(cx + ox, topY - 22);
        ctx.stroke();
        ctx.fillStyle = traits.hairColor || '#ef4444';
        ctx.beginPath();
        ctx.arc(cx + ox, topY - 25, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    } else if (traits.hairStyle === 'stem') {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(cx - 8, topY - 18, 16, 24, 5);
      ctx.fill();
      ctx.stroke();
    }

    if (traits.hat && traits.hat !== 'none') {
      if (traits.hat === 'pirate_hat') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cx - 68, topY + 12);
        ctx.quadraticCurveTo(cx, topY - 42, cx + 68, topY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☠', cx, topY + 4);
      } else if (traits.hat === 'tinfoil_hat') {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(cx - 50, topY + 12);
        ctx.lineTo(cx, topY - 40);
        ctx.lineTo(cx + 50, topY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (traits.hat === 'red_fez') {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(cx - 30, topY + 10);
        ctx.lineTo(cx - 22, topY - 28);
        ctx.lineTo(cx + 22, topY - 28);
        ctx.lineTo(cx + 30, topY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

/**
 * Renders the Big Animated Happiness Face in the HUD (from 105 Max down to 0).
 */
function renderHappinessFace(canvas, happiness, maxHappiness = 105, timeSec = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const ratio = Math.max(0, Math.min(1, happiness / maxHappiness));
  const cx = W * 0.5;
  const cy = H * 0.5;
  const r = W * 0.42;

  let faceColor = '#4ade80';
  let rimColor = '#16a34a';
  if (ratio >= 0.75) {
    faceColor = '#fde047';
    rimColor = '#22c55e';
  } else if (ratio >= 0.5) {
    faceColor = '#facc15';
    rimColor = '#eab308';
  } else if (ratio >= 0.28) {
    faceColor = '#fb923c';
    rimColor = '#ea580c';
  } else {
    faceColor = '#f87171';
    rimColor = '#dc2626';
  }

  ctx.save();

  const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.22, faceColor);
  grad.addColorStop(1, rimColor);

  ctx.fillStyle = grad;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (ratio > 0.6) {
    ctx.fillStyle = `rgba(244, 63, 94, ${(ratio - 0.5) * 0.65})`;
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.ellipse(cx + dir * r * 0.48, cy + r * 0.12, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const eyeY = cy - r * 0.16;
  const blink = Math.sin(timeSec * 2.3) > 0.97;

  [-1, 1].forEach(dir => {
    const ex = cx + dir * r * 0.34;
    ctx.fillStyle = '#0f172a';

    if (blink) {
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(ex - 7, eyeY);
      ctx.lineTo(ex + 7, eyeY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, eyeY, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 2, eyeY - 2.5, r * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    const sadTilt = (1 - ratio) * 7;
    ctx.beginPath();
    ctx.moveTo(ex - dir * 8, eyeY - 12 - sadTilt * 0.5);
    ctx.quadraticCurveTo(ex, eyeY - 15, ex + dir * 9, eyeY - 11 + sadTilt);
    ctx.stroke();
  });

  if (happiness < 42) {
    const tearIntensity = Math.min(1, (42 - happiness) / 30);
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;

    [-1, 1].forEach((dir, idx) => {
      const ex = cx + dir * r * 0.36;
      const dropOffset = ((timeSec * 45 + idx * 18) % 26);
      const ty = eyeY + 8 + dropOffset;

      ctx.beginPath();
      ctx.arc(ex, ty, 4.5 * tearIntensity + 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  const moodCurve = (ratio - 0.45) * 2.1;
  const mouthY = cy + r * 0.32;
  const mouthW = r * 0.46;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';

  if (ratio > 0.78) {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY - 6);
    ctx.quadraticCurveTo(cx, mouthY + 24, cx + mouthW, mouthY - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (ratio < 0.22) {
    const wobble = Math.sin(timeSec * 14) * 1.5;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY + 10);
    ctx.quadraticCurveTo(cx, mouthY - 18 + wobble, cx + mouthW, mouthY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY - moodCurve * 6);
    ctx.quadraticCurveTo(cx, mouthY + moodCurve * 18, cx + mouthW, mouthY - moodCurve * 6);
    ctx.stroke();
  }

  ctx.restore();
}

window.portraitSystem = new PortraitSystem();
window.renderHappinessFace = renderHappinessFace;
