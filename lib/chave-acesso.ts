// Digito verificador da chave de acesso da NF-e (44 digitos) - algoritmo
// modulo 11 padrao. Confere so a integridade do numero (nao consulta a
// Sefaz). Compartilhado entre leitura de XML (lib/nfe-xml.ts) e digitacao
// manual na Entrada de NF (components/admin/compras-conteudo.tsx) - por
// isso fica isolado sem depender do parser de XML (evita empacotar
// fast-xml-parser no bundle do client so pra validar um numero).
export function validarChaveAcesso(chave: string): boolean {
  const digitos = chave.replace(/\D/g, "")
  if (digitos.length !== 44) return false

  const corpo = digitos.slice(0, 43)
  const dvInformado = Number(digitos[43])

  let soma = 0
  let peso = 2
  for (let i = corpo.length - 1; i >= 0; i--) {
    soma += Number(corpo[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  const dvCalculado = resto < 2 ? 0 : 11 - resto

  return dvCalculado === dvInformado
}
