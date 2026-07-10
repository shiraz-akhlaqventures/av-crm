import { Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import type { Department } from "@av-crm/shared-types";

@Injectable()
export class DepartmentsService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.firestore.collection("departments");
  }

  async findAll(filter: {
    companyId?: string;
    subsidiaryId?: string;
  }): Promise<Department[]> {
    let query: FirebaseFirestore.Query = this.col();
    if (filter.companyId) query = query.where("companyId", "==", filter.companyId);
    if (filter.subsidiaryId)
      query = query.where("subsidiaryId", "==", filter.subsidiaryId);
    const snap = await query.get();
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Department, "id">) }),
    );
  }

  async findOne(id: string): Promise<Department | null> {
    const doc = await this.col().doc(id).get();
    return doc.exists
      ? { id: doc.id, ...(doc.data() as Omit<Department, "id">) }
      : null;
  }
}
