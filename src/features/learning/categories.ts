export type LearningCategoryId =
  | "notation"
  | "steps"
  | "f2l"
  | "oll"
  | "pll"
  | "ortega-oll"
  | "ortega-pbl"
  | "cll"
  | "pyra-ultima-capa"
  | "l4e"
  | "keyhole-l3e"
  | "l4ei-l3e"
  | "1flip-l3c"
  | "1flip-l3e"
  | "wo-l3c"
  | "wo-l3e"
  | "oka-cierre"
  | "oka-l3e"
  | "nutella-l3c"
  | "nutella-l3e"
  | "petrus-coll"
  | "petrus-epll"
  | "zz-ocll"
  | "zz-pll"
  | "roux-cmll"
  | "roux-eo"
  | "roux-ulur"
  | "roux-capa-m"
  | "eg-cll"
  | "eg-1"
  | "eg-2"
  | "leg-1"
  | "tcll-cll"
  | "tcll-mas"
  | "tcll-menos"
  | "skc-centros"
  | "ski-cara-arriba"
  | "ski-centros"
  | "ska-peanut"
  | "ska-pi"
  | "ska-l5c"
  | "r4-paridades"
  | "fs4-paridades"
  | "hoya-paridades"
  | "yau-paridades"
  | "c4-f2l"
  | "c4-oll"
  | "c4-pll";

export interface LearningCategory {
  id: LearningCategoryId;
  title: string;
  description: string;
  accent: string;
  /** What the block is about, shown above its cases. */
  intro?: string;
}

/** The methods Aprender teaches — the active ones of features/trainer/methods.ts. */
export type LearningMethodId =
  | "cfop"
  | "petrus"
  | "zz"
  | "roux"
  | "ortega"
  | "cll"
  | "eg"
  | "leg"
  | "tcll"
  | "por-capas"
  | "keyhole"
  | "l4e-intuitivo"
  | "oka"
  | "1-flip"
  | "wo"
  | "nutella"
  | "l4e"
  | "skewb-capas"
  | "sarah-intermedio"
  | "sarah-avanzado"
  | "reduccion"
  | "freeslice"
  | "hoya"
  | "yau";

/** The cubes Aprender teaches. */
export type LearningCube = "3x3" | "2x2" | "pyraminx" | "skewb" | "4x4";

export const DEFAULT_LEARNING_METHOD: LearningMethodId = "cfop";

/** Which cube each method is for (matches features/trainer/methods.ts). */
export const METHOD_CUBE: Record<LearningMethodId, LearningCube> = {
  cfop: "3x3",
  petrus: "3x3",
  zz: "3x3",
  roux: "3x3",
  ortega: "2x2",
  cll: "2x2",
  eg: "2x2",
  leg: "2x2",
  tcll: "2x2",
  "por-capas": "pyraminx",
  keyhole: "pyraminx",
  "l4e-intuitivo": "pyraminx",
  oka: "pyraminx",
  "1-flip": "pyraminx",
  wo: "pyraminx",
  nutella: "pyraminx",
  l4e: "pyraminx",
  "skewb-capas": "skewb",
  "sarah-intermedio": "skewb",
  "sarah-avanzado": "skewb",
  reduccion: "4x4",
  freeslice: "4x4",
  hoya: "4x4",
  yau: "4x4",
};

/** How the Aprender screen names each method under its title. */
export const METHOD_LABEL: Record<LearningMethodId, string> = {
  cfop: "3×3 · CFOP",
  petrus: "3×3 · Petrus",
  zz: "3×3 · ZZ",
  roux: "3×3 · Roux",
  ortega: "2×2 · Ortega",
  cll: "2×2 · CLL",
  eg: "2×2 · EG",
  leg: "2×2 · LEG",
  tcll: "2×2 · TCLL",
  "por-capas": "Pyraminx · Por capas",
  keyhole: "Pyraminx · Keyhole",
  "l4e-intuitivo": "Pyraminx · L4E intuitivo",
  oka: "Pyraminx · Oka",
  "1-flip": "Pyraminx · 1-Flip",
  wo: "Pyraminx · WO",
  nutella: "Pyraminx · Nutella",
  l4e: "Pyraminx · L4E",
  "skewb-capas": "Skewb · Por capas",
  "sarah-intermedio": "Skewb · Sarah's Intermediate",
  "sarah-avanzado": "Skewb · Sarah's Advanced",
  reduccion: "4×4 · Reducción",
  freeslice: "4×4 · Reducción con Freeslice",
  hoya: "4×4 · Hoya",
  yau: "4×4 · Yau",
};

