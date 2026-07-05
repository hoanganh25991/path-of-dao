export const TILE_SIZE = 32;
export const SURFACE_H = 22;
export const EDGE_H = 10;

export enum TileCategory {
  Ground = 'ground',
  Water = 'water',
  Flora = 'flora',
  Rock = 'rock',
  Structure = 'structure',
  Special = 'special',
}

export interface TileDef {
  gid: number;
  name: string;
  category: TileCategory;
  surface: string;
  edge: string;
  detail: string;
  highlight: string;
  shadow: string;
  speckle: string;
  canopy?: boolean;
  wall?: boolean;
  translucent?: boolean;
}

export const TILE_DEFS: Record<string, TileDef> = {
  grass: {
    gid: 1, name: 'Grass', category: TileCategory.Ground,
    surface: '#4a8c3f', edge: '#2d5a26', detail: '#3d7334',
    highlight: '#5ea852', shadow: '#1e3e1a', speckle: '#69b85c',
  },
  grassAlt: {
    gid: 2, name: 'Grass Alt', category: TileCategory.Ground,
    surface: '#529444', edge: '#31602a', detail: '#427a38',
    highlight: '#66b059', shadow: '#224522', speckle: '#72c265',
  },
  dirt: {
    gid: 3, name: 'Dirt', category: TileCategory.Ground,
    surface: '#8b7355', edge: '#5a4a35', detail: '#6e5c44',
    highlight: '#a0886a', shadow: '#3d3022', speckle: '#9e8770',
  },
  sand: {
    gid: 4, name: 'Sand', category: TileCategory.Ground,
    surface: '#d4b896', edge: '#a09070', detail: '#c0a885',
    highlight: '#e8d4b8', shadow: '#887058', speckle: '#dcc8a8',
  },
  shallowWater: {
    gid: 5, name: 'Shallow Water', category: TileCategory.Water,
    surface: '#4898c0', edge: '#306880', detail: '#3a80a0',
    highlight: '#5cb8e0', shadow: '#205068', speckle: '#68c8f0',
  },
  deepWater: {
    gid: 6, name: 'Deep Water', category: TileCategory.Water,
    surface: '#285080', edge: '#1a3860', detail: '#224070',
    highlight: '#3870a0', shadow: '#102848', speckle: '#4088b0',
  },
  waterEdgeN: {
    gid: 7, name: 'Water Edge N', category: TileCategory.Water,
    surface: '#4898c0', edge: '#2d5a26', detail: '#3a80a0',
    highlight: '#5ea852', shadow: '#205068', speckle: '#68c8f0',
  },
  waterEdgeW: {
    gid: 8, name: 'Water Edge W', category: TileCategory.Water,
    surface: '#4898c0', edge: '#2d5a26', detail: '#3a80a0',
    highlight: '#5ea852', shadow: '#205068', speckle: '#68c8f0',
  },
  bush: {
    gid: 9, name: 'Bush', category: TileCategory.Flora,
    surface: '#3a7030', edge: '#264a20', detail: '#2d5a26',
    highlight: '#4a9040', shadow: '#1a3015', speckle: '#58a048',
  },
  tallGrass: {
    gid: 10, name: 'Tall Grass', category: TileCategory.Flora,
    surface: '#4a8c3f', edge: '#2d5a26', detail: '#5ea852',
    highlight: '#72c265', shadow: '#1e3e1a', speckle: '#88d878',
  },
  treeTrunk: {
    gid: 11, name: 'Tree Trunk', category: TileCategory.Flora,
    surface: '#6b5030', edge: '#3d2a18', detail: '#584028',
    highlight: '#806848', shadow: '#281810', speckle: '#907858',
    wall: true,
  },
  canopy: {
    gid: 12, name: 'Canopy', category: TileCategory.Flora,
    surface: '#2d5a26', edge: '#1a3a15', detail: '#224522',
    highlight: '#3a7030', shadow: '#102810', speckle: '#4a8c3f',
    canopy: true,
  },
  flower: {
    gid: 13, name: 'Flower', category: TileCategory.Flora,
    surface: '#4a8c3f', edge: '#2d5a26', detail: '#e05070',
    highlight: '#f0a0b0', shadow: '#1e3e1a', speckle: '#ffc0d0',
  },
  rock: {
    gid: 14, name: 'Rock', category: TileCategory.Rock,
    surface: '#7a7a85', edge: '#484858', detail: '#606068',
    highlight: '#9898a0', shadow: '#303038', speckle: '#8a8a90',
    wall: true,
  },
  cliff: {
    gid: 15, name: 'Space Border', category: TileCategory.Rock,
    surface: '#101830', edge: '#060810', detail: '#1a2860',
    highlight: '#3040a0', shadow: '#040610', speckle: '#5060c0',
    wall: true,
  },
  gravel: {
    gid: 16, name: 'Gravel', category: TileCategory.Rock,
    surface: '#8a8a88', edge: '#585858', detail: '#707070',
    highlight: '#a0a0a0', shadow: '#404040', speckle: '#909090',
  },
  caveEntrance: {
    gid: 17, name: 'Cave', category: TileCategory.Rock,
    surface: '#484858', edge: '#202028', detail: '#303038',
    highlight: '#606068', shadow: '#101018', speckle: '#505058',
    wall: true,
  },
  woodFence: {
    gid: 18, name: 'Wood Fence', category: TileCategory.Structure,
    surface: '#a08060', edge: '#604830', detail: '#806848',
    highlight: '#c0a080', shadow: '#403020', speckle: '#b89870',
    wall: true,
  },
  stoneWall: {
    gid: 19, name: 'Stone Wall', category: TileCategory.Structure,
    surface: '#909098', edge: '#585860', detail: '#787880',
    highlight: '#a8a8b0', shadow: '#404048', speckle: '#9898a0',
    wall: true,
  },
  roof: {
    gid: 20, name: 'Roof', category: TileCategory.Structure,
    surface: '#c04030', edge: '#802018', detail: '#a03028',
    highlight: '#d86050', shadow: '#601010', speckle: '#d05040',
    canopy: true,
  },
  cobblestone: {
    gid: 21, name: 'Cobblestone', category: TileCategory.Structure,
    surface: '#b0a898', edge: '#787060', detail: '#989080',
    highlight: '#c8c0b0', shadow: '#585040', speckle: '#b8b0a0',
  },
  path: {
    gid: 22, name: 'Path', category: TileCategory.Special,
    surface: '#c0b090', edge: '#8a7a60', detail: '#a89878',
    highlight: '#d8ccb0', shadow: '#6a5a40', speckle: '#c8b898',
  },
  bridge: {
    gid: 23, name: 'Bridge', category: TileCategory.Special,
    surface: '#b89860', edge: '#786038', detail: '#987840',
    highlight: '#d0b880', shadow: '#584020', speckle: '#c0a068',
  },
  deepShadow: {
    gid: 24, name: 'Shadow', category: TileCategory.Special,
    surface: '#000000', edge: '#000000', detail: '#000000',
    highlight: '#000000', shadow: '#000000', speckle: '#000000',
    translucent: true,
  },
  lantern: {
    gid: 25, name: 'Lantern', category: TileCategory.Special,
    surface: '#686050', edge: '#383028', detail: '#d4a840',
    highlight: '#ffe880', shadow: '#201810', speckle: '#f0d060',
  },
};

