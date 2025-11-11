export const environment = {
  production: true,
  // In production set the real URL of your Spring Boot API
  apiUrl: 'https://api.example.com', // <-- change to your production API
  // Mode production : désactiver temporairement l'authentification
  // Mettez à true pour désactiver l'authentification et permettre l'accès aux données
  bypassAuth: false, // En production, mettre à false pour activer l'authentification
  // Credentials par défaut pour login automatique
  defaultCredentials: {
    email: 'admin@edugo.com', // Email de l'admin
    password: 'admin123' // Mot de passe de l'admin
  },
  // Token valide pour le développement (à utiliser si le login automatique échoue)
  // ⚠️ NE PAS COMMITER CE TOKEN EN PRODUCTION
  // Ce token sera utilisé directement au démarrage pour éviter les problèmes de login
  devToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBlZHVnby5jb20iLCJpYXQiOjE3NjI2NzI5MTksImV4cCI6MTc2Mjc1OTMxOX0.WlxbsGk8PYcqbrYWW2-zO_KHsngO85b6xmDSFbfMhzg'
};