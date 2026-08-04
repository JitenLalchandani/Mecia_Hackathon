/**
 * CyberTwin Nmap Engine
 * Runs network scans ONLY on user-verified domains.
 * Generates adaptive security summaries per profile type.
 */

const { execFile } = require('child_process');
const dns          = require('dns').promises;
const https        = require('https');
const http         = require('http');

// ── Risk classification for open ports ───────────────────────────────────────
const PORT_RISK = {
  // Critical — should never be public
  23:   { risk: 'critical', reason: 'Telnet is unencrypted and obsolete — credentials sent in plain text' },
  2323: { risk: 'critical', reason: 'Alternative Telnet port — same risks as port 23' },
  3389: { risk: 'critical', reason: 'RDP exposed to the internet is a common ransomware entry point' },
  1433: { risk: 'critical', reason: 'MSSQL exposed publicly — high risk of database compromise' },
  3306: { risk: 'critical', reason: 'MySQL exposed publicly — database should not be internet-facing' },
  27017:{ risk: 'critical', reason: 'MongoDB exposed publicly — frequently exploited if unauthenticated' },
  6379: { risk: 'critical', reason: 'Redis exposed publicly — often unauthenticated by default' },

  // High — concerning if unnecessary
  21:   { risk: 'high', reason: 'FTP sends credentials in plain text — use SFTP instead' },
  22:   { risk: 'medium', reason: 'SSH open — ensure key-based auth and no root login' },
  25:   { risk: 'high', reason: 'SMTP open — could be exploited for spam relay' },
  110:  { risk: 'high', reason: 'POP3 unencrypted — use POP3S (port 995) instead' },
  143:  { risk: 'high', reason: 'IMAP unencrypted — use IMAPS (port 993) instead' },
  512:  { risk: 'critical', reason: 'rexec — remote execution, extremely dangerous' },
  513:  { risk: 'critical', reason: 'rlogin — unencrypted remote login' },
  514:  { risk: 'critical', reason: 'rsh — remote shell, no authentication' },
  5900: { risk: 'high', reason: 'VNC exposed — remote desktop should not be public' },
  8080: { risk: 'medium', reason: 'Alternative HTTP — verify this is intentional' },
  8443: { risk: 'low',    reason: 'Alternative HTTPS — commonly used for admin panels' },

  // Normal web services
  80:   { risk: 'low',  reason: 'HTTP — standard web traffic' },
  443:  { risk: 'low',  reason: 'HTTPS — standard secure web traffic' },
  53:   { risk: 'low',  reason: 'DNS — standard if this is a nameserver' },
};

const classifyPort = (port) => {
  return PORT_RISK[port] || { risk: 'medium', reason: `Port ${port} open — verify if this service is necessary` };
};

