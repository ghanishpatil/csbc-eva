import crypto from 'crypto';

/**
 * Generate SHA-256 hashes for CTF flags
 * Add your flags below and run: node scripts/generate-flag-hashes.js
 */

const flags = [
  { level: 1, flag: 'ME2{welcome_to_mission_exploit}', description: 'Welcome Challenge' },
  { level: 2, flag: 'ME2{sql_injection_master}', description: 'SQL Injection' },
  { level: 3, flag: 'ME2{xss_vulnerability_found}', description: 'XSS Challenge' },
  { level: 4, flag: 'ME2{buffer_overflow_pwned}', description: 'Buffer Overflow' },
  { level: 5, flag: 'ME2{privilege_escalation_success}', description: 'Privilege Escalation' },
  { level: 6, flag: 'ME2{csrf_token_bypass}', description: 'CSRF Challenge' },
  { level: 7, flag: 'ME2{directory_traversal_exploited}', description: 'Path Traversal' },
  { level: 8, flag: 'ME2{command_injection_executed}', description: 'Command Injection' },
  { level: 9, flag: 'ME2{race_condition_exploited}', description: 'Race Condition' },
  { level: 10, flag: 'ME2{cryptographic_weakness_found}', description: 'Crypto Challenge' },
];

console.log('\n' + '='.repeat(80));
console.log('🔐 MISSION EXPLOIT 2.0 - FLAG HASH GENERATOR');
console.log('='.repeat(80) + '\n');

console.log('📝 Copy these lines to your .env file:\n');
console.log('-'.repeat(80) + '\n');

flags.forEach(({ level, flag, description }) => {
  const hash = crypto.createHash('sha256').update(flag).digest('hex');
  console.log(`# Level ${level}: ${description}`);
  console.log(`LEVEL_${level}_FLAG_HASH=${hash}`);
  console.log('');
});

console.log('-'.repeat(80));
console.log('\n✅ Hash generation complete!\n');
console.log('⚠️  SECURITY NOTES:');
console.log('   • Keep these hashes in .env (never commit to Git)');
console.log('   • Never expose the actual flags in frontend code');
console.log('   • Change flags before production deployment');
console.log('   • Use strong, unique flags for each level\n');