export function isLearningMethodId(id: string): id is LearningMethodId {
  return id in METHOD_CUBE;
}

const NOTATION = { id: "notation", accent: "#38bdf8" } as const;

/** What EG-1 and EG-2 have in common: how to read the bottom, and the diagrams. */
const EG_INTRO = (bottom: string) =>
  `Con la primera cara hecha, mira la capa de abajo: aquí tiene ${bottom}. Luego mira la de arriba como en CLL (la forma del amarillo y los faros) y usa su caso: el algoritmo resuelve las dos capas a la vez. Los diagramas miran desde arriba; en cada lado, la barra de dentro es la fila de arriba y la de fuera, la fila de abajo. Los tres últimos casos tienen el amarillo de arriba ya orientado y salen de las PBL de Ortega.`;
/** What TCLL+ and TCLL− have in common. */
const TCLL_INTRO = (white: string) =>
  `Con la primera capa hecha salvo una esquina girada, pon esa esquina delante a la derecha: aquí tiene el blanco mirando ${white}. Luego mira la capa de arriba (la forma del amarillo y los faros) y usa su caso: el algoritmo gira esa esquina y resuelve el cubo entero a la vez. Los diagramas miran desde arriba; en cada lado, la barra de dentro es la fila de arriba y la de fuera, la fila de abajo.`;
const STEPS = { id: "steps", accent: "#34d399" } as const;

/** The Skewb's last centers: the same step in Por capas and Sarah's Intermediate. */
const SKEWB_CENTERS_INTRO =
  "Con la cara blanca abajo y la amarilla arriba solo quedan los cuatro centros de los lados. Cada algoritmo empieza girando el Skewb entero (x o x'), de modo que el blanco queda delante a la izquierda y el amarillo detrás a la derecha, y luego repite el sledgehammer. Mira qué centros no están en su sitio y usa su caso.";
/** What the three L2L blocks of Sarah's Advanced have in common. */
const L2L_INTRO = (shape: string) =>
  `En Sarah's Advanced, con la cara blanca abajo, un solo algoritmo resuelve las dos últimas capas: las esquinas de arriba y los cinco centros (L2L). ${shape} Los algoritmos son los de Sarah escritos enteros, con la cara verde delante a la izquierda; gira el Skewb con y hasta verlo como en el diagrama. Los casos que su guía deja sin algoritmo llevan el más corto que encuentra el motor de RUBIKO.`;

/** The 4×4's notation block, the same in its four methods. */
const NOTATION_4X4 = {
  ...NOTATION,
  title: "Notación del 4×4",
  description: "Cada cara, sus dos capas de fuera (Rw) y la capa de dentro sola (r)",
} as const;

/**
 * The 3×3 part of the 4×4 methods: CFOP's F2L, OLL and PLL blocks as they
 * are (the same cases, and the same progress). Only the words change.
 */
const AS_3X3 =
  "Con los centros hechos y las aristas emparejadas, el 4×4 se resuelve como un 3×3: cada pareja de piezas es una arista y cada centro de 2×2, un centro. Estos son los casos de CFOP del 3×3, dibujados en el 4×4 y con los algoritmos escritos para él: la r del 3×3 (dos capas) es aquí 3Rw, las tres capas de ese lado, porque con Rw el 4×4 se deshace; y la capa del medio, M, son las dos de dentro (l r'). Cada algoritmo está comprobado con el motor en un 4×4 reducido.";
