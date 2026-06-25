import React from 'react';

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
  Home: '🏠', 
  Zap: '⚡', Laptop: '💻', TrendingDown: '📉', Target: '🎯', BarChart: '📊', ShoppingBag: '🛍️', 
  ChevronDown: '🔽', ChevronUp: '🔼', ShieldCheck: '🛡️', Camera: '📸', ArrowUpDown: '↕️', Filter: '🎛️', Eye: '👁️', 
  CheckCircle: '✅', MoreVertical: '⋮', Pencil: '✏️', IndianRupee: '₹', Edit3: '📝', Copy: '📋', 
  CreditCard: '💳', User: '👤', XCircle: '❌', Barcode: '🏷️', Keyboard: '⌨️', Volume2: '🔊', 
  VolumeX: '🔇', ChevronRight: '▶️', Cloud: '☁️', Wallet: '👛', Briefcase: '💼', Building: '🏢', 
  Landmark: '🏦', ArrowUpRight: '↗️', ArrowDownRight: '↘️', ArrowDownLeft: '↙️', DollarSign: '💰', CalendarDays: '📅', 
  ListFilter: '🎛️', Mail: '✉️', QrCode: '🔳', Edit: '✏️', SlidersHorizontal: '🎚️', Image: '🖼️', 
  ChevronLeft: '◀️', PlusCircle: '➕', Upload: '⬆️', ArrowLeft: '⬅️', Share2: '🔗', Phone: '📞', Save: '💾', 
  MapPin: '📍', Palette: '🎨', Contrast: '🌗', CheckCheck: '✅', BarChart2: '📊', FileDown: '⬇️', 
  Inbox: '📥', Sliders: '🎚️', EyeOff: '🙈', Store: '🏪', Edit2: '✏️', Globe: '🌐', Hash: '#', 
  Link: '🔗', MessageSquare: '💬', BookOpen: '📖', Star: '⭐', Award: '🏆', CloudLightning: '🌩️', 
  BarChart3: '📊', KeyRound: '🔑', UserCheck: '👤', Scale: '⚖️',
  Truck: '🚚', ClipboardList: '📋',
  SettingsIcon: '⚙️', ImageIcon: '🖼️', LinkIcon: '🔗',
  Maximize2: '🖥️', Minimize2: '⬇️'
};

const createEmojiIcon = (name: string) => {
  return function EmojiIcon({ size, className = '', strokeWidth, color, ...props }: any) {
    const emoji = emojiMap[name] || '✨';
    const inlineStyle: React.CSSProperties = { lineHeight: 1 };
    if (size) {
      inlineStyle.fontSize = size;
      inlineStyle.width = size;
      inlineStyle.height = size;
    }
    return (
      <span 
        className={`filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.12)] shrink-0 inline-flex items-center justify-center ${className}`}
        style={inlineStyle}
        {...props}
      >
        {emoji}
      </span>
    );
  }
};

