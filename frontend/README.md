# Auto-Nom React Frontend

This is the production-ready React frontend for the Auto-Nom AI Agent dashboard, migrated from the HTML/JS prototype.

## Tech Stack

- **Framework**: React 19 with Functional Components and Hooks
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (with PostCSS)
- **State Management**: React Context (UserContext)
- **Icons**: Lucide React
- **API Client**: Axios
- **Markdown**: Marked.js

## Project Structure

```
src/
├── components/
│   ├── Header.jsx                 # App header with user selector
│   ├── tabs/
│   │   ├── ProfileTab.jsx         # User profile management
│   │   ├── MealsTab.jsx           # Meal routines display
│   │   └── StatusTab.jsx          # Status tracking and events
│   ├── profile/
│   │   ├── DaySelector.jsx        # Delivery days selector
│   │   ├── MealSlotList.jsx       # Meal slots management
│   │   ├── MealSlotItem.jsx       # Individual meal slot
│   │   ├── PreferenceInput.jsx    # Preference tags input
│   │   └── AllergyGrid.jsx        # Allergies selection grid
│   ├── meals/
│   │   └── MealRoutineCard.jsx    # Individual meal card
│   └── status/
│       ├── StatusCard.jsx         # Expandable status card
│       ├── EventStream.jsx        # Event log display
│       └── SelectionModal.jsx     # User approval modal
├── context/
│   └── UserContext.jsx            # Global user state management
├── hooks/
│   ├── useUser.js                 # User context hook
│   └── useAutoNom.js              # API and workflow hooks
├── utils/
│   └── constants.js               # App constants
├── App.jsx                        # Main app component
├── main.jsx                       # App entry point
└── index.css                      # Global styles with Tailwind
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The dev server will start at `http://localhost:5173` with API proxy configured to `http://127.0.0.1:8000`.

### Build for Production
```bash
npm run build
```

This will output the build to `../src/static` directory, ready to be served by the Python backend.

## API Integration

The app uses Vite's proxy configuration to forward `/api` requests to the FastAPI backend.

### API Endpoints Used

- `GET /api/users` - Fetch all users
- `POST /api/users` - Create/update user
- `POST /api/trigger` - Start meal planning (SSE)
- `GET /api/sessions/active/{userId}` - Get active sessions
- `GET /api/sessions/{userId}/{sessionId}/state` - Get session state
- `POST /api/user_approval` - Submit user response


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
