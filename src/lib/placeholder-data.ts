// ---------------------------------------------------------------------------
// Event Categories -- Kerala / Malayalee cultural events in Australia
// ---------------------------------------------------------------------------

export interface EventCategory {
  value: string;
  label: string;
  icon: string;
  colour: string;
  description: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    value: "music",
    label: "Music",
    icon: "Music",
    colour: "#e94560",
    description:
      "Carnatic, Hindustani, film music concerts and live performances",
  },
  {
    value: "dance",
    label: "Dance",
    icon: "Drama",
    colour: "#ff6b6b",
    description:
      "Bharatanatyam, Mohiniyattam, Kathakali, Kuchipudi and contemporary dance",
  },
  {
    value: "comedy",
    label: "Comedy",
    icon: "Laugh",
    colour: "#ffa502",
    description: "Stand-up comedy, mimicry shows and humour nights",
  },
  {
    value: "heritage",
    label: "Heritage",
    icon: "Landmark",
    colour: "#2ed573",
    description: "Cultural heritage exhibitions, talks and demonstrations",
  },
  {
    value: "festival",
    label: "Festival",
    icon: "PartyPopper",
    colour: "#ff4757",
    description: "Onam, Vishu, Thiruvathira, Pongal and seasonal celebrations",
  },
  {
    value: "movies",
    label: "Movies",
    icon: "Clapperboard",
    colour: "#5352ed",
    description:
      "Malayalam and Indian film screenings, premieres and film festivals",
  },
  {
    value: "food",
    label: "Food",
    icon: "UtensilsCrossed",
    colour: "#ff6348",
    description:
      "Sadya feasts, cooking workshops, food festivals and pop-up kitchens",
  },
  {
    value: "sports",
    label: "Sports",
    icon: "Trophy",
    colour: "#1e90ff",
    description:
      "Cricket tournaments, football matches, kabaddi and community sports days",
  },
  {
    value: "workshop",
    label: "Workshop",
    icon: "GraduationCap",
    colour: "#a55eea",
    description:
      "Language classes, art workshops, technology talks and skill-building sessions",
  },
  {
    value: "community",
    label: "Community",
    icon: "Users",
    colour: "#26de81",
    description:
      "Community gatherings, networking events, charity drives and volunteer meetups",
  },
  {
    value: "theatre",
    label: "Theatre",
    icon: "Theater",
    colour: "#fd9644",
    description:
      "Drama, Kathakali performances, street plays and theatrical productions",
  },
  {
    value: "exhibition",
    label: "Exhibition",
    icon: "Image",
    colour: "#45aaf2",
    description:
      "Art exhibitions, photography shows, craft fairs and cultural displays",
  },
];

// ---------------------------------------------------------------------------
// Australian States & Territories
// ---------------------------------------------------------------------------

export interface AustralianState {
  value: string;
  label: string;
}

export const AUSTRALIAN_STATES: AustralianState[] = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

// ---------------------------------------------------------------------------
// Major Australian Cities
// ---------------------------------------------------------------------------

export interface AustralianCity {
  value: string;
  label: string;
  state: string;
}

export const CITIES: AustralianCity[] = [
  { value: "sydney", label: "Sydney", state: "NSW" },
  { value: "melbourne", label: "Melbourne", state: "VIC" },
  { value: "brisbane", label: "Brisbane", state: "QLD" },
  { value: "perth", label: "Perth", state: "WA" },
  { value: "adelaide", label: "Adelaide", state: "SA" },
  { value: "canberra", label: "Canberra", state: "ACT" },
  { value: "hobart", label: "Hobart", state: "TAS" },
  { value: "darwin", label: "Darwin", state: "NT" },
];