export const Plus = createEmojiIcon('Plus');
export const Receipt = createEmojiIcon('Receipt');
export const Users = createEmojiIcon('Users');
export const Settings = createEmojiIcon('Settings');
export const Image = createEmojiIcon('Image');
export const Link = createEmojiIcon('Link');
export const LogOut = createEmojiIcon('LogOut');
export const Menu = createEmojiIcon('Menu');
export const Grip = createEmojiIcon('Grip');
export const X = createEmojiIcon('X');
export const Wifi = createEmojiIcon('Wifi');
export const WifiOff = createEmojiIcon('WifiOff');
export const CloudOff = createEmojiIcon('CloudOff');
export const CloudCheck = createEmojiIcon('CloudCheck');
export const RefreshCw = createEmojiIcon('RefreshCw');
export const Home = createEmojiIcon('Home');
export const Building2 = createEmojiIcon('Building2');
export const Database = createEmojiIcon('Database');
export const FileSpreadsheet = createEmojiIcon('FileSpreadsheet');
export const Package = createEmojiIcon('Package');
export const TrendingUp = createEmojiIcon('TrendingUp');
export const LayoutDashboard = createEmojiIcon('LayoutDashboard');
export const FilePlus = createEmojiIcon('FilePlus');
export const ScrollText = createEmojiIcon('ScrollText');
export const PieChart = createEmojiIcon('PieChart');
export const UserCircle = createEmojiIcon('UserCircle');
export const Bell = createEmojiIcon('Bell');
export const Shield = createEmojiIcon('Shield');
export const Sparkles = createEmojiIcon('Sparkles');
export const Smartphone = createEmojiIcon('Smartphone');
export const HelpCircle = createEmojiIcon('HelpCircle');
export const Search = createEmojiIcon('Search');
export const Printer = createEmojiIcon('Printer');
export const Check = createEmojiIcon('Check');
export const Info = createEmojiIcon('Info');
export const ListRestart = createEmojiIcon('ListRestart');
export const FileText = createEmojiIcon('FileText');
export const ShoppingCart = createEmojiIcon('ShoppingCart');
export const Loader2 = createEmojiIcon('Loader2');
export const LayoutGrid = createEmojiIcon('LayoutGrid');
export const List = createEmojiIcon('List');
export const Coins = createEmojiIcon('Coins');
export const AlertCircle = createEmojiIcon('AlertCircle');
export const Calendar = createEmojiIcon('Calendar');
export const Layers = createEmojiIcon('Layers');
export const ArrowRight = createEmojiIcon('ArrowRight');
export const Download = createEmojiIcon('Download');
export const ShieldAlert = createEmojiIcon('ShieldAlert');
export const CheckCircle2 = createEmojiIcon('CheckCircle2');
export const Trash2 = createEmojiIcon('Trash2');
export const Clock = createEmojiIcon('Clock');
export const AlertTriangle = createEmojiIcon('AlertTriangle');
export const Activity = createEmojiIcon('Activity');
export const Terminal = createEmojiIcon('Terminal');
export const Users2 = createEmojiIcon('Users2');
export const Flag = createEmojiIcon('Flag');
export const Wrench = createEmojiIcon('Wrench');
export const Play = createEmojiIcon('Play');
export const Send = createEmojiIcon('Send');
export const Cpu = createEmojiIcon('Cpu');
export const History = createEmojiIcon('History');
export const Lock = createEmojiIcon('Lock');
export const Server = createEmojiIcon('Server');
export const Gauge = createEmojiIcon('Gauge');
export const BarChart4 = createEmojiIcon('BarChart4');
export const AlertOctagon = createEmojiIcon('AlertOctagon');
export const Zap = createEmojiIcon('Zap');
export const Laptop = createEmojiIcon('Laptop');
export const TrendingDown = createEmojiIcon('TrendingDown');
export const Target = createEmojiIcon('Target');
export const BarChart = createEmojiIcon('BarChart');
export const ShoppingBag = createEmojiIcon('ShoppingBag');
export const ChevronDown = createEmojiIcon('ChevronDown');
export const ChevronUp = createEmojiIcon('ChevronUp');
export const ShieldCheck = createEmojiIcon('ShieldCheck');
export const Camera = createEmojiIcon('Camera');
export const ArrowUpDown = createEmojiIcon('ArrowUpDown');
export const Filter = createEmojiIcon('Filter');
export const Eye = createEmojiIcon('Eye');
export const CheckCircle = createEmojiIcon('CheckCircle');
export const MoreVertical = createEmojiIcon('MoreVertical');
export const Pencil = createEmojiIcon('Pencil');
export const IndianRupee = createEmojiIcon('IndianRupee');
export const Edit3 = createEmojiIcon('Edit3');
export const Copy = createEmojiIcon('Copy');
export const CreditCard = createEmojiIcon('CreditCard');
export const User = createEmojiIcon('User');
export const XCircle = createEmojiIcon('XCircle');
export const Barcode = createEmojiIcon('Barcode');
export const Keyboard = createEmojiIcon('Keyboard');
export const Volume2 = createEmojiIcon('Volume2');
export const VolumeX = createEmojiIcon('VolumeX');
export const ChevronRight = createEmojiIcon('ChevronRight');
export const Cloud = createEmojiIcon('Cloud');
export const Wallet = createEmojiIcon('Wallet');
export const Briefcase = createEmojiIcon('Briefcase');
export const Building = createEmojiIcon('Building');
export const Landmark = createEmojiIcon('Landmark');
export const ArrowUpRight = createEmojiIcon('ArrowUpRight');
export const ArrowDownRight = createEmojiIcon('ArrowDownRight');
export const ArrowDownLeft = createEmojiIcon('ArrowDownLeft');
export const DollarSign = createEmojiIcon('DollarSign');
export const CalendarDays = createEmojiIcon('CalendarDays');
export const ListFilter = createEmojiIcon('ListFilter');
export const Mail = createEmojiIcon('Mail');
export const QrCode = createEmojiIcon('QrCode');
export const Edit = createEmojiIcon('Edit');
export const SlidersHorizontal = createEmojiIcon('SlidersHorizontal');
export const ChevronLeft = createEmojiIcon('ChevronLeft');
export const PlusCircle = createEmojiIcon('PlusCircle');
export const Upload = createEmojiIcon('Upload');
export const ArrowLeft = createEmojiIcon('ArrowLeft');
export const Share2 = createEmojiIcon('Share2');
export const Phone = createEmojiIcon('Phone');
export const MapPin = createEmojiIcon('MapPin');
export const Palette = createEmojiIcon('Palette');
export const Contrast = createEmojiIcon('Contrast');
export const CheckCheck = createEmojiIcon('CheckCheck');
export const BarChart2 = createEmojiIcon('BarChart2');
export const FileDown = createEmojiIcon('FileDown');
export const Inbox = createEmojiIcon('Inbox');
export const Sliders = createEmojiIcon('Sliders');
export const EyeOff = createEmojiIcon('EyeOff');
export const Store = createEmojiIcon('Store');
export const Edit2 = createEmojiIcon('Edit2');
export const Globe = createEmojiIcon('Globe');
export const Hash = createEmojiIcon('Hash');
export const MessageSquare = createEmojiIcon('MessageSquare');
export const BookOpen = createEmojiIcon('BookOpen');
export const Star = createEmojiIcon('Star');
export const Award = createEmojiIcon('Award');
export const CloudLightning = createEmojiIcon('CloudLightning');
export const BarChart3 = createEmojiIcon('BarChart3');
export const KeyRound = createEmojiIcon('KeyRound');
export const UserCheck = createEmojiIcon('UserCheck');
export const Scale = createEmojiIcon('Scale');
export const Save = createEmojiIcon('Save');
export const Truck = createEmojiIcon('Truck');
export const ClipboardList = createEmojiIcon('ClipboardList');
export const Maximize2 = createEmojiIcon('Maximize2');
export const Minimize2 = createEmojiIcon('Minimize2');
