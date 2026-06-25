import fs from 'fs';
import path from 'path';

const iconNames = [
  'Plus','Receipt','Users','Settings as SettingsIcon','LogOut','Menu','Grip','X','Wifi','WifiOff','CloudOff','CloudCheck','RefreshCw','Building2','Database','FileSpreadsheet','Package','TrendingUp','LayoutDashboard','FilePlus','ScrollText','PieChart','UserCircle','Bell','Shield','Sparkles','Smartphone','HelpCircle','Search','Printer','Check','Info','ListRestart','FileText','ShoppingCart','Loader2','LayoutGrid','List','Coins','AlertCircle','Calendar','Layers','ArrowRight','Download','ShieldAlert','CheckCircle2','Trash2','Clock','AlertTriangle','Activity','Terminal','Users2','Flag','Wrench','Play','Send','Cpu','History','Lock','Server','Gauge','BarChart4','AlertOctagon','Settings','Zap','Laptop','TrendingDown','Target','BarChart','ShoppingBag','ChevronDown','ShieldCheck','Camera','ArrowUpDown','Filter','Eye','CheckCircle','MoreVertical','Pencil','IndianRupee','Edit3','Copy','CreditCard','User','XCircle','Barcode','Keyboard','Volume2','VolumeX','ChevronRight','Cloud','Wallet','Briefcase','Building','Landmark','ArrowUpRight','ArrowDownLeft','DollarSign','CalendarDays','ListFilter','Mail','QrCode','Edit','SlidersHorizontal','Image as ImageIcon','ChevronLeft','PlusCircle','Upload','ArrowLeft','Share2','Phone','MapPin','Palette','Contrast','CheckCheck','BarChart2','FileDown','Inbox','Sliders','EyeOff','Store','Edit2','Globe','Hash','Link as LinkIcon','MessageSquare','BookOpen','Star','Award','CloudLightning','BarChart3','KeyRound','UserCheck','Scale'
];

let mapFileContent = `import React from 'react';

const emojiMap: Record<string, string> = {
  Plus: '➕', Receipt: '🧾', Users: '👥', Settings: '⚙️', LogOut: '🚪', Menu: '🍔', Grip: '🎛️', X: '❌', 
  Wifi: '📶', WifiOff: '📴', CloudOff: '☁️', CloudCheck: '☁️', RefreshCw: '🔄', Building2: '🏢', 
  Database: '💽', FileSpreadsheet: '📊', Package: '📦', TrendingUp: '📈', LayoutDashboard: '🖥️', 
  FilePlus: '📄', ScrollText: '📜', PieChart: '🥧', UserCircle: '👤', Bell: '🔔', Shield: '🛡️', 
  Sparkles: '✨', Smartphone: '📱', HelpCircle: '❓', Search: '🔍', Printer: '🖨️', Check: '✅', 
  Info: 'ℹ️', ListRestart: '🔁', FileText: '📝', ShoppingCart: '🛒', Loader2: '⏳', LayoutGrid: '🔲', 
  List: '📋', Coins: '🪙', AlertCircle: '⚠️', Calendar: '📅', Layers: '📚', ArrowRight: '➡️', 
  Download: '⬇️', ShieldAlert: '🚨', CheckCircle2: '✅', Trash2: '🗑️', Clock: '🕒', AlertTriangle: '⚠️', 
  Activity: '📈', Terminal: '💻', Users2: '👥', Flag: '🚩', Wrench: '🔧', Play: '▶️', Send: '📤', 
  Cpu: '🧠', History: '🕰️', Lock: '🔒', Server: '🗄️', Gauge: '⏱️', BarChart4: '📊', AlertOctagon: '🛑', 
  Zap: '⚡', Laptop: '💻', TrendingDown: '📉', Target: '🎯', BarChart: '📊', ShoppingBag: '🛍️', 
  ChevronDown: '🔽', ShieldCheck: '🛡️', Camera: '📸', ArrowUpDown: '↕️', Filter: '🎛️', Eye: '👁️', 
  CheckCircle: '✅', MoreVertical: '⋮', Pencil: '✏️', IndianRupee: '₹', Edit3: '📝', Copy: '📋', 
  CreditCard: '💳', User: '👤', XCircle: '❌', Barcode: '🏷️', Keyboard: '⌨️', Volume2: '🔊', 
  VolumeX: '🔇', ChevronRight: '▶️', Cloud: '☁️', Wallet: '👛', Briefcase: '💼', Building: '🏢', 
  Landmark: '🏦', ArrowUpRight: '↗️', ArrowDownLeft: '↙️', DollarSign: '💰', CalendarDays: '📅', 
  ListFilter: '🎛️', Mail: '✉️', QrCode: '🔳', Edit: '✏️', SlidersHorizontal: '🎚️', Image: '🖼️', 
  ChevronLeft: '◀️', PlusCircle: '➕', Upload: '⬆️', ArrowLeft: '⬅️', Share2: '🔗', Phone: '📞', 
  MapPin: '📍', Palette: '🎨', Contrast: '🌗', CheckCheck: '✅', BarChart2: '📊', FileDown: '⬇️', 
  Inbox: '📥', Sliders: '🎚️', EyeOff: '🙈', Store: '🏪', Edit2: '✏️', Globe: '🌐', Hash: '#', 
  Link: '🔗', MessageSquare: '💬', BookOpen: '📖', Star: '⭐', Award: '🏆', CloudLightning: '🌩️', 
  BarChart3: '📊', KeyRound: '🔑', UserCheck: '👤', Scale: '⚖️',
  SettingsIcon: '⚙️', ImageIcon: '🖼️', LinkIcon: '🔗'
};

const createEmojiIcon = (name: string) => {
  return function EmojiIcon({ size = 20, className = '', strokeWidth, ...props }: any) {
    const emoji = emojiMap[name] || '✨';
    return (
      <span 
        className={\`filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.12)] shrink-0 inline-flex items-center justify-center \${className}\`}
        style={{ fontSize: typeof size === 'number' ? size : 20, width: size, height: size, lineHeight: 1 }}
        {...props}
      >
        {emoji}
      </span>
    );
  }
};

`;

for (const icon of iconNames) {
  if (icon.includes(' as ')) {
    const aliases = icon.split(' as '); // e.g. "Settings as SettingsIcon"
    mapFileContent += `export const ${aliases[1]} = createEmojiIcon('${aliases[1]}');\n`;
  } else {
    mapFileContent += `export const ${icon} = createEmojiIcon('${icon}');\n`;
  }
}

// Add a generic export * from 'lucide-react' for anything else
// Wait! If I map lucide-react alias to this file, it overrides the real lucide-react. I cannot "export *" from it easily.
// Instead, I'll export all of them. Any missing ones will cause build errors, but we extracted all used ones!

fs.mkdirSync(path.join(process.cwd(), 'src/lib'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'src/lib/lucide-proxy.tsx'), mapFileContent);

// Also we need to modify vite.config.ts to resolve lucide-react to this proxy!
const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
let viteContent = fs.readFileSync(viteConfigPath, 'utf-8');

if (!viteContent.includes('lucide-react')) {
  viteContent = viteContent.replace(
    'alias: {',
    "alias: {\n        'lucide-react': path.resolve(__dirname, './src/lib/lucide-proxy.tsx'),"
  );
  fs.writeFileSync(viteConfigPath, viteContent);
}

