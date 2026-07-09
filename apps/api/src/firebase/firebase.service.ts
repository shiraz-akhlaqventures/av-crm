import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { initializeApp, cert, getApp, type App } from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK wrapper.
 *
 * Verifies Firebase ID tokens and provides access to Firestore /
 * Auth admin APIs. Initialized once at module load using the
 * FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * env vars (rendered in .env.example).
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private _app: App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.ensureInitialized();
  }

  ensureInitialized(): App {
    if (this._app) return this._app;

    const projectId = this.config.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = this.config.get<string>("FIREBASE_CLIENT_EMAIL");
    const privateKeyRaw = this.config.get<string>("FIREBASE_PRIVATE_KEY");

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn(
        "FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY missing - Firebase features will fail",
      );
    }

    // Render stores the key with literal "\n" escapes; convert to real newlines.
    const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");

    try {
      this._app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } catch (err) {
      // initializeApp throws if called twice (e.g. in tests); reuse the app.
      this._app = getApp();
    }
    this.logger.log(`Firebase Admin initialized for project ${projectId}`);
    return this._app;
  }

  get auth(): Auth {
    return getAuth(this.ensureInitialized());
  }

  get firestore(): Firestore {
    return getFirestore(this.ensureInitialized());
  }

  /**
   * Verify a Firebase ID token and return the decoded claims.
   * Throws if the token is invalid, expired, or revoked.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return this.auth.verifyIdToken(idToken);
  }
}
