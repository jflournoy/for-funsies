/**
 * Retro CRT Glitch and Asymmetry Theme Controller for DARE 006.
 *
 * Toggles subtle playful asymmetry, scanlines, and retro vibes safely.
 */

export function initGlitchTheme(): void {
  const toggleBtn = document.querySelector<HTMLButtonElement>("#glitch-toggle-btn");
  if (!toggleBtn) return;

  let isGlitchActive = false;

  toggleBtn.addEventListener("click", () => {
    isGlitchActive = !isGlitchActive;
    if (isGlitchActive) {
      document.body.classList.add("theme-slightly-wrong");
      toggleBtn.textContent = "Disable Quirky Mode";
    } else {
      document.body.classList.remove("theme-slightly-wrong");
      toggleBtn.textContent = "Enable Quirky Mode";
    }
  });
}
