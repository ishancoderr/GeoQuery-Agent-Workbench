import {
  AgentQueryResponse,
  isDataGroupsResponse,
  isVerdictResponse,
} from '../models/agent-response.model';

export type SpatialClass = 'agent1' | 'agent2' | 'mixed' | 'missing' | 'qualifies' | 'unknown';

export interface SpatialInvolvement {
  /** lowercase state/city name -> visual classification, for styling the base boundary layer */
  colorByName: Map<string, SpatialClass>;
  /** lowercase names that should get the "reference" outline treatment */
  referenceNames: Set<string>;
}

/**
 * Only the data-table and verdict/states shapes are backed by the public
 * boundary GeoJSON (they never return their own geometry). Geometry/operation/
 * buffer responses carry real WKT instead and are drawn as their own overlay,
 * so they don't need base-layer coloring here.
 */
export function classifySpatialInvolvement(response: AgentQueryResponse): SpatialInvolvement {
  const colorByName = new Map<string, SpatialClass>();
  const referenceNames = new Set<string>();

  if (isDataGroupsResponse(response)) {
    const sourcesByState = new Map<string, Set<string>>();
    for (const row of [...response.data.complete, ...response.data.partial, ...response.data.missing]) {
      const key = row.state.toLowerCase();
      const set = sourcesByState.get(key) ?? new Set<string>();
      set.add(row.source);
      sourcesByState.set(key, set);
    }
    for (const [name, sources] of sourcesByState) {
      const real = [...sources].filter(s => s !== 'missing');
      if (real.length === 0) {
        colorByName.set(name, 'missing');
      } else if (real.some(s => s.includes('+')) || (real.includes('Agent-1') && real.includes('Agent-2'))) {
        colorByName.set(name, 'mixed');
      } else if (real.includes('Agent-1')) {
        colorByName.set(name, 'agent1');
      } else {
        colorByName.set(name, 'agent2');
      }
    }
    return { colorByName, referenceNames };
  }

  if (isVerdictResponse(response)) {
    for (const s of response.states) colorByName.set(s.toLowerCase(), 'qualifies');
    for (const s of response.unknown_states) colorByName.set(s.toLowerCase(), 'unknown');
    for (const ref of response.query.relationship.refs) referenceNames.add(ref.toLowerCase());
    return { colorByName, referenceNames };
  }

  return { colorByName, referenceNames };
}