export const TILE_LIST = Object.values(TILE_DEFS).sort((a, b) => a.gid - b.gid);

export interface BiomePalette {
  name: string;
  grass: { surface: string; edge: string; detail: string; highlight: string; shadow: string; speckle: string };
  grassAlt: { surface: string; edge: string; detail: string; highlight: string; shadow: string; speckle: string };
  dirt: { surface: string; edge: string; detail: string; highlight: string; shadow: string; speckle: string };
  waterShallow: { surface: string; edge: string; highlight: string; speckle: string };
  waterDeep: { surface: string; edge: string; highlight: string; speckle: string };
}

export const BIOME_PALETTES: Record<string, BiomePalette> = {
  village: {
    name: 'Fallen Village',
    grass: { surface: '#4a8c3f', edge: '#2d5a26', detail: '#3d7334', highlight: '#5ea852', shadow: '#1e3e1a', speckle: '#69b85c' },
    grassAlt: { surface: '#529444', edge: '#31602a', detail: '#427a38', highlight: '#66b059', shadow: '#224522', speckle: '#72c265' },
    dirt: { surface: '#8b7355', edge: '#5a4a35', detail: '#6e5c44', highlight: '#a0886a', shadow: '#3d3022', speckle: '#9e8770' },
    waterShallow: { surface: '#5898b0', edge: '#386878', highlight: '#6cb8d0', speckle: '#78c8e0' },
    waterDeep: { surface: '#306080', edge: '#204060', highlight: '#4888a8', speckle: '#5098b8' },
  },
  mist: {
    name: 'Mist Forest',
    grass: { surface: '#3d7840', edge: '#265028', detail: '#326838', highlight: '#4c9048', shadow: '#183818', speckle: '#5ca858' },
    grassAlt: { surface: '#458048', edge: '#2a582c', detail: '#38703c', highlight: '#54984c', shadow: '#1c4020', speckle: '#64b060' },
    dirt: { surface: '#7a6850', edge: '#4e4030', detail: '#605038', highlight: '#908068', shadow: '#342820', speckle: '#8c7858' },
    waterShallow: { surface: '#48a090', edge: '#307060', highlight: '#60c0a8', speckle: '#70d0b8' },
    waterDeep: { surface: '#286860', edge: '#184840', highlight: '#389080', speckle: '#48a898' },
  },
  canyon: {
    name: 'Stone Canyon',
    grass: { surface: '#6a8040', edge: '#445028', detail: '#587038', highlight: '#809858', shadow: '#304020', speckle: '#8ca860' },
    grassAlt: { surface: '#728848', edge: '#4a582c', detail: '#5e783c', highlight: '#88a05c', shadow: '#344824', speckle: '#94b068' },
    dirt: { surface: '#a08860', edge: '#685840', detail: '#807048', highlight: '#b8a878', shadow: '#504030', speckle: '#ac9870' },
    waterShallow: { surface: '#609088', edge: '#406058', highlight: '#78b0a0', speckle: '#88c0b0' },
    waterDeep: { surface: '#385858', edge: '#203838', highlight: '#508080', speckle: '#609090' },
  },
  lake: {
    name: 'Moon Lake',
    grass: { surface: '#3a7038', edge: '#244826', detail: '#2e602e', highlight: '#489048', shadow: '#183018', speckle: '#58a858' },
    grassAlt: { surface: '#427840', edge: '#28502a', detail: '#346832', highlight: '#50984c', shadow: '#1c3820', speckle: '#60b05c' },
    dirt: { surface: '#706050', edge: '#484030', detail: '#585038', highlight: '#887860', shadow: '#302820', speckle: '#807058' },
    waterShallow: { surface: '#3098a0', edge: '#206868', highlight: '#40b8c0', speckle: '#50c8d0' },
    waterDeep: { surface: '#185860', edge: '#103838', highlight: '#288088', speckle: '#389898' },
  },
  desert: {
    name: 'Burning Desert',
    grass: { surface: '#a08050', edge: '#685830', detail: '#887040', highlight: '#c0a068', shadow: '#484020', speckle: '#b89860' },
    grassAlt: { surface: '#a88858', edge: '#6c6038', detail: '#907848', highlight: '#c8a870', shadow: '#4c4428', speckle: '#c0a068' },
    dirt: { surface: '#d4b080', edge: '#a08860', detail: '#c0a070', highlight: '#e8cc98', shadow: '#887048', speckle: '#dcc090' },
    waterShallow: { surface: '#60a090', edge: '#407060', highlight: '#78c0b0', speckle: '#88d0c0' },
    waterDeep: { surface: '#387068', edge: '#204840', highlight: '#509890', speckle: '#60a8a0' },
  },
  storm: {
    name: 'Thunder Peaks',
    grass: { surface: '#5a6a50', edge: '#384830', detail: '#485840', highlight: '#6e8060', shadow: '#283820', speckle: '#7a9070' },
    grassAlt: { surface: '#627258', edge: '#3c5034', detail: '#4e6044', highlight: '#768868', shadow: '#2c4024', speckle: '#829878' },
    dirt: { surface: '#7a7060', edge: '#504838', detail: '#605848', highlight: '#908878', shadow: '#383028', speckle: '#8a8070' },
    waterShallow: { surface: '#507088', edge: '#384860', highlight: '#6890a8', speckle: '#78a0b8' },
    waterDeep: { surface: '#304858', edge: '#203038', highlight: '#487080', speckle: '#588090' },
  },
  ice: {
    name: 'Frozen Palace',
    grass: { surface: '#98b0c8', edge: '#6888a0', detail: '#80a0b8', highlight: '#b0c8e0', shadow: '#506878', speckle: '#a8c0d8' },
    grassAlt: { surface: '#a0b8d0', edge: '#6c8ca8', detail: '#88a8c0', highlight: '#b8d0e8', shadow: '#547080', speckle: '#b0c8e0' },
    dirt: { surface: '#b0c0d0', edge: '#8098a8', detail: '#98b0c0', highlight: '#c8d8e8', shadow: '#687888', speckle: '#c0d0e0' },
    waterShallow: { surface: '#80a8c8', edge: '#5880a0', highlight: '#98c8e0', speckle: '#a8d8f0' },
    waterDeep: { surface: '#507090', edge: '#305068', highlight: '#6898b8', speckle: '#78a8c8' },
  },
  void: {
    name: 'Void Throne',
    grass: { surface: '#383848', edge: '#202030', detail: '#282838', highlight: '#484858', shadow: '#181828', speckle: '#424252' },
    grassAlt: { surface: '#404050', edge: '#242434', detail: '#303040', highlight: '#505060', shadow: '#1c1c2c', speckle: '#4a4a5a' },
    dirt: { surface: '#484858', edge: '#282838', detail: '#383848', highlight: '#585868', shadow: '#181828', speckle: '#505060' },
    waterShallow: { surface: '#303060', edge: '#202048', highlight: '#4848a0', speckle: '#585098' },
    waterDeep: { surface: '#202048', edge: '#101030', highlight: '#383878', speckle: '#484888' },
  },
};

export function applyBiomeToTile(def: TileDef, biome: BiomePalette): TileDef {
  switch (def.name) {
    case 'Grass':
      return { ...def, ...biome.grass };
    case 'Grass Alt':
      return { ...def, ...biome.grassAlt };
    case 'Dirt':
      return { ...def, ...biome.dirt };
    case 'Shallow Water':
      return { ...def, surface: biome.waterShallow.surface, edge: biome.waterShallow.edge, highlight: biome.waterShallow.highlight, speckle: biome.waterShallow.speckle };
    case 'Deep Water':
      return { ...def, surface: biome.waterDeep.surface, edge: biome.waterDeep.edge, highlight: biome.waterDeep.highlight, speckle: biome.waterDeep.speckle };
    default:
      return def;
  }
}