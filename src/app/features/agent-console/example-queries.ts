import { AgentId } from '../../core/models/agent.model';

export interface ExampleQuery {
  label: string;
  text: string;
}

/** One example per real query type the agents classify (see VALID_QUERY_TYPES). */
export const EXAMPLE_QUERIES: Record<AgentId, ExampleQuery[]> = {
  agent1: [
    { label: 'direct lookup', text: 'Give me population data from Hessen from 2022 to 2025' },
    { label: 'adjacency', text: 'Which states border Bayern? Show population 2020-2022' },
    { label: 'direction', text: 'Which states are north of Bayern, population 2021-2022' },
    { label: 'distance', text: 'States within 100 km of München, population in 2021' },
    { label: 'geometry', text: 'Show me the geometry of Sachsen and Berlin' },
    { label: 'spatial operation', text: 'What is the intersection of Bayern and Sachsen?' },
    { label: 'city buffer', text: 'Which cities are within 80 km of Frankfurt?' },
  ],
  agent2: [
    { label: 'direct lookup', text: 'Population of Bayern in 2021' },
    { label: 'adjacency', text: 'Which states border Hessen? Show population 2022-2024' },
    { label: 'direction', text: 'Which states are south of Niedersachsen, population 2023' },
    { label: 'distance', text: 'States within 80 km of Frankfurt, population in 2022' },
    { label: 'geometry', text: 'Show me the geometry of Hessen and München' },
    { label: 'spatial operation', text: 'Union of Hessen and Bayern' },
    { label: 'city buffer', text: 'Which cities are within 100 km of München?' },
  ],
};
