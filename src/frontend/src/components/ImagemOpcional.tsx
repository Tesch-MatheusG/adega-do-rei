import { useState, type ImgHTMLAttributes } from 'react';

// <img> que simplesmente some se o arquivo não existir (em vez de mostrar o ícone de imagem quebrada).
export default function ImagemOpcional({ onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return null;
  return <img {...props} onError={(e) => { setFalhou(true); onError?.(e); }} />;
}
