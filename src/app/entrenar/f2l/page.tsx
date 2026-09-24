import { redirect } from "next/navigation";

/** F2L lives inside Aprender; its cases are at /entrenar/f2l/[caseId]. */
export default function F2LPage() {
  redirect("/entrenar?abierto=f2l");
}
