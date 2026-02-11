import type { Workspace, Resource } from './types';
export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'ZenWork Launch',
    notes: [
      {
        id: 'n1',
        title: 'Project Goals',
        content: 'Focus on the core loop. Minimalist design is key.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ],
    tasks: [
      { id: 't1', text: 'Refactor sidebar logic', completed: true, createdAt: Date.now() },
      { id: 't2', text: 'Add drag and drop to resources', completed: false, createdAt: Date.now() },
    ],
    groups: [],
    kanban: {
      columns: [
        {
          id: 'col-1',
          name: 'To Do',
          order: 0,
          cards: [
            { id: 'c1', title: 'Design Landing Page', description: 'Create high-fidelity mockups', labels: ['Design', 'High Priority'], order: 0 },
            { id: 'c2', title: 'Setup Database Schema', description: 'Define tables and relations', labels: ['Dev'], order: 1 }
          ]
        },
        { id: 'col-2', name: 'In Progress', order: 1, cards: [] },
        { id: 'col-3', name: 'Done', order: 2, cards: [] }
      ]
    },
    layout: { columns: 1, resourceOrder: ['r1', 'r2'], notesViewMode: 'cards' },
    createdAt: Date.now(),
  },
  {
    id: 'ws-2',
    name: 'Personal Project',
    notes: [
      {
        id: 'n2',
        title: 'Research',
        content: 'Remember to check the API documentation for Cloudflare Workers.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ],
    tasks: [],
    groups: [],
    kanban: {
      columns: [
        { id: 'col-a', name: 'To Do', order: 0, cards: [] },
        { id: 'col-b', name: 'In Progress', order: 1, cards: [] }
      ]
    },
    layout: { columns: 1, resourceOrder: ['r3'], notesViewMode: 'cards' },
    createdAt: Date.now(),
  }
];
export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    workspaceId: 'ws-1',
    title: 'React Documentation',
    url: 'https://react.dev',
    favicon: 'https://react.dev/favicon.ico',
    order: 0,
  },
  {
    id: 'r2',
    workspaceId: 'ws-1',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    favicon: 'https://tailwindcss.com/favicon.ico',
    order: 1,
  },
  {
    id: 'r3',
    workspaceId: 'ws-2',
    title: 'Dnd Kit',
    url: 'https://dndkit.com',
    favicon: 'https://dndkit.com/favicon.ico',
    order: 0,
  }
];