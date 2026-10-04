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
  | "roux-capa-m";

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
  | "por-capas"
  | "keyhole"
  | "l4e-intuitivo"
  | "oka"
  | "1-flip"
  | "wo"
  | "nutella"
  | "l4e";

/** The cubes Aprender teaches. */
export type LearningCube = "3x3" | "2x2" | "pyraminx";

export const DEFAULT_LEARNING_METHOD: LearningMethodId = "cfop";

/** Which cube each method is for (matches features/trainer/methods.ts). */
export const METHOD_CUBE: Record<LearningMethodId, LearningCube> = {
  cfop: "3x3",
  petrus: "3x3",
  zz: "3x3",
  roux: "3x3",
  ortega: "2x2",
  cll: "2x2",
  "por-capas": "pyraminx",
  keyhole: "pyraminx",
  "l4e-intuitivo": "pyraminx",
  oka: "pyraminx",
  "1-flip": "pyraminx",
  wo: "pyraminx",
  nutella: "pyraminx",
  l4e: "pyraminx",
};

/** How the Aprender screen names each method under its title. */
export const METHOD_LABEL: Record<LearningMethodId, string> = {
  cfop: "3×3 · CFOP",
  petrus: "3×3 · Petrus",
  zz: "3×3 · ZZ",
  roux: "3×3 · Roux",
  ortega: "2×2 · Ortega",
  cll: "2×2 · CLL",
  "por-capas": "Pyraminx · Por capas",
  keyhole: "Pyraminx · Keyhole",
  "l4e-intuitivo": "Pyraminx · L4E intuitivo",
  oka: "Pyraminx · Oka",
  "1-flip": "Pyraminx · 1-Flip",
  wo: "Pyraminx · WO",
  nutella: "Pyraminx · Nutella",
  l4e: "Pyraminx · L4E",
};

export function isLearningMethodId(id: string): id is LearningMethodId {
  return id in METHOD_CUBE;
}

const NOTATION = { id: "notation", accent: "#38bdf8" } as const;
const STEPS = { id: "steps", accent: "#34d399" } as const;

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
