#!/usr/bin/env node
/**
 * Thunderbird CLI
 *
 * Command-line interface for the Thunderbird MCP extension.
 * Talks to the extension's HTTP endpoint on localhost:8765 via JSON-RPC.
 *
 * Usage: thunderbird-cli <command> [options]
 */

const http = require('http');

const THUNDERBIRD_PORT = 8765;
const REQUEST_TIMEOUT = 30000;

// --- JSON-RPC transport ---

function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    });

    const req = http.request({
      hostname: 'localhost',
      port: THUNDERBIRD_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          } else {
            resolve(parsed.result);
          }
        } catch {
          // Sanitize control chars and retry parse
          const sanitized = data
            .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
            .replace(/(?<!\\)\r/g, '\\r')
            .replace(/(?<!\\)\n/g, '\\n')
            .replace(/(?<!\\)\t/g, '\\t');
          try {
            const parsed = JSON.parse(sanitized);
            if (parsed.error) {
              reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
            } else {
              resolve(parsed.result);
            }
          } catch (e) {
            reject(new Error(`Invalid JSON from Thunderbird: ${e.message}`));
          }
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Connection failed: ${e.message}. Is Thunderbird running with the MCP extension?`));
    });

    req.setTimeout(REQUEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request to Thunderbird timed out'));
    });

    req.write(body);
    req.end();
  });
}

async function callTool(name, args) {
  const result = await rpcCall('tools/call', { name, arguments: args });
  // The MCP response wraps tool results in content blocks
  if (result && result.content && Array.isArray(result.content)) {
    const textBlock = result.content.find(c => c.type === 'text');
    if (textBlock) {
      return JSON.parse(textBlock.text);
    }
  }
  return result;
}

// --- Output formatting ---

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function truncate(str, len) {
  if (!str) return '';
  str = str.replace(/\n/g, ' ').trim();
  return str.length > len ? str.slice(0, len - 3) + '...' : str;
}

function printMessages(messages) {
  if (!messages || messages.length === 0) {
    console.log('No messages found.');
    return;
  }
  for (const msg of messages) {
    const flags = [
      msg.read === false ? 'UNREAD' : null,
      msg.flagged ? 'FLAGGED' : null
    ].filter(Boolean).join(' ');
    const flagStr = flags ? ` [${flags}]` : '';
    console.log(`${formatDate(msg.date)}  ${truncate(msg.author || msg.from, 30)}`);
    console.log(`  ${msg.subject || '(no subject)'}${flagStr}`);
    console.log(`  id: ${msg.id}  folder: ${msg.folderPath || ''}`);
    console.log('');
  }
  console.log(`${messages.length} message(s)`);
}

function printMessage(msg) {
  if (msg.error) {
    console.error(`Error: ${msg.error}`);
    process.exit(1);
  }
  const flags = [
    msg.read === false ? 'UNREAD' : null,
    msg.flagged ? 'FLAGGED' : null
  ].filter(Boolean).join(' ');
  const flagStr = flags ? ` [${flags}]` : '';
  console.log(`Subject: ${msg.subject || '(no subject)'}${flagStr}`);
  console.log(`From:    ${msg.author}`);
  console.log(`To:      ${msg.recipients}`);
  if (msg.ccList) console.log(`CC:      ${msg.ccList}`);
  console.log(`Date:    ${formatDate(msg.date)}`);
  console.log(`ID:      ${msg.id}`);

  if (msg.attachments && msg.attachments.length > 0) {
    console.log(`\nAttachments (${msg.attachments.length}):`);
    for (const att of msg.attachments) {
      const size = att.size ? ` (${(att.size / 1024).toFixed(1)}KB)` : '';
      const path = att.filePath ? ` -> ${att.filePath}` : '';
      const err = att.error ? ` [${att.error}]` : '';
      console.log(`  ${att.name}${size}${path}${err}`);
    }
  }

  console.log(`\n${msg.body || '(empty body)'}`);
}

function printFolders(folders) {
  if (!folders || folders.length === 0) {
    console.log('No folders found.');
    return;
  }
  for (const f of folders) {
    const indent = '  '.repeat(f.depth || 0);
    const unread = f.unreadMessages > 0 ? ` (${f.unreadMessages} unread)` : '';
    console.log(`${indent}${f.name}  [${f.totalMessages} msgs${unread}]`);
    console.log(`${indent}  ${f.path}`);
  }
}

function printAccounts(accounts) {
  if (!accounts || accounts.length === 0) {
    console.log('No accounts found.');
    return;
  }
  for (const acc of accounts) {
    console.log(`${acc.name || acc.key} (${acc.type})`);
    if (acc.identities) {
      for (const id of acc.identities) {
        console.log(`  ${id.name} <${id.email}>`);
      }
    }
    console.log('');
  }
}

function printContacts(contacts) {
  if (!contacts || contacts.length === 0) {
    console.log('No contacts found.');
    return;
  }
  for (const c of contacts) {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.displayName || '';
    console.log(`${name}  <${c.primaryEmail || ''}>`);
  }
  console.log(`\n${contacts.length} contact(s)`);
}

// --- Argument parsing ---

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0];
  const positional = [];
  const flags = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      // Boolean flags (no value after them or next arg is also a flag)
      if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = args[++i];
      }
    } else {
      positional.push(args[i]);
    }
  }

  return { command, positional, flags };
}

// --- Commands ---

const USAGE = `Thunderbird CLI - command-line interface for Thunderbird email

Usage: thunderbird-cli <command> [options]

Commands:
  accounts                          List email accounts and identities
  search <query>                    Search messages by subject, sender, or recipient
    --start-date <ISO>              Filter by start date
    --end-date <ISO>                Filter by end date
    --max <N>                       Max results (default: 20)
    --sort <asc|desc>               Sort order (default: desc)
  get <messageId> <folderPath>      Read a full email message
    --save-attachments              Save attachments to temp files
  folders                           List all mail folders
    --account <accountId>           Filter to a specific account
  update <messageId> <folderPath>   Update message state
    --read                          Mark as read
    --unread                        Mark as unread
    --flag                          Mark as flagged
    --unflag                        Remove flag
    --move-to <folderURI>           Move to folder
    --trash                         Move to trash
  send                              Open compose window
    --to <addr>                     Recipient (required)
    --subject <text>                Subject line
    --body <text>                   Message body
    --cc <addr>                     CC recipients
    --bcc <addr>                    BCC recipients
    --from <identity>               Sender identity
    --html                          Body is HTML
  reply <messageId> <folderPath>    Reply to a message
    --body <text>                   Reply body (required)
    --reply-all                     Reply to all recipients
    --html                          Body is HTML
    --to <addr>                     Override recipient
    --cc <addr>                     CC recipients
    --from <identity>               Sender identity
  forward <messageId> <folderPath>  Forward a message
    --to <addr>                     Recipient (required)
    --body <text>                   Additional body text
    --html                          Body is HTML
    --cc <addr>                     CC recipients
    --from <identity>               Sender identity
  contacts <query>                  Search contacts
  calendars                         List calendars
  help                              Show this help message
`;

async function main() {
  const { command, positional, flags } = parseArgs(process.argv);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(USAGE);
    return;
  }

  try {
    switch (command) {
      case 'accounts': {
        const result = await callTool('listAccounts', {});
        printAccounts(result);
        break;
      }

      case 'search': {
        const query = positional[0] || '';
        const result = await callTool('searchMessages', {
          query,
          startDate: flags['start-date'],
          endDate: flags['end-date'],
          maxResults: flags.max ? parseInt(flags.max) : undefined,
          sortOrder: flags.sort
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        printMessages(result);
        break;
      }

      case 'get': {
        const [messageId, folderPath] = positional;
        if (!messageId || !folderPath) {
          console.error('Usage: thunderbird-cli get <messageId> <folderPath>');
          process.exit(1);
        }
        const result = await callTool('getMessage', {
          messageId,
          folderPath,
          saveAttachments: !!flags['save-attachments']
        });
        printMessage(result);
        break;
      }

      case 'folders': {
        const result = await callTool('listFolders', {
          accountId: flags.account
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        printFolders(result);
        break;
      }

      case 'update': {
        const [messageId, folderPath] = positional;
        if (!messageId || !folderPath) {
          console.error('Usage: thunderbird-cli update <messageId> <folderPath> [--read|--unread] [--flag|--unflag] [--move-to <uri>] [--trash]');
          process.exit(1);
        }
        const args = { messageId, folderPath };
        if (flags.read) args.read = true;
        if (flags.unread) args.read = false;
        if (flags.flag) args.flagged = true;
        if (flags.unflag) args.flagged = false;
        if (flags['move-to']) args.moveTo = flags['move-to'];
        if (flags.trash) args.trash = true;
        const result = await callTool('updateMessage', args);
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(`Done: ${result.actions.join(', ')}`);
        break;
      }

      case 'send': {
        if (!flags.to) {
          console.error('Usage: thunderbird-cli send --to <addr> [--subject <text>] [--body <text>]');
          process.exit(1);
        }
        const result = await callTool('sendMail', {
          to: flags.to,
          subject: flags.subject || '',
          body: flags.body || '',
          cc: flags.cc,
          bcc: flags.bcc,
          from: flags.from,
          isHtml: !!flags.html
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(result.message || 'Compose window opened.');
        break;
      }

      case 'reply': {
        const [messageId, folderPath] = positional;
        if (!messageId || !folderPath || !flags.body) {
          console.error('Usage: thunderbird-cli reply <messageId> <folderPath> --body <text>');
          process.exit(1);
        }
        const result = await callTool('replyToMessage', {
          messageId,
          folderPath,
          body: flags.body,
          replyAll: !!flags['reply-all'],
          isHtml: !!flags.html,
          to: flags.to,
          cc: flags.cc,
          from: flags.from
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(result.message || 'Reply compose window opened.');
        break;
      }

      case 'forward': {
        const [messageId, folderPath] = positional;
        if (!messageId || !folderPath || !flags.to) {
          console.error('Usage: thunderbird-cli forward <messageId> <folderPath> --to <addr>');
          process.exit(1);
        }
        const result = await callTool('forwardMessage', {
          messageId,
          folderPath,
          to: flags.to,
          body: flags.body,
          isHtml: !!flags.html,
          cc: flags.cc,
          from: flags.from
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(result.message || 'Forward compose window opened.');
        break;
      }

      case 'contacts': {
        const query = positional[0] || '';
        const result = await callTool('searchContacts', { query });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        printContacts(result);
        break;
      }

      case 'calendars': {
        const result = await callTool('listCalendars', {});
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        if (!result || result.length === 0) {
          console.log('No calendars found.');
        } else {
          for (const cal of result) {
            console.log(`${cal.name} (${cal.type || 'unknown'})`);
            if (cal.color) console.log(`  color: ${cal.color}`);
          }
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "thunderbird-cli help" for usage.');
        process.exit(1);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

main();
