export interface DefaultCard {
  front: string;
  back: string;
  imageUrl?: string;
}

export interface DefaultDeck {
  name: string;
  description: string;
  cards: DefaultCard[];
}

export const defaultDecks: DefaultDeck[] = [
  {
    name: "Health Q&A",
    description: "Common health questions and answers to boost your medical knowledge",
    cards: [
      { front: "What is the normal body temperature?", back: "36.5-37.5°C (97.7-99.5°F)" },
      { front: "How many bones are in the adult human body?", back: "206 bones" },
      { front: "Which organ pumps blood throughout the body?", back: "The heart" },
      { front: "What vitamin does sunlight provide?", back: "Vitamin D" },
      { front: "How many chambers does the human heart have?", back: "4 chambers (2 atria, 2 ventricles)" },
      { front: "What is the largest organ in the human body?", back: "The skin" },
      { front: "How much water should you drink per day?", back: "About 2-3 liters (8 glasses)" },
      { front: "What does CPR stand for?", back: "Cardiopulmonary Resuscitation" },
      { front: "How many minutes of exercise is recommended per week?", back: "150 minutes of moderate activity" },
      { front: "What blood type is the universal donor?", back: "O negative" },
      { front: "What is the normal resting heart rate?", back: "60-100 beats per minute" },
      { front: "Which part of the body produces insulin?", back: "The pancreas" },
      { front: "What is the body's largest artery?", back: "The aorta" },
      { front: "How many teeth does an adult human have?", back: "32 teeth" },
      { front: "What mineral is essential for strong bones?", back: "Calcium" },
    ]
  },
  {
    name: "English → Japanese",
    description: "Learn Japanese vocabulary with English prompts and Japanese answers",
    cards: [
      { front: "Hello", back: "こんにちは (Konnichiwa)" },
      { front: "Good morning", back: "おはようございます (Ohayou gozaimasu)" },
      { front: "Good evening", back: "こんばんは (Konbanwa)" },
      { front: "Thank you", back: "ありがとうございます (Arigatou gozaimasu)" },
      { front: "Excuse me / Sorry", back: "すみません (Sumimasen)" },
      { front: "Yes", back: "はい (Hai)" },
      { front: "No", back: "いいえ (Iie)" },
      { front: "Please", back: "お願いします (Onegaishimasu)" },
      { front: "Nice to meet you", back: "はじめまして (Hajimemashite)" },
      { front: "I don't understand", back: "わかりません (Wakarimasen)" },
      { front: "Goodbye", back: "さようなら (Sayounara)" },
      { front: "Water", back: "水 (Mizu)" },
      { front: "Food", back: "食べ物 (Tabemono)" },
      { front: "Friend", back: "友達 (Tomodachi)" },
      { front: "Love", back: "愛 (Ai)" },
      { front: "Beautiful", back: "美しい (Utsukushii)" },
      { front: "Big", back: "大きい (Ookii)" },
      { front: "Small", back: "小さい (Chiisai)" },
      { front: "One", back: "一 (Ichi)" },
      { front: "Two", back: "二 (Ni)" },
      { front: "Three", back: "三 (San)" },
      { front: "Delicious", back: "美味しい (Oishii)" },
      { front: "Hospital", back: "病院 (Byouin)" },
      { front: "Station", back: "駅 (Eki)" },
      { front: "Mountain", back: "山 (Yama)" },
      { front: "River", back: "川 (Kawa)" },
      { front: "Flower", back: "花 (Hana)" },
      { front: "Cat", back: "猫 (Neko)" },
      { front: "Dog", back: "犬 (Inu)" },
      { front: "Book", back: "本 (Hon)" },
      { front: "Rain", back: "雨 (Ame)" },
      { front: "Sun", back: "太陽 (Taiyou)" },
      { front: "Moon", back: "月 (Tsuki)" },
    ]
  },
  {
    name: "English → Spanish",
    description: "Learn Spanish vocabulary with English prompts and Spanish answers",
    cards: [
      { front: "Hello", back: "Hola" },
      { front: "Goodbye", back: "Adiós" },
      { front: "Water", back: "Agua" },
      { front: "Bread", back: "Pan" },
      { front: "Milk", back: "Leche" },
      { front: "House", back: "Casa" },
      { front: "Book", back: "Libro" },
      { front: "Sun", back: "Sol" },
      { front: "Moon", back: "Luna" },
      { front: "Star", back: "Estrella" },
      { front: "Hand", back: "Mano" },
      { front: "Eye", back: "Ojo" },
      { front: "Mouth", back: "Boca" },
      { front: "Head", back: "Cabeza" },
      { front: "Dog", back: "Perro" },
      { front: "Cat", back: "Gato" },
      { front: "Bird", back: "Pájaro" },
      { front: "Fish", back: "Pez" },
      { front: "Flower", back: "Flor" },
      { front: "Tree", back: "Árbol" },
      { front: "Door", back: "Puerta" },
      { front: "Window", back: "Ventana" },
      { front: "Chair", back: "Silla" },
      { front: "Table", back: "Mesa" },
      { front: "Bed", back: "Cama" },
      { front: "Shoe", back: "Zapato" },
      { front: "Hat", back: "Sombrero" },
      { front: "Key", back: "Llave" },
      { front: "Clock", back: "Reloj" },
      { front: "Night", back: "Noche" },
    ]
  },
  {
    name: "Animals Quiz",
    description: "Fascinating animal facts with photos — identify each creature and learn something amazing",
    cards: [
      { front: "Elephant Seal", back: "Can hold its breath for up to 120 minutes and dive deeper than 1,500 meters, staying underwater for two hours", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/An_elephant_seal_from_NOAA.jpg" },
      { front: "Koala", back: "Its fingerprints are nearly identical to human fingerprints — even experts struggle to tell them apart under a microscope", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/49/Koala_climbing_tree.jpg" },
      { front: "Octopus", back: "Has three hearts — two pump blood to the gills while the third pumps it to the rest of the body", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Octopus_vulgaris_2.jpg" },
      { front: "Snail", back: "Some species can sleep (estivate) for up to three years without eating until rain returns", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Garden_snails_%28Helix_aspersa%29%2C_Israel..jpg" },
      { front: "Chameleon", back: "Its tongue can be twice the length of its body and shoots out to catch prey in 0.07 seconds", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Chamaeleo_chamaeleon_-_Common_Chameleon_-_Bukalemun.jpg" },
      { front: "Wood Frog", back: "Can survive being frozen solid — up to 70% of its body freezes in winter and it thaws back to life in spring", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/be/European_Common_Frog_Rana_temporaria_%28cropped%29.jpg" },
      { front: "Saltwater Crocodile", back: "Has the strongest bite force of any living creature — over 3,700 PSI, more than any other animal alive today", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Saltwater_Crocodile_%28Crocodylus_porosus%29_%2810106331165%29.jpg" },
      { front: "Bat", back: "The only mammal capable of true, sustained flight — its wings are made of skin stretched over elongated fingers", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Big_Brown_Bats_%28Eptesicus_fuscus%29.jpg" },
      { front: "Horseshoe Crab", back: "Has blue blood containing copper-based hemocyanin, which is used to test vaccines for contamination", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Atlantic_horseshoe_crab_%28Limulus_polyphemus%29.jpg" },
      { front: "Immortal Jellyfish", back: "Can theoretically live forever — it reverts back to its juvenile polyp stage after reaching adulthood", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Turritopsis_nutricula_Kamo.jpg" },
      { front: "Ostrich", back: "Its eyes are 5 cm across — the largest of any land animal and actually bigger than its own brain", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/21/Common_Ostrich_%28Struthio_camelus%29_male_%2832404508890%29.jpg" },
      { front: "Kangaroo Rat", back: "Never needs to drink water — it gets all its moisture from the seeds it eats", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Merriam%27s_Kangaroo_Rat.jpg" },
      { front: "Blue Whale", back: "Produces the loudest sound of any living creature — its calls reach 188 decibels and travel over 800 km through the ocean", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/79/Blue_Whale_%28Balaenoptera_musculus%29_Mysticeti_baleen_whale.jpg" },
      { front: "Cow", back: "Has four stomachs and chews its cud multiple times to extract every bit of nutrition from grass", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/05/Free-range_cows_in_grass.jpg" },
      { front: "Cuttlefish", back: "Changes color, pattern, and skin texture in milliseconds using special cells called chromatophores", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Sepia_officinalis_%28aquarium%29.jpg" },
      { front: "Honey Bee", back: "Worker bees are female; the drone's abdomen rips open after mating and it dies shortly after", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Honey_bee_%28Apis_mellifera%29.jpg" },
    ]
  }
];
