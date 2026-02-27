<<<<<<< HEAD
# shopping-page
React based application for product discovery experience. 
=======
Product Catalog (React + Vite)

This is a small product catalog UI that fetches products from an API and renders them as a grid of tiles. Each product can be liked or disliked and optionally added to a wishlist that is stored locally so it survives reloads.

Main pieces
- React 19 with functional components and hooks
- Vite for the dev server and builds
- Plain CSS in `src/App.css`

Running it
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Preview build: `npm run preview`

Data flow and state
- On mount, `App.jsx` fetches from `https://fakestoreapi.com/products` (see `API_URL` at the top of the file) and stores the result in `products`.
- While the request is in flight, `loading` is true; if anything fails, `error` is set and a simple message is shown.
- The view is either the main catalog or the wishlist view, decided by the `view` query parameter in the URL:
  - No `view` param: show all products
  - `?view=wishlist`: show only products whose ids are in the wishlist

Local state in `App.jsx`
- `products`: array of product objects from the API.
- `loading` / `error`: simple request state flags.
- `likedStatus`: an object keyed by product id, storing `"like"`, `"dislike"`, or nothing.
- `wishlistIds`: an array of product ids that are in the wishlist.

Persistence
- The wishlist is persisted in `localStorage` under the key `wishlistIds`.
- On startup, `wishlistIds` is initialized from `localStorage`.
- Whenever the wishlist changes, the new array is written back to storage.

API shape
The UI assumes each product object has at least:

```json
{
  "id": 1,
  "title": "Product title",
  "price": 109.95,
  "description": "Product description...",
  "category": "men's clothing",
  "image": "https://example.com/image.png",
  "rating": { "rate": 3.9, "count": 120 }
}
```

The endpoint returns an array of these.

Design choices in this version
- Keep everything in a single `App.jsx` file to make it easy to read and tweak.
- Use a query parameter (`view=wishlist`) instead of a full router, so opening the wishlist in a new tab is just a URL change.
- Store only product ids in the wishlist, not full product objects, so the UI always uses the latest data from the API.

Ideas for future improvements
- Persist the like/dislike state to `localStorage` so it also survives reloads.
- Extract a `Product` component to render a single tile and keep `App.jsx` focused on data and state.
- Extract a small `useLocalStorageState` hook so wishlist and any future cart/filters can share persistence logic.
- Add client-side filtering by category, search by title, and sorting by price or rating.
- Add a cart flow with quantities and a separate cart view.
- Replace the manual query-param logic with React Router once the number of views grows.
>>>>>>> 31311b2 (Initial commit of raw working application)