const CFOP_4X4 = (method: string): LearningCategory[] => [
  {
    id: "c4-f2l",
    title: "F2L (CFOP)",
    description: method === "reduccion" || method === "freeslice" ? "Las dos primeras capas, ya como un 3×3" : "Las dos primeras capas sobre la cruz que ya está hecha",
    accent: "#ff8c1a",
    intro: AS_3X3,
  },
  { id: "c4-oll", title: "OLL (CFOP)", description: "Orienta la última capa, como en el 3×3", accent: "#facc15", intro: AS_3X3 },
  { id: "c4-pll", title: "PLL (CFOP)", description: "Permuta la última capa, como en el 3×3", accent: "#a78bfa", intro: AS_3X3 },
];
/** The two parities, the same in the four methods. */
const PARITY_4X4 = (id: LearningCategoryId): LearningCategory => ({
  id,
  title: "Paridades",
  description: "Lo que un 3×3 no puede tener: una arista volteada o dos cambiadas",
  accent: "#f472b6",
  intro:
    "Al resolver el 4×4 como un 3×3 pueden salir dos casos imposibles en un 3×3, por cómo se juntaron los centros y las aristas. Paridad de OLL: al orientar la última capa, una sola arista (o tres) queda con el amarillo hacia el lado. Paridad de PLL: al permutarla, dos aristas quedan cambiadas sin ninguna PLL que lo arregle. Cada una tiene un algoritmo; después se sigue con la OLL o la PLL normal. Aquí r y l son solo la capa de dentro, y Rw, Lw y Uw, las dos de fuera.",
});

/**
 * The blocks of the Aprender screen, in order, for each method. Each one
 * has real content from a source in docs/source. New methods (Roux, ZZ...)
 * are added here once they have that content too.
 */
