import { queryMSSQL } from '@/lib/db/mssql'

/**
 * The data behind a batch card set.
 *
 * One card is produced for the customer part and one for every manufactured
 * item beneath it, so the set runs highest level first. For each card we need
 * the header (customer, part, description, revision, BOM and route names) plus
 * the route steps with their instructions and parameters — the same shape the
 * Daily Plan renders, which is why the TTYPE handling matches it.
 *
 * TTYPE on DATA0038, as evidenced by the queries already running in the app:
 *   2  work-order route          SOURCE_PTR = DATA0006.RKEY  (Daily Plan)
 *   3  inventory-part route      SOURCE_PTR = DATA0017.RKEY  (related parts)
 *   4  released customer part    SOURCE_PTR = DATA0050.RKEY  (Products route)
 *   1  not used anywhere yet — presumed engineering/unreleased
 */

export type RouteStep = {
  step: number
  dept: string
  deptCode: string
  instructions: string[]
  params: { name: string; value: string }[]
}

export type BomLine = {
  partNumber: string
  description: string
  unit: string
  requiredPer: string
  qtyRequired: string
  isManufactured: boolean
}

export type CardData = {
  level: number
  /** Customer part number for the top card, INV_PART_NUMBER below it. */
  partNumber: string
  description: string
  revision: string
  customerCode: string
  customerName: string
  bomNumber: string
  bomDescription: string
  routeName: string
  productCode: string
  catalogNumber: string
  bom: BomLine[]
  route: RouteStep[]
  notes: string[]
}

const clean = (v: any) => String(v ?? '').trim()

/** Header for the top-level customer part. */
// Only columns proven by the existing Products/Daily Plan queries. The BOM
// header's identity comes from its inventory part (DATA0025 -> DATA0017), which
// is how the Products BOM tab resolves it — DATA0025 has no BOM_NAME, and
// DATA0037 has no ROUTE_NAME.
const HEADER_SQL = `
  SELECT TOP 1
    d50.RKEY,
    d50.CUSTOMER_PART_NUMBER, d50.CUSTOMER_PART_DESC, d50.CP_REV,
    d50.CATALOG_NUMBER, d50.BOM_PTR,
    d10.CUST_CODE, d10.CUSTOMER_NAME,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS BOM_PART,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS BOM_DESC
  FROM DATA0050 d50 WITH (NOLOCK)
  LEFT JOIN DATA0010 d10 WITH (NOLOCK) ON d10.RKEY = d50.CUSTOMER_PTR
  LEFT JOIN DATA0025 d25 WITH (NOLOCK) ON d25.RKEY = d50.BOM_PTR
  LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d25.INVENTORY_PTR
  -- The stored number carries a status suffix ("12807 INPROCESS"), so an exact
  -- match finds nothing. A bare LIKE '12807%' is wrong too — it would also
  -- match 128070, a different part, and pick it when the plain number doesn't
  -- exist. So: the exact number, or the number followed by a space.
  WHERE LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) = @exact
     OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) LIKE @withSuffix
  ORDER BY LEN(LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER))), d50.CUSTOMER_PART_NUMBER`

/** Components directly under a BOM header. */
const BOM_SQL = `
  SELECT
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS partNumber,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS description,
    LTRIM(RTRIM(d17.P_M))                  AS pm,
    d17.RKEY                                AS rkey,
    d26.QTY_BOM
  FROM DATA0025 d25 WITH (NOLOCK)
  JOIN DATA0026 d26 WITH (NOLOCK) ON d26.PARENT_NODE_INVENT = d25.RKEY
  JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d26.INVENTORY_PTR
  WHERE d25.RKEY = @bomPtr
  ORDER BY d17.INV_PART_NUMBER`

/**
 * Route steps with instructions and parameters.
 * @sourcePtr is the DATA0050 RKEY for a customer part, or the DATA0017 RKEY for
 * a manufactured component; @ttype selects which route.
 */
