import { useEffect, useState } from 'react';
import type { Produto } from '../types';
import { urlDaImagem } from '../lib/imagem';

interface Props {
  produto: Pick<Produto, 'nome' | 'imagemUrl'>;
  className?: string; // tamanho/formato do espaço (ex: "w-full h-full")
  inicialClassName?: string; // tamanho da letra do placeholder
}

// Mostra a foto do produto; sem foto (ou se ela falhar ao carregar), mostra a inicial do nome.
export default function ProdutoImagem({ produto, className = 'w-full h-full', inicialClassName = 'text-4xl' }: Props) {
  const url = urlDaImagem(produto);
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [url]);

  if (!url || falhou) {
    return (
      <div className={`${className} flex items-center justify-center font-serif text-gold/40 ${inicialClassName}`}>
        {produto.nome.charAt(0)}
      </div>
    );
  }
  return <img src={url} alt={produto.nome} loading="lazy" onError={() => setFalhou(true)} className={`${className} object-cover`} />;
}
