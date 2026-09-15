// Charge les animations d'un personnage à partir de son manifeste JSON.
// Convention de fichiers attendue par dossier d'animation : 000.png, 001.png, 002.png, ...
// (c'est le format d'export "frame par frame" de Pixellab)
//
// Si une image est manquante (404), un placeholder coloré est dessiné à la place,
// ce qui permet de tester le jeu avant même d'avoir les sprites définitifs.

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // null => on utilisera un placeholder
    img.src = src;
  });
}

export async function loadCharacter(manifestPath) {
  const res = await fetch(manifestPath);
  if (!res.ok) throw new Error(`Impossible de charger ${manifestPath} (${res.status})`);
  const data = await res.json();

  const animations = {};

  // Les chemins ("folder", "portrait") dans le JSON sont relatifs à la racine du site
  // (là où se trouve index.html), pas au fichier manifeste lui-même.
  for (const [name, anim] of Object.entries(data.animations)) {
    const pad = (n) => String(n).padStart(3, '0');
    const frames = await Promise.all(
      Array.from({ length: anim.frameCount }, (_, i) => loadImage(`${anim.folder}/${pad(i)}.png`))
    );
    animations[name] = {
      frames,
      frameDuration: anim.frameDuration ?? 100,
      loop: anim.loop ?? true,
      hitbox: anim.hitbox ?? null,
      hurtboxOverride: anim.hurtboxOverride ?? null,
    };
  }

  let portrait = null;
  if (data.portrait) portrait = await loadImage(data.portrait);

  return {
    id: data.id,
    displayName: data.displayName,
    color: data.color || '#888',
    scale: data.scale || 2,
    // Rangée (en pixels, dans l'image source) où les pieds touchent le sol.
    // Utile pour les exports Pixellab, dont le canvas (souvent 256x256) contient
    // du padding transparent sous le personnage. Si absent, on suppose que les
    // pieds sont exactement au bord bas de l'image (comportement des placeholders).
    groundY: data.groundY ?? null,
    hurtbox: data.hurtbox ?? null,
    moveSpeed: data.moveSpeed ?? null,
    jumpVelocity: data.jumpVelocity ?? null,
    hitEffectTheme: data.hitEffectTheme ?? null,
    moves: data.moves || {},
    sfx: data.sfx || {},
    animations,
    portrait,
  };
}
