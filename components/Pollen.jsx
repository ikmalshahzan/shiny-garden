const pollen = Array.from({ length: 18 }, (_, index) => ({
  '--x': (8 + (index * 17.7) % 85) + '%',
  '--y': (18 + (index * 13.1) % 67) + '%',
  '--size': (2 + index % 4) + 'px',
  '--period': (8 + index % 7) + 's',
  '--delay': (-index * .73) + 's',
  '--drift': ((index % 2 ? -1 : 1) * (14 + index % 6 * 5)) + 'px',
}));

export default function Pollen() {
  return (
    <div className="pollen">
      {pollen.map(style => <i key={style['--x']} style={style} />)}
    </div>
  );
}
