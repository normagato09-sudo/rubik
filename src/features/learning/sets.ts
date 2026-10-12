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
import { SETS_3X3_RESEARCH } from "./cases-3x3-research";
import { SETS_ROUX } from "./cases-roux";
import { SETS_2X2_RESEARCH } from "./cases-2x2-research";
import { SETS_PYRAMINX_RESEARCH } from "./cases-pyraminx-research";
import { SETS_SKEWB } from "./cases-skewb";
import { SETS_4X4 } from "./cases-4x4";
import { SETS_CFOP_4X4 } from "./cases-4x4-cfop";
import { getCategory, isLearningCategoryId, type LearningCategoryId, type LearningMethodId } from "./categories";
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
  ...SETS_3X3_RESEARCH,
  ...SETS_ROUX,
  ...SETS_2X2_RESEARCH,
  ...SETS_SKEWB,
  ...SETS_4X4,
  ...SETS_CFOP_4X4,
};

const PUNTAS_INTRO =
  "Las puntas son las cuatro piezas pequeñas de los vértices y giran solas, sin mover nada más (u, l, r y b). Gira cada una hasta que sus tres colores coincidan con los del centro que tiene debajo. Como los giros grandes se las llevan con su centro, una vez puestas ya no se estropean: por eso se hacen al principio.";

/** The Skewb's first side, the same in its three methods. */
const SKEWB_FIRST_SIDE_INTRO =
  "Empieza por la cara blanca: su centro y las cuatro esquinas que lo rodean, con sus otros colores coincidiendo entre ellas en cada lado (así queda hecha la primera capa). Se hace con intuición: pon el centro y las primeras esquinas mirando dónde van. La última suele ser la difícil, porque meterla saca otra; estos dos casos la colocan con la cara blanca abajo y su hueco abajo delante.";

/** The 4×4's first two centers (Reducción and Freeslice build them first; Hoya and Yau only these two). */
const FIRST_CENTERS_4X4 = (rest: string) =>
  `El 4×4 no tiene centros fijos: cada centro son cuatro piezas que hay que juntar. Primero el blanco, que se hace arriba, donde se ve: busca piezas blancas, júntalas de dos en dos en barras y sube cada barra con una capa de dentro (r o l). Luego gira el cubo (x2) para dejar el blanco abajo y haz el amarillo arriba igual, con cuidado de bajar y subir siempre la misma capa para no romper el blanco. ${rest}`;
const LAST_CENTERS_4X4 = (keep: string) =>
  `Con el blanco a la izquierda y el amarillo a la derecha (gira el cubo con z), quedan los cuatro centros de alrededor. Cada uno se hace igual: junta una barra, ponla debajo del hueco y súbela con r, que no toca los centros de los lados. Para los dos últimos basta un algoritmo, según estén sus barras en caras vecinas u opuestas. ${keep}En los diagramas, en color, las piezas que importan.`;
const PAIR_INTRO =
  "Una arista del 4×4 son dos piezas iguales que hay que juntar. Con los centros hechos, pon una de ellas delante a la derecha y busca su pareja: los casos dependen de si están a la misma altura (enseñando el mismo color hacia ti) o no. Uw y Dw mueven dos capas y luego vuelven, así que los centros quedan como estaban; R U R' F R' F' R guarda la arista hecha y saca otra. Los diagramas muestran la cara de delante abierta, con las dos piezas en color.";
const LAST_TWO_INTRO =
  "Las dos últimas aristas se emparejan a la vez: pon sus cuatro piezas delante a la izquierda y delante a la derecha. El motor de RUBIKO cuenta 24 formas de tenerlas: 8 ya están emparejadas y las otras 16 son solo estos dos casos, con las piezas de cada arista a la misma altura o no.";
const FREESLICE_INTRO =
  "Freeslice empareja las primeras ocho aristas en la capa de arriba y en la de abajo con el corte de abajo (d) girado: los centros de los lados se rompen un momento, pero solo en esa fila. Pon la pieza que quieres delante a la derecha, arriba, y busca su pareja en la fila de d: con d, d' o d2 la juntas debajo, y R U R' la guarda arriba y baja otra. Al acabar, vuelve d a su sitio.";
