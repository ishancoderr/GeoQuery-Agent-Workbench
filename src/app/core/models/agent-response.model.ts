/**
 * Shapes mirror the real FastAPI responses in
 * Agent-001/agent1/controller/query_controller.py and Agent-002's mirror of it.
 * Shape is driven by which structural keys are present, not by query.type alone:
 * a relationship query (adjacency/direction/distance) with no attributes returns
 * the verdict/matches shape, but the same query.type WITH attributes falls through
 * into the data-table shape instead. See the type guards at the bottom.
 *
 * Token and record counts are relative to the agent that answered: `local` is
 * that agent itself, `peer` is the agent it asked over KQML.
 */

import { AnsweredBy } from './llm.model';

/** "Agent-1", "Agent-2", a merged "Agent-1+Agent-2" (either order), or "missing". */
export type DataSource = string;

export interface TokensBreakdown {
  local: number;
  peer: number;
  total: number;
}

export interface PerformanceInfo {
  phase1_ms: number;
  phase2_ms: number;
  phase3_ms: number;
  total_ms: number;
  tokens: TokensBreakdown;
}

export interface DataRow {
  /** The place's name — the KQML wire's own field name, whatever the entity type. */
  spatial: string;
  year: number;
  source: DataSource;
  // Every other key is one of the entity's own attribute columns
  // (population/marriages/live_births for a state, length_km for a river,
  // ...) — named individually in query.attributes, not fixed here, so a
  // new attribute table on the backend (config/schema/attributes.yaml)
  // needs no change in this interface to actually show up in a response.
  [attribute: string]: string | number | DataSource | null | undefined;
}

export interface DataGroups {
  complete: DataRow[];
  partial: DataRow[];
  missing: DataRow[];
}

export interface SummaryInfo {
  total_records: number;
  complete_records: number;
  partial_records: number;
  missing_records: number;
  total_data_points: number;
  present_data_points: number;
  missing_data_points: number;
  completeness_pct: number;
}

export interface ProvenanceInfo {
  kqml_turns: number;
  records_local: number;
  records_peer: number;
  records_from_both: number;
  records_unavailable: number;
}

/** One attribute's places combined for one year (Agent-001/agent1/result/totals.py). */
export interface CombinedTotal {
  year: number;
  attribute: string;
  aggregate: string;
  places: string[];
  /** null when any place's value is missing — see `missing`. */
  total: number | null;
  missing: string[];
  status: string;
}

export interface DataGroupsResponse {
  request_id: string;
  status: 'complete' | 'partial-complete' | 'not-found';
  query: {
    raw: string;
    type: string;
    spatial: string[];
    temporal: number[];
    attributes: string[];
    entity_type: string;
  };
  data: DataGroups;
  summary: SummaryInfo;
  provenance: ProvenanceInfo;
  performance: PerformanceInfo;
  /** Only when the question asked for the places combined. */
  totals?: CombinedTotal[] | null;
  full_total_years?: number[] | null;
}

export interface RelationshipInfo {
  type: string | null;
  subject: string | null;
  refs: string[];
  distance_km: number | null;
}

export interface VerdictResponse {
  request_id: string;
  status: string;
  query: {
    raw: string;
    type: string;
    entity_type?: string;
    relationship: RelationshipInfo;
  };
  verdict: boolean | null;
  /** The places that satisfy the relationship. */
  matches: string[];
  /** Places with no geometry at either agent, so the relationship could not be tested. */
  unknown: string[];
  summary: { total: number; verdict: boolean | null; unknown: number; kqml_turns?: number };
  performance: PerformanceInfo;
}

export interface GeometryEntity {
  entity_name: string;
  entity_type: string;
  wkt: string | null;
  srid: number | null;
  source: 'Agent-1' | 'Agent-2' | 'not_found';
  miss_mode_local?: string | null;
}

export interface GeometryLookupResponse {
  request_id: string;
  status: string;
  query: {
    raw: string;
    type: 'GEOMETRY_LOOKUP';
    entities: { entity_name: string; entity_type: string }[];
  };
  geometries: GeometryEntity[];
  summary: { total: number; found: number; missing: number };
  performance: PerformanceInfo;
}

/** A place found inside a zone (buffer, a state, or a merged shape), tagged with its source. */
export interface ZoneMatch {
  name: string;
  entity_type: string;
  wkt: string | null;
  srid: number | null;
  source: 'Agent-1' | 'Agent-2';
}

export interface ZoneSummary {
  total: number;
  from_local: number;
  from_peer: number;
}

export interface SpatialOperationResult {
  wkt: string;
  srid: number;
  geometry_type: string;
  has_shared_area?: boolean;
}

export interface BufferTarget {
  name: string;
  /** 1/0 straight from PostGIS, or a boolean. */
  meets_zone: boolean | number;
}

export interface SpatialOperationResponse {
  request_id: string;
  status: string;
  query: {
    raw: string;
    type: 'SPATIAL_OPERATION';
    operation: string;
    spatial: string[];
    target_entity?: string | null;
    sources?: Record<string, string>;
    temporal?: number[];
    attributes?: string[];
  };
  result?: SpatialOperationResult;
  note?: string;
  // BufferWithin ("Which of X and Y lie within N km of Z?")
  reference?: string;
  distance_km?: number;
  targets?: BufferTarget[];
  // "...which cities are inside the merged shape?"
  matches?: ZoneMatch[];
  summary?: ZoneSummary;
  // "...and give me its population for 2017"
  data?: DataRow[];
  totals?: CombinedTotal[];
  full_total_years?: number[];
  still_missing?: string[];
  message?: string;
  performance: PerformanceInfo;
}

