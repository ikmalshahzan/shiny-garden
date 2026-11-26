'use client';

import { useEffect, useRef } from 'react';
import { mountGardenMotion } from '../lib/garden-motion';

export default function GardenMotion({ children }) {
  const scene = useRef(null);

  useEffect(() => mountGardenMotion(scene.current), []);

  return <main ref={scene}>{children}</main>;
}