const CROSS_4X4_INTRO = (method: string, rest: string) =>
  `En ${method} la cruz blanca se hace antes de terminar los centros: como los cuatro centros de los lados aún no importan, las capas de dentro (u y d) se pueden girar libremente para juntar las dos piezas de cada arista. Con el blanco abajo, pon las piezas de la arista blanca-verde a la misma altura, júntalas con u o d y bájalas con F. ${rest}`;
const SIDE_EDGES_INTRO =
  "Quedan ocho aristas y la cruz está hecha, a la izquierda (gira el cubo con z). Se emparejan con el 3-2-3 de la Speedsolving Wiki: Uw o Dw aparta una pieza, R U R' (o R2) trae su pareja a la misma arista y Uw' o Dw las junta y devuelve los centros y la cruz. Los diagramas miran desde delante, con las dos piezas en color.";

/** The Top First methods' last edge of the block, before L3E (Keyhole, L4E intuitivo). */
const BACK_EDGE_INTRO =
  "Falta la arista roja-azul, la de arriba detrás, que cierra el bloque. Antes de buscarla, gira U hasta que el centro de arriba coincida con los demás. Luego mira dónde está esa arista (en uno de los tres lados de la cara verde, o ya en su sitio pero dada la vuelta) y usa su caso: la sube sin tocar los centros ni las aristas roja-amarilla y azul-amarilla.";

/** The Top First methods' first two edges of the block (1-Flip, WO): the V's cases. */
const BLOCK_INTRO = (method: string, rest: string) =>
  `${method} es un método Top First: primero se hace el bloque de una punta, aquí la de detrás, que es su centro con sus tres aristas. ${rest} En este paso se colocan dos de ellas, la roja-amarilla (abajo a la izquierda) y la azul-amarilla (abajo a la derecha), casi siempre con intuición; estos casos ponen la segunda.`;

const THIRD_EDGE_INTRO =
  "Falta la arista roja-azul, la de arriba detrás. Los centros de delante todavía no importan, así que bastan muy pocos giros: mira dónde está (en uno de los tres lados de la cara verde, o ya en su sitio) y usa su caso.";

const PETRUS_222_INTRO =
  "Petrus empieza con un bloque de 2×2×2: una esquina con sus tres aristas y sus tres centros. Se puede hacer en cualquier esquina; aquí, con el amarillo arriba y el verde delante, es el de abajo delante a la izquierda, el de la esquina blanca-verde-roja. Se hace con intuición: coloca primero las aristas blanca-roja y blanca-verde junto a sus centros, y luego junta la esquina con la arista verde-roja y métela en su hueco, como en F2L. Estos casos son esa última pareja, con U, L y F. Los diagramas miran el cubo desde delante a la izquierda, con las piezas del bloque en color.";

const PETRUS_223_INTRO =
  "Ahora el bloque crece hacia atrás hasta ocupar la parte izquierda de las dos primeras capas. Faltan la arista blanca-azul (abajo detrás), la esquina blanca-azul-roja y la arista azul-roja (detrás a la izquierda). Usa solo U, B y R, que no tocan el bloque 2×2×2: primero la arista blanca-azul y luego la pareja. Los diagramas miran el cubo desde detrás a la izquierda.";

const PETRUS_EO_INTRO =
  "Quedan 7 aristas libres: las 4 de arriba y las 3 de la derecha. Cada una es buena o mala. Mira su pegatina amarilla o blanca (si no tiene, la verde o la azul): la arista es buena si esa pegatina mira arriba o abajo, o si la arista está en la capa del medio y la pegatina mira hacia delante o hacia atrás. Si no, es mala. R y U nunca cambian si una arista es buena o mala; un cuarto de vuelta de F da la vuelta a las cuatro aristas de su capa. Siempre hay 0, 2, 4 o 6 malas: llévalas con R y U a las posiciones de un caso y usa su algoritmo; con 6, arregla primero 2 y luego las otras 4. Los diagramas miran desde delante a la derecha, con solo las 7 aristas en color.";

