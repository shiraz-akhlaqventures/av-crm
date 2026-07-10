import { Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import type { Subsidiary } from "@av-crm/shared-types";

@Injectable()
export class SubsidiariesService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.firestore.collection("subsidiaries");
  }

  async findAll(companyId?: string): Promise<Subsidiary[]> {
    let query: FirebaseFirestore.Query = this.col();
    if (companyId) query = query.where("companyId", "==", companyId);
    const snap = await query.get();
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Subsidiary, "id">) }),
    );
  }

  async findOne(id: string): Promise<Subsidiary | null> {
    const doc = await this.col().doc(id).get();
    return doc.exists
      ? { id: doc.id, ...(doc.data() as Omit<Subsidiary, "id">) }
      : null;
  }
}
