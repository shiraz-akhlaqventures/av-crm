import { Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import type { Company } from "@av-crm/shared-types";

@Injectable()
export class CompaniesService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.firestore.collection("companies");
  }

  async findAll(): Promise<Company[]> {
    const snap = await this.col().get();
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Company, "id">) }),
    );
  }

  async findOne(id: string): Promise<Company | null> {
    const doc = await this.col().doc(id).get();
    return doc.exists
      ? { id: doc.id, ...(doc.data() as Omit<Company, "id">) }
      : null;
  }
}
