import { ChangeDetectionStrategy, Component, input } from '@angular/core';
const PATHS: Record<string, string> = {
  play: 'm9 5 11 7-11 7Z',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4 4L19 6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  home: 'm3 10 9-7 9 7v10H3ZM9 20v-7h6v7',
  grid: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  arrow: 'm9 5 7 7-7 7',
  back: 'm15 5-7 7 7 7',
  close: 'm6 6 12 12M6 18 18 6',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  sparkle: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  film: 'M3 3h18v18H3ZM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  send: 'm22 2-7 20-4-9-9-4ZM22 2 11 13',
};
@Component({
  selector: 'luma-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      [attr.d]="paths[name()] || paths['play']"
      [attr.fill]="name() === 'play' ? 'currentColor' : 'none'"
    />
  </svg>`,
  styles: [
    ':host{display:inline-flex;width:20px;height:20px;flex-shrink:0}svg{width:100%;height:100%}',
  ],
})
export class Icon {
  readonly name = input('play');
  readonly paths = PATHS;
}
