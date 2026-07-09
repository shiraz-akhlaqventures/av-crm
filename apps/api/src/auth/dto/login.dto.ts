import { IsString, MinLength } from "class-validator";

export class LoginDto {
  /**
   * Firebase ID token obtained from
   * firebase.auth().currentUser.getIdToken() on the client.
   */
  @IsString()
  @MinLength(10)
  idToken!: string;
}