const ROUTE_SQL = `
  SELECT
    d38.STEP_NUMBER,
    RTRIM(d34.DEPT_NAME) AS deptName,
    RTRIM(d34.DEPT_CODE) AS deptCode,
    -- instruction text, same shape the Daily Plan uses
    LTRIM(RTRIM(
      ISNULL(i1.PROD_ROUT_INST_1,'') + ' ' + ISNULL(i1.PROD_ROUT_INST_2,'') + ' ' +
      ISNULL(i1.PROD_ROUT_INST_3,'') + ' ' + ISNULL(i1.PROD_ROUT_INST_4,'')
    )) AS instructionText,
    (
      ISNULL(RTRIM(i1.INST_CODE),'') +
      CASE WHEN i2.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i2.INST_CODE) ELSE '' END +
      CASE WHEN i3.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i3.INST_CODE) ELSE '' END +
      CASE WHEN i4.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i4.INST_CODE) ELSE '' END +
      CASE WHEN i5.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i5.INST_CODE) ELSE '' END
    ) AS instructionCodes,
    -- inline parameter values
    STUFF(
      CASE WHEN LTRIM(RTRIM(d38.PARAMETER_1))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_1)) ELSE '' END +
      CASE WHEN LTRIM(RTRIM(d38.PARAMETER_2))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_2)) ELSE '' END +
      CASE WHEN LTRIM(RTRIM(d38.PARAMETER_3))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_3)) ELSE '' END +
      CASE WHEN LTRIM(RTRIM(d38.PARAMETER_4))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_4)) ELSE '' END +
      CASE WHEN LTRIM(RTRIM(d38.PARAMETER_5))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_5)) ELSE '' END,
      1, 3, '') AS parameterValues,
    -- parameter names from the DATA0035 definitions
    STUFF(
      CASE WHEN p1.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p1.PRODUCTION_PARAMETER) ELSE '' END +
      CASE WHEN p2.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p2.PRODUCTION_PARAMETER) ELSE '' END +
      CASE WHEN p3.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p3.PRODUCTION_PARAMETER) ELSE '' END +
      CASE WHEN p4.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p4.PRODUCTION_PARAMETER) ELSE '' END +
      CASE WHEN p5.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p5.PRODUCTION_PARAMETER) ELSE '' END,
      1, 3, '') AS parameterNames,
    -- additional route step parameters (DATA0471 values -> DATA0469 defs)
    STUFF((
      SELECT '; ' +
        LTRIM(RTRIM(ISNULL(d469.PARAMETER_DESC, d469.PARAMETER_CODE))) + ': ' +
        LTRIM(RTRIM(ISNULL(CAST(d471.PARAMETER_VALUE AS NVARCHAR(MAX)), '')))
      FROM DATA0471 d471 WITH (NOLOCK)
      INNER JOIN DATA0469 d469 WITH (NOLOCK) ON d469.RKEY = d471.DATA0469_PTR
      WHERE d471.DATA0038_PTR = d38.RKEY
      ORDER BY d471.SEQUENCE_NO
      FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS extParameters
  FROM DATA0038 d38 WITH (NOLOCK)
  LEFT JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d38.DEPT_PTR
  LEFT JOIN DATA0036 i1 WITH (NOLOCK) ON i1.RKEY = d38.DEF_ROUT_INST_1_PTR
  LEFT JOIN DATA0036 i2 WITH (NOLOCK) ON i2.RKEY = d38.DEF_ROUT_INST_2_PTR
  LEFT JOIN DATA0036 i3 WITH (NOLOCK) ON i3.RKEY = d38.DEF_ROUT_INST_3_PTR
  LEFT JOIN DATA0036 i4 WITH (NOLOCK) ON i4.RKEY = d38.DEF_ROUT_INST_4_PTR
  LEFT JOIN DATA0036 i5 WITH (NOLOCK) ON i5.RKEY = d38.DEF_ROUT_INST_5_PTR
  LEFT JOIN DATA0035 p1 WITH (NOLOCK) ON p1.RKEY = d38.DEF_ROUT_PARA_1_PTR
  LEFT JOIN DATA0035 p2 WITH (NOLOCK) ON p2.RKEY = d38.DEF_ROUT_PARA_2_PTR
  LEFT JOIN DATA0035 p3 WITH (NOLOCK) ON p3.RKEY = d38.DEF_ROUT_PARA_3_PTR
  LEFT JOIN DATA0035 p4 WITH (NOLOCK) ON p4.RKEY = d38.DEF_ROUT_PARA_4_PTR
  LEFT JOIN DATA0035 p5 WITH (NOLOCK) ON p5.RKEY = d38.DEF_ROUT_PARA_5_PTR
  WHERE d38.SOURCE_PTR = @sourcePtr AND d38.TTYPE = @ttype
  ORDER BY d38.STEP_NUMBER`

/** Notepad / discrepancy text for a customer part. */
const NOTES_SQL = `
  SELECT LTRIM(RTRIM(d211.NOTEPAD_TEXT)) AS text
  FROM DATA0211 d211 WITH (NOLOCK)
  WHERE d211.SOURCE_POINTER = @rkey AND d211.SOURCE_TYPE = 1
  ORDER BY d211.SEQUENCE_NUMBER`

