import { Injectable, computed, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { firebaseConfig } from '../../environments/firebase.generated';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null, { equal: () => false });
  readonly ready = signal(false);
  readonly configured = Object.values(firebaseConfig).every(Boolean);
  readonly initial = computed(() =>
    (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase(),
  );
  private auth?: Auth;
  constructor() {
    if (!this.configured) {
      this.ready.set(true);
      return;
    }
    this.auth = getAuth(initializeApp(firebaseConfig));
    onAuthStateChanged(
      this.auth,
      (user) => {
        this.user.set(user);
        this.ready.set(true);
      },
      () => this.ready.set(true),
    );
  }
  async email(email: string, password: string, name?: string): Promise<void> {
    if (!this.auth) throw new Error('unconfigured');
    if (name !== undefined) {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });
      this.user.set(credential.user);
    } else await signInWithEmailAndPassword(this.auth, email, password);
  }
  async google(): Promise<void> {
    if (!this.auth) throw new Error('unconfigured');
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }
  async reset(email: string): Promise<void> {
    if (!this.auth) throw new Error('unconfigured');
    await sendPasswordResetEmail(this.auth, email);
  }
  async logout(): Promise<void> {
    if (this.auth) await signOut(this.auth);
  }
}
