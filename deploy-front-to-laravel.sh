#!/bin/bash

# Arrêter en cas d'erreur
set -e

# Étape 1 : Builder le projet frontend
echo "🔨 Build du projet..."
npm run build

# Étape 2 : Chemin vers le dossier dist (modifie selon ton framework)
DIST_PATH="./dist/portail-scolaire/browser"  # Dossier de build Angular

# Étape 3 : Chemin vers le dossier public du backend Laravel
BACK_PUBLIC_PATH="../PortailScolaire-Back/public"

# Vérification que le dossier dist existe
if [ ! -d "$DIST_PATH" ]; then
  echo "❌ Dossier '$DIST_PATH' introuvable. Le build a-t-il échoué ?"
  exit 1
fi

# Étape 4 : Suppression uniquement des anciens fichiers frontend dans public/
# ⚠️ On conserve index.php, .htaccess, etc.
echo "🧹 Nettoyage des anciens fichiers frontend dans $BACK_PUBLIC_PATH (en conservant les fichiers Laravel)..."
find "$BACK_PUBLIC_PATH" -type f \
  ! -name 'index.php' \
  ! -name '.htaccess' \
  ! -name 'favicon.ico' \
  ! -name 'robots.txt' \
  -exec rm -f {} \;

find "$BACK_PUBLIC_PATH" -mindepth 1 -type d -not -path "$BACK_PUBLIC_PATH" -exec rm -rf {} +

# Étape 5 : Copie des nouveaux fichiers build dans public/
echo "📦 Copie des fichiers de $DIST_PATH vers $BACK_PUBLIC_PATH..."
cp -r "$DIST_PATH"/* "$BACK_PUBLIC_PATH"

echo "✅ Build et copie terminés avec succès."
