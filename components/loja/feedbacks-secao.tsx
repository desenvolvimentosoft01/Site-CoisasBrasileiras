import Image from "next/image"
import { Star } from "lucide-react"

type Feedback = {
  id: string
  nome: string
  texto: string
  imagem_url: string | null
  nota: number
}

export function FeedbacksSecao({ feedbacks }: { feedbacks: Feedback[] }) {
  if (feedbacks.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h2 className="font-heading mb-6 text-2xl font-semibold text-foreground">
        O que nossos clientes dizem
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="flex flex-col gap-3 rounded-xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={14}
                  className={n <= feedback.nota ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                />
              ))}
            </div>
            <p className="flex-1 text-sm text-neutral-600">&ldquo;{feedback.texto}&rdquo;</p>
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10">
                {feedback.imagem_url && (
                  <Image src={feedback.imagem_url} alt="" fill className="object-cover" sizes="36px" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground">{feedback.nome}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
