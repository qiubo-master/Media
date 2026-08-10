import { destroySession } from "@/lib/auth";
import { seeOther } from "@/lib/request";

export async function POST() {
  await destroySession();
  return seeOther("/login");
}