export interface RelationshipBufferResponse {
  request_id: string;
  status: string;
  query: {
    raw: string;
    type: 'SPATIAL_RELATIONSHIP_BUFFER';
    /** The place the zone is built around (a city or a state). */
    reference: string;
    /** "not_found" when neither agent holds the reference's geometry. */
    reference_source: string;
    /** 0 means "inside the reference place itself". */
    distance_km: number | null;
    direction: string | null;
    target_entity: string;
  };
  matches: ZoneMatch[];
  /** Present when the zone search itself failed. */
  message?: string;
  summary: ZoneSummary;
  performance: PerformanceInfo;
}

export interface MessageResponse {
  request_id: string;
  status: 'rejected' | 'error';
  message: string;
  /** Absent on the backend's early "error" returns. */
  query?: { raw: string; type: string; attributes?: string[] };
  performance: PerformanceInfo;
}

export type AgentQueryResponse = (
  | DataGroupsResponse
  | VerdictResponse
  | GeometryLookupResponse
  | SpatialOperationResponse
  | RelationshipBufferResponse
  | MessageResponse
) & {
  /** The language model that answered (every response carries it). */
  llm?: AnsweredBy;
};

// ---- structural type guards (shape, not query.type, decides rendering) ----
// Several shapes now share keys (`matches` is in the verdict, buffer and
// operation shapes; `data` is a grouped object in one and a plain list in
// another), so each guard tests a key combination only its own shape has.

function queryType(r: AgentQueryResponse): string | undefined {
  return (r as { query?: { type?: string } }).query?.type;
}

export function isDataGroupsResponse(r: AgentQueryResponse): r is DataGroupsResponse {
  return 'data' in r && 'provenance' in r;
}

export function isVerdictResponse(r: AgentQueryResponse): r is VerdictResponse {
  return 'verdict' in r && 'matches' in r;
}

export function isGeometryResponse(r: AgentQueryResponse): r is GeometryLookupResponse {
  return 'geometries' in r;
}

export function isBufferResponse(r: AgentQueryResponse): r is RelationshipBufferResponse {
  return 'matches' in r && queryType(r) === 'SPATIAL_RELATIONSHIP_BUFFER';
}

export function isSpatialOperationResponse(r: AgentQueryResponse): r is SpatialOperationResponse {
  return queryType(r) === 'SPATIAL_OPERATION' && 'operation' in (r as SpatialOperationResponse).query;
}

export function isMessageResponse(r: AgentQueryResponse): r is MessageResponse {
  return (
    'message' in r &&
    !isDataGroupsResponse(r) &&
    !isVerdictResponse(r) &&
    !isGeometryResponse(r) &&
    !isBufferResponse(r) &&
    !isSpatialOperationResponse(r)
  );
}

/** True when no view knows this shape — the response viewer then shows the raw JSON. */
export function isUnrecognizedResponse(r: AgentQueryResponse): boolean {
  return (
    !isMessageResponse(r) &&
    !isDataGroupsResponse(r) &&
    !isVerdictResponse(r) &&
    !isGeometryResponse(r) &&
    !isBufferResponse(r) &&
    !isSpatialOperationResponse(r)
  );
}

/** Shape-aware record count, used by the evaluation log. */
export function getRecordCount(r: AgentQueryResponse): number {
  if (isDataGroupsResponse(r)) return r.summary.total_records;
  if (isVerdictResponse(r)) return r.matches.length;
  if (isGeometryResponse(r)) return r.geometries.length;
  if (isBufferResponse(r)) return r.matches.length;
  if (isSpatialOperationResponse(r)) {
    if (r.targets) return r.targets.length;
    if (r.matches) return r.matches.length;
    if (r.result) return r.query.spatial.length;
    return 0;
  }
  return 0;
}

/** kqml_turns as the backend reports it — only the data-table and verdict shapes carry it. */
export function getKqmlTurns(r: AgentQueryResponse): number | null {
  if (isDataGroupsResponse(r)) return r.provenance.kqml_turns;
  if (isVerdictResponse(r)) return r.summary.kqml_turns ?? null;
  return null;
}

/** Only the data-table shape reports a completeness percentage. */
export function getCompletenessPct(r: AgentQueryResponse): number | null {
  return isDataGroupsResponse(r) ? r.summary.completeness_pct : null;
}

/** All the state/city names this response touched, for the geo panel. */
export function getInvolvedSpatialNames(r: AgentQueryResponse): string[] {
  if (isDataGroupsResponse(r)) {
    return [...new Set([...r.data.complete, ...r.data.partial, ...r.data.missing].map(row => row.spatial))];
  }
  if (isVerdictResponse(r)) {
    return [...new Set([...r.matches, ...r.unknown, ...r.query.relationship.refs])];
  }
  if (isGeometryResponse(r)) {
    return r.geometries.map(g => g.entity_name);
  }
  if (isBufferResponse(r)) {
    return [r.query.reference, ...r.matches.map(m => m.name)];
  }
  if (isSpatialOperationResponse(r)) {
    return [...r.query.spatial];
  }
  return [];
}
