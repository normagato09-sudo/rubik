import type { AlgorithmCase, AlgorithmSetId } from "./algorithm-sets";
import {
  CLL_LEARN_CASES,
  ORTEGA_OLL_CASES,
  ORTEGA_PBL_CASES,
  PRIMERA_CAPA_CASES,
  PRIMERA_CARA_CASES,
} from "./cases-2x2";
import {
  L4E_LEARN_CASES,
  L4E_PUNTAS_CASES,
  L4E_V_CASES,
  PYRA_CENTROS_CASES,
  PYRA_PRIMERA_CAPA_CASES,
  PYRA_PUNTAS_CASES,
  PYRA_ULTIMA_CAPA_CASES,
} from "./cases-pyraminx";
import { SETS_PYRAMINX_RESEARCH } from "./cases-pyraminx-research";
import { getCategory, type LearningCategoryId, type LearningMethodId } from "./categories";
import { CRUZ_CASES } from "./cruz-cases";
import { ESQUINAS_CASES } from "./esquinas-cases";
import { F2L_CASES } from "./f2l-cases";
import { OLL_CASES } from "./oll-cases";
import { PLL_CASES } from "./pll-cases";

/** Every list of cases with algorithms, whatever Aprender block shows it. */
export const ALGORITHM_SETS: Record<AlgorithmSetId, AlgorithmCase[]> = {
  cruz: CRUZ_CASES,
  esquinas: ESQUINAS_CASES,
  f2l: F2L_CASES,
  oll: OLL_CASES,
  pll: PLL_CASES,
  "primera-cara": PRIMERA_CARA_CASES,
  "primera-capa": PRIMERA_CAPA_CASES,
  "ortega-oll": ORTEGA_OLL_CASES,
  "ortega-pbl": ORTEGA_PBL_CASES,
  cll: CLL_LEARN_CASES,
  "pyra-puntas": PYRA_PUNTAS_CASES,
  "pyra-centros": PYRA_CENTROS_CASES,
  "pyra-primera-capa": PYRA_PRIMERA_CAPA_CASES,
  "pyra-ultima-capa": PYRA_ULTIMA_CAPA_CASES,
  "l4e-puntas": L4E_PUNTAS_CASES,
  "l4e-v": L4E_V_CASES,
  l4e: L4E_LEARN_CASES,
  ...SETS_PYRAMINX_RESEARCH,
};

const PUNTAS_INTRO =
  "Las puntas son las cuatro piezas pequeñas de los vértices y giran solas, sin mover nada más (u, l, r y b). Gira cada una hasta que sus tres colores coincidan con los del centro que tiene debajo. Como los giros grandes se las llevan con su centro, una vez puestas ya no se estropean: por eso se hacen al principio.";

/** The Top First methods' last edge of the block, before L3E (Keyhole, L4E intuitivo). */
const BACK_EDGE_INTRO =
  "Falta la arista roja-azul, la de arriba detrás, que cierra el bloque. Antes de buscarla, gira U hasta que el centro de arriba coincida con los demás. Luego mira dónde está esa arista (en uno de los tres lados de la cara verde, o ya en su sitio pero dada la vuelta) y usa su caso: la sube sin tocar los centros ni las aristas roja-amarilla y azul-amarilla.";

/** The Top First methods' first two edges of the block (1-Flip, WO): the V's cases. */
const BLOCK_INTRO = (method: string, rest: string) =>
  `${method} es un método Top First: primero se hace el bloque de una punta, aquí la de detrás, que es su centro con sus tres aristas. ${rest} En este paso se colocan dos de ellas, la roja-amarilla (abajo a la izquierda) y la azul-amarilla (abajo a la derecha), casi siempre con intuición; estos casos ponen la segunda.`;

const THIRD_EDGE_INTRO =
  "Falta la arista roja-azul, la de arriba detrás. Los centros de delante todavía no importan, así que bastan muy pocos giros: mira dónde está (en uno de los tres lados de la cara verde, o ya en su sitio) y usa su caso.";

export interface LearningStep {
  setId: AlgorithmSetId;
  title: string;
  /** What the step is about, shown above its cases (when the source has no cases of its own). */
  intro?: string;
}

/**
 * The "Pasos de aprendizaje" block of each method, in order. To add a
 * step: put its source in docs/source, create `<step>-cases.ts` with
 * buildCases(), register it in ALGORITHM_SETS and add one line here.
 */
