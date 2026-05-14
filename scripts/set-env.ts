import { write } from 'bun';

/**
 * Script para injetar variáveis de ambiente no Angular durante o build na Vercel.
 * "Porque dele, e por meio dele, e para ele são todas as coisas." — Romanos 11:36
 */

const targetPath = './src/environments/environment.prod.ts';

// Coletamos as variáveis ou usamos fallbacks (para não quebrar o build local se necessário)
const apiUrl = process.env['API_URL'] || 'https://api.seusite.com/api';
const faroUrl = process.env['FARO_URL'] || '';
const eventActivityV2Enabled = process.env['EVENT_ACTIVITY_V2_ENABLED'] !== 'false'; // Default true

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  eventActivityV2Enabled: ${eventActivityV2Enabled},
  faroUrl: '${faroUrl}'
};
`;

console.log('🚀 [Mestre do Bigode] Gerando environment.prod.ts...');

try {
  await write(targetPath, envConfigFile);
  console.log(`✅ Arquivo de ambiente gerado com sucesso em: ${targetPath}`);
  console.log(`   - API_URL: ${apiUrl}`);
  console.log(`   - FARO_URL: ${faroUrl ? 'Configurado' : 'Não definido (vazio)'}`);
} catch (err) {
  console.error('❌ Erro ao gerar o arquivo de ambiente:', err);
  process.exit(1);
}
