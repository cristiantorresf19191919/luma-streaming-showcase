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
    tag: 'Preview',
  },
];
export const poster = (id: string) => `/images/${id}.jpg`;