const PETRUS_F2L_INTRO =
  "Con las aristas orientadas, el lado derecho de las dos primeras capas se termina solo con R y U. Así nunca se estropean el bloque ni la orientación, y al acabar las aristas de arriba ya tienen el amarillo arriba. Primero la arista blanca-naranja (abajo a la derecha), luego la pareja de detrás (la esquina blanca-azul-naranja con la arista azul-naranja) y por último la de delante (la esquina blanca-verde-naranja con la arista verde-naranja). Los diagramas miran desde delante a la derecha.";

const ZZ_EO_INTRO =
  "ZZ empieza orientando las 12 aristas a la vez. Una arista es buena o mala: mira su pegatina amarilla o blanca (si no tiene, la verde o la azul). Es buena si esa pegatina mira arriba o abajo, o si la arista está en la capa del medio y la pegatina mira hacia delante o hacia atrás; si no, es mala. R, L, U y D nunca cambian si una arista es buena o mala, y un cuarto de vuelta de F o de B da la vuelta a las cuatro aristas de su capa. Siempre hay un número par de malas: con R, L, U y D junta cuatro en la capa F (o en la B) y gira F (o B), y repite hasta que no quede ninguna. Los diagramas miran desde delante a la derecha, con las aristas en color.";

const ZZ_LINE_INTRO =
  "La línea son las aristas blanca-verde (abajo delante) y blanca-azul (abajo detrás), con el centro blanco entre ellas. Con las aristas ya orientadas, colócalas sin cuartos de vuelta de F ni de B: con R, L, U, D, F2 y B2, que no cambian la orientación. Con la EO, es el paso EOLine. Estos casos ponen la blanca-verde, con la blanca-azul ya en su sitio. Los diagramas miran desde delante a la derecha.";

const ZZ_F2L_INTRO =
  "Con la EOLine hecha, las dos primeras capas se terminan solo con L, U y R, sin girar el cubo. Primero el bloque de la izquierda, con L y U: la arista blanca-roja, luego la pareja de detrás (la esquina blanca-azul-roja con la arista azul-roja) y la de delante (la blanca-verde-roja con la verde-roja). Después, el de la derecha con R y U, igual pero en espejo. Al acabar, las aristas de arriba ya tienen el amarillo arriba. Los diagramas miran desde el lado en que se trabaja.";

const ROUX_FIRST_BLOCK_INTRO =
  "Roux empieza con dos bloques de 1×2×3, uno a cada lado, y deja libre la capa del medio (M). El primero es el de la izquierda: el centro rojo con la arista blanca-roja (abajo a la izquierda) y las dos parejas de esquina y arista, la de detrás (blanca-azul-roja con azul-roja) y la de delante (blanca-verde-roja con verde-roja). Se hace con intuición y se puede empezar por cualquier lado; estos casos usan L, U, F y B: primero la arista, luego la pareja de detrás y por último la de delante. Los diagramas miran desde delante a la izquierda, con las piezas del bloque en color.";

