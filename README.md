# Cloudflare Workers Chat App

[![Deploy to Cloudflare Workers][cloudflarebutton]]

A production-ready full-stack chat application built on Cloudflare Workers. Features a reactive frontend with React, Tailwind CSS, and shadcn/ui, powered by a Durable Objects backend for scalable user and chat management. Demonstrates entity-based storage, indexing, pagination, and real-time messaging.

## ✨ Key Features

- **Durable Objects Entities**: One DO per user/chat for strong consistency and low-latency access.
- **Indexed Listing**: Efficient pagination with cursor-based queries.
- **Full CRUD Operations**: Create, read, update, delete users, chats, and messages.
- **Modern UI**: Responsive design with shadcn/ui components, dark mode, and smooth animations.
- **Type-Safe APIs**: Shared types between frontend and backend with Hono routing.
- **Seed Data**: Mock users, chats, and messages for instant demo.
- **Production-Ready**: Error handling, CORS, logging, and Cloudflare observability.

## 🛠️ Technology Stack

- **Backend**: Cloudflare Workers, Durable Objects, Hono
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Data**: Global Durable Object with versioning (CAS), prefix indexes
- **State**: TanStack Query, Zustand, React Hook Form
- **Utils**: Lucide icons, Framer Motion, Sonner toasts
- **Dev Tools**: Bun, Wrangler, ESLint, TypeScript

## 🚀 Quick Start

1. **Prerequisites**:
   - [Bun](https://bun.sh/) installed
   - [Cloudflare CLI (Wrangler)](https://developers.cloudflare.com/workers/wrangler/install-update/) logged in (`wrangler login`)

2. **Clone & Install**:
   ```bash
   git clone <your-repo-url>
   cd <project>
   bun install
   ```

3. **Development**:
   ```bash
   bun dev
   ```
   - Frontend: `http://localhost:3000`
   - Backend APIs: `http://localhost:8787/api/*`

4. **Type Generation** (after first deploy):
   ```bash
   bun cf-typegen
   ```

## 💻 Development

- **Scripts**:
  | Command | Description |
  |---------|-------------|
  | `bun dev` | Start dev server (frontend + workers) |
  | `bun build` | Build frontend assets |
  | `bun lint` | Run ESLint |
  | `bun preview` | Local preview of production build |

- **Backend Customization**:
  - Add routes in `worker/user-routes.ts`
  - Define entities in `worker/entities.ts` (extends `IndexedEntity`)
  - Core utils in `worker/core-utils.ts` (DO NOT MODIFY)

- **Frontend Customization**:
  - Pages in `src/pages/`
  - Components in `src/components/`
  - API calls via `src/lib/api-client.ts`

- **API Endpoints**:
  ```
  GET    /api/users              # List users (paginated)
  POST   /api/users              # Create user {name}
  DELETE /api/users/:id          # Delete user

  GET    /api/chats              # List chats
  POST   /api/chats              # Create chat {title}
  GET    /api/chats/:chatId/messages  # List messages
  POST   /api/chats/:chatId/messages  # Send {userId, text}
  ```

## ☁️ Deployment

Deploy to Cloudflare Workers with a single command:

```bash
bun deploy
```

- **Custom Domain**: Edit `wrangler.jsonc` and run `wrangler deploy`
- **Environment Variables**: Add via Wrangler dashboard or `wrangler secret put <NAME>`
- **Bindings**: Durable Objects auto-migrated via `wrangler.jsonc`

[![Deploy to Cloudflare Workers][cloudflarebutton]]

## 📚 API Response Format

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`bun dev`)
3. Commit changes (`git commit -m 'feat: ...'`)
4. Push and open PR

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙌 Acknowledgments

Built with [Cloudflare Workers](https://workers.cloudflare.com/), [shadcn/ui](https://ui.shadcn.com/), and [Hono](https://hono.dev/).