/**
 * Animates a product thumbnail flying from a source element to the cart icon.
 * Creates a temporary circular element that arcs upward then drops into the cart.
 */
export function flyToCart(imageUrl: string, sourceEl: HTMLElement) {
  const cartIcon = document.querySelector<HTMLElement>('[aria-label="Shopping cart"]');
  if (!cartIcon) return;

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = cartIcon.getBoundingClientRect();

  // Use a div with background-image so the teal fallback shows immediately
  // even if the image hasn't loaded yet
  const dot = document.createElement("div");
  dot.style.cssText = `
    position: fixed;
    z-index: 9999;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    pointer-events: none;
    background: var(--color-teal, #2f93a3);
    background-image: url(${CSS.escape(imageUrl)});
    background-size: cover;
    background-position: center;
    box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    left: ${sourceRect.left + sourceRect.width / 2 - 25}px;
    top: ${sourceRect.top + sourceRect.height / 2 - 25}px;
  `;
  document.body.appendChild(dot);

  const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  // Wait one frame so the element is painted before animating
  requestAnimationFrame(() => {
    const anim = dot.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 60}px) scale(0.55)`,
          opacity: 0.85,
          offset: 0.4,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0 },
      ],
      { duration: 550, easing: "ease-in", fill: "forwards" }
    );

    anim.onfinish = () => {
      dot.remove();
      // Pulse the cart icon
      cartIcon.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.35)" },
          { transform: "scale(1)" },
        ],
        { duration: 300, easing: "ease-out" }
      );
    };
  });
}
