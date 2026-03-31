# VR Rubber Band Workout AI Vibe Coding Guidelines

Welcome, AI Agent. This `agents.md` serves as your primary context for interacting with the `vr_rubber_band_workout` codebase.

## Architecure & Constraints
- **Zero Build Tools**: We do not use Webpack, Vite, npm scripts, or any node-based tooling for the frontend.
- **Pure Javascript**: The project uses Vanilla ES Modules (`<script type="module">`). It's all native.
- **CDNs Only**: All external dependencies (e.g., Three.js, VRButton) are fetched directly from a CDN (such as `esm.sh` or `unpkg`). Do not add `package.json` dependencies for the frontend.
- **Serving**: We use a tiny, custom Bun server (`server.js`) to locally host the files over HTTP so that WebXR can be tested.
- **Visuals**: Keep the aesthetic locked to "Synthwave/Neon". Use saturated cyan, magenta, and deep navy colors.

## Code Structure Goals
- Maintain maximum decoupled modularity in the `src/` directory.
- `game.js` must contain **pure functions** wherever possible for scoring, combos, and state transitions so it can be strictly headless-tested.
- Audio synthesis is handled entirely pragmatically via the Web Audio API in `src/audio.js` (adapted from our original prototypes). NO external audio files/assets are to be generated or embedded. 

## Testing Guidelines
- Tests are executed directly via `bun test`. We do not use Jest or Vitest.
- Place all logic tests inside the `tests/` directory.
- For manual testing, start the local server `bun run server.js`. If you need to verify WebXR capabilities, instruct the user to access via their local IP from their Meta Quest 3.

## Vibe Coding
1. Context Management: Try to read only the specific `src/` files related to your sub-task.
2. Long-term Maintainability: Always explicitly export what is needed, avoid attaching random properties to the global `window` object unless absolutely necessary for WebXR bridging.
3. Keep things declarative and clean. When making UI changes, ensure they map intuitively to the existing elements in `index.html`.