const ROUX_SECOND_BLOCK_INTRO =
  "El segundo bloque es el de la derecha, con el centro naranja, y se hace sin romper el primero: solo con R, U, M y r (R junto con la capa del medio). M sirve para sacar la arista blanca-naranja cuando está en la capa del medio. El centro blanco puede quedar girado: la capa M se arregla al final, en LSE. Primero la arista, luego la pareja de detrás y por último la de delante. Los diagramas miran desde delante a la derecha.";

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
  petrus: [
    { setId: "petrus-222", title: "Bloque 2×2×2", intro: PETRUS_222_INTRO },
    { setId: "petrus-223", title: "Bloque 2×2×3", intro: PETRUS_223_INTRO },
    { setId: "petrus-eo", title: "Orientación de aristas (EO)", intro: PETRUS_EO_INTRO },
    { setId: "petrus-f2l", title: "Resto de F2L con R y U", intro: PETRUS_F2L_INTRO },
  ],
  zz: [
    { setId: "zz-eo", title: "Orientación de aristas (EO)", intro: ZZ_EO_INTRO },
    { setId: "zz-linea", title: "Línea", intro: ZZ_LINE_INTRO },
    { setId: "zz-f2l", title: "F2L con L, U y R", intro: ZZ_F2L_INTRO },
  ],
  roux: [
    { setId: "roux-bloque1", title: "Primer bloque", intro: ROUX_FIRST_BLOCK_INTRO },
    { setId: "roux-bloque2", title: "Segundo bloque", intro: ROUX_SECOND_BLOCK_INTRO },
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
  eg: [
    {
      setId: "eg-cara",
      title: "Primera cara",
      intro:
        "EG empieza como Ortega: haz una cara de un solo color abajo, aquí la blanca, con intuición. Sus otros colores no tienen que coincidir: lo que haya quedado abajo decide qué usar después. Si la capa de abajo está bien, CLL; si tiene dos esquinas vecinas cambiadas, EG-1; si tiene dos en diagonal, EG-2. Cada caso resuelve el cubo entero de una vez. Estos son los tres casos básicos para colocar una esquina de la cara.",
    },
  ],
  leg: [
    {
      setId: "leg-cara",
      title: "Primera cara",
      intro:
        "LEG empieza como Ortega: haz una cara de un solo color abajo, aquí la blanca, con intuición. Si la capa de abajo queda con dos esquinas vecinas cambiadas, sujeta el cubo con la barra (el lado con sus dos pegatinas de abajo iguales) a la izquierda y usa LEG-1, que resuelve el cubo entero de una vez. Estos son los tres casos básicos para colocar una esquina de la cara.",
    },
  ],
  tcll: [
    {
      setId: "tcll-capa",
      title: "Primera capa",
      intro:
        "TCLL empieza como CLL: haz la capa de abajo, aquí la blanca, con sus colores coincidiendo en cada lado. La diferencia es que la última esquina puede quedar en su sitio pero girada: en vez de arreglarla, ponla delante a la derecha y usa TCLL+ (blanco hacia ti) o TCLL− (blanco a la derecha), que la giran y resuelven el cubo entero a la vez. Si no queda girada, usa la CLL. Estos son los casos básicos para colocar una esquina de la capa.",
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
  oka: [
    { setId: "oka-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "oka-arista",
      title: "Arista Oka",
      intro:
        "Oka es un método Top First: primero se hace el bloque de una punta, aquí la de detrás, que es su centro con sus tres aristas. Empieza con una de ellas, la azul-amarilla (abajo a la derecha), con intuición. Luego viene su truco: la arista roja-azul, la «arista Oka», no va a su sitio sino abajo a la izquierda, en el de la roja-amarilla. Así el sitio de arriba detrás queda libre, como en Keyhole, y la última arista entra después a la vez que la Oka sube. Los centros de delante todavía no importan: mira dónde está la arista Oka y usa su caso. (También vale el espejo: la roja-amarilla bien y la arista Oka abajo a la derecha; el cierre del bloque trae los casos de los dos lados.)",
    },
    {
      setId: "oka-centros",
      title: "Centros",
      intro:
        "Los centros de delante se arreglan igual que en Keyhole, con el hueco de arriba detrás libre. Fw gira la cara verde entera (todo menos el bloque de detrás) y U gira la capa de arriba. Fw sube el centro de la izquierda a la posición de arriba, U lo gira y Fw' lo devuelve; para el de la derecha es al revés: Fw', U y Fw. Arregla así el de la izquierda y el de la derecha, y deja para el final el de arriba, que se pone solo con U. Ninguno de estos giros mueve la arista Oka ni la azul-amarilla.",
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
  nutella: [
    { setId: "nutella-puntas", title: "Puntas", intro: PUNTAS_INTRO },
    {
      setId: "nutella-aristas",
      title: "Aristas cambiadas",
      intro:
        "Nutella es un método Top First: primero se hace el bloque de una punta, aquí la de detrás, que es su centro con sus tres aristas. Su truco es dejar dos de ellas cambiadas de sitio a propósito: un solo algoritmo arregla después los tres centros de delante y las cambia a la vez. Pon con intuición la roja-azul en su sitio (arriba detrás) y la azul-amarilla abajo a la izquierda, en el sitio de la roja-amarilla. Estos casos ponen la roja-amarilla abajo a la derecha, en el de la azul-amarilla. Los centros de delante todavía no importan.",
    },
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
  "skewb-capas": [
    { setId: "skc-primera-cara", title: "Cara blanca", intro: SKEWB_FIRST_SIDE_INTRO },
    {
      setId: "skc-esquinas",
      title: "Esquinas de arriba",
      intro:
        "Pon la cara blanca abajo. Las cuatro esquinas de arriba ya están en su sitio: solo hay que girarlas hasta que tengan el amarillo arriba. Si las cuatro están giradas es la forma Pi; si lo están dos opuestas, la Peanut. Si no ves ninguna de las dos, haz el sledgehammer (F' L F L') una vez desde cualquier lado y vuelve a mirar. El centro de arriba todavía no importa.",
    },
    {
      setId: "skc-centro",
      title: "Centro amarillo",
      intro:
        "Con las esquinas de arriba hechas, sube el centro amarillo. Si está en un lado, gira el Skewb entero con y hasta dejarlo detrás a la izquierda, como en el diagrama. Si está abajo no puede ser: la cara blanca estaría mal.",
    },
  ],
  "sarah-intermedio": [{ setId: "ski-primera-cara", title: "Cara blanca", intro: SKEWB_FIRST_SIDE_INTRO }],
  "sarah-avanzado": [{ setId: "ska-primera-cara", title: "Cara blanca", intro: SKEWB_FIRST_SIDE_INTRO }],
  reduccion: [
    { setId: "r4-centros", title: "Centros", intro: FIRST_CENTERS_4X4(LAST_CENTERS_4X4("")) },
    { setId: "r4-aristas", title: "Aristas", intro: `${PAIR_INTRO} ${LAST_TWO_INTRO}` },
    { setId: "c4-cruz", title: "Cruz" },
    { setId: "c4-esquinas", title: "Esquinas" },
  ],
  freeslice: [
    { setId: "fs4-centros", title: "Centros", intro: FIRST_CENTERS_4X4(LAST_CENTERS_4X4("")) },
    { setId: "fs4-aristas", title: "Ocho aristas con el corte libre", intro: FREESLICE_INTRO },
    { setId: "fs4-l4e", title: "Últimas aristas", intro: `Quedan las cuatro aristas del medio. Se emparejan como en Reducción, de dos en dos, sin estropear las de arriba y abajo. ${LAST_TWO_INTRO}` },
    { setId: "c4-cruz", title: "Cruz" },
    { setId: "c4-esquinas", title: "Esquinas" },
  ],
  hoya: [
    { setId: "hoya-centros", title: "Dos centros opuestos", intro: FIRST_CENTERS_4X4("Los otros cuatro centros esperan: primero va la cruz.") },
    { setId: "hoya-cruz", title: "Cruz", intro: CROSS_4X4_INTRO("Hoya", "Haz así las cuatro aristas de la cruz.") },
    { setId: "hoya-centros4", title: "Cuatro centros", intro: LAST_CENTERS_4X4("r no rompe la cruz, que está a la izquierda. ") },
    { setId: "hoya-aristas", title: "Resto de aristas", intro: SIDE_EDGES_INTRO },
  ],
  yau: [
    { setId: "yau-centros", title: "Dos centros opuestos", intro: FIRST_CENTERS_4X4("Los otros cuatro centros esperan: primero van tres aristas de la cruz.") },
    { setId: "yau-cruz3", title: "Tres aristas de la cruz", intro: CROSS_4X4_INTRO("Yau", "Haz así tres de las cuatro; la cuarta, la de delante, se deja para después de los centros.") },
    { setId: "yau-centros4", title: "Cuatro centros", intro: LAST_CENTERS_4X4("Con la cruz a la izquierda y su hueco delante, r no rompe sus tres aristas. ") },
    {
      setId: "yau-cruz4",
      title: "Última arista de la cruz",
      intro:
        "Con los seis centros hechos, la última arista de la cruz ya no se puede juntar con las capas de dentro sin romperlos. Se empareja como en Reducción (Uw' R U R' F R' F' R Uw), delante a la derecha, y F la baja a su sitio. Con el blanco abajo, los diagramas miran desde delante.",
    },
    { setId: "yau-aristas", title: "Resto de aristas", intro: SIDE_EDGES_INTRO },
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
  "oka-puntas": "oka",
  "oka-arista": "oka",
  "oka-centros": "oka",
  "oka-cierre": "oka",
  "oka-l3e": "oka",
  "nutella-puntas": "nutella",
  "nutella-aristas": "nutella",
  "nutella-l3c": "nutella",
  "nutella-l3e": "nutella",
  "petrus-222": "petrus",
  "petrus-223": "petrus",
  "petrus-eo": "petrus",
  "petrus-f2l": "petrus",
  "petrus-coll": "petrus",
  "petrus-epll": "petrus",
  "zz-eo": "zz",
  "zz-linea": "zz",
  "zz-f2l": "zz",
  "zz-ocll": "zz",
  "zz-pll": "zz",
  "roux-bloque1": "roux",
  "roux-bloque2": "roux",
  "roux-cmll": "roux",
  "roux-eo": "roux",
  "roux-ulur": "roux",
  "roux-capa-m": "roux",
  "eg-cara": "eg",
  "eg-cll": "eg",
  "eg-1": "eg",
  "eg-2": "eg",
  "leg-cara": "leg",
  "leg-1": "leg",
  "tcll-capa": "tcll",
  "tcll-cll": "tcll",
  "tcll-mas": "tcll",
  "tcll-menos": "tcll",
  "skc-primera-cara": "skewb-capas",
  "skc-esquinas": "skewb-capas",
  "skc-centro": "skewb-capas",
  "skc-centros": "skewb-capas",
  "ski-primera-cara": "sarah-intermedio",
  "ski-cara-arriba": "sarah-intermedio",
  "ski-centros": "sarah-intermedio",
  "ska-primera-cara": "sarah-avanzado",
  "ska-peanut": "sarah-avanzado",
  "ska-pi": "sarah-avanzado",
  "ska-l5c": "sarah-avanzado",
  "r4-centros": "reduccion",
  "r4-aristas": "reduccion",
  "r4-paridades": "reduccion",
  "fs4-centros": "freeslice",
  "fs4-aristas": "freeslice",
  "fs4-l4e": "freeslice",
  "fs4-paridades": "freeslice",
  "hoya-centros": "hoya",
  "hoya-cruz": "hoya",
  "hoya-centros4": "hoya",
  "hoya-aristas": "hoya",
  "hoya-paridades": "hoya",
  "yau-centros": "yau",
  "yau-cruz3": "yau",
  "yau-centros4": "yau",
  "yau-cruz4": "yau",
  "yau-aristas": "yau",
  "yau-paridades": "yau",
  // Shared by the four 4×4 methods: a case opened from one of them comes back to it (getSetInfo).
  "c4-cruz": "reduccion",
  "c4-esquinas": "reduccion",
  "c4-f2l": "reduccion",
  "c4-oll": "reduccion",
  "c4-pll": "reduccion",
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

/** Whether a method lists a set (as a step or as a block). */
export const methodListsSet = (method: LearningMethodId, setId: AlgorithmSetId) =>
  METHOD_STEPS[method].some((step) => step.setId === setId) || isLearningCategoryId(setId, method);

/**
 * Where a set is listed. A set several methods share (CFOP on the 4×4)
 * belongs to SET_METHOD's; `from` names the one it was opened from, so
 * its step number and the way back are that method's.
 */
export function getSetInfo(setId: AlgorithmSetId, from?: LearningMethodId): SetInfo {
  const method = from && methodListsSet(from, setId) ? from : SET_METHOD[setId];
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