// ── Adaptive security summaries ───────────────────────────────────────────────
const generateAdaptiveSummary = (profileType, riskLevel, findings, openPorts, domain) => {
  const hasCritical = findings.some(f => f.includes('critical') || f.toLowerCase().includes('telnet') || f.toLowerCase().includes('rdp'));

  const content = {
    senior: {
      low:      { explanation: `Good news! We scanned your website ${domain} and it looks safe. Only normal web services are running.`,
                  advice: 'Your website appears secure. No immediate action needed.',
                  steps: ['Keep your website software up to date', 'Make sure you have a strong admin password', 'Ask your web developer to check it every few months'] },
      medium:   { explanation: `We scanned ${domain} and found a few things worth checking. Nothing critical, but worth a look.`,
                  advice: 'Some services on your website may not be needed. Ask your web developer to review.',
                  steps: ['Share this report with your web developer or IT person', 'Ask them to close any ports or services that are not needed', 'Make sure all software on your website is up to date'] },
      high:     { explanation: `We found some concerning things on ${domain}. Some services that are running could be a risk.`,
                  advice: 'Please contact your web developer or hosting provider as soon as possible. Show them this report.',
                  steps: ['Contact your web developer or hosting provider today', 'Share this report with them', 'Do not share your website admin password over email or phone', 'Ask them to close the risky services we found'] },
      critical: { explanation: `We found serious security problems on ${domain}. These need to be fixed as soon as possible.`,
                  advice: 'This is urgent. Please call your web developer or hosting provider right away. These issues could put your website and visitors at risk.',
                  steps: ['Call your web developer or hosting provider immediately', 'Tell them: "My security scan found critical open ports that need to be closed"', 'Do not ignore this — it could lead to your website being hacked', 'Change all admin passwords after the issues are fixed'] }
    },

    student: {
      low:      { explanation: `Scan complete for ${domain} — looking clean! Only expected services are running.`,
                  advice: 'No major issues found. Keep your dependencies updated and you\'re good.',
                  steps: ['Run updates on your server software regularly', 'Set up fail2ban or similar to block brute force attempts', 'Consider adding a WAF if you\'re running a public app'] },
      medium:   { explanation: `Scan on ${domain} found a few things worth fixing. Nothing critical but not ideal either.`,
                  advice: 'A few unnecessary services are exposed. Close what you don\'t need — attack surface reduction is a quick win.',
                  steps: ['Close ports for services you\'re not using', 'Check if any of these services have default credentials', 'Run `sudo ufw status` and tighten your firewall rules', 'Google each open port to understand what\'s running'] },
      high:     { explanation: `Red flags on ${domain} 🚩 Some high-risk services are publicly accessible that really shouldn\'t be.`,
                  advice: 'Stuff like FTP and unencrypted services need to go. Fix these before your site gets scraped or exploited.',
                  steps: ['Disable or restrict FTP — use SFTP instead', 'Move databases off public-facing interfaces', 'Update firewall rules to whitelist IPs where possible', 'Check your server logs for any suspicious access already', 'Use `netstat -tlnp` to see what\'s actually listening'] },
      critical: { explanation: `Critical issues found on ${domain} ⚠️ Services like Telnet, RDP, or exposed databases are dangerous.`,
                  advice: 'This is serious. These services are actively exploited in the wild. Fix them today, not tomorrow.',
                  steps: ['Disable Telnet/FTP immediately — they\'re not needed in 2025', 'Put RDP/VNC behind a VPN or close it', 'Block database ports (3306, 27017, 6379) from public access in your firewall', 'Check for unauthorized access in your logs right now', 'Consider a full security audit if this is a production system'] }
    },

    professional: {
      low:      { explanation: `Scan results for ${domain}: attack surface within expected parameters. Standard web services only.`,
                  advice: 'No high-risk findings. Continue with standard patching cadence and periodic re-scans.',
                  steps: ['Maintain patch cycle for exposed services', 'Schedule next scan in 30 days or after any infrastructure change', 'Verify SSL/TLS configuration with testssl.sh or ssllabs.com'] },
      medium:   { explanation: `${domain} scan complete: ${openPorts} open ports, medium risk profile. Several non-essential services detected.`,
                  advice: 'Reduce attack surface by closing unnecessary services. Implement network segmentation where applicable.',
                  steps: ['Enumerate and close non-essential open ports', 'Verify service versions against CVE databases (use `nmap -sV` for detail)', 'Implement IP allowlisting for admin services', 'Check for default credentials on all exposed services', 'Document legitimate service exposures in your asset inventory'] },
      high:     { explanation: `Elevated risk profile on ${domain}. High-severity findings include unencrypted legacy protocols and/or unintended service exposure.`,
                  advice: 'Initiate remediation. Legacy protocols (FTP, Telnet) represent compliance violations in most frameworks (PCI-DSS, ISO 27001).',
                  steps: ['Immediate: disable cleartext protocols (FTP→SFTP, Telnet→SSH)', 'Restrict database ports to application-tier IPs via firewall ACL', 'Run authenticated scan for CVE identification on open services', 'Review access logs for exploitation attempts on flagged ports', 'Update vulnerability register and assign remediation owner'] },
      critical: { explanation: `CRITICAL findings on ${domain}. Services present: ${findings.slice(0, 3).join('; ')}. Immediate remediation required.`,
                  advice: 'Treat as active incident risk. Critical service exposure (RDP/VNC/DB/Telnet) are primary ransomware and APT entry vectors.',
                  steps: ['P0: Isolate or firewall critical ports immediately — do not wait for maintenance window', 'Rotate all credentials for exposed services', 'Review auth logs for IOCs of prior exploitation', 'Engage incident response if unauthorized access is suspected', 'File findings in vulnerability management system with SLA tracking', 'Consider third-party pentest to validate full exposure scope'] }
    },

    teen: {
      low:      { explanation: `Scanned ${domain} — it\'s giving secure energy ✓ Nothing sketchy found!`,
                  advice: 'All good! Just keep your stuff updated and you\'re solid.',
                  steps: ['Keep your server and apps updated', 'Use strong unique passwords for everything', 'Scan again every month to stay on top of it'] },
      medium:   { explanation: `${domain} scan done — a few things look a bit sus 👀 Not dangerous yet but worth fixing.`,
                  advice: 'Some stuff is open that probably doesn\'t need to be. Close it down and you\'re good.',
                  steps: ['Google each open port to understand what it does', 'Close or disable services you don\'t actually need', 'Make sure you\'re using strong passwords on everything', 'Ask someone techy to help if you\'re not sure'] },
      high:     { explanation: `Major red flag energy on ${domain} 🚩 Some risky services are exposed to the whole internet.`,
                  advice: 'This needs fixing. Old/unencrypted services are like leaving your front door open.',
                  steps: ['Tell your hosting provider or a trusted adult about this', 'Close services you don\'t use — especially old ones like FTP', 'Change all passwords on this server', 'Don\'t panic, but do fix this ASAP'] },
      critical: { explanation: `Yikes — critical issues on ${domain} ⚠️ Serious stuff found that could get your site hacked.`,
                  advice: 'This is urgent! Tell someone who can help fix this today. Your site could be at risk.',
                  steps: ['Tell a trusted adult or your hosting provider right now', 'Don\'t ignore this — critical issues get exploited fast', 'Change all your passwords immediately', 'Ask for help — this isn\'t something to tackle alone'] }
    }
  };

  const profile = content[profileType] || content.professional;
  return profile[riskLevel] || profile.medium;
};

