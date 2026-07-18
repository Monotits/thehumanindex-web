// Next 16: `next lint` kaldırıldı; eslint-config-next artık doğrudan flat
// config export ediyor. Eski FlatCompat köprüsü ESLint 9'da
// "Converting circular structure to JSON" hatasıyla çöküyordu.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-sitemap.config.js'],
  },
]

export default eslintConfig
