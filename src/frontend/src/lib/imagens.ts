// Imagens fixas do site (logo, fundo da Home e categorias da Home).
// Os arquivos ficam na pasta  src/frontend/public/img/  e são servidos a partir de "/img/...".
//
// Para trocar uma imagem: substitua o arquivo mantendo o nome. Se o seu arquivo tiver outra
// extensão (.jpg, .png, .webp), ajuste o caminho aqui
// Use sempre minúsculas, sem espaços e sem acentos.
export const IMAGENS = {
  logo: '/img/logo.png',
  hero: '/img/hero.jpg',
  categorias: {
    Vinhos: '/img/categorias/vinhos.jpg',
    Cervejas: '/img/categorias/cervejas.jpg',
    Whiskies: '/img/categorias/whiskies.jpg',
    'Gins & Vodkas': '/img/categorias/gins-vodkas.jpg',
  },
} as const
export const MOSTRAR_NOME_AO_LADO_DA_LOGO = true;
