export const categoryPaths: Record<string, string> = {
  ring: "M8 9a7 7 0 1 0 8 0 M8 5l2-2h4l2 2-4 5-4-5Z M8 5h8 M10 3l2 7 2-7",
  necklace: "M4 4v5a8 8 0 0 0 16 0V4 M9 17l3 4 3-4-3-3-3 3Z",
  bracelet:
    "M6 7a8 6 0 1 0 12 0 M9 6l3-3 3 3-3 3-3-3Z M4 10l2 2-2 2-2-2 2-2Z M20 10l2 2-2 2-2-2 2-2Z M9 18l3-3 3 3-3 3-3-3Z",
  bangle:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z",
  pendant: "M10 3h4v4h-4V3Z M12 7l6 7-6 7-6-7 6-7Z M6 14h12 M12 7v14",
  tanmania:
    "M3 3v6c0 4 3 7 6 8 M21 3v6c0 4-3 7-6 8 M8 17l4-4 4 4-4 4-4-4Z M4 10h2 M18 10h2 M6 14h2 M16 14h2",
  earrings:
    "M7 3v4 M17 3v4 M7 7c-4 0-4 6 0 10 4-4 4-10 0-10Z M17 7c-4 0-4 6 0 10 4-4 4-10 0-10Z M7 17v3 M17 17v3",
  chain:
    "M9 15l6-6 M8 13l-2 2a4 4 0 0 0 6 6l3-3a4 4 0 0 0 0-6 M16 11l2-2a4 4 0 0 0-6-6L9 6a4 4 0 0 0 0 6",
  anklet:
    "M6 3v7c0 4 2 7 6 7s6-3 6-7V3 M7 12l3 1 2 1 2-1 3-1 M12 14v4 M10 20l2-2 2 2-2 2-2-2Z",
  brooch:
    "M12 3l3 3 4 1-1 4 1 4-4 1-3 3-3-3-4-1 1-4-1-4 4-1 3-3Z M12 7l4 4-4 4-4-4 4-4Z M8 17l-3 4 M16 17l3 4",
  accessories: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  other:
    "M3 3h7v7H3z M17.5 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z M6.5 14l4.5 7H2l4.5-7Z M14 14h7v7h-7z",
};

