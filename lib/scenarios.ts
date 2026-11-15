export type Language = {
  code: string; // BCP-47, used for speech synthesis / recognition
  name: string; // Swedish display name
  flag: string;
  nativeName: string;
};

export const LANGUAGES: Language[] = [
  { code: "es-ES", name: "Spanska", flag: "🇪🇸", nativeName: "español" },
  { code: "fr-FR", name: "Franska", flag: "🇫🇷", nativeName: "français" },
  { code: "it-IT", name: "Italienska", flag: "🇮🇹", nativeName: "italiano" },
  { code: "de-DE", name: "Tyska", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "en-GB", name: "Engelska", flag: "🇬🇧", nativeName: "English" },
  { code: "pt-PT", name: "Portugisiska", flag: "🇵🇹", nativeName: "português" },
  { code: "ja-JP", name: "Japanska", flag: "🇯🇵", nativeName: "日本語" },
];

export type Level = { id: string; label: string; description: string };

export const LEVELS: Level[] = [
  { id: "A1", label: "Nybörjare", description: "Enkla ord och korta meningar" },
  { id: "A2", label: "Grundläggande", description: "Vardagliga fraser" },
  { id: "B1", label: "Mellan", description: "Klarar de flesta situationer" },
  { id: "B2", label: "Avancerad", description: "Flytande, nyanserat" },
  { id: "C1", label: "Expert", description: "Nästan modersmål" },
];

export type Scenario = {
  id: string;
  title: string;
  emoji: string;
  subtitle: string;
  /** Instructions to the model: who it plays and what the situation is. */
  role: string;
  /** Concrete goal shown to the learner. */
  goal: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "restaurant",
    title: "Restaurang",
    emoji: "🍝",
    subtitle: "Beställ mat, fråga om menyn, betala",
    role: "You are a friendly, slightly busy waiter at a popular local restaurant. Greet the guest, offer the menu, recommend dishes of the day, ask about drinks, handle allergies or special requests, and later bring the bill.",
    goal: "Beställ en förrätt, en huvudrätt och något att dricka – och be om notan.",
  },
  {
    id: "smalltalk",
    title: "Vardagssnack",
    emoji: "☕",
    subtitle: "Prata om dagen, väder, planer",
    role: "You are a friendly neighbour the learner bumps into at a café. Chat casually about the weekend, the weather, work, plans – like real small talk between acquaintances.",
    goal: "Håll igång ett avslappnat samtal i minst 6 repliker.",
  },
  {
    id: "hobby",
    title: "Hobby & intressen",
    emoji: "🎸",
    subtitle: "Berätta om vad du gillar att göra",
    role: "You are a curious new acquaintance at a social event who loves talking about hobbies (sports, music, films, cooking, travel...). Ask follow-up questions and share your own interests.",
    goal: "Berätta om din hobby och ställ minst två frågor tillbaka.",
  },
  {
    id: "tourist",
    title: "Turistattraktion",
    emoji: "🏛️",
    subtitle: "Biljetter, guidning, öppettider",
    role: "You work at the ticket desk of a famous museum / landmark. Help the visitor with tickets, prices, discounts, opening hours, guided tours, and tips for what to see.",
    goal: "Köp biljett, fråga om guidad tur och vad man inte får missa.",
  },
  {
    id: "directions",
    title: "Hitta vägen",
    emoji: "🗺️",
    subtitle: "Fråga om vägen och kollektivtrafik",
    role: "You are a helpful local on the street. The learner is lost. Give directions, mention metro/bus lines, landmarks, and how long it takes.",
    goal: "Ta reda på hur du kommer till stationen och hur lång tid det tar.",
  },
  {
    id: "hotel",
    title: "Hotell",
    emoji: "🏨",
    subtitle: "Checka in, klaga, fråga om tips",
    role: "You are a receptionist at a mid-range hotel. Handle check-in, questions about breakfast and Wi-Fi, a small problem with the room, and local recommendations.",
    goal: "Checka in och lös ett problem med rummet.",
  },
  {
    id: "shopping",
    title: "Shopping",
    emoji: "🛍️",
    subtitle: "Storlekar, priser, byta varor",
    role: "You are a shop assistant in a clothing store. Help with sizes, colours, fitting rooms, prices, and returns.",
    goal: "Hitta en tröja i rätt storlek och fråga om du kan byta den senare.",
  },
  {
    id: "friends",
    title: "Nya vänner",
    emoji: "🎉",
    subtitle: "Presentera dig på en fest",
    role: "You are a friendly guest at a house party. Introduce yourself, ask where the learner is from, what they do, how they know the host, and suggest meeting up again.",
    goal: "Presentera dig och bestäm att ses igen.",
  },
];

export function getScenario(id: string) {
  return SCENARIOS.find((s) => s.id === id);
}
export function getLanguage(code: string) {
  return LANGUAGES.find((l) => l.code === code);
}
