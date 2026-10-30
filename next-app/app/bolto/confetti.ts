/** Returns an idempotent cancellation function for early dismissal/unmount. */
export function burstConfetti(
  host: HTMLDivElement | null,
  reducedMotion: boolean,
  viewport: { width: number; height: number },
): () => void {
    if (!host || reducedMotion) return () => {};
    const animations = new Set<Animation>();
    const colors = ['var(--bolto-primary)', 'var(--bolto-success)', '#90dfac', '#f2ba61'];
    const { width, height } = viewport;
    for (let index = 0; index < 56; index++) {
      const left = index % 2 === 0;
      const particle = host.ownerDocument.createElement('i');
      const duration = 2100 + Math.random() * 650;
      const travel = (left ? 1 : -1) * width * (0.12 + Math.random() * 0.42);
      const rotation = (Math.random() - 0.5) * 1080;
      Object.assign(particle.style, {
        position: 'absolute', left: left ? '8%' : '92%', top: '10%',
        width: `${4 + Math.random() * 4}px`, height: `${7 + Math.random() * 5}px`,
        background: colors[index % colors.length], borderRadius: '1px',
      });
      host.appendChild(particle);
      const animation = particle.animate([
        { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate3d(${travel * 0.4}px,-35px,0) rotate(${rotation * 0.2}deg)`, opacity: 1, offset: 0.15 },
        { transform: `translate3d(${travel * 0.8}px,${height * 0.35}px,0) rotate(${rotation * 0.65}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate3d(${travel}px,${height}px,0) rotate(${rotation}deg)`, opacity: 0 },
      ], { duration, easing: 'cubic-bezier(.2,.5,.6,1)', fill: 'both' });
      animation.onfinish = () => { particle.remove(); animation.cancel(); animations.delete(animation); };
      animations.add(animation);
    }
    return () => { animations.forEach(animation => animation.cancel()); animations.clear(); host.replaceChildren(); };
}
