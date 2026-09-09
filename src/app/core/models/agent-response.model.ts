/**
 * Shapes mirror the real FastAPI responses in
 * Agent-001/agent1/controller/query_controller.py and Agent-002's mirror of it.
 * Shape is driven by which structural keys are present, not by query.type alone:
 * a relationship query (adjacency/direction/distance) with no attributes returns
 * the verdict/states shape, but the same query.type WITH attributes falls through
 * into the data-table shape instead. See the type guards at the bottom.
 */

export type DataSource = 'Agent-1' | 'Agent-2' | 'Agent-1+Agent-2' | 'missing';

export interface TokensBreakdown {
  agent_1: number;
  agent_2: number;
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
  state: string;
  year: number;
  source: DataSource;
  population?: number | null;
  marriages?: number | null;
  live_births?: number | null;
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
  records_from_agent_1: number;
  records_from_agent_2: number;
  records_from_both: number;
  records_unavailable: number;
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
  };
  data: DataGroups;
  summary: SummaryInfo;
  provenance: ProvenanceInfo;
  performance: PerformanceInfo;
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
    relationship: RelationshipInfo;
  };
  verdict: boolean | null;
  states: string[];
  unknown_states: string[];
  summary: { total: number; verdict: boolean | null; unknown: number };
  performance: PerformanceInfo;
}

export interface GeometryEntity {
  entity_name: string;
  entity_type: 'state' | 'city';
  wkt: string | null;
  srid: number | null;
  source: 'Agent-1' | 'Agent-2' | 'not_found';
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

export interface SpatialOperationResult {
  wkt: string;
  srid: number;
  geometry_type: string;
  has_shared_area?: boolean;
}

export interface BufferTarget {
  entity_name?: string;
  name?: string;
  within?: boolean;
  distance_km?: number;
  wkt?: string;
  srid?: number;
  [key: string]: unknown;
}

export interface SpatialOperationResponse {
  request_id: string;
  status: string;
  query: {
    raw: string;
    type: 'SPATIAL_OPERATION';
    operation: string;
    spatial: string[];
    sources?: Record<string, string>;
  };
  result?: SpatialOperationResult;
  note?: string;
  reference?: string;
  distance_km?: number;
  targets?: BufferTarget[];
  still_missing?: string[];
  message?: string;
  performance: PerformanceInfo;
}

export interface BufferCity {
  city_name: string;
  wkt: string;
  srid: number;
  source: 'Agent-1' | 'Agent-2';
}

export interface RelationshipBufferResponse {
  request_id: string;
  status: string;
  query: {
    raw: string;
    type: 'SPATIAL_RELATIONSHIP_BUFFER';
    reference_city: string;
    reference_source?: string;
    distance_km: number;
  };
  cities: BufferCity[];
  summary: { total: number; found?: number; from_agent_1?: number; from_agent_2?: number };
  performance: PerformanceInfo;
}

export interface MessageResponse {
  request_id: string;
  status: 'rejected' | 'error';
  message: string;
  query: { raw: string; type: string; attributes?: string[] };
  performance: PerformanceInfo;
}

export type AgentQueryResponse =
  | DataGroupsResponse
  | VerdictResponse
  | GeometryLookupResponse
  | SpatialOperationResponse
  | RelationshipBufferResponse
  | MessageResponse;

// ---- structural type guards (shape, not query.type, decides rendering) ----

export function isDataGroupsResponse(r: AgentQueryResponse): r is DataGroupsResponse {
  return 'data' in r && typeof (r as DataGroupsResponse).data === 'object';
}

export function isVerdictResponse(r: AgentQueryResponse): r is VerdictResponse {
  return 'states' in r && 'verdict' in r;
}

export function isGeometryResponse(r: AgentQueryResponse): r is GeometryLookupResponse {
  return 'geometries' in r;
}

export function isBufferResponse(r: AgentQueryResponse): r is RelationshipBufferResponse {
  return 'cities' in r;
}

export function isSpatialOperationResponse(r: AgentQueryResponse): r is SpatialOperationResponse {
  return 'result' in r || 'targets' in r || 'still_missing' in r;
}

export function isMessageResponse(r: AgentQueryResponse): r is MessageResponse {
  return 'message' in r && !isSpatialOperationResponse(r);
}

/** Shape-aware record count, used by the evaluation log. */
export function getRecordCount(r: AgentQueryResponse): number {
  if (isDataGroupsResponse(r)) return r.summary.total_records;
  if (isVerdictResponse(r)) return r.states.length;
  if (isGeometryResponse(r)) return r.geometries.length;
  if (isBufferResponse(r)) return r.cities.length;
  if (isSpatialOperationResponse(r)) {
    if (r.targets) return r.targets.length;
    if (r.result) return r.query.spatial.length;
    return 0;
  }
  return 0;
}

/** Only the data-table shape reports kqml_turns to the client. */
export function getKqmlTurns(r: AgentQueryResponse): number | null {
  return isDataGroupsResponse(r) ? r.provenance.kqml_turns : null;
}

/** Only the data-table shape reports a completeness percentage. */
export function getCompletenessPct(r: AgentQueryResponse): number | null {
  return isDataGroupsResponse(r) ? r.summary.completeness_pct : null;
}

/** All the state/city names this response touched, for the geo panel. */
export function getInvolvedSpatialNames(r: AgentQueryResponse): string[] {
  if (isDataGroupsResponse(r)) {
    return [...new Set([...r.data.complete, ...r.data.partial, ...r.data.missing].map(row => row.state))];
  }
  if (isVerdictResponse(r)) {
    return [...new Set([...r.states, ...r.unknown_states, ...r.query.relationship.refs])];
  }
  if (isGeometryResponse(r)) {
    return r.geometries.map(g => g.entity_name);
  }
  if (isBufferResponse(r)) {
    return [r.query.reference_city, ...r.cities.map(c => c.city_name)];
  }
  if (isSpatialOperationResponse(r)) {
    return [...r.query.spatial];
  }
  return [];
}
