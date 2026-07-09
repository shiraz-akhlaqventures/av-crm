import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FirebaseService } from "../firebase/firebase.service";
import type { AuthResponse, TokenPayload, User } from "@av-crm/shared-types";

@Injectable()
export class AuthService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Exchange a Firebase ID token for our own JWT pair.
   *
   * 1. Verify the Firebase ID token (signature, expiry, audience).
   * 2. Look up / create the user in Firestore `users` collection.
   * 3. Issue access (15m) + refresh (7d) JWTs containing role/permissions.
   */
  async loginWithFirebase(idToken: string): Promise<AuthResponse> {
    let decoded;
    try {
      decoded = await this.firebase.verifyIdToken(idToken);
    } catch (err) {
      throw new UnauthorizedException("Invalid Firebase ID token");
    }

    const uid = decoded.uid;
    const email = decoded.email ?? "";

    // Look up or create user document.
    const userRef = this.firebase.firestore.collection("users").doc(uid);
    const snap = await userRef.get();

    let user: User;
    if (!snap.exists) {
      // First-time login: create a minimal user record.
      const newUser: User = {
        uid,
        email,
        displayName: decoded.name ?? email.split("@")[0] ?? "User",
        photoURL: decoded.picture,
        role: "employee",
        permissions: [],
        primaryEntityId: "",
        primaryEntityType: "employee",
      };
      await userRef.set({
        ...newUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      user = newUser;
    } else {
      const data = snap.data() as User;
      user = { ...data, uid };
    }

    const payload: TokenPayload = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      primaryEntityId: user.primaryEntityId,
      primaryEntityType: user.primaryEntityType,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: "15m",
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken, user };
  }
}
