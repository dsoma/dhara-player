import DharaPlayer from './dhara-player';

const win: any = window;

// biome-ignore lint/complexity/useLiteralKeys: Prevent name minification
win['DHARA'] = win['DHARA'] || {};

// biome-ignore lint/complexity/useLiteralKeys: Prevent name minification
win['DHARA']['Player'] = DharaPlayer;
