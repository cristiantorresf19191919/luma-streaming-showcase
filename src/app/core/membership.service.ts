import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class MembershipService {
  readonly opened = signal(false);
  open(): void {
    this.opened.set(true);
  }
}
