import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { criarTokenSessao } from "@/lib/auth"
import { enviarEmail } from "@/lib/email"
import { NextResponse } from "next/server"

const TAMANHO_MINIMO_SENHA = 8

// Troca da propria senha. Sempre exige a senha atual, inclusive quando a atual
// e provisoria: quem esta na frente do computador tem que provar que e o dono
// do acesso, senao uma sessao esquecida aberta vira uma conta sequestrada.
export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro
  const sessao = sessaoOuErro

  const { senhaAtual, novaSenha } = await request.json()

  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ erro: "Informe a senha atual e a nova senha" }, { status: 400 })
  }
  if (String(novaSenha).length < TAMANHO_MINIMO_SENHA) {
    return NextResponse.json(
      { erro: `A nova senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres` },
      { status: 400 }
    )
  }
  if (senhaAtual === novaSenha) {
    return NextResponse.json({ erro: "A nova senha precisa ser diferente da atual" }, { status: 400 })
  }

  const [usuario] = await query(
    "SELECT senha_hash, nome, email FROM TAB_USUARIO_ADMIN WHERE id = $1 AND ativo = true",
    [sessao.id]
  )
  if (!usuario) {
    return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })
  }

  const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha_hash)
  if (!senhaConfere) {
    return NextResponse.json({ erro: "A senha atual está incorreta" }, { status: 401 })
  }

  await query(
    `UPDATE TAB_USUARIO_ADMIN
     SET senha_hash = $1, senha_provisoria = false, senha_alterada_em = NOW()
     WHERE id = $2`,
    [await bcrypt.hash(novaSenha, 10), sessao.id]
  )

  // Avisa por e-mail que a senha mudou. Vai SEMPRE pro e-mail do cadastro, e
  // nunca pra um endereco informado na hora: se a pessoa que trocou a senha
  // pudesse escolher pra onde vai o aviso, quem invadisse a conta mandaria o
  // aviso pra si mesmo e o dono nunca ficaria sabendo. O objetivo do aviso e
  // exatamente esse - o dono descobrir uma troca que nao foi ele.
  //
  // Nao bloqueia a resposta: a senha ja foi trocada, e falha de e-mail nao
  // pode fazer a tela dizer que nao deu certo.
  if (usuario.email) {
    enviarEmail({
      to: usuario.email,
      subject: "Sua senha do painel foi alterada",
      html: `<p>Olá, ${usuario.nome}.</p>
             <p>A senha de acesso ao painel administrativo foi alterada em ${new Date().toLocaleString("pt-BR")}.</p>
             <p><strong>Se foi você, pode ignorar este aviso.</strong> Se não foi, procure o administrador do sistema imediatamente — alguém pode ter acesso à sua conta.</p>`,
    }).catch(() => {})
  }

  // Reemite o cookie sem a marca de senha provisoria - sem isso o middleware
  // continuaria mandando a pessoa pra tela de troca de senha ate ela sair e
  // entrar de novo.
  const token = await criarTokenSessao({
    id: sessao.id,
    nome: sessao.nome,
    email: sessao.email,
    papel: sessao.papel,
    senhaProvisoria: false,
  })

  const resposta = NextResponse.json({ sucesso: true })
  resposta.cookies.set("admin_sessao", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return resposta
}
