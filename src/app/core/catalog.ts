export interface Film {
  readonly id: string;
  readonly title: string;
  readonly year: number;
  readonly genre: string;
  readonly kind: 'movie' | 'series';
  readonly duration: string;
  readonly rating: string;
  readonly description: string;
  readonly director: string;
  readonly cast: string;
  readonly tag?: string;
}
export const FILMS: readonly Film[] = [
  {
    id: 'dune',
    title: 'Dune: Part Two',
    year: 2024,
    genre: 'Sci-Fi',
    kind: 'movie',
    duration: '2h 46m',
    rating: 'PG-13',
    description:
      'Destiny is written in sand. Paul Atreides joins Chani and the Fremen on a journey of revenge, love, and the fate of a universe.',
    director: 'Denis Villeneuve',
    cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson',
    tag: '#1 today',
  },
  {
    id: 'severance',
    title: 'Severance',
    year: 2022,
    genre: 'Thriller',
    kind: 'series',
    duration: '2 seasons',
    rating: 'TV-MA',
    description:
      'A team of office workers discover that the boundary between their work and personal lives hides a deeply unsettling mystery.',
    director: 'Ben Stiller',
    cast: 'Adam Scott, Britt Lower, Patricia Arquette',
    tag: 'New season',
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    year: 2014,
    genre: 'Sci-Fi',
    kind: 'movie',
    duration: '2h 49m',
    rating: 'PG-13',
    description:
      'A team of explorers travel beyond this galaxy to discover whether mankind has a future among the stars.',
    director: 'Christopher Nolan',
    cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    tag: 'Fan favorite',
  },
  {
    id: 'lastofus',
    title: 'The Last of Us',
    year: 2023,
    genre: 'Drama',
    kind: 'series',
    duration: '2 seasons',
    rating: 'TV-MA',
    description:
      'Across a changed America, two unlikely companions find that the hardest thing to survive is losing the people you love.',
    director: 'Craig Mazin',
    cast: 'Pedro Pascal, Bella Ramsey',
    tag: 'New episodes',
  },
  {
    id: 'batman',
    title: 'The Batman',
    year: 2022,
    genre: 'Action',
    kind: 'movie',
    duration: '2h 56m',
    rating: 'PG-13',
    description:
      'A trail of cryptic clues takes Gotham’s vigilante into the city’s darkest corners, where every answer raises another question.',
    director: 'Matt Reeves',
    cast: 'Robert Pattinson, Zoë Kravitz, Paul Dano',
  },
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    year: 2023,
    genre: 'Drama',
    kind: 'movie',
    duration: '3h',
    rating: 'R',
    description:
      'An extraordinary mind confronts the consequences of a discovery that will change the world forever.',
    director: 'Christopher Nolan',
    cast: 'Cillian Murphy, Emily Blunt, Robert Downey Jr.',
    tag: 'Award winner',
  },
  {
    id: 'blade',
    title: 'Blade Runner 2049',
    year: 2017,
    genre: 'Sci-Fi',
    kind: 'movie',
    duration: '2h 44m',
    rating: 'R',
    description:
      'A new blade runner uncovers a secret that leads him on a search for a man who has been missing for thirty years.',
    director: 'Denis Villeneuve',
    cast: 'Ryan Gosling, Harrison Ford, Ana de Armas',
  },
  {
    id: 'arrival',
    title: 'Arrival',
    year: 2016,
    genre: 'Sci-Fi',
    kind: 'movie',
    duration: '1h 56m',
    rating: 'PG-13',
    description:
      'When mysterious spacecraft arrive on Earth, a linguist searches for meaning in a language that could reshape our understanding of time.',
    director: 'Denis Villeneuve',
    cast: 'Amy Adams, Jeremy Renner, Forest Whitaker',
  },
  {
    id: 'maverick',
    title: 'Top Gun: Maverick',
    year: 2022,
    genre: 'Action',
    kind: 'movie',
    duration: '2h 10m',
    rating: 'PG-13',
    description:
      'An elite pilot returns to train a new generation for a mission that demands the ultimate sacrifice.',
    director: 'Joseph Kosinski',
    cast: 'Tom Cruise, Miles Teller, Jennifer Connelly',
  },
  {
    id: 'stranger',
    title: 'Stranger Things',
    year: 2016,
    genre: 'Thriller',
    kind: 'series',
    duration: '4 seasons',
    rating: 'TV-14',
    description:
      'A small town, a missing boy, and a world hiding just beneath the surface. Some friendships are stronger than fear.',
    director: 'The Duffer Brothers',
    cast: 'Millie Bobby Brown, Finn Wolfhard, Winona Ryder',
  },
];
export const poster = (id: string) => `/images/${id}.jpg`;
