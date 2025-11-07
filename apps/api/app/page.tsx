export default function Home() {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '20px',
    }}>
      <h1>API Server</h1>
      <p>This is a standalone API server built with Next.js Route Handlers.</p>

      <h2>Available Endpoints:</h2>

      <h3>Health Check</h3>
      <ul>
        <li><code>GET /api/health</code> - Health check</li>
      </ul>

      <h3>Events</h3>
      <ul>
        <li><code>GET /api/events</code> - Get all events</li>
        <li><code>POST /api/events</code> - Create event</li>
        <li><code>GET /api/events/:id</code> - Get single event</li>
        <li><code>PUT /api/events/:id</code> - Update event</li>
        <li><code>DELETE /api/events/:id</code> - Delete event</li>
        <li><code>GET /api/events/:id/components</code> - Get event components</li>
        <li><code>POST /api/events/:id/components</code> - Add event component</li>
      </ul>

      <h3>Registrations</h3>
      <ul>
        <li><code>GET /api/registrations</code> - Get all registrations (query params: event_id, user_id)</li>
        <li><code>POST /api/registrations</code> - Create registration</li>
        <li><code>GET /api/registrations/:id</code> - Get single registration</li>
        <li><code>PUT /api/registrations/:id</code> - Update registration</li>
        <li><code>DELETE /api/registrations/:id</code> - Cancel registration</li>
        <li><code>GET /api/registrations/event/:eventId/count</code> - Get registration count</li>
      </ul>

      <p style={{ marginTop: '40px', color: '#666' }}>
        See the <a href="https://github.com" style={{ color: '#0070f3' }}>README</a> for more information.
      </p>
    </div>
  );
}
