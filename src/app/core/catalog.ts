export interface Film {
  readonly id: string;
  readonly title: string;
  readonly titleEs?: string;
  readonly year: number;
  readonly genre: string;
  readonly kind: 'movie' | 'series';
  readonly duration: string;
  readonly rating: string;
  readonly description: string;
  readonly descriptionEs?: string;
  readonly director: string;
  readonly cast: string;
  readonly tag?: string;
  readonly tagEs?: string;
  /** Local trailer / preview clip under /media */
  readonly trailer?: string;
}

export const FILMS: readonly Film[] = [
  {
    id: 'invisibles',
    title: "Invisible's",
    titleEs: "Invisible's",
    year: 2026,
    genre: 'Horror',
    kind: 'movie',
    duration: '1h 48m',
    rating: 'R',
    description:
      'On a rain-soaked night, a presence presses against the glass. She can feel it watching—even when she cannot see it.',
    descriptionEs:
      'En una noche torrencial, una presencia se apoya contra el cristal. Ella puede sentir que la observa… aunque no pueda verla.',
    director: 'Lee Production',
    cast: 'Coming soon',
    tag: 'Coming soon',
    tagEs: 'Próximamente',
    trailer: '/media/invisibles-trailer.mp4',
  },
  {
    id: 'dune',
    title: 'Dune: Part Two',
    titleEs: 'Dune: Parte Dos',
    year: 2024,
    genre: 'Sci-Fi',
    kind: 'movie',
    duration: '2h 46m',
    rating: 'PG-13',
    description:
      'Destiny is written in sand. Paul Atreides joins Chani and the Fremen on a journey of revenge, love, and the fate of a universe.',
    descriptionEs:
      'El destino está escrito en la arena. Paul Atreides se une a Chani y a los Fremen en un viaje de venganza, amor y el destino de un universo.',
    director: 'Denis Villeneuve',
    cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson',
    tag: 'Preview',
    tagEs: 'Vista previa',
    trailer: '/media/preview.mp4',
  },
];

export const poster = (id: string) => `/images/${id}.jpg`;

export function filmTrailer(film: Film): string {
  return film.trailer ?? '/media/preview.mp4';
}

export function filmTitle(film: Film, lang: 'en' | 'es'): string {
  return lang === 'es' && film.titleEs ? film.titleEs : film.title;
}

export function filmDescription(film: Film, lang: 'en' | 'es'): string {
  return lang === 'es' && film.descriptionEs ? film.descriptionEs : film.description;
}

export function filmTag(film: Film, lang: 'en' | 'es'): string | undefined {
  if (lang === 'es' && film.tagEs) return film.tagEs;
  return film.tag;
}