export const METHOD_CATEGORIES: Record<LearningMethodId, LearningCategory[]> = {
  cfop: [
    {
      ...NOTATION,
      title: "Notación del Cubo",
      description: "Aprende los giros básicos para leer algoritmos",
    },
    {
      // Its content is the ordered list of steps in sets.ts (LEARNING_STEPS).
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Aprende a resolver el 3×3 paso a paso",
    },
    {
      id: "f2l",
      title: "F2L (CFOP)",
      description: "Resuelve las primeras dos capas simultáneamente",
      accent: "#ff8c1a",
    },
    {
      id: "oll",
      title: "OLL (CFOP)",
      description: "Orienta la última capa de tu cubo",
      accent: "#facc15",
    },
    {
      id: "pll",
      title: "PLL (CFOP)",
      description: "Permuta las piezas de la última capa",
      accent: "#a78bfa",
    },
  ],
  petrus: [
    {
      ...NOTATION,
      title: "Notación del Cubo",
      description: "Los giros básicos, y también las capas del medio y los giros anchos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Dos bloques, la orientación de las aristas y el resto de F2L con R y U",
    },
    {
      id: "petrus-coll",
      title: "COLL (Petrus)",
      description: "Orienta y coloca las esquinas de arriba con las aristas ya orientadas",
      accent: "#f472b6",
    },
    {
      id: "petrus-epll",
      title: "EPLL (Petrus)",
      description: "Coloca las aristas de arriba: los 4 PLL que solo mueven aristas",
      accent: "#a78bfa",
    },
  ],
  zz: [
    {
      ...NOTATION,
      title: "Notación del Cubo",
      description: "Los giros básicos, y también las capas del medio y los giros anchos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Orientar las aristas, la línea y F2L solo con L, U y R",
    },
    {
      id: "zz-ocll",
      title: "OCLL (ZZ)",
      description: "Pon el amarillo arriba en las esquinas: las aristas ya lo tienen",
      accent: "#facc15",
    },
    {
      id: "zz-pll",
      title: "PLL (ZZ)",
      description: "Permuta las piezas de la última capa",
      accent: "#a78bfa",
    },
  ],
  roux: [
    {
      ...NOTATION,
      title: "Notación del Cubo",
      description: "Los giros básicos, y también las capas del medio y los giros anchos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Los dos bloques de 1×2×3, a los lados",
    },
    {
      id: "roux-cmll",
      title: "CMLL (Roux)",
      description: "Orienta y coloca las esquinas de arriba sin romper los bloques",
      accent: "#f472b6",
    },
    {
      id: "roux-eo",
      title: "LSE 4a · Orientación",
      description: "Orienta las seis aristas que quedan, solo con M y U",
      accent: "#facc15",
      intro:
        "Tras CMLL quedan seis aristas: las cuatro de arriba y las dos de abajo de la capa M (abajo delante y abajo detrás). LSE las resuelve solo con M y U, sin tocar los bloques, y empieza orientándolas. Mira la pegatina amarilla o blanca de cada una: la arista es buena si esa pegatina mira arriba o abajo, y mala si mira a un lado. Antes, los centros tienen que estar arriba y abajo (el amarillo o el blanco arriba): si están delante y detrás, haz M o M'. U no cambia si una arista es buena o mala, y un cuarto de vuelta de M da la vuelta a las cuatro de su capa. Los diagramas muestran el cubo desplegado: la cara de arriba en el centro, delante debajo y abajo al final; detrás, encima (del revés), y los lados a izquierda y derecha. Solo las seis aristas y los centros están en color.",
    },
    {
      id: "roux-ulur",
      title: "LSE 4b · Izquierda y derecha",
      description: "Coloca las aristas de arriba a la izquierda y a la derecha",
      accent: "#fb923c",
      intro:
        "Con las seis aristas orientadas, toca la amarilla-roja y la amarilla-naranja, que van arriba a la izquierda y a la derecha. Mira dónde están y súbelas juntas con M y U; el último giro de U las deja junto a sus esquinas. Si las dos están abajo, da igual cuál esté delante: M2 las sube. En los diagramas están en color esas dos aristas, las esquinas de arriba y los centros.",
    },
    {
      id: "roux-capa-m",
      title: "LSE 4c · Capa M",
      description: "Termina las cuatro aristas de la capa del medio",
      accent: "#a78bfa",
      intro:
        "Solo quedan las cuatro aristas de la capa M y sus centros. Si el centro blanco está arriba, haz M2 primero: los casos están vistos con el amarillo arriba. Mira dónde está cada arista y usa su caso; todos se hacen con M y U2, que no mueven la izquierda ni la derecha.",
    },
  ],
  ortega: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con una cara de un color",
    },
    {
      id: "ortega-oll",
      title: "OLL (Ortega)",
      description: "Orienta la cara de arriba del 2×2",
      accent: "#facc15",
    },
    {
      id: "ortega-pbl",
      title: "PBL (Ortega)",
      description: "Coloca las esquinas de las dos capas a la vez",
      accent: "#a78bfa",
    },
  ],
  cll: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con la primera capa completa",
    },
    {
      id: "cll",
      title: "CLL",
      description: "Resuelve la última capa del 2×2 con un solo algoritmo",
      accent: "#f472b6",
    },
  ],
  eg: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con una cara de un color, como en Ortega",
    },
    {
      id: "eg-cll",
      title: "CLL (EG)",
      description: "Abajo todo bien: resuelve la capa de arriba",
      accent: "#f472b6",
    },
    {
      id: "eg-1",
      title: "EG-1",
      description: "Abajo, dos esquinas vecinas cambiadas: resuelve las dos capas",
      accent: "#fb923c",
      intro: EG_INTRO("dos esquinas vecinas cambiadas: un lado tiene sus dos pegatinas de abajo iguales (la barra) y los otros no"),
    },
    {
      id: "eg-2",
      title: "EG-2",
      description: "Abajo, dos esquinas en diagonal cambiadas: resuelve las dos capas",
      accent: "#a78bfa",
      intro: EG_INTRO("dos esquinas en diagonal cambiadas: ningún lado tiene sus dos pegatinas de abajo iguales"),
    },
  ],
  leg: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con una cara de un color, como en Ortega",
    },
    {
      id: "leg-1",
      title: "LEG-1",
      description: "Abajo, la barra a la izquierda: resuelve las dos capas sin girar el cubo",
      accent: "#fb923c",
      intro:
        "LEG-1 resuelve los mismos casos que EG-1, pero sujetando el cubo con la barra de abajo (el lado con sus dos pegatinas de abajo iguales) a la izquierda. Así no hace falta girar el cubo después de la primera cara. Mira la capa de arriba como en CLL (la forma del amarillo y los faros) y usa su caso. Los diagramas miran desde arriba; en cada lado, la barra de dentro es la fila de arriba y la de fuera, la fila de abajo. Los tres últimos casos tienen el amarillo de arriba ya orientado y salen de las PBL de Ortega.",
    },
  ],
  tcll: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con la primera capa, como en CLL",
    },
    {
      id: "tcll-cll",
      title: "CLL (TCLL)",
      description: "Ninguna esquina de abajo girada: resuelve la capa de arriba",
      accent: "#f472b6",
    },
    {
      id: "tcll-mas",
      title: "TCLL+",
      description: "La esquina de abajo girada con el blanco hacia ti: resuelve el cubo",
      accent: "#fb923c",
      intro: TCLL_INTRO("hacia ti (delante)"),
    },
    {
      id: "tcll-menos",
      title: "TCLL−",
      description: "La esquina de abajo girada con el blanco a la derecha: resuelve el cubo",
      accent: "#a78bfa",
      intro: TCLL_INTRO("a la derecha"),
    },
  ],
  "por-capas": [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Aprende los giros del Pyraminx para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas, centros y la primera capa del Pyraminx",
    },
    {
      id: "pyra-ultima-capa",
      title: "Última capa (Por capas)",
      description: "Coloca las tres aristas de arriba",
      accent: "#facc15",
    },
  ],
  keyhole: [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Los giros del Pyraminx, y también Fw y los giros enteros",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas, el bloque de detrás, los centros y su última arista",
    },
    {
      id: "keyhole-l3e",
      title: "L3E (Keyhole)",
      description: "Coloca las tres aristas de la cara de delante",
      accent: "#facc15",
    },
  ],
  "l4e-intuitivo": [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Aprende los giros del Pyraminx para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas, la V y una arista de arriba",
    },
    {
      id: "l4ei-l3e",
      title: "L3E (L4E intuitivo)",
      description: "Termina con las tres aristas de la cara de delante",
      accent: "#facc15",
    },
  ],
  oka: [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Los giros del Pyraminx, y también Fw y los giros enteros",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas, la arista Oka y los centros con el hueco",
    },
    {
      id: "oka-cierre",
      title: "Cierre del bloque (Oka)",
      description: "La arista Oka a su sitio y la última del bloque en el hueco, a la vez",
      accent: "#ff8c1a",
    },
    {
      id: "oka-l3e",
      title: "L3E (Oka)",
      description: "Termina con las tres aristas de la cara de delante",
      accent: "#facc15",
    },
  ],
  "1-flip": [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Los giros del Pyraminx, y también Fw y los giros enteros",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas y el bloque de detrás, con una arista dada la vuelta",
    },
    {
      id: "1flip-l3c",
      title: "L3C (1-Flip)",
      description: "Los tres centros de delante y la arista volteada a la vez",
      accent: "#ff8c1a",
    },
    {
      id: "1flip-l3e",
      title: "L3E (1-Flip)",
      description: "Termina con las tres aristas de la cara de delante",
      accent: "#facc15",
    },
  ],
  wo: [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Los giros del Pyraminx, y también Fw y los giros enteros",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas y el bloque de detrás entero",
    },
    {
      id: "wo-l3c",
      title: "L3C (WO)",
      description: "Los tres centros de delante en un solo algoritmo",
      accent: "#ff8c1a",
    },
    {
      id: "wo-l3e",
      title: "L3E (WO)",
      description: "Termina con las tres aristas de la cara de delante",
      accent: "#facc15",
    },
  ],
  nutella: [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Los giros del Pyraminx, y también Fw y los giros enteros",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas y el bloque de detrás, con dos aristas cambiadas",
    },
    {
      id: "nutella-l3c",
      title: "L3C (Nutella)",
      description: "Los tres centros de delante y las dos aristas cambiadas a la vez",
      accent: "#ff8c1a",
    },
    {
      id: "nutella-l3e",
      title: "L3E (Nutella)",
      description: "Termina con las tres aristas de la cara de delante",
      accent: "#facc15",
    },
  ],
  l4e: [
    {
      ...NOTATION,
      title: "Notación del Pyraminx",
      description: "Aprende los giros del Pyraminx para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Puntas y la V del Pyraminx",
    },
    {
      id: "l4e",
      title: "L4E",
      description: "Resuelve las cuatro últimas aristas a la vez",
      accent: "#f472b6",
    },
  ],
  "skewb-capas": [
    {
      ...NOTATION,
      title: "Notación del Skewb",
      description: "Los giros de Sarah: F, R, L y los giros del Skewb entero",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "La cara blanca, las esquinas de arriba y el centro amarillo",
    },
    {
      id: "skc-centros",
      title: "Centros (Por capas)",
      description: "Coloca los cuatro centros de los lados",
      accent: "#facc15",
      intro: SKEWB_CENTERS_INTRO,
    },
  ],
  "sarah-intermedio": [
    {
      ...NOTATION,
      title: "Notación del Skewb",
      description: "Los giros de Sarah: F, R, L y los giros del Skewb entero",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "La cara blanca",
    },
    {
      id: "ski-cara-arriba",
      title: "Cara de arriba",
      description: "Esquinas de arriba y centro amarillo a la vez",
      accent: "#ff8c1a",
      intro:
        "Con la cara blanca abajo, mira la forma de las esquinas de arriba (Pi: las cuatro giradas; Peanut: dos opuestas giradas) y dónde está el centro amarillo. Los casos de la categoría 1 dejan la cara amarilla hecha. Los de las categorías 2 y 3 son un solo sledgehammer o hedgeslammer que convierte el caso en otro de una categoría más baja, y desde ahí se sigue. Gira el Skewb entero con y hasta ver el caso como en el diagrama.",
    },
    {
      id: "ski-centros",
      title: "Centros",
      description: "Coloca los cuatro centros de los lados",
      accent: "#facc15",
      intro: SKEWB_CENTERS_INTRO,
    },
  ],
  "sarah-avanzado": [
    {
      ...NOTATION,
      title: "Notación del Skewb",
      description: "Los giros de Sarah: F, R, L y los giros del Skewb entero",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "La cara blanca",
    },
    {
      id: "ska-peanut",
      title: "L2L · Peanut",
      description: "Dos esquinas opuestas de arriba giradas: resuelve el Skewb",
      accent: "#ff8c1a",
      intro: L2L_INTRO(
        "Peanut: dos esquinas opuestas de arriba tienen el amarillo arriba y las otras dos no. Los grupos son los de la guía de Sarah por casos: dónde está el centro amarillo (arriba, FR, FL, BR o BL) mirando la forma desde su lado.",
      ),
    },
    {
      id: "ska-pi",
      title: "L2L · Pi",
      description: "Las cuatro esquinas de arriba giradas: resuelve el Skewb",
      accent: "#a78bfa",
      intro: L2L_INTRO(
        "Pi: ninguna esquina de arriba tiene el amarillo arriba. Los grupos son los de la guía de Sarah por casos: dónde está el centro amarillo (arriba, F, B, R o L) mirando la forma desde su lado.",
      ),
    },
    {
      id: "ska-l5c",
      title: "L5C",
      description: "Esquinas de arriba hechas: los últimos cinco centros",
      accent: "#facc15",
      intro: L2L_INTRO("L5C: las cuatro esquinas de arriba ya tienen el amarillo arriba y solo faltan los centros."),
    },
  ],
  reduccion: [
    NOTATION_4X4,
    { ...STEPS, title: "Pasos de aprendizaje", description: "Los seis centros, las aristas de una en una y la cruz y las esquinas del 3×3" },
    ...CFOP_4X4("reduccion"),
    PARITY_4X4("r4-paridades"),
  ],
  freeslice: [
    NOTATION_4X4,
    { ...STEPS, title: "Pasos de aprendizaje", description: "Los centros, ocho aristas con el corte libre, las últimas y el 3×3" },
    ...CFOP_4X4("freeslice"),
    PARITY_4X4("fs4-paridades"),
  ],
  hoya: [
    NOTATION_4X4,
    { ...STEPS, title: "Pasos de aprendizaje", description: "Dos centros, la cruz, los otros cuatro centros y el resto de aristas" },
    ...CFOP_4X4("hoya"),
    PARITY_4X4("hoya-paridades"),
  ],
  yau: [
    NOTATION_4X4,
    { ...STEPS, title: "Pasos de aprendizaje", description: "Dos centros, tres aristas de la cruz, los otros centros, la última y el resto" },
    ...CFOP_4X4("yau"),
    PARITY_4X4("yau-paridades"),
  ],
};

/** The 3×3 (CFOP) blocks. */
export const LEARNING_CATEGORIES = METHOD_CATEGORIES.cfop;

export function getCategory(
  id: LearningCategoryId,
  method: LearningMethodId = DEFAULT_LEARNING_METHOD,
): LearningCategory {
  return METHOD_CATEGORIES[method].find((category) => category.id === id)!;
}

export function isLearningCategoryId(
  id: string,
  method: LearningMethodId = DEFAULT_LEARNING_METHOD,
): id is LearningCategoryId {
  return METHOD_CATEGORIES[method].some((category) => category.id === id);
}

/** Aprender for one method: the 3×3 keeps its plain /entrenar address. */
export function learnHref(method: LearningMethodId, open?: LearningCategoryId): string {
  const params = new URLSearchParams();
  if (method !== DEFAULT_LEARNING_METHOD) params.set("metodo", method);
  if (open) params.set("abierto", open);
  const query = params.toString();
  return query ? `/entrenar?${query}` : "/entrenar";
}
