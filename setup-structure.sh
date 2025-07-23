#!/bin/bash

# ===== Script de création de la structure du projet Angular 17 =====
# Portail Administratif Scolaire
# Usage: ./setup-structure.sh

echo "🏫 Création de la structure du Portail Administratif Scolaire"
echo "============================================================="

# Vérifier si on est dans un projet Angular
if [ ! -f "angular.json" ]; then
    echo "❌ Ce script doit être exécuté dans la racine d'un projet Angular"
    exit 1
fi

echo "📁 Création des dossiers principaux..."

# Créer les dossiers principaux
mkdir -p src/app/core/{auth,guards,interceptors,services,constants,utils}
mkdir -p src/app/shared/{components,models,pipes,directives,validators}
mkdir -p src/app/features/{auth,admin,enseignant,eleve-parent}
mkdir -p src/app/layouts
mkdir -p src/assets/{images,icons,styles,fonts,data}

echo "✅ Dossiers créés"

echo "🔧 Génération des services core..."

# Services core
ng generate service core/auth/auth --skip-tests
ng generate service core/services/api --skip-tests
ng generate service core/services/user --skip-tests
ng generate service core/services/classe --skip-tests
ng generate service core/services/matiere --skip-tests
ng generate service core/services/note --skip-tests

echo "✅ Services générés"

echo "🛡️ Génération des guards..."

# Guards
ng generate guard core/guards/auth --skip-tests
ng generate guard core/guards/admin --skip-tests
ng generate guard core/guards/enseignant --skip-tests
ng generate guard core/guards/eleve --skip-tests

echo "✅ Guards générés"

echo "🔄 Génération des intercepteurs..."

# Intercepteurs
ng generate interceptor core/interceptors/auth --skip-tests

echo "✅ Intercepteurs générés"

echo "🧩 Génération des composants partagés..."

# Composants partagés
ng generate component shared/components/navbar --standalone --skip-tests
ng generate component shared/components/sidebar --standalone --skip-tests
ng generate component shared/components/loading-spinner --standalone --skip-tests
ng generate component shared/components/confirmation-dialog --standalone --skip-tests
ng generate component shared/components/breadcrumb --standalone --skip-tests

echo "✅ Composants partagés générés"

echo "🔧 Génération des pipes..."

# Pipes
ng generate pipe shared/pipes/role-name --skip-tests
ng generate pipe shared/pipes/grade-mention --skip-tests

echo "✅ Pipes générés"

echo "📚 Génération des modules features..."

# Module d'authentification
ng generate module features/auth --routing
ng generate component features/auth/login --standalone --skip-tests
ng generate component features/auth/profile --standalone --skip-tests

# Module administrateur
ng generate module features/admin --routing
ng generate component features/admin/dashboard --standalone --skip-tests
ng generate component features/admin/users/user-list --standalone --skip-tests
ng generate component features/admin/users/user-form --standalone --skip-tests
ng generate component features/admin/classes/classe-list --standalone --skip-tests
ng generate component features/admin/classes/classe-form --standalone --skip-tests
ng generate component features/admin/matieres/matiere-list --standalone --skip-tests
ng generate component features/admin/matieres/matiere-form --standalone --skip-tests

# Module enseignant
ng generate module features/enseignant --routing
ng generate component features/enseignant/dashboard --standalone --skip-tests
ng generate component features/enseignant/notes/note-list --standalone --skip-tests
ng generate component features/enseignant/notes/note-form --standalone --skip-tests

# Module élève/parent
ng generate module features/eleve-parent --routing
ng generate component features/eleve-parent/dashboard --standalone --skip-tests
ng generate component features/eleve-parent/bulletins/bulletin-list --standalone --skip-tests
ng generate component features/eleve-parent/bulletins/bulletin-detail --standalone --skip-tests

echo "✅ Modules features générés"

echo "🎨 Génération des layouts..."

# Layouts
ng generate component layouts/admin-layout --standalone --skip-tests
ng generate component layouts/enseignant-layout --standalone --skip-tests
ng generate component layouts/eleve-layout --standalone --skip-tests
ng generate component layouts/auth-layout --standalone --skip-tests

echo "✅ Layouts générés"

echo "📄 Création des fichiers de modèles et constantes..."

# Créer les fichiers de modèles (ils seront remplis manuellement)
touch src/app/shared/models/user.model.ts
touch src/app/shared/models/classe.model.ts
touch src/app/shared/models/matiere.model.ts
touch src/app/shared/models/note.model.ts
touch src/app/shared/models/bulletin.model.ts
touch src/app/shared/models/auth.model.ts
touch src/app/shared/models/dashboard.model.ts
touch src/app/shared/models/api-response.model.ts

# Créer les fichiers de constantes
touch src/app/core/constants/api-endpoints.ts
touch src/app/core/constants/app-constants.ts
touch src/app/core/constants/roles.ts

# Créer les fichiers d'utilitaires
touch src/app/core/utils/date-utils.ts
touch src/app/core/utils/validation-utils.ts

# Créer les validateurs personnalisés
touch src/app/shared/validators/custom-validators.ts

echo "✅ Fichiers de modèles créés"

echo "🎨 Création des fichiers de styles..."

# Créer les fichiers de styles
touch src/assets/styles/_variables.scss
touch src/assets/styles/_mixins.scss
touch src/assets/styles/_components.scss

echo "✅ Fichiers de styles créés"

echo "⚙️ Configuration des alias de chemins dans tsconfig.json..."

# Backup du tsconfig original
cp tsconfig.json tsconfig.json.backup

# Ajouter les alias de chemins
cat > tsconfig.paths.json << EOF
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@layouts/*": ["src/app/layouts/*"],
      "@assets/*": ["src/assets/*"],
      "@env/*": ["src/environments/*"]
    }
  }
}
EOF

echo "✅ Configuration des alias créée (à fusionner manuellement dans tsconfig.json)"

echo "📊 Résumé de la structure créée..."

echo "
📁 Structure finale:
src/
├── app/
│   ├── core/               ✅ Services singleton
│   ├── shared/             ✅ Composants partagés
│   ├── features/           ✅ Modules fonctionnels
│   └── layouts/            ✅ Templates de mise en page
├── assets/                 ✅ Ressources statiques
└── environments/           ✅ Configuration d'environnement

📈 Statistiques:
- Services: 6
- Guards: 4
- Intercepteurs: 1
- Composants partagés: 5
- Modules features: 3
- Composants features: 11
- Layouts: 4
- Pipes: 2
- Modèles TypeScript: 8
"

echo "🎉 Structure créée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Remplir les fichiers de modèles TypeScript"
echo "2. Configurer les services avec les APIs"
echo "3. Implémenter l'authentification"
echo "4. Configurer le routing principal"
echo ""
echo "🔗 Utilisez les alias de chemins:"
echo "- @core/* pour les services core"
echo "- @shared/* pour les composants partagés"
echo "- @features/* pour les modules fonctionnels"
echo "- @layouts/* pour les layouts"
echo ""
echo "✨ Bon développement!"