export const METHOD_STEPS: Record<LearningMethodId, LearningStep[]> = {
  cfop: [
    { setId: "cruz", title: "Cruz" },
    { setId: "esquinas", title: "Esquinas" },
  ],
  ortega: [
    {
      setId: "primera-cara",
      title: "Primera cara",
      intro:
        "Haz una cara de un solo color abajo; aquí, la blanca. Es el primer paso de Ortega y se hace con intuición: los otros colores de esas esquinas no tienen que coincidir, porque la PBL los coloca al final. Busca una esquina con blanco que esté arriba y gira U hasta dejarla justo encima de su hueco, delante a la derecha. Luego mira hacia dónde apunta su pegatina blanca y usa el caso que toque. Repite con las cuatro esquinas.",
    },
  ],
  cll: [
    {
      setId: "primera-capa",
      title: "Primera capa",
      intro:
        "Haz la capa de abajo completa; aquí, la blanca. Tiene que tener las cuatro esquinas con el blanco abajo y, además, con sus otros colores coincidiendo en cada lado. Así la CLL puede resolver toda la capa de arriba de una vez. Coloca las esquinas de una en una: gira U hasta dejar la esquina encima de su hueco, delante a la derecha, y usa el caso según hacia dónde mire su pegatina blanca.",
    },
  ],
  "por-capas": [
    { setId: "pyra-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "pyra-centros",
      title: "Centros",
      intro:
        "Cada centro es la pieza de tres colores que hay bajo cada punta, y gira con su capa grande (U, L, R o B). Elige el color de abajo, aquí el amarillo, y gira L, R y B hasta que los tres centros de abajo tengan el amarillo abajo. Así cada cara de los lados queda con su color en los centros.",
    },
    {
      setId: "pyra-primera-capa",
      title: "Primera capa",
      intro:
        "Coloca las tres aristas de abajo: con el amarillo abajo y el otro color igual que los centros de su lado. Las dos primeras se ponen con intuición. Para la última, sujeta el Pyraminx con su hueco delante y abajo, busca su arista en la capa de arriba y usa el caso que toque según dónde esté y hacia dónde mire el amarillo.",
    },
  ],
  keyhole: [
    { setId: "keyhole-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "keyhole-bloque",
      title: "Bloque de detrás",
      intro:
        "Keyhole es un método Top First: primero se hace el bloque de una punta, aquí la de detrás, que es su centro con sus tres aristas. En este paso se colocan dos de ellas, la roja-amarilla (abajo a la izquierda) y la azul-amarilla (abajo a la derecha), casi siempre con intuición; estos casos ponen la segunda. La tercera, la de arriba detrás, se deja sin hacer: ese hueco libre es el «keyhole» con el que se arreglan los centros.",
    },
    {
      setId: "keyhole-centros",
      title: "Centros",
      intro:
        "Con el hueco de arriba detrás libre, los centros de delante se pueden girar sin romper el bloque. Fw gira la cara verde entera (todo menos el bloque de detrás) y U gira la capa de arriba. Fw sube el centro de la izquierda a la posición de arriba, U lo gira y Fw' lo devuelve; para el de la derecha es al revés: Fw', U y Fw. Arregla así el de la izquierda y el de la derecha, y deja para el final el de arriba, que se pone solo con U.",
    },
    { setId: "keyhole-arista", title: "Arista del hueco", intro: BACK_EDGE_INTRO },
  ],
  "l4e-intuitivo": [
    { setId: "l4ei-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "l4ei-v",
      title: "V",
      intro:
        "La misma V que en L4E: los tres centros de abajo con el amarillo abajo y las dos aristas de abajo de detrás, la roja-amarilla y la azul-amarilla. La primera arista se pone con intuición y la segunda con uno de estos casos.",
    },
    {
      setId: "l4ei-arista",
      title: "Arista de arriba",
      intro: `En vez de los algoritmos de L4E, aquí se coloca primero una de las cuatro aristas que faltan y las otras tres se resuelven después con un ciclo, en L3E. ${BACK_EDGE_INTRO}`,
    },
  ],
  "1-flip": [
    { setId: "1flip-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "1flip-bloque",
      title: "Bloque de detrás",
      intro: BLOCK_INTRO(
        "1-Flip",
        "Su truco es dejar una de esas aristas dada la vuelta a propósito: un solo algoritmo arregla después los tres centros de delante y esa arista a la vez.",
      ),
    },
    {
      setId: "1flip-arista",
      title: "Arista volteada",
      intro: `${THIRD_EDGE_INTRO} Aquí va en su sitio pero dada la vuelta, con el rojo hacia la derecha: el algoritmo de L3C la girará junto con los centros.`,
    },
  ],
  wo: [
    { setId: "wo-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "wo-bloque",
      title: "Bloque de detrás",
      intro: BLOCK_INTRO(
        "WO (de Wedel y Odder, sus autores)",
        "Después, un solo algoritmo arregla los tres centros de delante sin romperlo.",
      ),
    },
    { setId: "wo-arista", title: "Tercera arista", intro: `${THIRD_EDGE_INTRO} Al terminar, el bloque de detrás está entero.` },
  ],
  l4e: [
    { setId: "l4e-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "l4e-v",
      title: "V",
      intro:
        "La V son los tres centros de abajo con las dos aristas de abajo de detrás (la de la izquierda y la de la derecha): vistas desde abajo forman una V. Pon los centros con el amarillo abajo, luego la primera arista con intuición y la segunda con uno de estos casos, con la V detrás. La arista de abajo delante se deja libre: la coloca L4E junto con las tres de arriba.",
    },
  ],
};

