# La borne d'arcade — deux jeux, un menu, les mêmes boutons

Montage **temporaire** pour l'événement : la borne tourne sur *Microbe Fighter*
et *Cell Dungeon* à la place des deux jeux habituels. Rien n'est supprimé —
voir [Remettre la borne comme avant](#remettre-la-borne-comme-avant) à la fin.

```
            ┌──────────── serveur.js, un seul port ────────────┐
   /        │  le menu (index.html + borne.js + manette.js)    │
   /jeux/microbe-fighter/   →  le dépôt Microbe Fighter        │
   /jeux/cell-dungeon/      →  le dépôt Cell Dungeon           │
            └──────────────────────────────────────────────────┘
```

Un jeu choisi s'ouvre dans une **iframe** du menu. Trois conséquences, et
elles sont le cœur du montage :

- **Un seul port, donc une seule origine.** C'est à cette condition que le
  menu peut lire le clavier et les manettes du jeu qu'il héberge, donc
  reconnaître le geste de retour **sans que les jeux y participent**. Ni
  *Microbe Fighter* ni *Cell Dungeon* ne contiennent une ligne pour cette
  borne : on peut les mettre à jour sans rien casser ici.
- **Revenir au menu détruit l'iframe**, donc le jeu : boucle d'images
  arrêtée, contexte audio fermé, mémoire rendue. Une navigation ordinaire
  laisserait tout cela derrière elle, et une borne tourne six heures d'affilée.
- **Le menu survit au jeu.** Même si un jeu se fige, le geste de retour est
  lu par le menu, qui est un autre document.

---

## Les gestes

| Geste | Effet |
|---|---|
| Joystick gauche/droite | Choisir un jeu |
| Poing, pied ou START | Lancer le jeu retenu |
| **Les deux START tenus 1,5 s** | Revenir au menu, depuis n'importe quel jeu |
| START + SELECT tenus 1,5 s | Idem, si l'encodeur n'expose qu'une seule manette |
| Plus rien pendant 3 min | Retour au menu tout seul |

Une jauge se remplit pendant le maintien : sans elle, 1,5 s se vivent comme
une panne. Le délai d'inactivité se règle dans `jeux.json`
(`retourInactif`, en secondes, `0` pour le désactiver), et s'essaie sans rien
modifier avec `http://localhost:8080/?inactif=10`.

---

## Sur le poste de développement

```bash
cd borne
npm install          # Playwright, pour le banc uniquement
npm run serveur      # http://localhost:8080/
npm run banc         # 16 verdicts : le menu, les deux jeux, le retour, le serveur
```

Le serveur écrit au démarrage **ce qu'il a monté**. Une racine introuvable
est annoncée, et sa tuile s'affiche barrée dans le menu — une configuration
devinée en silence est une panne qu'on ne découvre que le public devant.

```
  /jeux/microbe-fighter/ -> /home/moi/Microbe-Fighter
  /jeux/cell-dungeon/ -> /home/moi/Cell-dungeon
  Borne dispo sur http://localhost:8080/
```

---

## Déployer sur la Raspberry Pi

### 1. Sauvegarder le montage actuel — avant tout le reste

Les deux jeux habituels ne sont **pas** supprimés. On note où ils sont, ce
qui les lance, et on désactive seulement le lancement :

```bash
systemctl --user list-units | grep -i -E 'jeu|game|kiosk'   # ou
systemctl list-units --type=service | grep -i -E 'jeu|game|kiosk'
crontab -l; ls ~/.config/autostart/ ~/.config/lxsession/LXDE-pi/ 2>/dev/null
cat ~/.config/wayfire.ini 2>/dev/null | sed -n '/autostart/,$p'
```

Tout ce qui est trouvé est **copié** avant d'être touché :

```bash
mkdir -p ~/borne-avant-fete
cp -a <chaque fichier trouvé> ~/borne-avant-fete/
```

### 2. Poser les deux jeux

La disposition attendue par `jeux.json` — aucune modification de fichier
n'est nécessaire si elle est respectée :

```bash
mkdir -p ~/borne && cd ~/borne
git clone https://github.com/microbiologames/Microbe-Fighter.git microbe-fighter
git clone https://github.com/microbiologames/Cell-dungeon.git cell-dungeon
cd cell-dungeon && git checkout claude/epic-carson-ryenav && cd ..
```

Le lanceur vit dans `microbe-fighter/borne/`. Il cherche les jeux dans cet
ordre : à côté de lui d'abord (poste de développement), puis
`/home/pi/borne/...`. Si l'utilisateur de la borne n'est pas `pi`, ajouter le
bon chemin dans `racines` de `jeux.json`.

### 3. Le serveur au démarrage

`/etc/systemd/system/borne.service` :

```ini
[Unit]
Description=Borne Microbiologames — menu et jeux
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/borne/microbe-fighter/borne/serveur.js 8080
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now borne
systemctl status borne          # les lignes de montage doivent y figurer
curl -s localhost:8080/jeux.json | head -c 200
```

### 4. Chromium en kiosque

```
chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  http://localhost:8080/
```

**`--autoplay-policy=no-user-gesture-required` n'est pas une option de
confort.** Un appui sur une manette **n'est pas** un geste utilisateur au
sens du navigateur : sans ce drapeau, une borne qui n'a ni clavier ni souris
peut très bien rester muette alors que les deux jeux croient jouer leur
musique. C'est le premier point à vérifier sur place.

Selon la version du système, la ligne va dans :

- `~/.config/lxsession/LXDE-pi/autostart` (ancien bureau LXDE), précédée de `@` ;
- `~/.config/autostart/borne.desktop` (bureau récent) ;
- `~/.config/wayfire.ini`, section `[autostart]` (Bookworm, Wayland).

`cat /etc/os-release` et `echo $XDG_SESSION_TYPE` disent laquelle. Et pour
que l'écran ne s'éteigne pas : `xset s off -dpms` (X11) ou l'équivalent
`idle_timeout 0` du bureau utilisé. Le pointeur, lui, est déjà masqué : le
menu le cache, et il injecte la même règle dans la page du jeu qu'il ouvre.

### 5. Relever les boutons — ne rien deviner

```
http://localhost:8080/touches.html
```

La page demande un geste à la fois et note ce que le navigateur reçoit
vraiment : index de manette, index de bouton, numéro d'axe et signe. Elle
affiche un bloc JSON à recopier. **Ce relevé est la seule source** pour :

- `borne/manette.js` → `BOUTONS` (menu et geste de retour) ;
- `js/engine/Input.js` de Microbe Fighter → `GAMEPAD_BUTTONS` ;
- `src/core/input.js` de Cell Dungeon → `PAD_BOUTONS`, et l'ordre des deux
  manettes.

Si l'encodeur numérote les manettes dans l'autre sens, l'ordre se corrige
**sans toucher au code**, par l'URL servie au kiosque :

```
http://localhost:8080/jeux/cell-dungeon/?manettes=1,0
```

(Le même paramètre se met dans `url` du jeu, dans `jeux.json`.)

### 6. Les mesures à faire sur place

Rien de tout cela n'est vérifiable à distance. Dans l'ordre, et en notant
les chiffres :

1. **Le son sort**, dans les deux jeux, sans clavier ni souris branchés.
   Sinon : le drapeau d'autoplay de l'étape 4.
2. **La jauge de retour se remplit pendant une partie.** C'est le point le
   plus incertain du montage : Chromium ne livre l'état des manettes qu'au
   document qui a le focus, et le menu interroge donc celui de l'iframe.
   Si la jauge ne bouge qu'au menu, c'est là que ça se joue.
3. **Combien de manettes** l'encodeur présente (une ou deux), et **la valeur
   des axes au repos** — `touches.html` l'affiche. En dessous de 0,25, la
   zone morte de Cell Dungeon convient ; au-dessus, il faut la relever.
4. **Les deux joysticks de Cell Dungeon** : le gauche nage, le droit met au
   point. C'est le geste voulu — un joueur, deux joysticks en main.
5. **Les images par seconde**, dans les deux jeux. Cell Dungeon affiche
   beaucoup de petits objets : si la Raspberry décroche, on le saura là, pas
   le jour de l'événement.
6. **La lisibilité à 1,5 m** du menu et des deux HUD, debout devant la borne.

### 7. Remettre la borne comme avant

```bash
sudo systemctl disable --now borne
cp -a ~/borne-avant-fete/<fichiers> <leurs emplacements d'origine>
sudo reboot
```

Les deux dépôts peuvent rester dans `~/borne` : ils ne se lancent plus.

---

## Ce qui est mesuré, et ce qui ne l'est pas

`npm run banc` conduit **le vrai serveur** dans un vrai navigateur : le menu,
le lancement des deux jeux dans leur iframe, le fait que le lanceur ne vole
pas les touches au jeu, le maintien court qui ne quitte pas, le maintien
complet qui revient **et détruit l'iframe**, le retour sur inactivité, la
tuile barrée d'un jeu absent, et le refus de sortir de la racine d'un jeu.

Playwright ne sait pas brancher une manette : **tout ce qui est manette se
relève sur la borne**, avec `touches.html`. Le chemin clavier et le chemin
manette partagent la boucle, les fronts et le combo — c'est ce partage qui
rend le banc utile, pas une promesse qu'il couvre l'encodeur.

Le banc refuse de tourner si son serveur n'a pas démarré. Un serveur resté
d'un banc précédent avait gardé le port, et le banc mesurait **une version
antérieure du code** en restant vert.
