import { Controller, Get } from "@nestjs/common";
import { SupabaseService } from "./supabase/supabase.service";

@Controller("supabase")
export class SupabaseController {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Verify the Supabase admin client can reach the project.
   * Lists bucket names — if the call succeeds, env vars + network are OK.
   */
  @Get("health")
  async health() {
    const { data, error } = await this.supabase.admin.storage.listBuckets();
    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
    return {
      ok: true,
      buckets: data.map((b) => b.name),
    };
  }
}
