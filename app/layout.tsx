import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { resolverMarcaAtual } from "@/lib/marca";
import { getConfiguracoesMarca } from "@/lib/configuracoes";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Fallback por marca pra quando a loja ainda nao configurou nome/descricao
// em TAB_CONFIGURACAO_MARCA (ex: Porcelanas Brancas recem migrada).
const METADATA_PADRAO = {
  colorido: {
    titulo: "Coisas Brasileiras — Loja",
    descricao: "Porcelanas decorativas, presentes, artigos religiosos e perfumaria, direto pra sua casa.",
  },
  branco: {
    titulo: "Porcelanas Brancas — Loja",
    descricao: "Porcelanas decorativas em branco, direto pra sua casa.",
  },
} as const;

// Dinamico por marca (host) pra titulo/descricao nao vazarem "Coisas
// Brasileiras" pro dominio da Porcelanas Brancas - generateMetadata roda por
// requisicao, diferente do export const metadata estatico que so olha build.
export async function generateMetadata(): Promise<Metadata> {
  const marca = await resolverMarcaAtual();
  const padrao = METADATA_PADRAO[marca];
  const config = await getConfiguracoesMarca(["nome_loja", "texto_sobre_nos", "logo_url"], marca);

  return {
    title: config.nome_loja ? `${config.nome_loja} — Loja` : padrao.titulo,
    description: config.texto_sobre_nos || padrao.descricao,
    // Icone da aba declarado aqui, e nao pelo arquivo app/icon.*: nesse
    // esquema o Next so reconhece ico/png/jpg/svg, e o que existia era um
    // .webp - por isso o navegador mostrava o globo generico. Declarado por
    // metadata o formato deixa de importar, e de quebra cada loja usa a
    // PROPRIA logo, que e configurada por marca.
    icons: { icon: config.logo_url || "/logo.webp" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