// ── Scan type configs ─────────────────────────────────────────────────────────
const SCAN_CONFIGS = {
  quick:    { args: ['-T4', '--open', '-F'],                        label: 'Quick (top 100 ports)' },
  standard: { args: ['-T4', '--open', '-p', '1-1024'],              label: 'Standard (ports 1-1024)' },
  full:     { args: ['-T3', '--open', '-p', '1-65535', '-sV', '--version-intensity', '3'], label: 'Full (all ports + versions)' }
};

// ── Parse nmap stdout into structured port list ───────────────────────────────
const parseNmapOutput = (stdout) => {
  const ports    = [];
  const lines    = stdout.split('\n');
  let   ipAddress = null;
  let   hostStatus = 'unknown';
  let   osGuess  = null;

  for (const line of lines) {
    // Extract IP
    const ipMatch = line.match(/Nmap scan report for .+\s+\((\d+\.\d+\.\d+\.\d+)\)/);
    if (ipMatch) ipAddress = ipMatch[1];

    // Simple IP line
    const ipOnly = line.match(/Nmap scan report for (\d+\.\d+\.\d+\.\d+)/);
    if (ipOnly && !ipAddress) ipAddress = ipOnly[1];

    // Host status
    if (line.includes('Host is up'))   hostStatus = 'up';
    if (line.includes('Host is down')) hostStatus = 'down';

    // OS guess
    const osMatch = line.match(/OS guess:\s*(.+)/i) || line.match(/OS details:\s*(.+)/i);
    if (osMatch) osGuess = osMatch[1].trim();

    // Port lines: "22/tcp   open  ssh   OpenSSH 8.2"
    const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+(\S+)?\s*(.*)?/);
    if (portMatch) {
      const port    = parseInt(portMatch[1]);
      const risk    = classifyPort(port);
      ports.push({
        port,
        protocol:   portMatch[2],
        state:      portMatch[3],
        service:    portMatch[4] || 'unknown',
        version:    portMatch[5]?.trim() || '',
        risk:       risk.risk,
        riskReason: risk.reason
      });
    }
  }

  return { ports, ipAddress, hostStatus, osGuess };
};