/** The 3×3 (CFOP) learning steps. */
export const LEARNING_STEPS = METHOD_STEPS.cfop;

/** Which method teaches each set. */
const SET_METHOD: Record<AlgorithmSetId, LearningMethodId> = {
  cruz: "cfop",
  esquinas: "cfop",
  f2l: "cfop",
  oll: "cfop",
  pll: "cfop",
  "primera-cara": "ortega",
  "primera-capa": "cll",
  "ortega-oll": "ortega",
  "ortega-pbl": "ortega",
  cll: "cll",
  "pyra-puntas": "por-capas",
  "pyra-centros": "por-capas",
  "pyra-primera-capa": "por-capas",
  "pyra-ultima-capa": "por-capas",
  "l4e-puntas": "l4e",
  "l4e-v": "l4e",
  l4e: "l4e",
  "keyhole-puntas": "keyhole",
  "keyhole-bloque": "keyhole",
  "keyhole-centros": "keyhole",
  "keyhole-arista": "keyhole",
  "keyhole-l3e": "keyhole",
  "l4ei-puntas": "l4e-intuitivo",
  "l4ei-v": "l4e-intuitivo",
  "l4ei-arista": "l4e-intuitivo",
  "l4ei-l3e": "l4e-intuitivo",
  "1flip-puntas": "1-flip",
  "1flip-bloque": "1-flip",
  "1flip-arista": "1-flip",
  "1flip-l3c": "1-flip",
  "1flip-l3e": "1-flip",
  "wo-puntas": "wo",
  "wo-bloque": "wo",
  "wo-arista": "wo",
  "wo-l3c": "wo",
  "wo-l3e": "wo",
};

export interface SetInfo {
  /** The method whose Aprender screen lists this set. */
  method: LearningMethodId;
  /** The Aprender block that lists this set. */
  categoryId: LearningCategoryId;
  /** "F2L (CFOP)", or "Paso 1 · Cruz" for a learning step. */
  title: string;
  accent: string;
}

export function getSetInfo(setId: AlgorithmSetId): SetInfo {
  const method = SET_METHOD[setId];
  const steps = METHOD_STEPS[method];
  const stepIndex = steps.findIndex((step) => step.setId === setId);
  if (stepIndex !== -1) {
    return {
      method,
      categoryId: "steps",
      title: `Paso ${stepIndex + 1} · ${steps[stepIndex].title}`,
      accent: getCategory("steps", method).accent,
    };
  }
  const category = getCategory(setId as LearningCategoryId, method);
  return { method, categoryId: category.id, title: category.title, accent: category.accent };
}

export function isAlgorithmSetId(id: string): id is AlgorithmSetId {
  return id in ALGORITHM_SETS;
}

export function getCase(setId: AlgorithmSetId, caseId: string): AlgorithmCase | undefined {
  return ALGORITHM_SETS[setId].find((algorithmCase) => algorithmCase.id === caseId);
}