export const shapePaths: Record<string, { outline: string; facets: string }> = {
  round: {
    outline: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
    facets:
      "M8 7h8l3 5-3 5H8l-3-5 3-5Z M8 7l4-4 4 4 M19 12h2 M16 17l-4 4-4-4 M3 12h2 M8 7l8 10 M16 7L8 17",
  },
  oval: {
    outline: "M12 3a6 9 0 1 0 0 18 6 9 0 0 0 0-18Z",
    facets:
      "M10 7h4l2 5-2 5h-4l-2-5 2-5Z M10 7l2-4 2 4 M16 12h2 M14 17l-2 4-2-4 M6 12h2",
  },
  marquise: {
    outline: "M12 3C4 9 4 15 12 21c8-6 8-12 0-18Z",
    facets:
      "M12 7l3 5-3 5-3-5 3-5Z M12 3v4 M15 12h3 M12 17v4 M6 12h3 M8 7l1 5-1 5 M16 7l-1 5 1 5",
  },
  pear: {
    outline: "M12 3C10 6 5 10 5 14a7 7 0 0 0 14 0c0-4-5-8-7-11Z",
    facets:
      "M12 8l4 5-1 4H9l-1-4 4-5Z M12 3v5 M5 14l3-1 M19 14l-3-1 M9 17l3 4 3-4",
  },
  cushion: {
    outline:
      "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z",
    facets:
      "M8 7h8l1 1v8l-1 1H8l-1-1V8l1-1Z M5 5l3 2 M19 5l-3 2 M19 19l-3-2 M5 19l3-2 M3 12l4-4 M21 12l-4 4",
  },
  emerald: {
    outline: "M8 3h8l3 3v12l-3 3H8l-3-3V6l3-3Z",
    facets:
      "M9 6h6l1 1v10l-1 1H9l-1-1V7l1-1Z M8 3l1 3 M16 3l-1 3 M19 6l-3 1 M19 18l-3-1 M16 21l-1-3 M8 21l1-3 M5 18l3-1 M5 6l3 1",
  },
  princess: {
    outline: "M3 3h18v18H3z",
    facets:
      "M8 7h8l1 1v8l-1 1H8l-1-1V8l1-1Z M3 3l5 4 M21 3l-5 4 M21 21l-5-4 M3 21l5-4 M3 3l4 5 M21 3l-4 5 M21 21l-4-5 M3 21l4-5",
  },
  radiant: {
    outline: "M8 3h8l3 3v12l-3 3H8l-3-3V6l3-3Z",
    facets:
      "M12 6l4 6-4 6-4-6 4-6Z M8 3l4 3 4-3 M19 6l-3 6 3 6 M16 21l-4-3-4 3 M5 18l3-6-3-6 M8 12h8",
  },
  asscher: {
    outline: "M7 3h10l4 4v10l-4 4H7l-4-4V7l4-4Z",
    facets:
      "M9 7h6l2 2v6l-2 2H9l-2-2V9l2-2Z M7 3l2 4 M17 3l-2 4 M21 7l-4 2 M21 17l-4-2 M17 21l-2-4 M7 21l2-4 M3 17l4-2 M3 7l4 2",
  },
  heart: {
    outline: "M12 7C7 0 1 5 3 11c1 3 5 7 9 10 4-3 8-7 9-10 2-6-4-11-9-4Z",
    facets:
      "M12 10C9 6 6 7 6 11c0 2 3 5 6 7 3-2 6-5 6-7 0-4-3-5-6-1Z M12 7v3 M3 11h3 M21 11h-3 M12 18v3",
  },
  trillion: {
    outline: "M12 3Q18 10 21 20Q12 23 3 20Q6 10 12 3Z",
    facets:
      "M12 8l5 10H7l5-10Z M12 3v5 M21 20l-4-2 M3 20l4-2 M7 9l5-1 5 1 M5 15l2 3 5 3 5-3 2-3",
  },
  baguette: {
    outline: "M7 3h10v18H7z",
    facets: "M9 6h6v12H9z M7 3l2 3 M17 3l-2 3 M17 21l-2-3 M7 21l2-3",
  },
  shield: {
    outline: "M6 3h12l3 6-9 12-9-12 3-6Z",
    facets:
      "M8 7h8l1 3-5 7-5-7 1-3Z M6 3l2 4 M18 3l-2 4 M21 9l-4 1 M3 9l4 1 M12 17v4",
  },
  kite: {
    outline: "M12 3l7 7-7 11-7-11 7-7Z",
    facets:
      "M12 7l4 4-4 6-4-6 4-4Z M12 3v4 M19 10l-3 1 M12 21v-4 M5 10l3 1 M8 11h8",
  },
  "half-moon": {
    outline: "M3 7h18a9 9 0 0 1-18 0Z",
    facets:
      "M6 7h12a6 6 0 0 1-12 0Z M3 7l3 3 M21 7l-3 3 M12 13v3 M7 11l-2 2 M17 11l2 2",
  },
  bullet: {
    outline: "M7 3h10v12l-5 6-5-6V3Z",
    facets:
      "M9 6h6v8l-3 3-3-3V6Z M7 3l2 3 M17 3l-2 3 M7 15l2-1 M17 15l-2-1 M12 17v4",
  },
  hexagon: {
    outline: "M7 3h10l5 9-5 9H7l-5-9 5-9Z",
    facets:
      "M9 7h6l3 5-3 5H9l-3-5 3-5Z M7 3l2 4 M17 3l-2 4 M22 12h-4 M17 21l-2-4 M7 21l2-4 M2 12h4",
  },
  octagon: {
    outline: "M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Z",
    facets:
      "M10 7h4l3 3v4l-3 3h-4l-3-3v-4l3-3Z M8 3l2 4 M16 3l-2 4 M21 8l-4 2 M21 16l-4-2 M16 21l-2-4 M8 21l2-4 M3 16l4-2 M3 8l4 2",
  },
};

export const gemstonePath =
  "M7 3h10l4 6-9 12-9-12 4-6Z M3 9h18 M7 3l2 6 3 12 3-12 2-6 M9 9h6";