async function loadRoute(sourcePtr: number, ttype: number): Promise<RouteStep[]> {
  const rows = await queryMSSQL<any[]>('1', ROUTE_SQL, { sourcePtr, ttype }).catch(() => [])
  return (rows || []).map(r => {
    // Names and values are pipe-joined in matching order.
    const names = clean(r.parameterNames).split('|').map(clean).filter(Boolean)
    const values = clean(r.parameterValues).split('|').map(clean).filter(Boolean)
    const params = names.map((name, i) => ({ name, value: values[i] ?? '' }))
    // Additional step parameters arrive pre-formatted as "name: value" pairs.
    for (const extra of clean(r.extParameters).split(';').map(clean).filter(Boolean)) {
      const [name, ...rest] = extra.split(':')
      params.push({ name: clean(name), value: clean(rest.join(':')) })
    }
    const instructions: string[] = []
    if (clean(r.instructionText)) instructions.push(clean(r.instructionText))
    if (clean(r.instructionCodes)) instructions.push(clean(r.instructionCodes))
    return {
      step: Number(r.STEP_NUMBER) || 0,
      dept: clean(r.deptName),
      deptCode: clean(r.deptCode),
      instructions,
      params,
    }
  })
}

/**
 * Build the full card set for a customer part: the part itself, then every
 * manufactured component beneath it, depth-first so the order runs highest
 * level to lowest. A visited set stops a self-referencing BOM looping.
 */
export async function buildCardSet(customerPart: string): Promise<CardData[]> {
  const part = String(customerPart ?? '').trim()
  const head = await queryMSSQL<any[]>('1', HEADER_SQL, {
    exact: part,
    withSuffix: `${part} %`,
  })
  if (!head?.length) return []
  const h = head[0]

  const cards: CardData[] = []
  const visited = new Set<string>()

  const bomLines = async (bomPtr: number): Promise<{ lines: BomLine[]; children: any[] }> => {
    if (!bomPtr) return { lines: [], children: [] }
    const rows = await queryMSSQL<any[]>('1', BOM_SQL, { bomPtr }).catch(() => [])
    const lines: BomLine[] = []
    const children: any[] = []
    for (const r of rows || []) {
      const isM = clean(r.pm).toUpperCase() === 'M'
      lines.push({
        partNumber: clean(r.partNumber),
        description: clean(r.description),
        unit: 'PART',
        requiredPer: `${Number(r.QTY_BOM ?? 0).toFixed(6)}/PART`,
        qtyRequired: Number(r.QTY_BOM ?? 0).toFixed(6),
        isManufactured: isM,
      })
      if (isM) children.push(r)
    }
    return { lines, children }
  }

  // Top card — the customer part.
  const topBom = await bomLines(Number(h.BOM_PTR))
  // TTYPE 4 is the released customer-part route.
  const topRoute = await loadRoute(Number(h.RKEY ?? 0), 4)
  const notes = await queryMSSQL<any[]>('1', NOTES_SQL, { rkey: Number(h.RKEY ?? 0) }).catch(() => [])
  cards.push({
    level: 0,
    partNumber: clean(h.CUSTOMER_PART_NUMBER),
    description: clean(h.CUSTOMER_PART_DESC),
    revision: clean(h.CP_REV) || '-',
    customerCode: clean(h.CUST_CODE),
    customerName: clean(h.CUSTOMER_NAME),
    bomNumber: clean(h.BOM_PART),
    bomDescription: clean(h.BOM_DESC),
    routeName: topRoute[0] ? `${topRoute[0].deptCode} ${topRoute[0].dept}`.trim() : '',
    productCode: '',
    catalogNumber: clean(h.CATALOG_NUMBER),
    bom: topBom.lines,
    route: topRoute,
    notes: (notes || []).map(n => clean(n.text)).filter(Boolean),
  })

  // Manufactured components, depth-first.
  const walk = async (rows: any[], level: number) => {
    if (level > 10) return
    for (const r of rows) {
      const pn = clean(r.partNumber)
      if (!pn || visited.has(pn)) continue
      visited.add(pn)

      // A manufactured item's BOM hangs off its inventory record.
      const own = await queryMSSQL<any[]>('1',
        `SELECT TOP 1 d25.RKEY AS bomPtr
         FROM DATA0025 d25 WITH (NOLOCK) WHERE d25.INVENTORY_PTR = @rkey`,
        { rkey: Number(r.rkey) }).catch(() => [])
      const bomPtr = Number(own?.[0]?.bomPtr ?? 0)
      const sub = await bomLines(bomPtr)

      cards.push({
        level,
        partNumber: pn,
        description: clean(r.description),
        revision: '-',
        customerCode: clean(h.CUST_CODE),
        customerName: clean(h.CUSTOMER_NAME),
        bomNumber: pn,
        bomDescription: clean(r.description),
        routeName: '',
        productCode: '',
        catalogNumber: clean(h.CATALOG_NUMBER),
        bom: sub.lines,
        // TTYPE 3 is the inventory-part route, keyed on DATA0017.RKEY — the
        // same join the Standards "related parts" query uses. TTYPE 1 (my
        // earlier guess) returns nothing, which is why these came out blank.
        route: await loadRoute(Number(r.rkey), 3),
        notes: [],
      })
      await walk(sub.children, level + 1)
    }
  }
  await walk(topBom.children, 1)

  return cards
}
