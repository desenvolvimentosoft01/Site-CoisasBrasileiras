// Validacao de codigo de barras EAN-13 (padrao da imensa maioria dos
// produtos no Brasil) - confere o tamanho (13 digitos) e o digito
// verificador, mesmo algoritmo publico usado em qualquer leitor de codigo
// de barras (GTIN checksum). Aceita tambem EAN-8 (8 digitos, comum em
// embalagens pequenas), que usa o mesmo algoritmo.
export function validarCodigoBarras(codigo: string): boolean {
  const digitos = codigo.replace(/\D/g, "")
  if (digitos.length !== 13 && digitos.length !== 8) return false

  const numeros = digitos.split("").map(Number)
  const digitoVerificador = numeros.pop()!

  let soma = 0
  // Da direita pra esquerda (ja sem o digito verificador), peso alterna 3/1.
  numeros
    .reverse()
    .forEach((n, indice) => {
      soma += n * (indice % 2 === 0 ? 3 : 1)
    })

  const calculado = (10 - (soma % 10)) % 10
  return calculado === digitoVerificador
}

// Calcula o digito verificador de um EAN-13 a partir dos 12 primeiros
// digitos (mesmo algoritmo GTIN usado na validacao acima, so que gerando em
// vez de conferindo).
function calcularDigitoVerificador(doze: string): number {
  let soma = 0
  doze
    .split("")
    .map(Number)
    .reverse()
    .forEach((n, indice) => {
      soma += n * (indice % 2 === 0 ? 3 : 1)
    })
  return (10 - (soma % 10)) % 10
}

// Prefixo 2: faixa que a GS1 reserva pra USO INTERNO / distribuicao restrita.
// Nenhum produto de circulacao comercial tem GTIN comecando com 2, entao usar
// essa faixa pra codigo proprio nao colide com o codigo de ninguem.
const PREFIXO_USO_INTERNO = "2"

// Gera um EAN-13 valido pra produto que nao tem GTIN do fabricante.
//
// POR QUE NAO E SO "COMPLETAR COM ZEROS A ESQUERDA": GTIN nao e um numero
// qualquer de 13 digitos - e uma numeracao global emitida pela GS1, e a
// Sefaz valida. Pegar o codigo interno "1234", virar "0000000001234" e
// mandar como GTIN na NF-e cria um codigo que ou nao existe, ou pertence a
// outra empresa - e a nota e rejeitada por GTIN invalido.
//
// A saida correta e a faixa de uso interno (prefixo 2) com digito
// verificador calculado: o leitor de codigo de barras do balcao le
// normalmente, e na NF-e esse codigo NUNCA vai como GTIN - vai "SEM GTIN",
// que e o que o padrao manda quando o produto nao tem GTIN de verdade
// (ver o campo codigo_barras_interno em TAB_PRODUTO e lib/bling.ts).
export function gerarEanInterno(codigoInterno: string): string {
  // So os digitos interessam: SKU costuma ter letra e hifen ("CB-001"), que
  // nao cabem num EAN. Sem nenhum digito, cai pro tempo atual - garante que
  // dois produtos cadastrados em sequencia nao recebam o mesmo codigo.
  const digitos = codigoInterno.replace(/\D/g, "") || String(Date.now())

  // 12 digitos = prefixo (1) + 11 do codigo. Corta pelos ultimos digitos
  // quando o codigo e maior, porque o final e a parte que varia entre
  // produtos (prefixo comum de familia costuma ficar na frente).
  const corpo = digitos.slice(-11).padStart(11, "0")
  const doze = `${PREFIXO_USO_INTERNO}${corpo}`

  return `${doze}${calcularDigitoVerificador(doze)}`
}

// Um EAN-13 na faixa de uso interno nao pode ser enviado como GTIN na NF-e.
export function ehCodigoDeUsoInterno(codigo: string): boolean {
  return codigo.replace(/\D/g, "").startsWith(PREFIXO_USO_INTERNO)
}
