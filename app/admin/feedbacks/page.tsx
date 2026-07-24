import { query } from "@/lib/db"
import { FeedbacksConteudo } from "@/components/admin/feedbacks-conteudo"

export default async function FeedbacksPage() {
  const feedbacks = await query("SELECT * FROM TAB_FEEDBACK ORDER BY ordem, criado_em DESC")

  return <FeedbacksConteudo feedbacksIniciais={feedbacks} />
}
