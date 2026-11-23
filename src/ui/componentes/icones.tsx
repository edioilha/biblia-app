const svg = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    className="size-[1.15rem]"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/** Ícones das barras (traço, herdam a cor do texto). */
export const Icones = {
  lapis: svg('M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4'),
  lixeira: svg('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'),
  borracha: svg(
    'M7 21h13M5.5 14.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8l-2.5-2.5a1.4 1.4 0 0 1 0-2z',
  ),
};
