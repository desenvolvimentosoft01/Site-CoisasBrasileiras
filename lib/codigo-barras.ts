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