// ── Build security summary from parsed ports ──────────────────────────────────
const buildSecuritySummary = (ports) => {
  const openPorts = ports.filter(p => p.state === 'open');

  // Aggregate worst risk level
  const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  let worstRisk = 'low';
  for (const p of openPorts) {
    if (riskOrder[p.risk] > riskOrder[worstRisk]) worstRisk = p.risk;
  }

  const criticalFindings = openPorts
    .filter(p => p.risk === 'critical' || p.risk === 'high')
    .map(p => `Port ${p.port}/${p.protocol} (${p.service}) — ${p.riskReason}`);

  const recommendations = openPorts
    .filter(p => p.risk !== 'low')
    .map(p => `Close or restrict port ${p.port} (${p.service}): ${p.riskReason}`);

  return {
    riskLevel:        worstRisk,
    openPortCount:    openPorts.length,
    criticalFindings: criticalFindings.slice(0, 10),
    recommendations:  recommendations.slice(0, 10)
  };
};

// ── Main scan function ────────────────────────────────────────────────────────
const runScan = (domain, scanType = 'quick', profileType = 'professional') => {
  return new Promise((resolve, reject) => {
    const config = SCAN_CONFIGS[scanType] || SCAN_CONFIGS.quick;
    const args   = [...config.args, domain];
    const startTime = Date.now();

    console.log(`🔍 Starting nmap scan: nmap ${args.join(' ')} ${domain}`);

    execFile('nmap', args, { timeout: 120000 }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error && !stdout) {
        return reject(new Error(`Nmap failed: ${error.message}`));
      }

      const { ports, ipAddress, hostStatus, osGuess } = parseNmapOutput(stdout);
      const securitySummary = buildSecuritySummary(ports);
      const adaptiveSummary = generateAdaptiveSummary(
        profileType,
        securitySummary.riskLevel,
        securitySummary.criticalFindings,
        securitySummary.openPortCount,
        domain
      );

      resolve({
        ports,
        ipAddress,
        hostStatus,
        osGuess,
        securitySummary,
        adaptiveSummary,
        rawOutput:      stdout.slice(0, 10000), // cap at 10kb
        scanDurationMs: duration,
        status:         'completed'
      });
    });
  });
};

// ── Domain verification helpers ───────────────────────────────────────────────

/**
 * Verify via DNS TXT record
 * Looks for TXT record on _cybertwin-verify.<domain>
 */
const verifyViaDNS = async (domain, token) => {
  try {
    const records = await dns.resolveTxt(`_cybertwin-verify.${domain}`);
    const flat = records.flat().join(' ');
    return flat.includes(token);
  } catch {
    return false;
  }
};

/**
 * Verify via file at /.well-known/cybertwin-verify.txt
 */
const verifyViaFile = (domain, token) => {
  return new Promise((resolve) => {
    const url  = `https://${domain}/.well-known/cybertwin-verify.txt`;
    const mod  = url.startsWith('https') ? https : http;

    const req = mod.get(url, { timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body.trim().includes(token)));
    });
    req.on('error', () => {
      // Try HTTP fallback
      http.get(`http://${domain}/.well-known/cybertwin-verify.txt`, { timeout: 8000 }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve(body.trim().includes(token)));
      }).on('error', () => resolve(false));
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
};

module.exports = { runScan, verifyViaDNS, verifyViaFile, SCAN_CONFIGS, classifyPort };
