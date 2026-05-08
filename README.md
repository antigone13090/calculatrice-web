# Calculatrice Web

## Description
Ce projet est une calculatrice web en HTML, CSS et JavaScript natif. Elle propose désormais une interface plus professionnelle, des fonctions scientifiques, une mémoire, un historique persistant et une meilleure prise en charge du clavier.

## Fonctionnalités
- Opérations classiques : addition, soustraction, multiplication, division, pourcentage et parenthèses.
- Fonctions avancées : racine carrée, carré, puissance, inverse, changement de signe, constantes `π` et `e`.
- Fonctions scientifiques : `sin`, `cos`, `tan`, `log`, `ln`.
- Mode d'angle : degrés ou radians.
- Arrondi configurable : 2, 4 ou 6 décimales.
- Mémoire : `MC`, `MR`, `M+`, `M-`.
- Historique des 10 derniers calculs avec sauvegarde dans `localStorage`.
- Réutilisation d'un calcul depuis l'historique par simple clic.
- Mode clair / mode sombre avec sauvegarde du thème.
- Copie du résultat dans le presse-papiers.
- Messages d'erreur explicites pour les expressions invalides ou les divisions par zéro.

## Technologies utilisées
- HTML5
- CSS3
- JavaScript natif
- `localStorage` pour l'historique, le thème et les préférences

## Structure des fichiers
- `index.html` : structure de l'interface
- `style.css` : styles, responsive, thèmes clair/sombre
- `app.js` : logique de calcul, parser sécurisé, mémoire, historique, interactions clavier
- `README.md` : documentation du projet

## Installation
1. Cloner ou télécharger le projet.
2. Se placer dans le dossier du projet.

## Lancement en local
Lancer un serveur HTTP simple avec :

```bash
python3 -m http.server 8000
```

Puis ouvrir dans le navigateur :

```text
http://localhost:8000
```

## Utilisation
- Saisir une expression avec les boutons ou le clavier.
- Utiliser les boutons scientifiques pour enrichir le calcul.
- Choisir le mode `DEG` ou `RAD` selon le contexte trigonométrique.
- Régler l'arrondi sur `2`, `4` ou `6` décimales.
- Appuyer sur `=` ou `Entrée` pour calculer.
- Utiliser l'historique pour relancer rapidement une expression précédente.
- Copier le résultat avec le bouton dédié.

## Raccourcis clavier
- `0` à `9` : saisie des chiffres
- `+`, `-`, `*`, `/`, `%`, `^` : opérateurs
- `(`, `)` : parenthèses
- `Entrée` ou `=` : calculer
- `Backspace` : supprimer le dernier caractère
- `Échap` : effacer l'expression
- `S` : `sin(`
- `C` : `cos(`
- `T` : `tan(`
- `L` : `log(`
- `N` : `ln(`
- `R` : racine carrée sur l'expression courante
- `Q` : carré sur l'expression courante
- `I` : inverse `1/x` sur l'expression courante
- `P` : constante `π`
- `E` : constante `e`

## Améliorations possibles
- Ajouter un mode historique exportable.
- Proposer un affichage plus détaillé des étapes de calcul.
- Ajouter des tests automatisés JavaScript.
- Intégrer un mode ingénieur avec davantage de fonctions mathématiques.

## Auteur
Thierry Mas

## GitHub Pages
Lien à compléter :
https://antigone13090.github.io/calculatrice-web/
