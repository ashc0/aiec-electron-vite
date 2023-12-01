import './App.scss';
import {
  BrowserRouter, Route, Routes, Link,
} from 'react-router-dom';
import routes from '@/router/index';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="App">
          <Link to="/about">About</Link>
          <Routes>
            {routes.map((route) => (
              <Route
                key={(route.path as string)}
                path={
                  Array.isArray(route.path) ? route.path.join('/') : route.path
                }
                element={route.component ? <route.component /> : null}
              />
            ))}
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
