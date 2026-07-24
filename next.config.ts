import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache do router no navegador: reabrir uma tela ja visitada ha pouco tempo
  // (ex: trocar de aba no admin) usa os dados que ja estavam em memoria em vez
  // de buscar tudo de novo no servidor e mostrar o loading.tsx a cada clique.
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
