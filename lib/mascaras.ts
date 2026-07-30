// Mascaras de digitacao dos formularios. Recebem o texto digitado e devolvem
// formatado; usadas em inputs controlados (onChange aplica a mascara).

export function mascaraCPF(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2")
}

export function mascaraCNPJ(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/\/(\d{4})(\d{1,2})$/, "/$1-$2")
}

// Aceita CPF (11 digitos) ou CNPJ (14 digitos) conforme a quantidade digitada.
export function mascaraCpfCnpj(texto: string): string {
  const d = texto.replace(/\D/g, "")
  return d.length > 11 ? mascaraCNPJ(texto) : mascaraCPF(texto)
}

export function mascaraTelefone(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d.replace(/(\d{1,2})/, "($1")
  if (d.length <= 6) return d.replace(/(\d{2})(\d+)/, "($1) $2")
  // Fixo (10 digitos): (00) 0000-0000 - celular (11): (00) 00000-0000
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d*)/, "($1) $2-$3")
  return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}

export function mascaraCEP(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 8)
  return d.replace(/(\d{5})(\d)/, "$1-$2")
}

// Campos que so aceitam numero inteiro (estoque, quantidade) - descarta
// qualquer letra/simbolo digitado ou colado, em vez de deixar o campo aceitar
// e so quebrar na hora de salvar.
export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, "")
}

// Campos decimais (peso, dimensoes) - aceita digitos e uma unica virgula.
export function mascaraDecimal(texto: string): string {
  const limpo = texto.replace(/[^\d,]/g, "")
  const [inteiro, ...resto] = limpo.split(",")
  return resto.length > 0 ? `${inteiro},${resto.join("")}` : inteiro
}

// Converte o texto de um campo decimal ("1,5") para numero (1.5).
export function decimalParaNumero(texto: string): number {
  return Number(texto.replace(",", ".")) || 0
}

// Formata um numero (em reais, ex: 89.9) como moeda para exibicao (R$ 89,90).
export function formatarMoeda(valor: number | string): string {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// Converte o texto digitado num campo de valor (ex: "89,90" ou "8990") para
// numero em reais, tratando como se os ultimos 2 digitos fossem centavos -
// mesmo comportamento dos campos de valor monetario de caixas/PDVs.
export function mascaraMoeda(texto: string): string {
  const d = texto.replace(/\D/g, "")
  if (!d) return ""
  const numero = Number(d) / 100
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function valorMoedaParaNumero(textoFormatado: string): number {
  const normalizado = textoFormatado.replace(/\./g, "").replace(",", ".")
  return Number(normalizado) || 0
}
