import "./src/styles.css";

import type { CanvasProps } from "@compozy/proto";
import { MemoryRouter } from "react-router-dom";

/**
 * O app só tem `styles.css` e o roteador em volta das telas. As views usam
 * `<Link>`, então cada estado ganha um roteador em memória: os links
 * renderizam, mas não navegam.
 *
 * Não há `Frame`: cada área (login, catequista, coordenação) desenha a própria
 * casca dentro da página, e o protótipo já mostra a tela inteira.
 */
export function Canvas({ children }: CanvasProps) {
  return <MemoryRouter>{children}</MemoryRouter>;
}
