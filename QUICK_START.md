# 🚀 Quick Start Guide

## Get the Frontend Running in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Create Environment File (30 seconds)
Create `.env.local` in your project root:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Step 3: Update App.tsx (2 min)

Add these imports at the top:
```tsx
import { QueryProvider } from './src/providers/QueryProvider';
import AgentListPage from './src/pages/AgentListPage';
import AgentCreatePage from './src/pages/AgentCreatePage';
import AgentPreviewPage from './src/pages/AgentPreviewPage';
```

Wrap your app with QueryProvider:
```tsx
export default function App() {
  return (
    <QueryProvider>  {/* Add this wrapper */}
      <AuthProvider>
        <OrganizationsProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Routes>
                {/* Existing routes */}
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Add these new routes */}
                <Route path="/agents" element={
                  <RequireAuth><AgentListPage /></RequireAuth>
                } />
                <Route path="/agents/create" element={
                  <RequireAuth><AgentCreatePage /></RequireAuth>
                } />
                <Route path="/agents/:id/edit" element={
                  <RequireAuth><AgentCreatePage /></RequireAuth>
                } />
                <Route path="/agents/:id/preview" element={
                  <RequireAuth><AgentPreviewPage /></RequireAuth>
                } />
                
                {/* Existing routes */}
                <Route path="/dashboard/*" element={...} />
              </Routes>
            </BrowserRouter>
          </NotificationsProvider>
        </OrganizationsProvider>
      </AuthProvider>
    </QueryProvider>  {/* Close wrapper */}
  );
}
```

### Step 4: Add Navigation Link (1 min)

In your `Sidebar.tsx`, add a link to agents:
```tsx
<SidebarItem
  icon={<Bot size={20} />}
  label="AI Agents"
  active={currentView === 'agents'}
  onClick={() => {
    setCurrentView('agents');
    navigate('/agents');
  }}
  collapsed={isSidebarCollapsed}
/>
```

### Step 5: Run Dev Server (30 seconds)
```bash
npm run dev
```

### Step 6: Test It Out!
Navigate to `http://localhost:5173/agents`

You should see:
- ✅ Beautiful agent list page
- ✅ "Create Agent" button
- ✅ Empty state (since no backend yet)

---

## What You'll See

### Without Backend:
- Agent list page loads (shows empty state)
- Create agent page loads (all forms work)
- Preview page loads (but can't connect to backend)
- All UI is functional and beautiful

### With Backend:
- Everything works end-to-end
- Real-time chat
- Voice recording and playback
- Agent creation and editing
- Live testing

---

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### "QueryProvider is not defined"
Make sure you added the import:
```tsx
import { QueryProvider } from './src/providers/QueryProvider';
```

### Routes not working
Make sure you wrapped your app with `<QueryProvider>` and added all the routes.

### Sidebar link not working
Make sure you imported `Bot` from lucide-react and added the navigation handler.

---

## Next Steps

1. **Test the Frontend**: Click around, see all the pages
2. **Read the Docs**: Check out `FRONTEND_COMPLETE.md` for full details
3. **Build the Backend**: Follow `LANGGRAPH_AGENT_IMPLEMENTATION_PLAN.md`

---

## Need Help?

- Check `INTEGRATION_GUIDE.md` for detailed integration steps
- Check `FRONTEND_COMPLETE.md` for feature overview
- Check `IMPLEMENTATION_STATUS.md` for progress tracking

---

**That's it! Your frontend is ready to go! 🎉**

Now you just need the backend to make it fully functional.
